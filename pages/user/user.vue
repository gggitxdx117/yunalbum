<template>
  <view>
    <view class="user-info">
      <image class="user-avatar" :src="userInfo.avatar" mode="aspectFill" @tap="toAvatar"></image>
      <view class="user-nickname-id" @tap="toAvatar">
        <text class="user-nickname">{{ userInfo.nickname }}</text>
        <text class="user-id">ID:{{ userInfo.user_id }}</text>
      </view>
    </view>
    <button @tap="clear">退出当前账号</button>
  </view>
</template>

<script>
  import {
    request
  } from '@/utils/request.js';
  export default {
    data() {
      return {
        userInfo: {}
      }
    },
    onShow() {
      console.log(getCurrentPages().pop().route + ' - onShow')
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
    },
    methods: {
      clear() {
        uni.clearStorageSync();
        uni.showToast({
          title: '已退出当前账号'
        })
        uni.setStorageSync('refreshIndexData', true)
        uni.setStorageSync('refreshViewData', true)
        uni.redirectTo({
          url: '/pages/login/login' // 跳转到 login 登录页
        });
      },
      // 去获取头像和昵称
      toAvatar() {
        uni.navigateTo({
          url: '/pages/user/avatar'
        })
      }
    }
  }
</script>

<style>
  .user-info {
    display: flex;
    padding: 3vw;
  }

  .user-avatar {
    width: 15vw;
    height: 15vw;
  }

  .user-nickname-id {
    padding-left: 2vw;
    display: flex;
    flex-direction: column;
  }

  .user-nickname {
    flex-direction: column;
    line-height: 16px;
    font-size: 14px;
    margin-top: calc((15vw - 14px - 16px) / 2);
    font-weight: bold;
  }

  .user-id {
    line-height: 14px;
    font-size: 12px;
  }
</style>