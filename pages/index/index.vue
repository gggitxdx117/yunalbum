<template>
  <view>
    <loginTopic ref="loginTopic"></loginTopic>
    <view class="block">
      <uni-grid v-if="list.length > 0" class="block" :column="2" @change="clickHandle" :showBorder="false">
        <uni-grid-item :text="item.title" v-for="(item, index) in list" :index="index" :key="index">
          <view class="album-list">
            <image style="width: 100%; height: 100%; background-color: #eeeeee;border-radius: 10%;"
              :src="item.thumb_url" :data-code="item.code" mode="aspectFill" />
          </view>
          <text class="text">{{ item.title }}</text>
        </uni-grid-item>
      </uni-grid>
      <view v-else style="text-align: center;">无可用相册</view>
    </view>
    <uni-load-more :status="loadStatus" @clickLoadMore="loadMore" />
    <uni-fab :content="contentForFab" horizontal="right" vertical="bottom" direction="vertical" popMenu
      @trigger="triggerFab"></uni-fab>
    <!-- 分享示例 -->
    <!-- #ifdef WEB || MP-WEIXIN -->
    <uni-popup ref="share" type="share" safeArea backgroundColor="#fff">
      <wxShare @select="shareSelect"></wxShare>
    </uni-popup>
    <!-- #endif -->
  </view>
</template>

<script>
  import loginTopic from '@/components/loginTopic/loginTopic.vue'
  import wxShare from '@/components/wxShare/wxShare.vue'
  import {
    request
  } from '@/utils/request.js';
  export default {
    components: {
      loginTopic,
      wxShare
    },
    data() {
      return {
        selected: 0,
        loadStatus: 'noMore',
        list: [],
        permission: '',
        imageWidth: 0,
        contentForFab: [{
            iconPath: '/static/icons/zoom-in.png',
            text: '加入',
            active: false
          },
          {
            iconPath: '/static/icons/share.png',
            text: '分享',
            active: false
          }
        ],
      }
    },
    onShow() {
      // 获取当前页面路径和参数
      console.log(getCurrentPages().pop().route + ' - onShow')
      // 更新登录状态
      const loginTopicComponent = this.$refs.loginTopic;
      if (loginTopicComponent) {
        loginTopicComponent.checkAccessToken();
      }
      // 更新图片的宽
      const res = uni.getSystemInfoSync();
      console.log(res)
      this.imageWidth = res.windowWidth / 2 - res.windowWidth / 20;
      // 判断是否更新首页数据
      if (uni.getStorageSync('refreshIndexData') === true) {
        this.getAlbumList()
        uni.removeStorageSync('refreshIndexData')
      }
    },
    onLoad() {
      // 获取当前页面路径和参数
      console.log(getCurrentPages().pop().route + ' - onLoad')
    },
    mounted() {
      // 获取当前页面路径和参数
      console.log(getCurrentPages().pop().route + ' - mounted')
      // 更新登录状态
      const loginTopicComponent = this.$refs.loginTopic;
      if (loginTopicComponent) {
        loginTopicComponent.checkAccessToken();
      }
      this.getAlbumList();
      let that = this
    },
    // 下拉刷新
    onPullDownRefresh() {
      console.log('refresh');
      this.getAlbumList();
    },
    // #ifdef MP-WEIXIN
    // 分享内容
    onShareAppMessage() {
      return {
        title: '猫王云相册',
        path: '/pages/index/index',
      };
    },
    // #endif
    // 定义方法
    methods: {
      onTabItemTap(e) {

      },
      loadMore(e) {
        if (e.detail.status === 'more') {
          this.loadStatus = 'loading'
        }
      },
      // 点击相册
      clickHandle(e) {
        const el = this.list[e.detail.index]
        uni.navigateTo({
          url: `/pages/view/view?code=${el.code}`
        });
      },
      // 获取相册列表
      getAlbumList() {
        uni.showLoading({
          title: '加载中',
          mask: true
        })
        uni.stopPullDownRefresh();
        request({
            url: 'https://wx.ctokz.com/wx/Album/list', // 替换为你的远程图片列表接口
            method: 'post'
          })
          .then(res => {
            uni.hideLoading()
            this.refreshEnable = false
            if (res.statusCode === 200) {
              let data = res.data;
              if (data.status === 200) {
                this.list = data.result.list
                this.permission = data.result.permission
                // 判断创建相册的权限和入口
                if (this.permission > 0) {
                  this.contentForFab.unshift({
                        iconPath: '/static/icons/pictures.png',
                        text: '创建',
                        active: false
                  })
                }
              }
            } else {
              console.error('Failed to fetch list:', res);
            }
          })
          .catch(err => {
            uni.hideLoading()
            this.refreshEnable = false
            console.error('Request failed:', err);
          })
      },
      // 点击菜单
      triggerFab(e) {
        let that = this
        // 判断菜单事件
        if (e.item.text === '加入') {
          uni.showModal({
            title: '加入相册',
            placeholderText: '请输入相册邀请码',
            content: '',
            editable: true,
            success: function(res) {
              if (res.confirm) {
                uni.showLoading({
                  title: '申请中...',
                  mask: true,
                })
                request({
                    url: 'https://wx.ctokz.com/wx/Album/invite', // 替换为你的远程图片列表接口
                    method: 'post',
                    data: {
                      inviteCode: res.content,
                    }
                  })
                  .then(res => {
                    uni.hideLoading();
                    if (res.statusCode === 200 && res.data.status === 200) {
                      uni.showToast({
                        title: '加入成功'
                      })
                      that.getAlbumList()
                    } else {
                      uni.showModal({
                        title: '加入失败',
                        content: res.data.message,
                        showCancel: false
                      })
                    }
                  })
                  .catch(err => {
                    uni.hideLoading();
                    console.error('Request failed:', err);
                  })
              } else if (res.cancel) {
                console.log('用户点击取消');
              }
            }
          });
        } else if (e.item.text === '分享') {
          // #ifdef APP || APP-PLUS
          uni.share({
            provider: 'weixin',
            scene: "WXSceneSession",
            type: 5,
            imageUrl: 'https://wx.qlogo.cn/mmhead/INk4JvWfe8XwKeVKWSvLIXUIc3VBd9TP5I2MZPlprzOVyvaiaicmElgKqoqGQqNm3a3ZV24v88Hok/0',
            title: '欢迎体验云相册',
            miniProgram: {
              id: 'gh_3bc6e6d49678',
              path: 'pages/index/index',
              type: 0,
              webUrl: 'https://h5.ctokz.com'
            },
            success: ret => {
              console.log(JSON.stringify(ret));
            }
          });
          // #endif
          // #ifdef WEB || MP-WEIXIN
          this.$refs.share.open()
          // #endif
        } else if (e.item.text === '创建') {
          uni.showModal({
          	title: '提示',
          	content: '',
            editable: true,
            placeholderText: '请输入相册名称',
          	success: function (res) {
          		if (res.confirm) {
                uni.showLoading({
                  title: '创建中',
                  mask: true
                })
                request({
                  url: 'https://wx.ctokz.com/wx/Album/create',
                  method: 'post',
                  data: {
                    albumName: res.content
                  }
                })
                .then(res => {
                  uni.hideLoading()
                  if (res.statusCode === 200 && res.data.status === 200) {
                    uni.showToast({
                      title: '创建成功'
                    })
                    that.getAlbumList()
                  } else {
                    uni.showToast({
                      title: res.data.message
                    })
                  }
                })
          		} else if (res.cancel) {
          			console.log('用户点击取消');
          		}
          	}
          });
        }
      },
      // 分享按钮
      shareSelect(data) {
        console.log(data)
      }
    }
  }
</script>

<style>
  .album-list {
    margin: 2vw;
    height: 100%;
  }

  .text {
    font-size: 14px;
    margin-top: 5px;
    text-align: center;
  }

  /* #ifdef WEB */

  /* #endif */
</style>