<template>
  <view class="container" v-if="url">
    <web-view :src="url" style="width:100%;height:100%"></web-view>
    <view class="rotate-btn" @tap="toggleOrient">{{ isLand ? '↻竖屏' : '↻横屏' }}</view>
  </view>
  <view v-else class="loading"><text>加载中...</text></view>
</template>

<script>
export default {
  data() {
    return { url: '', isLand: true }
  },
  onLoad() {
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
    // #ifdef APP-PLUS
    plus.screen.lockOrientation('landscape')
    // #endif
  },
  onUnload() {
    // #ifdef APP-PLUS
    plus.screen.lockOrientation('portrait')
    // #endif
  },
  methods: {
    toggleOrient() {
      // #ifdef APP-PLUS
      this.isLand = !this.isLand
      plus.screen.lockOrientation(this.isLand ? 'landscape' : 'portrait')
      // #endif
    }
  }
}
</script>

<style scoped>
.container{width:100%;height:100vh;position:relative}
.loading{display:flex;justify-content:center;padding-top:200rpx;color:#888;font-size:28rpx}
.rotate-btn{position:fixed;bottom:30rpx;right:30rpx;z-index:9999;padding:10rpx 20rpx;background:rgba(34,197,94,0.8);color:#fff;border-radius:50rpx;font-size:22rpx}
</style>
