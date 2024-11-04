<template>
  <view>
    <uni-notice-bar v-if="visible" show-get-more show-icon more-text="点击登录" text="请登录后体验完整功能" @getmore="getMore" />
  </view>
</template>

<script>
  export default {
    name: "loginTopic",
    data() {
      return {
        visible: false
      };
    },
    methods: {
      getMore() {
        // 获取当前页面路径和参数
        const currentPage = getCurrentPages().pop();
        const {
          route,
          options
        } = currentPage;
        if (route) {
          const queryString = options ? ('?' + Object.keys(options).map(key => `${key}=${options[key]}`).join('&')) : '';
          const currentPath = `/${route}${queryString}`;
          const loginPathPattern = /\/pages\/login\/login/;
          // 保存当前页面路径到全局变量或缓存
          if (!loginPathPattern.test(currentPath)) {
            uni.setStorageSync('redirectAfterLogin', currentPath)
          }
        }
        uni.navigateTo({
          url: '/pages/login/login' // 跳转到 login 登录页
        });
      },
      checkAccessToken() {
        console.log('checkAccessToken')
        const accessToken = uni.getStorageSync('accessToken')
        this.visible = !accessToken
      }
    }
  }
</script>

<style>

</style>