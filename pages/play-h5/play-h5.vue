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
  onLoad(options) {
    const m3u8 = options.url || ''
    const title = options.title || ''
    const poster = options.poster || ''
    const params = '?url=' + encodeURIComponent(m3u8) +
      '&title=' + encodeURIComponent(title) +
      '&poster=' + encodeURIComponent(poster)
    // #ifdef APP-PLUS
    this.url = '/static/h5/index.html' + params
    // #endif
    // #ifdef H5
    this.url = '/static/h5/index.html' + params
    // #endif
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
