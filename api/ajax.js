const axios = require('axios')

module.exports = function ajax(url='',data={},type='GET') {
    return new Promise(function (resolve,reject) {
        let promise

        if (type==='GET'){
            var dataStr = ''
            Object.keys(data).forEach(key => {
                dataStr += key + '=' + data[key] + '&'
            })
            if (dataStr!==''){
                dataStr = dataStr.substring(0,dataStr.length-1)
                url = url + '?' +dataStr
            }
            //发送GET请求
            promise = axios.get(url)
        } else {
            promise = axios.post(url,data)
        }

        promise.then(response => {
            resolve(response.data)
        })
            .catch(error=>{
                reject(error)
            })
    })
}
