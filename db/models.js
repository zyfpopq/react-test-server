/*
包含N个操作数据库集合数据的Model模块
1. 连接数据库
   1.1. 引入mongoose
   1.2. 连接指定数据库(URL只有数据库是变化的)
   1.3. 获取连接对象
   1.4. 绑定连接完成的监听(用来提示连接成功)
2. 定义出对应特定集合Model并向外暴露
   2.1. 定义Schema(描述文档结构)
   2.2. 定义Model(与集合对应，可以操作集合)
   2.3. 向外暴露Model
*/

const mongoose = require("mongoose")
mongoose.connect('mongodb://localhost:27017/ewaimai',{ useNewUrlParser: true })
const conn = mongoose.connection
conn.on('connected',function () {
    console.log('db connect success')
})

const userSchema = mongoose.Schema({
    username:{type:String},
    password:{type:String},
    phone:{type:String},
})

UserModel = mongoose.model('user',userSchema)
exports.UserModel = UserModel


