<template>
  <view style="text-align: center;">
    邀请加入中
  </view>
</template>

<script>
  import {
    request
  } from '@/utils/request'
  export default {
    data() {
      return {
        inviteCode: ''
      }
    },
    onLoad(options) {
      console.log(getCurrentPages().pop().route + ' - onLoad')
      // 初始化code参数
      if (options && options.inviteCode) {
        this.inviteCode = options.inviteCode
        uni.showLoading({
          title: '申请中...',
          mask: true,
        })
        request({
            url: 'https://wx.ctokz.com/wx/Album/invite', // 替换为你的远程图片列表接口
            method: 'post',
            data: {
              inviteCode: this.inviteCode,
            }
          })
          .then(res => {
            uni.hideLoading();
            if (res.statusCode === 200 && res.data.status === 200) {
              uni.showToast({
                title: '加入成功'
              })
              // 跳转到指定相册
              uni.redirectTo({
                url: '/pages/view/view?code=' + res.data.result.albumCode
              })
            } else {
              uni.showModal({
                title: '加入失败',
                content: res.data.message,
                showCancel: false
              })
              // 跳转到首页
              uni.switchTab({
                url: '/pages/index/index'
              });
            }
          })
          .catch(err => {
            uni.hideLoading();
            console.error('Request failed:', err);
          })
      }
    },
    methods: {

    }
  }
</script>

<style>

</style>