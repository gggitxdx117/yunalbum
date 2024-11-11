<template>
  <view>
    <web-view :webview-styles="webviewStyles" :src="src" v-if="src !== ''"></web-view>
  </view>
</template>

<script>
  import {
    request
  } from '@/utils/request.js';
  export default {
    data() {
      return {
        src: '',
        webviewStyles: {
          progress: {
            color: '#FF3333'
          }
        }
      }
    },
    onShow() {
      console.log(getCurrentPages().pop().route + ' - onShow')
      uni.showLoading({
        title: '加载中',
        mask: true
      })
      request({
          url: 'https://wx.ctokz.com/wx/Index/atmSrc', // 替换为你的远程图片列表接口
          method: 'post'
        })
        .then(res => {
          uni.hideLoading()
          if (res.statusCode === 200 && res.data.status === 200) {
            this.src = res.data.result.src
          }
        })
        .catch(err => {
          uni.hideLoading()
          console.error('Request failed:', err);
        })
    },
    methods: {

    }
  }
</script>

<style>

</style>