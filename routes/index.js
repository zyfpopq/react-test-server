var express = require('express');
var svgCaptcha = require('svg-captcha');
var router = express.Router();

const ajax = require('../api/ajax');
const users={};
const md5 = require('blueimp-md5');
const {UserModel} = require('../db/models');
const filter = {password:0};
const send_sms = require('../until/send_sms');


//注册一个路由：用户注册
/*
a)path为：/register
b)请求方式为:post
c)接受username和password参数,以及一次性验证码
d)admin是已注册用户
e)注册成功返回:{code：0，data：{_id:'abc',username:'xxx',password:'123'}}
f)注册失败返回:{code:1,msg:'此用户已存在'}
*/
/*
1. 获取请求参数
2. 处理
3. 返回相应数据
*/
router.post('/login_pwd',function(req,res){
    const {username,password}=req.body;
    const captcha = req.body.captcha.toUpperCase();
    if (captcha!==req.session.captcha){
        return res.send({code:2,data:'验证码不正确'})
    }
    // 删除保存的验证码
    delete req.session.captcha

    UserModel.findOne({"$or":[{username:username},{phone:username}],password:md5(password)},filter,function (error,user) {
        if (user) {
            res.session.userid=user._id
            res.send({code:0,data:user})
        } else {
            res.send({code:1,msg:'用户名或密码不正确'})
        }
    })
})

//密码登陆页面一次性验证码路由
router.get('/captcha',function(req,res){
  const cap = svgCaptcha.create(
      {
          size:4,
          ignoreChars:'0o1i',
          noise:1,
          color:true
      });
  req.session.captcha = cap.text.toUpperCase();
  res.type('svg');
  res.send(cap.data);
})

//发送验证码短信
router.get('/sendcode',function (req,res) {
    const {phone} = req.query;
    var code = send_sms.randomCode(6);
    send_sms.sendCode(phone,code,function (success) {
        if (success){
            users[phone] = code;
            console.log('保存验证码',phone,code);
            setTimeout(()=>{
                users[phone] = ''
            },1000*60*30);
            res.send({code:0,data:success})
        } else {
            res.send({code:1,msg:success})
        }
    })
})
//短信登陆
router.post('/login_sms',function (req,res) {
    const {phone} = req.body;
    const {code} = req.body;
    if (code!=users[phone]) {
        res.send({code:1,msg:'手机号或者验证码不正确'});
        return;
    }
    //删除保存的code
    delete users[phone];

    UserModel.findOne({phone},filter,function (error,user) {
        if (user){
            req.session.userid=user._id;
            res.send({code:0,data:user})
        } else {
            const pwd = Math.round(phone*Math.random()/100000);
            const password = pwd.toString();
            const userModel = new UserModel({phone:phone,username:phone,password:password});
            userModel.save(function (err,user) {
                req.session.userid=user._id;
                res.send({code:0,data:user})
            })
        }
    })
})

//根据session中的userid，查询对应的user
router.get('/userinfo',function (req,res) {
    //取出userid
    const userid = req.session.userid;
    //查询
    UserModel.findOne({_id:userid},filter,function (err,user) {
        //如果没有不用返回
        if (!user){
            delete req.session.userid
        } else {
            //如果有返回user
            res.send({code:0,data:user})
        }
    })
})
//获取首页分类列表
router.get('/index_category',function (req,res) {
    setTimeout(function () {
        const data = require(`../data/index_category`);
        res.send({code:0,data})
    },300)
})

//根据经纬度获取位置详情
router.get('/position/:geohash',function (req,res) {
    const {geohash} = req.params;
    ajax(`http://cangdu.org:8001/v2/pois/${geohash}`)
        .then(data=>{
            res.send({code:0,data})
        })
})
/*
根据经纬度获取商铺列表
?latitude=30.6260815936&longitude=104.0695220232
 */
router.get('/shops', function (req, res) {
    const latitude = req.query.latitude;
    const longitude = req.query.longitude;

    setTimeout(function () {
        const data = require('../data/shops.json');
        res.send({code: 0, data})
    }, 300)
})

router.get('/search_shops', function (req,res) {
    const {geohash, keyword} = req.query
    ajax('http://cangdu.org:8001/v4/restaurants', {
        'extras[]': 'restaurant_activity',
        geohash:geohash,
        keyword:keyword,
        type: 'search'
    }).then(function (data) {
        res.send({code: 0, data:data})
    }
)
})

//用户登出
router.get('/login_out',function (req,res) {
    //清楚浏览器保存的userid的cookie
    delete req.session.userid;
    //返回数据
    res.send({code:0})
})

module.exports = router;
