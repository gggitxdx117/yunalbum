<template>
  <view>
    <loginTopic ref="loginTopic"></loginTopic>
    <view class="uni-padding-wrap uni-common-mt">
      <uni-segmented-control :current="currentTab" :values="tabItems" :style-type="styleType"
        :active-color="activeColor" @clickItem="onClickItem" />
    </view>
    <view class="content">
      <view v-if="currentTab === 0">
        <uni-grid v-if="images.length > 0" class="block" :column="2" @change="clickHandle" :showBorder="false">
          <uni-grid-item v-for="(item, index) in images" :index="index" :key="index">
            <view class="image-list">
              <checkbox :value="index" v-if="settings" />
              <image style="width: 100%; height: 100%; background-color: #eeeeee;border-radius: 5%;"
                :src="item + '?x-image-process=style/style-b25f'" mode="aspectFill" />
            </view>
          </uni-grid-item>
        </uni-grid>
      </view>
      <view v-if="currentTab === 1 && hasv">
        <uni-grid v-if="infos.length > 0" class="info-block" :column="1" :showBorder="false">
          <uni-grid-item v-for="(item, index) in infos" :index="index" :key="index">
            <view class="info-list">
              <video :src="item" controls>
              </video>
            </view>
          </uni-grid-item>
        </uni-grid>
      </view>
      <uni-load-more :status="loadStatus" />
    </view>
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
  // #ifdef APP
  var AfDocument = uni.requireNativePlugin("Aq-ChooseFile");
  // #endif
  import loginTopic from '@/components/loginTopic/loginTopic.vue'
  import {
    request
  } from '@/utils/request.js';
  import wxShare from '@/components/wxShare/wxShare.vue'
  export default {
    components: {
      loginTopic
    },
    data() {
      return {
        loadStatus: 'noMore',
        currentTab: 0,
        activeColor: '#007aff',
        styleType: 'text',
        tabItems: ['图片'],
        code: '',
        inviteCode: [],
        inviteCodeCurrent: '',
        title: '',
        images: [],
        infos: [],
        imagePage: 1, // 当前页码
        infoPage: 1, // 当前页码
        pageSize: 10, // 每页加载的图片数量
        hasMoreForImage: true, // 是否还有更多图片
        hasMoreForInfo: true, // 是否还有更多图片
        permission: 0,
        hasv: false,
        settings: false,
        contentForFab: [{
            iconPath: '/static/icons/home.png',
            text: '首页',
            active: false
          },
          {
            iconPath: '/static/icons/share.png',
            text: '分享',
            active: false
          }
        ],
        // 上传参数
        uploadFromData: {}
      }
    },
    onShow() {
      // 判断是否更新数据
      if (uni.getStorageSync('refreshViewData') === true) {
        this.onRefresh()
        uni.removeStorageSync('refreshViewData')
      }
    },
    onLoad(options) {
      console.log(getCurrentPages().pop().route + ' - onLoad')
      // 初始化code参数
      if (options && options.code) {
        this.code = options.code
        // 获取相册信息
        request({
            url: 'https://wx.ctokz.com/wx/Album/permission', // 替换为你的远程图片列表接口
            method: 'post',
            data: {
              code: this.code,
            }
          })
          .then(res => {
            if (res.statusCode === 200) {
              if (res.data.status === 200) {
                // 判断权限
                this.permission = res.data.result.permission;
                this.inviteCode = res.data.result.inviteCode;
                this.hasv = res.data.result.hasv;
                if (res.data.result.hasv === true) {
                  this.tabItems = [res.data.result.typeLabel1, res.data.result.typeLabel2]
                } else {
                  this.tabItems = [res.data.result.typeLabel1]
                }
                // 设置上传按钮
                if (res.data.result.permission >= 2) {
                  // 可以上传图片
                  this.contentForFab.unshift({
                    iconPath: '/static/icons/picture.png',
                    text: '照片',
                    active: false
                  })
                  if (this.hasv) {
                    // 可以上传视频
                    this.contentForFab.unshift({
                      iconPath: '/static/icons/video.png',
                      text: '视频',
                      active: false
                    })
                  }
                  // 可以删除图片资源
                  this.contentForFab.push({
                    iconPath: '/static/icons/settings.png',
                    text: '管理',
                    active: false
                  })
                }
                // 设置头文字
                uni.setNavigationBarTitle({
                  title: `${res.data.result.title}`
                });
                this.title = `${res.data.result.title}`
                // 刷新列表
                this.onRefresh();
              }
            }
          });
      }
    },
    // 下拉刷新
    onPullDownRefresh() {
      console.log('refresh');
      this.onRefresh();
    },
    // 触底事件
    onReachBottom(e) {
      this.loadImages();
      this.loadInfos();
    },
    // 加载组件后执行
    mounted() {
      // 获取当前页面路径和参数
      console.log(getCurrentPages().pop().route + ' - mounted');
      // 更新登录状态
      const loginTopicComponent = this.$refs.loginTopic;
      if (loginTopicComponent) {
        loginTopicComponent.checkAccessToken();
      }
    },
    // #ifdef MP-WEIXIN
    // 分享内容
    onShareAppMessage() {
      if (this.inviteCodeCurrent) {
        return {
          title: this.title,
          path: '/pages/view/invite?inviteCode=' + this.inviteCodeCurrent,
        };
      } else {
        return {
          title: this.title,
          path: '/pages/view/view?code=' + this.code,
        };
      }
    },
    // #endif
    methods: {
      // 重新刷新页面
      onRefresh() {
        this.refreshEnable = true;
        this.imagePage = 1;
        this.infoPage = 1;
        this.images = [];
        this.infos = [];
        this.hasMoreForImage = true;
        this.hasMoreForInfo = true;
        this.loadImages();
        this.loadInfos();
      },
      /**
       * 加载图片列表
       */
      loadImages() {
        uni.stopPullDownRefresh();
        if (!this.hasMoreForImage || this.currentTab !== 0 || this.loadStatus === 'loading') return; // 如果没有更多图片则返回

        uni.showLoading({
          title: '加载中',
          mask: true
        })
        this.loadStatus = 'loading'
        request({
            url: 'https://wx.ctokz.com/wx/Album/images', // 替换为你的远程图片列表接口
            method: 'post',
            data: {
              code: this.code,
              page: this.imagePage,
              pageSize: this.pageSize
            }
          })
          .then(res => {
            uni.hideLoading();
            this.refreshEnable = false;
            if (res.statusCode === 200 && res.data.status === 200) {
              let result = res.data.result;
              let newImages = result.imageList;

              // 判断是否还有更多图片
              this.hasMoreForImage = newImages.length === this.pageSize
              this.loadStatus = this.hasMoreForImage ? "more" : "noMore"
              this.images = this.images.concat(newImages);
              this.imagePage = this.imagePage + 1;
            } else {
              console.error('Failed to fetch list:', res);
            }
          })
          .catch(err => {
            uni.hideLoading()
            this.refreshEnable = false
            this.loadStatus = 'noMore'
            console.error('Request failed:', err);
          })
      },

      /**
       * 加载内容列表
       */
      loadInfos() {
        if (!this.hasMoreForInfo || this.currentTab !== 1 || this.loadStatus === 'loading') return; // 如果没有更多图片则返回
        uni.showLoading({
          title: '加载中',
          mask: true
        })
        this.loadStatus = 'loading'
        request({
            url: 'https://wx.ctokz.com/wx/Album/infos', // 替换为你的远程图片列表接口
            method: 'post',
            data: {
              code: this.code,
              page: this.infoPage,
              pageSize: 5
            }
          })
          .then(res => {
            uni.hideLoading();
            this.refreshEnable = false;
            if (res.statusCode === 200 && res.data.status) {
              let result = res.data.result;
              let newInfos = result.infoList;

              // 判断是否还有更多图片
              this.hasMoreForInfo = newInfos.length === 5
              this.loadStatus = this.hasMoreForInfo ? "more" : "noMore"
              this.infos = this.infos.concat(newInfos);
              this.infoPage = this.infoPage + 1;
            } else {
              console.error('Failed to fetch list:', res);
            }
          })
          .catch(err => {
            uni.hideLoading()
            this.refreshEnable = false
            this.loadStatus = 'noMore'
            console.error('Request failed:', err);
          })
      },
      // 点击放大图片
      clickHandle(e) {
        // 预览图片
        uni.previewImage({
          urls: this.images,
          showmenu: true,
          current: e.detail.index,
        });
      },
      // 点击tab切换内容
      onClickItem(e) {
        this.currentTab = e.currentIndex
        if (e.currentIndex === 0 && this.imagePage === 1) {
          this.loadImages();
        }
        if (e.currentIndex === 1 && this.infoPage === 1) {
          this.loadInfos();
        }
      },
      // 删除图片内容
      onDeleteInfo() {

      },
      // 解析XML中的Key值
      parseXML(xmlData) {
        const keyMatch = xmlData.match(/<Key>(.*?)<\/Key>/);
        if (keyMatch && keyMatch[1]) {
          return keyMatch[1]
        } else {
          console.error('Key element not found in XML data');
        }
      },
      // 获取文件后缀的方法
      getFileExtension(filePath) {
        return filePath.split('.').pop();
      },
      // 获取文件名的方法
      getFileName(filePath) {
        return filePath.split('/').pop();
      },
      // 点击菜单
      triggerFab(e) {
        let that = this
        // 判断菜单事件
        if (e.item.text === '首页') {
          uni.navigateTo({
            url: `/pages/index/index`
          });
        } else if (e.item.text === '照片') {
          this.uploadFile('image')
        } else if (e.item.text === '视频') {
          this.uploadFile('video')
        } else if (e.item.text === '管理') {
          this.settings = true
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
          // 让用户选择分享什么权限
          if (this.inviteCode.length > 0) {
            let that = this
            uni.showActionSheet({
            	itemList: ['分享管理权限', '分享编辑权限', '分享阅读权限'],
            	success: function (res) {
                that.inviteCodeCurrent = that.inviteCode[res.tapIndex]
                that.$refs.share.open()
            	},
            	fail: function (res) {
            		console.log(res.errMsg);
            	}
            });
          } else {
            this.$refs.share.open()
          }
          // #endif
        }
      },
      // 点击上传文件
      uploadFile(mediaType = 'image') {
        let that = this
        request({
            url: 'https://wx.ctokz.com/wx/Album/getObsUploadData',
            method: 'POST',
            data: {
              code: that.code
            }
          })
          .then(res => {
            if (res.data.status === 200) {
              that.uploadFromData = res.data.result
            }
          })
        // 拉起图片视频选择按钮
        // #ifdef WEB
        let ext = mediaType === 'image' ? ['svgz', 'pjp', 'jff', 'jpeg', 'ico', 'ttiff', 'avif', '.svg', ' jpg', 'tift',
          'git', 'png', 'xbm', 'pjpeg', 'bmp', 'webp'
        ] : ['mp4', 'avi', 'mov', 'wmv', 'flv', 'mkv', 'webm', 'mpeg', 'mpg', 'm4v']
        uni.chooseFile({
          count: 1000, //默认9
          type: mediaType,
          extension: ext,
          sizeType: ['original'],
          compressed: false,
          sourceType: ['album', 'camera'], //从相册选择
          success: function(chooseRes) {
            that.uploadFileRes(chooseRes, that)
          },
          fail: (err) => {
            uni.hideLoading()
            uni.showToast({
              title: '上传失败'
            })
            console.log(err)
          }
        })
        // #endif
        // #ifdef APP
        if (mediaType === 'image') {
          uni.chooseImage({
            count: 1000, //默认9
            extension: ['svgz', 'pjp', 'jff', 'jpeg', 'ico', 'ttiff', 'avif', '.svg', ' jpg', 'tift', 'git', 'png',
              'xbm', 'pjpeg', 'bmp', 'webp'
            ],
            sizeType: ['original'],
            compressed: false,
            sourceType: ['album', 'camera'], //从相册选择
            success: function(chooseRes) {
              that.uploadFileRes(chooseRes, that)
            },
            fail: (err) => {
              uni.hideLoading()
              uni.showToast({
                title: '上传失败'
              })
              console.log(err)
            }
          })
        } else {
          uni.chooseVideo({
            count: 1000, //默认9
            extension: ['mp4', 'avi', 'mov', 'wmv', 'flv', 'mkv', 'webm', 'mpeg', 'mpg', 'm4v'],
            sizeType: ['original'],
            compressed: false,
            sourceType: ['album', 'camera'], //从相册选择
            success: function(chooseRes) {
              that.uploadFileRes(chooseRes, that)
            },
            fail: (err) => {
              uni.hideLoading()
              uni.showToast({
                title: '上传失败'
              })
              console.log(err)
            }
          })
        }
        // #endif
        // #ifdef MP-WEIXIN
        uni.chooseMedia({
          count: 200,
          sizeType: ['original'],
          mediaType: [mediaType],
          sourceType: ['album', 'camera'],
          maxDuration: 30,
          camera: 'back',
          success: (chooseRes) => {
            that.uploadFileRes(chooseRes, that)
          },
          fail: (err) => {
            uni.hideLoading()
            uni.showToast({
              title: '上传失败'
            })
            console.log(err)
          }
        });
        // #endif
      },
      // 将选择的文件进行上传
      uploadFileRes(chooseRes, that) {
        // 更新进度
        uni.showLoading({
          title: `进度 0%`,
          mask: true
        })
        // 单个单个上传
        let sessionKey = uni.getStorageSync('sessionKey');
        let accessToken = uni.getStorageSync('accessToken');
        let fileCount = chooseRes.tempFiles.length;
        if (fileCount > 0) {
          let successCount = 0
          let errCount = 0
          let uploadTask = []
          let progressList = []
          for (let index in chooseRes.tempFiles) {
            // 执行上传到资源服务器
            let file = chooseRes.tempFiles[index]
            progressList[index] = 0
            uploadTask[index] = uni.uploadFile({
              url: that.uploadFromData.domain,
              filePath: file.tempFilePath ? file.tempFilePath : file.path,
              name: 'file',
              header: {
                'sessionKey': sessionKey, // 自动传入 sessionKey
                'accessToken': accessToken // 自动传入 accessToken
              },
              formData: {
                key: that.uploadFromData.path + that.getFileName(file.tempFilePath ? file.tempFilePath : file.name),
                policy: that.uploadFromData.policy,
                AccessKeyId: that.uploadFromData.AccessKeyId,
                signature: that.uploadFromData.signature,
                success_action_status: that.uploadFromData.success_action_status,
                domain: that.uploadFromData.domain,
              },
              success: (uploadFileRes) => {
                progressList[index] = 100
                successCount += 1
                let progress = Math.round(progressList.reduce((accumulator, currentValue) => accumulator +
                  currentValue, 0) / fileCount) - (fileCount - successCount - errCount)
                console.log([successCount, fileCount, progress])
                // 更新进度
                uni.showLoading({
                  title: `进度 ${progress}%`,
                  mask: true
                })
                // 显示完成
                if (progress >= 100) {
                  uni.hideLoading()
                  uni.showToast({
                    title: '已完成'
                  })
                  that.onRefresh()
                }
              },
              fail: (err) => {
                progressList[index] = 100
                errCount += 1
                let progress = Math.round(progressList.reduce((accumulator, currentValue) => accumulator +
                  currentValue, 0) / fileCount) - (fileCount - successCount - errCount)
                if (progress >= 100) {
                  uni.hideLoading()
                  uni.showToast({
                    title: '已完成'
                  })
                  that.onRefresh()
                }
                console.log(err)
              }
            });
            uploadTask[index].onProgressUpdate((res) => {
              console.log(index + '-' + res.progress)
              progressList[index] = res.progress
              let progress = Math.round(progressList.reduce((accumulator, currentValue) => accumulator +
                currentValue, 0) / fileCount) - (fileCount - successCount - errCount)
              // 更新进度
              if (progress >= 100) {
                uni.hideLoading()
                uni.showToast({
                  title: '已完成'
                })
                that.onRefresh()
              } else {
                uni.showLoading({
                  title: `进度 ${progress}%`,
                  mask: true
                })
              }
            })
          }
        } else {
          uni.hideLoading()
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
  .image-list {
    margin: 2vw;
    height: 100%;
  }

  .info-list {
    margin-top: 2vw;
    margin-bottom: 2vw;
  }

  .info-block {
    text-align: center;
  }
  .image-list uni-checkbox {
    position: absolute;
    z-index: 2;
    right: 2vw;
    top: 2vw;
    padding-left: calc(44vw - 22px);
    padding-bottom: calc(44vw - 22px);
    padding-right: 1vw;
    padding-top: 1vw;
  }
  .image-list uni-checkbox .uni-checkbox-input {
    margin: 0;
  }
</style>