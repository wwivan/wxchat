/*
  获取access_token:
    全局唯一的接口调用凭据，今后使用微信的接口基本上都需要携带上这个参数
    2小时需要更新一次，提前5分钟刷新
    
    请求地址：
      https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=APPID&secret=APPSECRET
    请求方式：
      GET
    
    设计思路：
      首先发送请求获取凭据，保存为一个唯一的文件
      然后后面请求先去本地文件读取凭据
        判断凭据是否过期
          如果没有过期，直接使用
          如果过期了，重新发送请求获取凭据，保存下来覆盖之前的文件
    
    总结：
      先去本地查看有没有指定文件（readAccessToken）
        如果有（之前请求过凭据）
          判断凭据是否过期(isValidAccessToken)
            如果没有过期，直接使用
            如果过期了，重新发送请求获取凭据，保存下来覆盖之前的文件(getAccessToken、saveAccessToken)
        如果没有（之前都没有请求过凭据）
         发送请求获取凭据，保存为一个唯一的文件
      
 */
//引入配置对象
const { appID, appsecret, url } = require('../config');
//引入发送http请求的库
const rp = require('request-promise-native');
const request = require('request');
const sha1 = require("sha1")
//引入fs模块
const { readFile, writeFile, createReadStream, createWriteStream } = require('fs');
const { resolve, join } = require('path');
const { writeFileAsync, readFileAsync } = require('../libs/utils');
//引入接口文件
const api = require('../libs/api');
//引入菜单文件
const menu = require('./menu');

class Wechat {
  getAccessToken() {
    //定义请求地址
    const url = `${api.accessToken}&appid=${appID}&secret=${appsecret}`;
    /*
      问题：需要将回调函数中的数据返回出去？
      解决：用promise解决
      
      所有的异步操作，都应该包装一层promise，让这个异步操作执行完毕之后，再去执行后面的代码
      简化： 所有的异步操作，都应该包装一层promise
     */
    return new Promise((resolve, reject) => {
      //发送http请求
      //下载 request-promise-native  request
      rp({ method: 'GET', json: true, url })
        .then(res => {
          //请求成功的状态
          // console.log(res);
          //重新赋值凭据的过期时间 ： 当前时间 + (7200 - 5分钟) * 1000
          res.expires_in = Date.now() + (res.expires_in - 300) * 1000;
          // console.log(res);
          resolve(res);
        })
        .catch(err => {
          //请求失败
          reject('getAccessToken方法出了问题：' + err);
        })
    })
  }
  saveAccessToken(data) {
    /*
      问题：writeFile方法会将对象转化为字符串
      解决：我将对象转化为json字符串
     */
    data = JSON.stringify(data);
    return new Promise((resolve, reject) => {
      //将凭据保存为一个文件
      writeFile('accessToken.txt', data, err => {
        if (!err) {
          //写入成功
          resolve();
        } else {
          //写入失败
          reject('saveAccessToken方法出了问题：' + err);
        }
      })
    })
  }
  readAccessToken() {
    return new Promise((resolve, reject) => {
      //将凭据读取出来
      readFile('accessToken.txt', (err, data) => {
        if (!err) {
          //将读取的Buffer数据转化为json字符串
          data = data.toString();
          //将json字符串转化为对象
          data = JSON.parse(data);
          //读取成功
          resolve(data);
        } else {
          //读取失败
          reject('readAccessToken方法出了问题：' + err);
        }
      })
    })
  }
  isValidAccessToken(data) {
    /*
      判断凭据是否过期
        true   凭据没有过期
        false  凭据过期了
     */
    //过滤非法的数据
    if (!data || !data.access_token || !data.expires_in) return false;
    //判断凭据是否过期
    /*if (data.expires_in > Date.now()) {
      //如果凭据的过期时间大于当前时间，说明没有过期
      return true
    } else {
      //如果凭据的过期时间小于当前时间，说明过期了
      return false
    }*/
    //简写方式
    return data.expires_in > Date.now();
  }
  fetchAccessToken() {
    //优化操作,优化不去执行读取文件操作
    if (this.access_token && this.expires_in && this.isValidAccessToken(this)) {
      //说明this有凭据和过期时间，并且凭据未过期
      return Promise.resolve({ access_token: this.access_token, expires_in: this.expires_in });
    }

    return this.readAccessToken()
      .then(async res => {
        //判断凭据是否过期(isValidAccessToken)
        if (this.isValidAccessToken(res)) {
          //没有过期，直接使用
          return Promise.resolve(res);
        } else {
          //重新发送请求获取凭据
          const data = await this.getAccessToken();
          //保存下来
          await this.saveAccessToken(data);
          //将请求回来的凭据返回出去
          return Promise.resolve(data);
        }
      })
      .catch(async err => {
        console.log(err);
        //重新发送请求获取凭据
        const data = await this.getAccessToken();
        //保存下来
        await this.saveAccessToken(data);
        //将请求回来的凭据返回出去
        return Promise.resolve(data);
      })
      .then(res => {
        //将其请求回来的凭据和过期时间挂载到this上
        this.access_token = res.access_token;
        this.expires_in = res.expires_in;
        //指定fetchAccessToken方法返回值
        return Promise.resolve(res);
      })
  }
  /**
   * 用来获取jsapi_ticket
   */
  getTicket() {

    //发送请求
    return new Promise(async (resolve, reject) => {
      //获取access_token
      const data = await this.fetchAccessToken();
      //定义请求的地址
      const url = `${api.ticket}&access_token=${data.access_token}`;

      rp({ method: 'GET', url, json: true })
        .then(res => {
          //将promise对象状态改成成功的状态
          resolve({
            ticket: res.ticket,
            expires_in: Date.now() + (res.expires_in - 300) * 1000
          });
        })
        .catch(err => {
          console.log(err);
          //将promise对象状态改成失败的状态
          reject('getTicket方法出了问题：' + err);
        })
    })
  }

  /**
   * 用来保存jsapi_ticket
   * @param ticket 要保存的票据
   */
  saveTicket(ticket) {
    return writeFileAsync(ticket, 'ticket.txt');
  }

  /**
   * 用来读取ticket
   */
  readTicket() {
    return readFileAsync('ticket.txt');
  }

  /**
   * 用来检测ticket是否有效的
   * @param data
   */
  isValidTicket(data) {
    //检测传入的参数是否是有效的
    if (!data && !data.ticket && !data.expires_in) {
      //代表ticket无效的
      return false;
    }

    return data.expires_in > Date.now();
  }

  /**
   * 用来获取没有过期的ticket
   * @return {Promise<any>} ticket
   */
  fetchTicket() {
    //优化
    if (this.ticket && this.ticket_expires_in && this.isValidTicket(this)) {
      //说明之前保存过ticket，并且它是有效的, 直接使用
      return Promise.resolve({
        ticket: this.ticket,
        expires_in: this.ticket_expires_in
      })
    }

    return this.readTicket()
      .then(async res => {
        //本地有文件
        //判断它是否过期
        if (this.isValidTicket(res)) {
          //有效的
          return Promise.resolve(res);
        } else {
          //过期了
          const res = await this.getTicket();
          await this.saveTicket(res);
          return Promise.resolve(res);
        }
      })
      .catch(async err => {
        //本地没有文件
        const res = await this.getTicket();
        await this.saveTicket(res);
        return Promise.resolve(res);
      })
      .then(res => {
        //将ticket挂载到this上
        this.ticket = res.ticket;
        this.ticket_expires_in = res.expires_in;
        //返回res包装了一层promise对象（此对象为成功的状态）
        return Promise.resolve(res);
      })
  }
  //使用code换取access_token
  // getUserInfo() {
  //   //

  //   //发送请求
  //   return new Promise(async (resolve, reject) => {
  //     //获取access_token
  //     const data = await this.fetchAccessToken();
  //     //定义请求的地址
  //     const url = `${api.ticket}&access_token=${data.access_token}`;

  //     rp({ method: 'GET', url, json: true })
  //       .then(res => {
  //         //将promise对象状态改成成功的状态
  //         resolve({
  //           ticket: res.ticket,
  //           expires_in: Date.now() + (res.expires_in - 300) * 1000
  //         });
  //       })
  //       .catch(err => {
  //         console.log(err);
  //         //将promise对象状态改成失败的状态
  //         reject('getTicket方法出了问题：' + err);
  //       })
  //   })
  // }
  //上传临时素材
  uploadTemporaryMaterial(type, filePath) {
    /*
      type: 上传多媒体文件的类型
      filePath: 上传多媒体文件的路径
     */
    return new Promise((resolve, reject) => {
      //获取access_token
      this.fetchAccessToken()
        .then(res => {
          //定义请求的地址
          const url = `${api.temporary.upload}access_token=${res.access_token}&type=${type}`;
          //定义要传输过去的媒体数据
          const formData = {
            media: createReadStream(filePath)
          }
          //发送请求
          rp({ method: 'POST', json: true, url, formData })
            .then(res => {
              //将请求回来的数据返回出去
              resolve(res);
            })
            .catch(err => {
              reject('uploadTemporaryMaterial方法出了问题：' + err);
            })
        })
    })


  }
  //获取临时素材
  getTemporaryMaterial(mediaId, filePath, isVideo = false) {
    /*
      mediaId: 要获取的素材id
      filePath：要保存媒体文件的路径
      isVideo: 可选值
     */
    return new Promise((resolve, reject) => {
      //获取access_token
      this.fetchAccessToken()
        .then(res => {
          //定义请求地址
          const url = `${api.temporary.get}access_token=${res.access_token}&media_id=${mediaId}`;
          //发送请求
          if (isVideo) {
            //如果是视频消息素材，就返回一个url地址
            rp({ method: 'GET', json: true, url })
              .then(res => resolve(res))
              .catch(err => reject('getTemporaryMaterial方法出了问题：' + err))
          } else {
            //如果不是视频消息素材，就返回一个文件接收
            request
              .get(url)
              .pipe(createWriteStream(filePath))
              .once('close', () => {
                //说明文件下载成功了~
                resolve();
              })
          }
        })
    })

  }
  //上传永久素材
  uploadPermanentMaterial(type, material, description) {
    /*
      type: 可以区分我通过什么方式上传素材
      material: 上传素材的路径/请求体中的内容
      description: 针对于视频素材上传
     */
    return new Promise((resolve, reject) => {
      this.fetchAccessToken()
        .then(res => {
          //定义请求地址
          let url = '';
          //定义发送请求的配置对象
          let options = {
            method: 'POST',
            json: true
          }
          if (type === 'news') {
            //上传图文消息
            url = `${api.permanent.uploadNews}access_token=${res.access_token}`;
            options.body = material;
          } else if (type === 'pic') {
            //上传图文消息的图片
            url = `${api.permanent.uploadImg}access_token=${res.access_token}`;
            options.formData = {
              media: createReadStream(material)
            }
          } else {
            //上传其他素材
            url = `${api.permanent.uploadOthers}access_token=${res.access_token}&type=${type}`;
            options.formData = {
              media: createReadStream(material)
            }
            if (type === 'video') {
              options.body = description;
            }
          }
          //将请求地址放到配置对象中
          options.url = url;
          //发送请求
          rp(options)
            .then(res => resolve(res))
            .catch(err => reject('uploadPermanentMaterial方法出了问题:' + err))
        })
    })
  }
  //获取永久素材
  getPermanentMaterial(type, mediaId, filePath) {
    /*
      type: 用来如何接受数据
      mediaId: 获取的媒体素材id
      filePath: 保存的媒体素材的位置
     */
    return new Promise((resolve, reject) => {
      this.fetchAccessToken()
        .then(res => {
          //定义请求地址
          const url = `${api.permanent.get}access_token=${res.access_token}`;
          //定义请求体中的数据
          const body = {
            media_id: mediaId
          }
          if (type === 'news' || 'video') {
            rp({ method: 'POST', json: true, url, body })
              .then(res => resolve(res))
              .catch(err => reject('getPermanentMaterial方法出了问题:' + err))
          } else {
            request({ method: 'POST', json: true, url, body })
              .pipe(createWriteStream(filePath))
              .once('close', () => resolve())
          }
        })
    })
  }
  //删除永久素材
  deletePermanentMaterial(mediaId) {
    return new Promise((resolve, reject) => {
      this.fetchAccessToken()
        .then(res => {
          const url = `${api.permanent.delete}access_token=${res.access_token}`;
          const body = {
            media_id: mediaId
          }
          rp({ method: 'POST', json: true, url, body })
            .then(res => resolve(res))
            .catch(err => reject('deletePermanentMaterial方法出了问题：' + err))
        })
    })
  }
  //更新永久图文消息素材
  updatePermanentNews(body) {
    return new Promise((resolve, reject) => {
      this.fetchAccessToken()
        .then(res => {
          const url = `${api.permanent.updateNews}access_token=${res.access_token}`;
          rp({ method: 'POST', json: true, url, body })
            .then(res => resolve(res))
            .catch(err => reject('updatePermanentNews方法出了问题：' + err))
        })
    })
  }
  //获取永久素材数量
  getPermanentCount() {
    return new Promise((resolve, reject) => {
      this.fetchAccessToken()
        .then(res => {
          const url = `${api.permanent.getCount}access_token=${res.access_token}`;
          rp({ method: 'GET', json: true, url })
            .then(res => resolve(res))
            .catch(err => reject('getPermanentCount方法出了问题：' + err))
        })
    })
  }
  //获取永久素材列表
  getPermanentList(body) {
    return new Promise((resolve, reject) => {
      this.fetchAccessToken()
        .then(res => {
          const url = `${api.permanent.getMaterialList}access_token=${res.access_token}`;
          rp({ method: 'POST', json: true, url, body })
            .then(res => resolve(res))
            .catch(err => reject('getPermanentList方法出了问题：' + err))
        })
    })
  }
  //创建菜单
  createMenu(body) {
    console.log(1111)
    return new Promise((resolve, reject) => {
      this.fetchAccessToken()
        .then(res => {
          console.log(2222222)
          const url = `${api.menu.create}access_token=${res.access_token}`;
          rp({ method: 'POST', json: true, url, body })
            .then(res => resolve(res))
            .catch(err => reject('createMenu方法出了问题：' + err))
        })
    })
  }
  //删除菜单
  deleteMenu() {
    return new Promise((resolve, reject) => {
      this.fetchAccessToken()
        .then(res => {
          const url = `${api.menu.delete}access_token=${res.access_token}`;
          rp({ method: 'GET', json: true, url })
            .then(res => resolve(res))
            .catch(err => reject('deleteMenu方法出了问题：' + err))
        })
    })
  }
  //获取菜单的配置
  getMenu() {
    return new Promise((resolve, reject) => {
      this.fetchAccessToken()
        .then(res => {
          const url = `${api.menu.get}access_token=${res.access_token}`;
          rp({ method: 'GET', json: true, url })
            .then(res => resolve(res))
            .catch(err => reject('getMenu方法出了问题：' + err))
        })
    })
  }
  //创建自定义菜单
  createMyMenu(body) {
    console.log("11111111")
    return new Promise((resolve, reject) => {
      this.fetchAccessToken()
        .then(res => {
          const url = `${api.menu.myCreate}access_token=${res.access_token}`;
          rp({ method: 'POST', json: true, url, body })
            .then(res => resolve(res))
            .catch(err => reject('createMyMenu方法出了问题：' + err))
        })
    })
  }
  //删除自定义菜单
  deleteMyMenu(body) {
    return new Promise((resolve, reject) => {
      this.fetchAccessToken()
        .then(res => {
          const url = `${api.menu.myDelete}access_token=${res.access_token}`;
          rp({ method: 'POST', json: true, url, body })
            .then(res => resolve(res))
            .catch(err => reject('deleteMyMenu方法出了问题：' + err))
        })
    })
  }
  //测试个性化菜单匹配结果
  testMyMenu(body) {
    return new Promise((resolve, reject) => {
      this.fetchAccessToken()
        .then(res => {
          const url = `${api.menu.myTest}access_token=${res.access_token}`;
          rp({ method: 'POST', json: true, url, body })
            .then(res => resolve(res))
            .catch(err => reject(' testMyMenu方法出了问题：' + err))
        })
    })
  }
}
// const Signature = require("../libs/signature")


  //测试
  (async () => {
    // const signatureApi = new Signature();
    // let signature = await signatureApi.signature()
    // console.log(signature)

    const wechatApi = new Wechat();
    const {ticket} = await wechatApi.fetchTicket()
    console.log(ticket)
    
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


    let data = await wechatApi.deleteMenu();
    // console.log(data);
    data = await wechatApi.createMenu(menu);
    console.log(data)
  })()

module.exports = Wechat;
