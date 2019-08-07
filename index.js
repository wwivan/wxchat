const express = require('express');
const auth = require('./wechat/auth');
const Wechat = require("./wechat/wechat")
const sha1 = require("sha1")
const axios = require("axios")
const app = express();
const {appID,appsecret} = require("./config")
app.use(require('cors')())//应用后可被跨域访问
app.use(express.json())//req.body转成json数据


//接受微信服务器发送过来的请求 GET
//应用中间级，能够接受处理所有请求
// app.get("/getWxConfig",async(res,req)=>{
//   const wechatApi = new Wechat()
//   let {ticket} =await wechatApi.fetchTicket()
//   console.log(11111111)
//   //  获取随机字符串
//         const noncestr = Math.random().toString().split('.')[1];
//         //获取时间戳
//         const timestamp = Date.now();
//         // 1. 组合参与签名的四个参数：jsapi_ticket（临时票据）、noncestr（随机字符串）、timestamp（时间戳）、url（当前服务器地址）
//         const arr = [
//             `jsapi_ticket=${ticket}`,
//             `noncestr=${noncestr}`,
//             `timestamp=${timestamp}`,
//             `url=${url}`
//         ]

//         // 2. 将其进行字典序排序，以'&'拼接在一起
//         const str = arr.sort().join('&');
//         console.log(str);  //xxx=xxx&xxx=xxx&xxx=xxx

//         // 3. 进行sha1加密，最终生成signature
//         const signature = sha1(str);
//         console.log(signature)
//         res.send(signature)
// })
// app.get('/response',(req,res)=>{
//   console.log(1)
//   // 授权成功之后跳转到response路由，携带code. 根据code拿到access_token
//   // axios.get('https://api.weixin.qq.com/sns/oauth2/access_token',{
//   //   params:{
//   //     appid:appID,
//   //     secret:appsecret,
//   //     code:req.query.code,
//   //     grant_type:'authorization_code'
//   //   }
//   // }).then(function(response){
//   //     // 拿到access_token和openId值
//   //     access_token = response.data.access_token
//   //     openId = response.data.openid


//   //     // 获取用户信息
//   //     axios.get( 'https://api.weixin.qq.com/sns/userinfo' , {
//   //       params:{
//   //           access_token:response.data.access_token,
//   //           openid:response.data.openid,
//   //           lang:'zh_CN'
//   //       }
//   //     }).then((userinfo)=>{
//   //       // userinfo.data.nickname 
//   //       //userinfo.data.sex  
//   //       //userinfo.data.province  
//   //       //userinfo.data.city 

//   //       // ress.render('shop' , { ...userinfo.data })
//   //     });

//   // })
// })
// app.get("/getWxConfig",async(req,res)=>{
//   var code = req.query.code
//   console.log(code);
//   res.send(code)
// })
app.use(auth());
require('./we_login.js')(app)
app.listen(3000, err => {
  if (!err) console.log('服务器启动成功了~~~');
})
