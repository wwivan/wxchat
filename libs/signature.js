
// const { appID, appsecret, url } = require('../config');
// const Wechat = require("../wechat/wechat")
// const wechatApi = new Wechat()
// const { ticket } = wechatApi.fetchTicket();
// class Signature {
//     signature(router) {
//         //获取随机字符串
//         const noncestr = Math.random().toString().split('.')[1];
//         //获取时间戳
//         const timestamp = Date.now();
//         // 1. 组合参与签名的四个参数：jsapi_ticket（临时票据）、noncestr（随机字符串）、timestamp（时间戳）、url（当前服务器地址）
//         const arr = [
//             `jsapi_ticket=${ticket}`,
//             `noncestr=${noncestr}`,
//             `timestamp=${timestamp}`,
//             `url=${url}/${router}`
//         ]

//         // 2. 将其进行字典序排序，以'&'拼接在一起
//         const str = arr.sort().join('&');
//         console.log(str);  //xxx=xxx&xxx=xxx&xxx=xxx

//         // 3. 进行sha1加密，最终生成signature
//         const signature = sha1(str);
//         return signature
//     }

// }
// (async () => {
//     const signatureApi = new Signature();
//     let signature = await signatureApi.signature()
//     console.log(signature)

// })()

// module.exports = Signature