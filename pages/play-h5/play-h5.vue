<template>
  <view class="container" v-if="url">
    <view class="close-btn" @tap="goBack">✕</view>
    <!-- #ifdef APP-PLUS -->
    <web-view :src="url" @message="onMsg"></web-view>
    <!-- #endif -->
    <!-- #ifdef H5 -->
    <iframe :src="url" style="width:100%;height:100%;border:none"></iframe>
    <!-- #endif -->
  </view>
</template>

<script>
export default {
  data() {
    return { url: '' }
  },
  onLoad() {
    const raw = uni.getStorageSync('h5_player_data')
    if (raw) {
      try {
        const data = JSON.parse(raw)
        const params = '?url=' + encodeURIComponent(data.url || '') +
          '&title=' + encodeURIComponent(data.title || '') +
          '&poster=' + encodeURIComponent(data.poster || '')
        this.url = '/static/player/index.html' + params
      } catch(e) {}
    }
  },
  methods: {
    goBack() { uni.navigateBack() },
    onMsg(e) {}
  }
}
</script>

<style scoped>
.container{width:100%;height:100vh;position:relative}
.close-btn{position:fixed;top:20rpx;right:20rpx;z-index:999;width:56rpx;height:56rpx;background:rgba(0,0,0,0.6);color:#fff;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:28rpx}
</style>
