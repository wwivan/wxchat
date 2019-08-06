/*
  工具函数
 */
//引入解析xml数据的库
const {parseString} = require('xml2js');
const{resolve} = require("path")
const {writeFile, readFile} = require('fs');
// const Wechat = require("../wechat/wechat")
// const wechatApi = new Wechat()
// const {ticket} = await wechatApi.fetchTicket();
  
//   // 1. 组合参与签名的四个参数：jsapi_ticket（临时票据）、noncestr（随机字符串）、timestamp（时间戳）、url（当前服务器地址）
//   const arr = [
//     `jsapi_ticket=${ticket}`,
//     `noncestr=${noncestr}`,
//     `timestamp=${timestamp}`,
//     `url=${url}`
//   ]
  
//   // 2. 将其进行字典序排序，以'&'拼接在一起
//   const str = arr.sort().join('&');
//   console.log(str);  //xxx=xxx&xxx=xxx&xxx=xxx
  
//   // 3. 进行sha1加密，最终生成signature
//   const signature = sha1(str);

module.exports = {

  getUserDataAsync (req) {
    /*
      用户数据是通过流的方式发送，通过绑定data事件接受数据
     */
    return new Promise((resolve, reject) => {
      let data = '';
      req
        .on('data', userData => {
          //将流式数据全部拼接起来
          data += userData;
        })
        .on('end', () => {
          //确保数据全部获取了
          resolve(data);
        })
    })
  },
  parseXMLAsync (xmlData) {
    return new Promise((resolve, reject) => {
      parseString(xmlData, {trim: true}, (err, data) => {
        if (!err) {
          //解析成功了
          resolve(data);
        } else {
          //解析失败了
          reject('parseXMLAsync方法出了问题：' + err);
        }
      })
    })
  },
  formatMessage (jsData) {
    const data = jsData.xml;
    //初始化一个空的对象
    let message = {};
    //判断数据是一个合法的数据
    if (typeof data === 'object') {
      //循环遍历对象中的所有数据
      for (let key in data) {
        //获取属性值
        let value = data[key];
        //过滤掉空的数据和空的数组
        if (Array.isArray(value) && value.length > 0) {
          //在新对象中添加属性和值
          message[key] = value[0];
        }
      }
    }
    //将格式化后的数据返回出去
    return message;
  },
  writeFileAsync (data, fileName) {
    //将对象转化json字符串
    data = JSON.stringify(data);
    const filePath = resolve(__dirname, fileName);
    return new Promise((resolve, reject) => {
      writeFile(filePath, data, err => {
        if (!err) {
          console.log('文件保存成功~');
          resolve();
        } else {
          reject('writeFileAsync方法出了问题：' + err);
        }
      })
    })
  },
  readFileAsync (fileName) {
    const filePath = resolve(__dirname, fileName);
    return new Promise((resolve, reject) => {
      readFile(filePath, (err, data) => {
        if (!err) {
          console.log('文件读取成功~');
          //将json字符串转化js对象
          data = JSON.parse(data);
          resolve(data);
        } else {
          reject('readFileAsync方法出了问题：' + err);
        }
      })
    })
  }
}
