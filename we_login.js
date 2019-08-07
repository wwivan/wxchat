//wx_login.js
var express = require('express');
var app = express();
var router = express.Router();
var request = require('request');
const {appID,appsecret} = require("./config/index")

/*微信登录*/
var AppID = appID;//测试号APPID
var AppSecret = appsecret;//测试号APPSECRET

//监控路由地址/wx_login
module.exports = app =>{
    router.get('/wx_login',function(req,res,next){
        //第一步：用户同意授权，获取code
         var router = 'get_wx_access_token';
         //编码后的回调地址，这里一定要记得加端口号，因为我们在测试号里设置过的
         var return_uri = 'http%3A%2F%2Fwww.xxxxxx.cn%3A3000%2Foauth%2F'+router;
         console.log(decodeURIComponent(return_uri));
         var scope = 'snsapi_userinfo';
     
         //重定向授权地址，回调页面是return_uri，中间有oauth是因为我下面写了虚拟目录的代理
         res.redirect('https://open.weixin.qq.com/connect/oauth2/authorize?' +
             'appid=' + AppID +
             '&redirect_uri=' + return_uri +
             '&response_type=code' +
             '&scope=' + scope +
             '&state=STATE#wechat_redirect');
     });
     
     //get授权页面回调后的code
     router.get('/get_wx_access_token',function(req,res,next){
         //第二步：通过code换取网页授权access_token
         var code = req.query.code;
         console.log(code);
         //请求获取token和用户的openId
         request.get(
             {
                 url:'https://api.weixin.qq.com/sns/oauth2/access_token?appid='+AppID+'&secret='+AppSecret+'&code='+code+'&grant_type=authorization_code'
             },
             function(error,response,body){
                 if(response.statusCode == 200){
                     console.log(body);
                     var data = JSON.parse(body);
                     var access_token = data.access_token;
                     var openid = data.openid;
                     //第三步：利用token和openId请求用户信息
                     request.get(
                         {
                             url:'https://api.weixin.qq.com/sns/userinfo?access_token='+access_token+'&openid='+openid+'&lang=zh_CN'
                         },
                         function(error,response,body){
                             if(response.statusCode === 200){
                                 //第四步：根据获取的用户信息进行操作
                                 var userinfo = JSON.parse(body);
                                 console.log('获取信息成功');
                                 console.log(userinfo);
     
                                 //测试
                                 res.send(
                                     "<h1>" + userinfo.nickname + " 的个人信息</h1>" +
                                     "<p><img src=" + userinfo.headimgurl + "/></p>" +
                                     "<p>" + userinfo.city + "," + userinfo.province + "," + userinfo.country + "</p>"
                                 );
                             }
                             else{
                                 console.log(response.statusCode);
                             }
                         }
                     );
                 }
                 else{
                     console.log(response.statusCode);
                 }
             }
         );
     });
     
     //静态资源下的虚拟目录，即所有的地址都通过http://[host]:3000/oauth来访问
     app.use('/oauth',router);
}


//监听对应主机名及端口
// var server = app.listen(3000,'www.xxxx.cn',function(){
//     var host = server.address().address;
//     var port = server.address().port;

//     console.log('Example app listening at http://%s:%s', host, port);
// })
