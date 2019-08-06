const express = require('express');
const auth = require('./wechat/auth');
const Wechat = require("./wechat/wechat")
const sha1 = require("sha1")
const app = express();


//接受微信服务器发送过来的请求 GET
//应用中间级，能够接受处理所有请求
app.get("/sign",async(res,req)=>{
  const wechatApi = new Wechat()
  let {ticket} =await wechatApi.fetchTicket()
  console.log(11111111)
  //  获取随机字符串
        const noncestr = Math.random().toString().split('.')[1];
        //获取时间戳
        const timestamp = Date.now();
        // 1. 组合参与签名的四个参数：jsapi_ticket（临时票据）、noncestr（随机字符串）、timestamp（时间戳）、url（当前服务器地址）
        const arr = [
            `jsapi_ticket=${ticket}`,
            `noncestr=${noncestr}`,
            `timestamp=${timestamp}`,
            `url=${url}`
        ]

        // 2. 将其进行字典序排序，以'&'拼接在一起
        const str = arr.sort().join('&');
        console.log(str);  //xxx=xxx&xxx=xxx&xxx=xxx

        // 3. 进行sha1加密，最终生成signature
        const signature = sha1(str);
        console.log(signature)
        res.send(signature)
})
app.use(auth());


app.listen(3000, err => {
  if (!err) console.log('服务器启动成功了~~~');
})
