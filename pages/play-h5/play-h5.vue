<template>
  <web-view v-if="url" :src="url" style="width:100%;height:100vh"></web-view>
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
  }
}
</script>

<style scoped>
.loading{display:flex;justify-content:center;padding-top:200rpx;color:#888;font-size:28rpx}
</style>
