/*
  菜单的配置
 */
const {url,appID} = require("../config")
const code = 'code'
const SCOPE = 'snsapi_userinfo'
module.exports = {
    "button":[
      {
        "type":"view",
        "name":"首页",
        "url":`https://open.weixin.qq.com/connect/oauth2/authorize?appid=${appID}&redirect_uri=${url}&response_type=code&scope=snsapi_userinfo&state=1#wechat_redirect`
      },
      {
        "name":"搜索",
        "sub_button":[
          {
            "type":"view",
            "name":"百度",
            "url":"http://baidu.com"
          },
          {
            "type":"view",
            "name":"百度搜索",
            "url":"http://baidu.com"
          },
          // {
          //   "type": "scancode_waitmsg",
          //   "name": "扫码带提示",
          //   "key": "扫码带提示"
          // },
          // {
          //   "type": "scancode_push",
          //   "name": "扫码推事件\ue348",
          //   "key": "扫码推事件"
          // },
          // {
          //   "type": "pic_sysphoto",
          //   "name": "系统拍照发图",
          //   "key": "系统拍照发图"
          // },
          // {
          //   "type": "pic_photo_or_album",
          //   "name": "拍照或者相册发图",
          //   "key": "拍照或者相册发图"
          // }
        ]
      },
    ]
  }
  