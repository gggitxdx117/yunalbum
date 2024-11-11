// utils/request.js
export const request = (options) => {
  let sessionKey = uni.getStorageSync('sessionKey');
  let accessToken = uni.getStorageSync('accessToken');
  return new Promise((resolve, reject) => {
    uni.request({
      ...options,
      header: {
        ...options.header,
        'miniVersion': '1.0.3', // 自动传入小程序版本号
        'sessionKey': sessionKey, // 自动传入 sessionKey
        'accessToken': accessToken // 自动传入 accessToken
      },
      success: (res) => {
        if (res.statusCode === 200 && res.data.status === 201) {
          uni.hideToast()
          uni.hideLoading()
          // 获取当前页面路径和参数
          const currentPage = getCurrentPages().pop();
          const {
            route,
            options
          } = currentPage;
          if (route) {
            const queryString = options && Object.keys(options).length > 0 ? ('?' + Object.keys(options).map(key => `${key}=${options[key]}`).join('&')) : '';
            const currentPath = `/${route}${queryString}`;
            const loginPathPattern = /\/pages\/login\/login/;
            // 保存当前页面路径到全局变量或缓存
            if (!loginPathPattern.test(currentPath)) {
              uni.setStorageSync('redirectAfterLogin', currentPath)
            }
          }
          uni.redirectTo({
            url: '/pages/login/login' // 跳转到 login 登录页
          });
        } else {
          resolve(res);
        }
      },
      fail: (err) => {
        reject(err);
      }
    });
  });
};