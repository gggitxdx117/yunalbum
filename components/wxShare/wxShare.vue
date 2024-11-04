<template>
  <view class="uni-popup-share">
    <view class="uni-share-title"><text class="uni-share-title-text">{{shareTitleText}}</text></view>
    <view class="uni-share-content">
      <view class="uni-share-content-box">
        <!-- #ifdef WEB -->
        <view class="uni-share-content-item" @click.stop="select('wx')">
          <image class="uni-share-image"
            src="https://vkceyugu.cdn.bspapp.com/VKCEYUGU-dc-site/c2b17470-50be-11eb-b680-7980c8a877b8.png"
            mode="aspectFill"></image>
          <text class="uni-share-text">微信</text>
        </view>
        <!-- #endif -->
        <!-- #ifdef MP-WEIXIN -->
        <button class="uni-share-content-item" open-type="share">
          <image class="uni-share-image"
            src="https://vkceyugu.cdn.bspapp.com/VKCEYUGU-dc-site/c2b17470-50be-11eb-b680-7980c8a877b8.png"
            mode="aspectFill"></image>
          <text class="uni-share-text">微信</text>
        </button>
        <!-- #endif -->
      </view>
    </view>
    <view class="uni-share-button-box">
      <button class="uni-share-button" @click="close">{{cancelText}}</button>
    </view>
  </view>
</template>

<script>
  import popup from '@/uni_modules/uni-popup/components/uni-popup/popup.js'
  export default {
    name: 'UniPopupShare',
    mixins: [popup],
    emits: ['select'],
    props: {
      title: {
        type: String,
        default: ''
      },
      beforeClose: {
        type: Boolean,
        default: false
      }
    },
    data() {
      return {}
    },
    created() {},
    computed: {
      cancelText() {
        return '取消分享'
      },
      shareTitleText() {
        return this.title || '分享'
      }
    },
    methods: {
      /**
       * 选择内容
       */
      select(item) {
        this.$emit('select', {
          item
        })
        this.close()
      },
      /**
       * 关闭窗口
       */
      close() {
        if (this.beforeClose) return
        this.popup.close()
      }
    }
  }
</script>
<style lang="scss">
  .uni-popup-share {
    background-color: #fff;
    border-top-left-radius: 11px;
    border-top-right-radius: 11px;
  }

  .uni-share-title {
    /* #ifndef APP-NVUE */
    display: flex;
    /* #endif */
    flex-direction: row;
    align-items: center;
    justify-content: center;
    height: 40px;
  }

  .uni-share-title-text {
    font-size: 14px;
    color: #666;
  }

  .uni-share-content {
    /* #ifndef APP-NVUE */
    display: flex;
    /* #endif */
    flex-direction: row;
    justify-content: center;
    padding-top: 10px;
  }

  .uni-share-content-box {
    /* #ifndef APP-NVUE */
    display: flex;
    /* #endif */
    flex-direction: row;
    flex-wrap: wrap;
    width: 360px;
  }

  .uni-share-content-item {
    width: 90px;
    /* #ifndef APP-NVUE */
    display: flex;
    /* #endif */
    flex-direction: column;
    justify-content: center;
    padding: 10px 0;
    align-items: center;
    background-color: initial;
  }

  .uni-share-content-item:active {
    background-color: #f5f5f5;
  }

  .uni-share-content-item::after {
    border: none;
    background-color: initial;
  }

  .uni-share-image {
    width: 30px;
    height: 30px;
  }

  .uni-share-text {
    margin-top: 10px;
    font-size: 14px;
    color: #3B4144;
  }

  .uni-share-button-box {
    /* #ifndef APP-NVUE */
    display: flex;
    /* #endif */
    flex-direction: row;
    padding: 10px 15px;
  }

  .uni-share-button {
    flex: 1;
    border-radius: 50px;
    color: #666;
    font-size: 16px;
  }

  .uni-share-button::after {
    border-radius: 50px;
  }
</style>