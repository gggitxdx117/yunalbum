<template>
  <view>
    <loginTopic ref="loginTopic"></loginTopic>
    <view class="uni-padding-wrap uni-common-mt">
      <uni-segmented-control :current="currentTab" :values="tabItems" :style-type="styleType"
        :active-color="activeColor" @clickItem="onClickItem" />
    </view>
    <view class="content">
      <view v-if="currentTab === 0">
        <checkbox-group @change="checkboxChange">
          <uni-grid v-if="images.length > 0" class="block" :column="4" :showBorder="false">
            <uni-grid-item v-for="(item, index) in images" :index="index" :key="index">
              <view class="image-list">
                <checkbox :value="index.toString()" v-if="settings" />
                <image style="width: 100%; height: 100%; background-color: #eeeeee;"
                  :src="item + '?x-image-process=style/w-300'" mode="aspectFill" @tap="clickHandle(index)" />
              </view>
            </uni-grid-item>
          </uni-grid>
        </checkbox-group>
      </view>
      <view v-if="currentTab === 1 && hasv" class="infos-box">
        <checkbox-group @change="checkboxChange">
          <block v-for="(item, index) in infos" :index="index" :key="index">
            <view class="info-list">
              <checkbox :value="index.toString()" v-if="settings" />
              <video :src="item" controls>
              </video>
            </view>
          </block>
        </checkbox-group>
      </view>
      <uni-load-more :status="loadStatus" />
    </view>
    <uni-fab ref="uniFab" :content="contentForFab" horizontal="right" vertical="bottom" direction="vertical" popMenu
      @trigger="triggerFab" @fabClick="fabClick"></uni-fab>
    <!-- 分享示例 -->
    <!-- #ifdef WEB || MP-WEIXIN -->
    <uni-popup ref="share" type="share" safeArea backgroundColor="#fff">
      <wxShare @select="shareSelect"></wxShare>
    </uni-popup>
    <!-- 海报生成 -->
    <uni-popup ref="canvas" mode="center" safeArea backgroundColor="#fff" @maskClick="fabClick">
      <view class="canvas">
        <view class="canvas-box" v-if="showCanvas">
          <canvas canvas-id="posterCanvas" style="width: 300px; height: 300px;"></canvas>
        </view>
        <view class="canvas-image">
          <image style="width: 100%; height: 100%;" mode="aspectFill" :src="thumbUrl" />
        </view>
      </view>
      <button @click="editThumbUrl" :disabled="showCanvas">应用相册海报</button>
    </uni-popup>
    <!-- 管理模块 -->
    <uni-drawer ref="settings" mode="right" mask-click width="260">
      <uni-card padding="0" spacing="0">
        <template v-slot:cover>
          <view class="custom-cover">
            <image class="cover-image" mode="aspectFill" :src="thumbUrl" @tap="selectImages" />
            <view class="cover-content">
              <text class="uni-subtitle uni-white">{{ title }}</text>
            </view>
          </view>
        </template>
        <uni-list>
          <uni-list-item title="修改标题" showArrow clickable @click="editTitle()"></uni-list-item>
          <uni-list-item title="删除相册" showArrow clickable @click="delAlbum()"></uni-list-item>
        </uni-list>
      </uni-card>
    </uni-drawer>
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
        showCanvas: false,
        activeColor: '#007aff',
        styleType: 'text',
        tabItems: ['图片'],
        code: '',
        inviteCode: [],
        inviteCodeCurrent: '',
        title: '',
        thumbUrl: '',
        images: [],
        infos: [],
        imagePage: 1, // 当前页码
        infoPage: 1, // 当前页码
        pageSize: 40, // 每页加载的图片数量
        hasMoreForImage: true, // 是否还有更多图片
        hasMoreForInfo: true, // 是否还有更多图片
        permission: 0,
        hasv: false,
        settings: false,
        selectedValues: [],
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
        contentForFabBk: [],
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
                this.thumbUrl = res.data.result.thumbUrl;
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
                  // 可以编辑相册
                  this.contentForFab.push({
                    iconPath: '/static/icons/delete.png',
                    text: '编辑',
                    active: false
                  })
                }
                // 设置管理按扭
                if (res.data.result.permission >= 4) {
                  // 可以管理相册信息
                  this.contentForFab.push({
                    iconPath: '/static/icons/settings.png',
                    text: '设置',
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
          current: e,
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
      onDeleteInfo(e) {
        let that = this
        that.settings = false

        if (this.selectedValues.length) {
          let count = this.selectedValues.length
          let current = 1
          let url = ''
          uni.showLoading({
            title: `正在删除 ${current} / ${count}`,
            mask: true
          })
          // 执行删除，一条一条删除
          for (let s of this.selectedValues) {
            if (this.currentTab === 0) {
              url = this.images[Number(s)]
            } else {
              url = this.infos[Number(s)]
            }
            current += 1
            request({
                url: 'https://wx.ctokz.com/wx/Album/deleteImage',
                method: 'post',
                data: {
                  url: url,
                  code: this.code
                }
              })
              .then(res => {
                if (res.statusCode === 200) {
                  if (res.data.status !== 200) {
                    uni.showToast({
                      title: res.data.message
                    })
                  } else {
                    if (this.currentTab === 0) {
                      that.images = that.images.filter(item => item !== url);
                    } else {
                      that.infos = that.infos.filter(item => item !== url);
                    }
                    uni.showLoading({
                      title: `正在删除 ${current} / ${count}`,
                      mask: true
                    })
                  }
                }
                if (current >= count) {
                  uni.hideLoading()
                }
              })
              .catch(err => {
                if (current >= count) {
                  uni.hideLoading()
                }
                console.log(err)
              })
          }
        }
      },
      checkboxChange(e) {
        this.selectedValues = e.detail.value
      },
      // 修改相册名称
      editTitle() {
        let that = this
        uni.showModal({
          title: '修改相册名称',
          placeholderText: '请输入新的名称',
          content: that.title,
          editable: true,
          success: function(res) {
            if (res.confirm === true) {
              request({
                  url: 'https://wx.ctokz.com/wx/Album/editTitle',
                  method: 'post',
                  data: {
                    code: that.code,
                    title: res.content
                  }
                })
                .then(res => {
                  if (res.statusCode === 200) {
                    if (res.data.status === 200) {
                      that.title = res.data.result.title
                      uni.showToast({
                        title: '修改成功'
                      })
                    } else {
                      uni.showToast({
                        title: res.data.message
                      })
                    }
                  }
                })
            }
          }
        })
      },
      // 修改相册缩略图
      editThumbUrl() {
        let that = this
        request({
            url: 'https://wx.ctokz.com/wx/Album/editThumbUrl',
            method: 'post',
            data: {
              code: that.code,
              thumbUrl: that.thumbUrl
            }
          })
          .then(res => {
            if (res.statusCode === 200) {
              if (res.data.status === 200) {
                // 需要刷新首页信息
                uni.setStorageSync('refreshIndexData', true)
                uni.showToast({
                  title: '保存成功'
                })
                that.$refs.canvas.close()
                that.fabClick()
              } else {
                uni.showToast({
                  title: res.data.message
                })
              }
            }
          })
      },
      // 删除相册
      delAlbum() {
        let that = this
        uni.showModal({
          title: '删除提示',
          content: '删除后无法恢复，请确认',
          success: function(res) {
            request({
                url: 'https://wx.ctokz.com/wx/Album/delAlbum',
                method: 'post',
                data: {
                  code: that.code
                }
              })
              .then(res => {
                if (res.statusCode === 200) {
                  if (res.data.status === 200) {
                    // 需要刷新首页信息
                    uni.setStorageSync('refreshIndexData', true)
                    // 跳转到首页
                    that.toHome()
                  } else {
                    uni.showToast({
                      title: res.data.message
                    })
                  }
                }
              })
          }
        })
      },
      fabClick() {
        if (this.settings === true) {
          this.settings = false
          this.contentForFab = this.contentForFabBk
        }
      },
      // 选择图片生成海报
      selectImages() {
        let that = this
        that.settings = true
        that.$refs.uniFab.isShow = true
        that.currentTab = 0
        that.contentForFabBk = that.contentForFab
        that.contentForFab = [{
          iconPath: '/static/icons/gallery.png',
          text: '生成海报',
          active: false
        }]
        that.$refs.settings.close()
      },
      // 点击菜单
      triggerFab(e) {
        let that = this
        // console.log(that.$refs.uniFab)
        that.$refs.uniFab.isShow = false
        // 判断菜单事件
        if (e.item.text === '首页') {
          this.toHome()
        } else if (e.item.text === '照片') {
          that.uploadFile('image')
        } else if (e.item.text === '视频') {
          that.uploadFile('video')
        } else if (e.item.text === '删除') {
          that.onDeleteInfo()
          that.settings = false
          that.contentForFab = that.contentForFabBk
        } else if (e.item.text === '编辑') {
          that.settings = true
          that.$refs.uniFab.isShow = true
          that.contentForFabBk = that.contentForFab
          that.contentForFab = [{
            iconPath: '/static/icons/delete.png',
            text: '删除',
            active: false
          }]
        } else if (e.item.text === '设置') {
          that.$refs.settings.open()
        } else if (e.item.text === '生成海报') {
          that.createPoster()
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
          if (that.inviteCode.length > 0) {
            uni.showActionSheet({
              itemList: ['分享管理权限', '分享编辑权限', '分享阅读权限'],
              success: function(res) {
                that.inviteCodeCurrent = that.inviteCode[res.tapIndex]
                that.$refs.share.open()
              },
              fail: function(res) {
                console.log(res.errMsg);
              }
            });
          } else {
            that.$refs.share.open()
          }
          // #endif
        }
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
      },
      toHome() {
        uni.switchTab({
          url: `/pages/index/index`
        });
      },
      async createPoster() {
        this.$refs.canvas.open()
        this.showCanvas = true;
        const ctx = uni.createCanvasContext('posterCanvas');

        const imageFiles = await Promise.all(this.selectedValues.map(s => this.downloadFile(this.images[Number(s)] + '?x-image-process=style/w-300')));

        const count = imageFiles.length;
        const sizes = this.calculateSizes(count);

        for (let i = 0; i < count; i++) {
          const img = imageFiles[i].tempFilePath;
          const {
            imgWidth,
            imgHeight,
            orientation
          } = await this.getImageInfoExtended(img);
          const {
            sx,
            sy,
            sSize
          } = this.getCenterCrop(imgWidth, imgHeight, orientation);

          const x = (i % sizes.cols) * sizes.size;
          const y = Math.floor(i / sizes.cols) * sizes.size;

          ctx.save();
          ctx.drawImage(img, sx, sy, sSize, sSize, x, y, sizes.size, sizes.size);
        }

        ctx.draw(false, () => {
          uni.canvasToTempFilePath({
            canvasId: 'posterCanvas',
            success: (res) => {
              if (res.tempFilePath.indexOf('data:image') === 0) {
                // 已经是 base64 数据
                this.thumbUrl = res.tempFilePath;
                this.showCanvas = false;
              } else {
                // 需要获取 base64 数据
                uni.getFileSystemManager().readFile({
                  filePath: res.tempFilePath,
                  encoding: 'base64',
                  success: (res) => {
                    this.thumbUrl = 'data:image/png;base64,' + res.data;
                    this.showCanvas = false;
                  },
                  fail: (err) => {
                    console.error('生成海报失败:', err);
                  }
                });
              }
            },
            fail: (err) => {
              console.error('生成海报失败:', err);
            }
          });
        });
      },
      calculateSizes(count) {
        const canvasSize = 300;
        let cols = Math.ceil(Math.sqrt(count));
        let rows = Math.ceil(count / cols);
        let size = canvasSize / cols;
        return {
          cols,
          rows,
          size
        };
      },
      downloadFile(url) {
        return new Promise((resolve, reject) => {
          uni.downloadFile({
            url: url,
            success: (res) => {
              if (res.statusCode === 200) {
                resolve(res);
              } else {
                reject(new Error('下载失败'));
              }
            },
            fail: (err) => {
              reject(err);
            }
          });
        });
      },
      getImageInfoExtended(imgPath) {
        return new Promise((resolve, reject) => {
          uni.getImageInfo({
            src: imgPath,
            success: (res) => {
              resolve({
                imgWidth: res.width,
                imgHeight: res.height,
                orientation: res.orientation || 'up'
              });
            },
            fail: (err) => {
              reject(err);
            }
          });
        });
      },
      getCenterCrop(imgWidth, imgHeight, orientation) {
        let size = Math.min(imgWidth, imgHeight);
        let sx = (imgWidth - size) / 2;
        let sy = (imgHeight - size) / 2;

        if (orientation === 'left' || orientation === 'right') {
          // Swap width and height if the orientation is left or right
          size = Math.min(imgHeight, imgWidth);
          sx = (imgHeight - size) / 2;
          sy = (imgWidth - size) / 2;
        }

        return {
          sx,
          sy,
          sSize: size
        };
      }
    }
  }
</script>

<style>
  .image-list {
    padding: 1px;
    background-color: black;
    height: 100%;
  }

  .infos-box {
    display: grid;
    place-items: center;
  }

  .info-list {
    position: relative;
    margin-top: 2vw;
    margin-bottom: 2vw;
  }

  .info-block {
    text-align: center;
  }

  .info-list uni-checkbox,
  .info-list checkbox {
    position: absolute;
    z-index: 2;
    padding-left: calc(300px - 3vw - 22px);
    padding-bottom: calc(225px - 3vw - 22px);
    padding-right: 3vw;
    padding-top: 3vw;
  }

  .image-list uni-checkbox,
  .image-list checkbox {
    position: absolute;
    z-index: 2;
    padding-left: calc(95% - 25px);
    padding-bottom: calc(95% - 25px);
    padding-right: 5%;
    padding-top: 5%;
  }

  .image-list uni-checkbox .uni-checkbox-input {
    margin: 0;
  }

  .custom-cover {
    flex-direction: row;
    position: relative;
    width: 100%;
  }

  .custom-cover::before {
    content: "";
    display: block;
    padding-bottom: 100%;
  }

  .cover-content {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 40px;
    background-color: rgba($color: #000000, $alpha: 0.4);
    display: flex;
    flex-direction: row;
    align-items: center;
    padding-left: 15px;
    font-size: 14px;
    color: #fff;
  }

  .cover-image {
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    width: 100%;
    background-color: black;
  }

  .canvas {
    width: 300px;
    height: 300px;
    overflow: hidden;
    position: relative;
  }

  .canvas-image {
    width: 100%;
    height: 100%;
    position: absolute;
    top: 0;
    left: 0;
    z-index: 1;
  }

  .canvas-box {
    width: 300px;
    height: 300px;
    overflow: hidden;
    z-index: -1;
  }
</style>