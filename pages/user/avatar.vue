<template>
  <view>
    <!-- #ifdef MP-WEIXIN -->
    <button open-type="chooseAvatar" @chooseavatar="getUserAvatar">
      <image :src="userInfo.avatar" alt="" style="width: 30vw;height: 30vw;" mode="aspectFill" />
    </button>
    <!-- #endif -->
    <!-- #ifndef MP-WEIXIN -->
    <button @tap="uploadAvatar">
      <image :src="userInfo.avatar" alt="" style="width: 30vw;height: 30vw;" mode="aspectFill" />
    </button>
    <!-- #endif -->
    <view class="nickname">
      <!-- #ifdef MP-WEIXIN -->
      <input ref="nicknameInput" id="nicknameInput" type="nickname" :value="userInfo.nickname" @blur="inputChange" />
      <!-- #endif -->
      <!-- #ifndef MP-WEIXIN -->
      <input ref="nicknameInput" type="text" :value="userInfo.nickname" @input="inputChange" @confirm="inputChange" />
      <!-- #endif -->
    </view>
    <view>
      <button type="primary" class="submit" @tap="wxSubmit">确认</button>
    </view>
  </view>
</template>

<script>
  import {
    request
  } from '@/utils/request.js';
  export default {
    data() {
      return {
        uploadFromData: {},
        userInfo: {
          avatar: '',
          nickname: ''
        }
      }
    },
    onShow() {
      console.log(getCurrentPages().pop().route + ' - onShow')
      // 获取用户信息
      request({
          url: 'https://wx.ctokz.com/wx/User/info', // 替换为你的远程图片列表接口
          method: 'post'
        })
        .then(res => {
          if (res.statusCode === 200 && res.data.status === 200) {
            this.userInfo = res.data.result
          }
        })
        .catch(err => {})
      // 获取上传表单信息
      request({
          url: 'https://wx.ctokz.com/wx/User/getObsUploadData',
          method: 'POST',
          data: {
            dir: 'avatar'
          }
        })
        .then(res => {
          if (res.data.status === 200) {
            this.uploadFromData = res.data.result
          }
        })
    },
    methods: {
      // 更新昵称内容
      inputChange(e) {
        this.userInfo.nickname = e.detail.value
      },
      // 上传头像文件
      uploadAvatar() {
        let that = this
        uni.chooseFile({
          count: 1,
          type: 'image',
          extension: ['svgz', 'pjp', 'jff', 'jpeg', 'ico', 'ttiff', 'avif', '.svg', ' jpg', 'tift',
            'git', 'png', 'xbm', 'pjpeg', 'bmp', 'webp'
          ],
          sizeType: ['original'],
          compressed: false,
          sourceType: ['album', 'camera'], //从相册选择
          success: function(chooseRes) {
            let e = {}
            for (let index in chooseRes.tempFiles) {
              let file = chooseRes.tempFiles[index]
              e = {
                detail: {
                  avatarUrl: file.tempFilePath ? file.tempFilePath : file.path
                }
              }
            }
            that.getUserAvatar(e)
          },
          fail: (err) => {
            uni.hideLoading()
            uni.showToast({
              title: '上传失败'
            })
            console.log(err)
          }
        })
      },
      // 微信提交
      wxSubmit() {
        // #ifdef MP-WEIXIN
        let that = this
        const query = wx.createSelectorQuery();
        query.select('#nicknameInput').fields({
          properties: ['value']
        }, function(res) {
          that.userInfo.nickname = res.value
          that.submit()
        }).exec();
        // #endif
        // #ifndef MP-WEIXIN
        this.submit()
        // #endif
      },
      // 提交信息
      submit() {
        // 更新进度
        uni.showLoading({
          title: `更新中`,
          mask: true
        })
        request({
            url: 'https://wx.ctokz.com/wx/User/updateInfo',
            method: 'post',
            data: {
              avatar: this.userInfo.avatar,
              nickname: this.userInfo.nickname
            }
          })
          .then(res => {
            // 显示完成
            uni.hideLoading()
            uni.showToast({
              title: '更新成功'
            })
            uni.navigateBack()
          })
          .catch(err => {
            // 显示完成
            uni.hideLoading()
          })
      },
      // 获取用户头像
      getUserAvatar(e) {
        // 更新进度
        uni.showLoading({
          title: `获取中`,
          mask: true
        })
        let that = this
        if (e?.detail?.avatarUrl) {
          // 上传到云资源
          let sessionKey = uni.getStorageSync('sessionKey');
          let accessToken = uni.getStorageSync('accessToken');
          uni.uploadFile({
            url: that.uploadFromData.domain,
            filePath: e?.detail?.avatarUrl,
            name: 'file',
            header: {
              'sessionKey': sessionKey, // 自动传入 sessionKey
              'accessToken': accessToken // 自动传入 accessToken
            },
            formData: {
              key: that.uploadFromData.path + e?.detail?.avatarUrl.split('/').pop(),
              policy: that.uploadFromData.policy,
              AccessKeyId: that.uploadFromData.AccessKeyId,
              signature: that.uploadFromData.signature,
              success_action_status: that.uploadFromData.success_action_status,
              domain: that.uploadFromData.domain,
            },
            success: (uploadFileRes) => {
              console.log(uploadFileRes)
              if (uploadFileRes.statusCode === 200) {
                let data = JSON.parse(uploadFileRes.data)
                if (data.status === 200) {
                  this.userInfo.avatar = data.result.url
                  // 显示完成
                  uni.hideLoading()
                  uni.showToast({
                    title: 'success'
                  })
                } else {
                  uni.hideLoading()
                  uni.showToast({
                    title: data?.message
                  })
                }
              }
            },
            fail: (err) => {
              uni.hideLoading()
              console.log(err)
            }
          });
        }
      }
    }
  }
</script>

<style>
  .nickname {
    text-align: center;
    display: flex;
    justify-content: center;
    align-items: center;
    line-height: 15vw;
    height: 15vw;
  }

  .nickname .uni-input {
    height: 15vw;
  }

  .nickname .uni-input-input {
    height: 15vw;
  }

  .submit {
    width: 50vw;
  }
</style>