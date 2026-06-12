<template>
  <view class="container" v-if="url">
    <web-view :src="url" style="width:100%;height:100%"></web-view>
    <view class="close-btn left" @tap="goBack">‹ 返回</view>
    <view class="close-btn right" @tap="goBack">✕</view>
  </view>
  <view v-else class="loading"><text>加载中...</text></view>
</template>

<script>
export default {
  data() {
    return { url: '' }
  },
  onLoad() {
    // #ifdef APP-PLUS
    setTimeout(function() {
      plus.screen.lockOrientation('landscape')
    }, 300)
    // #endif
    const raw = uni.getStorageSync('h5_player_data')
    if (raw) {
      try {
        const data = JSON.parse(raw)
        const eps = data.urls && data.titles ? { u: data.urls, t: data.titles } : null
        const params = '?url=' + encodeURIComponent(data.url || '') +
          '&title=' + encodeURIComponent(data.title || '') +
          '&poster=' + encodeURIComponent(data.poster || '')
        const epsStr = eps ? '&eps=' + encodeURIComponent(JSON.stringify(eps)) : ''
        this.url = '/static/player/index.html' + params + epsStr
      } catch(e) {}
    }
  },
  onUnload() {
    // #ifdef APP-PLUS
    plus.screen.lockOrientation('portrait')
    // #endif
  },
  onHide() {
    // #ifdef APP-PLUS
    plus.screen.lockOrientation('portrait')
    // #endif
  },
  methods: {
    goBack() { uni.navigateBack() }
  }
}
</script>

<style scoped>
.container{width:100%;height:100vh;position:relative}
.loading{display:flex;justify-content:center;padding-top:200rpx;color:#888;font-size:28rpx}
.close-btn{position:fixed;z-index:99999;background:rgba(0,0,0,0.6);color:#fff;border-radius:8rpx;display:flex;align-items:center;justify-content:center;font-size:26rpx;padding:8rpx 20rpx}
.close-btn.left{top:10rpx;left:10rpx}
.close-btn.right{top:10rpx;right:10rpx;padding:8rpx 16rpx;font-size:30rpx}
</style>
