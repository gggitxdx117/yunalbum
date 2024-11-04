<template>
  <view>
    <!-- #ifdef MP-WEIXIN -->
    <view class="avatar">
      <view style="text-align: center;width: 50vw;margin: 2vw 25vw;" v-if="!showLoginForm">
        <open-data type="userAvatarUrl"></open-data>
        <open-data type="userNickName"></open-data>
        <button class="login uni-success" type="success" open-type="getUserInfo" @getuserinfo="getUserInfo"
          style="margin-top: 5vw;margin-bottom: 5vw;">点击授权登录</button>
        <button @click="() => {showLoginForm = true}" style="margin-bottom: 5vw;">使用账号/密码登录</button>
      </view>
    </view>
    <!-- #endif -->
    <view class="loginForm" v-if="showLoginForm">
      <view style="text-align: center;margin-bottom: 5vw;">
        <image style="width: 40vw;height: 40vw;border-radius: 5vw;" src="/static/logo.png" />
      </view>
      <text class="title-topic uni-h6 uni-secondary-color" v-if="hasBindPhone">绑定对应的登录手机号，如未注册可选择立即注册or点击跳过</text>
      <text class="title-topic uni-h6 uni-secondary-color" v-if="isRegister">请输入手机号和密码进行免费注册</text>
      <uni-forms ref="form" :modelValue="formData" :rules="rules">
        <uni-forms-item label="手机号" name="mobilePhone">
          <uni-easyinput type="number" maxlength="11" v-model="formData.mobilePhone" placeholder="请输入11位手机号" />
        </uni-forms-item>
        <uni-forms-item label="密码" name="password">
          <uni-easyinput type="password" v-model="formData.password" placeholder="请输入密码"></uni-easyinput>
        </uni-forms-item>
        <uni-forms-item label="确认密码" name="confirmPassword" v-if="isRegister">
          <uni-easyinput type="password" v-model="formData.confirmPassword" placeholder="请再次输入密码"></uni-easyinput>
        </uni-forms-item>
      </uni-forms>
      <button @click="submit" v-if="!isRegister" type="primary" style="margin-bottom: 5vw;">登录<text
          v-if="hasBindPhone">并绑定</text></button>
      <button @click="register" v-if="isRegister" type="primary" style="margin-bottom: 5vw;">注册<text
          v-if="hasBindPhone">并绑定</text></button>
      <!-- #ifndef WEB -->
      <button @click="navToPer">点击跳过</button>
      <!-- #endif -->
      <view class="registerBtn uni-info" v-if="!isRegister" @click="() => {isRegister=true;showLoginForm=true}">
        没有账号？点击注册
      </view>
      <view class="registerBtn uni-info" v-if="isRegister" @click="() => {isRegister=false;showLoginForm=true}">
        已有账号？点击登录
      </view>
    </view>
  </view>
</template>

<script>
  import {
    request
  } from '@/utils/request.js';
  import md5 from 'js-md5'
  import * as jweixin from 'weixin-js-sdk'
  export default {
    data() {
      return {
        showLoginForm: false,
        hasBindPhone: false,
        isRegister: false,
        formData: {
          mobilePhone: '',
          password: '',
          confirmPassword: ''
        },
        rules: {
          mobilePhone: {
            rules: [{
              format: 'number',
              errorMessage: '请输入正确的手机号码',
            }, {
              required: true,
              errorMessage: '请输入手机号',
            }, {
              validateFunction: function(rule, value, data, callback) {
                if (value.toString().length != 11) {
                  callback('请输入11位手机号码')
                }
                return true
              }
            }]
          },
          password: {
            rules: [{
              format: 'string',
              errorMessage: '请输入正确的密码',
            }]
          },
          confirmPassword: {
            rules: [{
              validateFunction: function(rule, value, data, callback) {
                if (value != data.password) {
                  callback('两次密码输入不正确')
                }
                return true
              }
            }]
          }
        }
      }
    },
    onLoad() {
      let that = this
      // #ifndef MP-WEIXIN
      this.showLoginForm = true
      // #endif
      // #ifdef MP-WEIXIN
      uni.login({
        provider: 'weixin',
        success: function(loginRes) {
          console.log(loginRes);
          uni.showLoading({
            title: '正在获取登录信息',
            mask: true
          });
          uni.request({
            url: 'https://wx.ctokz.com/wx/event/miniProgramLogin', // 替换为你的服务器地址
            method: 'POST',
            data: {
              code: loginRes.code
            },
            success: response => {
              uni.hideLoading();
              if (response.data.status === 200) {
                // 保存用户信息到本地存储
                uni.setStorageSync('sessionKey', response.data.result.sessionKey);
                uni.setStorageSync('accessToken', response.data.result.accessToken);
                if (!response.data.result.isBind) {
                  // 已经授权，可以直接调用 getUserInfo 获取头像昵称
                  uni.getUserInfo({
                    success: function(res) {
                      console.log(res)
                      that.bindUserInfo(res);
                    }
                  })
                }
                // 判断是否需要绑定手机号
                else if (response.data.result.hasBindPhone) {
                  // 判断是否需要绑定手机号
                  that.showLoginForm = true;
                  that.hasBindPhone = true;
                }
                // 完成绑定则直接跳转页面
                if (response.data.result.isBind && !response.data.result.hasBindPhone) {
                  that.navToPer();
                }
              } else {
                console.error('登录失败：', response.data.message);
              }
            },
            fail: error => {
              uni.hideLoading();
              console.error('请求失败：', error);
            }
          });


          // 获取用户信息
          uni.getUserInfo({
            provider: 'weixin',
            success: function(infoRes) {
              console.log('用户昵称为：' + infoRes.userInfo.nickName);
            }
          });
        }
      });
      // #endif
    },
    onNavigationBarButtonTap(e) {
      // 判断是否回首页
      if (e.type === 'home') {
        uni.switchTab({
          url: '/pages/index/index'
        });
      }
    },
    methods: {
      /**
       * 页面跳转回原始页面
       */
      navToPer() {
        uni.setStorageSync('refreshIndexData', true)
        uni.setStorageSync('refreshViewData', true)
        // 获取之前保存的页面路径
        const redirectAfterLogin = uni.getStorageSync('redirectAfterLogin') || '/pages/index/index';
        console.log(redirectAfterLogin)
        // 跳转回之前的页面
        uni.redirectTo({
          url: redirectAfterLogin,
          fail: err => {
            uni.switchTab({
              url: redirectAfterLogin
            });
          }
        });
      },
      getUserInfo(e) {
        // console.log(e)
        this.bindUserInfo(e.detail)
      },
      // 绑定用户信息
      bindUserInfo(data) {
        uni.showLoading({
          title: '正在处理登录信息',
          mask: true,
        })
        request({
            url: 'https://wx.ctokz.com/wx/event/bindUserInfo', // 替换为你的远程图片列表接口
            method: 'post',
            data: {
              iv: data.iv,
              encryptedData: data.encryptedData
            }
          })
          .then(response => {
            uni.hideLoading()
            if (response.statusCode === 200 && response.data.status === 200) {
              if (!response.data.result.hasBindPhone) {
                // 跳转回到首页
                this.navToPer();
              } else {
                // 需要绑定手机号
                this.showLoginForm = true;
                this.hasBindPhone = true;
              }
            } else {
              console.error('Failed to fetch list:', res);
            }
          })
          .catch(err => {
            uni.hideLoading()
            console.error('Request failed:', err);
          })
      },
      // 登录、绑定、注册按钮
      submit(e) {
        this.$refs.form.validate().then(res => {
          uni.showLoading({
            title: '正在处理登录信息',
            mask: true,
          })
          // 后台账号密码登录
          request({
            url: 'https://wx.ctokz.com/wx/user/phonePasswordLogin', // 替换为你的远程图片列表接口
            method: 'post',
            data: {
              mobilePhone: res.mobilePhone,
              passwordMd5: md5(res.password)
            }
          }).then(response => {
            uni.hideLoading()
            if (response.statusCode === 200 && response.data.status === 200) {
              // 保存用户信息到本地存储
              uni.setStorageSync('sessionKey', response.data.result.sessionKey);
              uni.setStorageSync('accessToken', response.data.result.accessToken);
              // 绑定or登录成功，直接回到上一页
              this.navToPer()
            } else if (response.data.message) {
              uni.showModal({
                title: '失败',
                content: response.data.message
              })
            } else {
              uni.showToast({
                title: '登录失败'
              })
            }
          }).catch(err => {
            uni.hideLoading()
            console.error('Request failed:', err);
          })
        }).catch(err => {
          console.log('表单错误信息：', err);
        })
      },
      // 注册操作
      register(e) {
        this.$refs.form.validate().then(res => {
          uni.showLoading({
            title: '正在处理注册信息',
            mask: true,
          })
          // 后台账号密码登录
          request({
            url: 'https://wx.ctokz.com/wx/user/register', // 替换为你的远程图片列表接口
            method: 'post',
            data: {
              mobilePhone: res.mobilePhone,
              passwordMd5: md5(res.password)
            }
          }).then(res => {
            uni.hideLoading()
            if (response.statusCode === 200 && response.data.status === 200) {
              // 绑定or注册成功，直接回到上一页
              uni.setStorageSync('sessionKey', response.data.result.sessionKey);
              uni.setStorageSync('accessToken', response.data.result.accessToken);
              this.navToPer()
            } else if (response.data.message) {
              uni.showModal({
                title: '注册失败',
                content: response.data.message
              })
            } else {
              uni.showToast({
                title: '注册失败'
              })
            }
          }).catch(err => {
            uni.hideLoading()
            console.error('Request failed:', err);
          })
        }).catch(err => {
          console.log('表单错误信息：', err);
        })
      }
    }
  }
</script>

<style>
  .avatar {
    width: 100vw;
    text-align: center;
  }

  .loginForm {
    padding: 5vw 5vh;
  }

  .title-topic {
    display: block;
    text-align: center;
    width: 80vw;
    margin-bottom: 5vw;
  }

  .registerBtn {
    margin-top: 5vw;
    text-align: right;
    float: right;
  }
</style>