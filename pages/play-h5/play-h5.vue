<template>
  <view class="container" v-if="url">
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
    this.url = 'https://zmdhh.github.io/cms-video-app/h5-player/' + params
    // #endif
    // #ifdef H5
    this.url = '/static/h5/index.html' + params
    // #endif
  },
  methods: {
    onMsg(e) {
      if (e.detail && e.detail.data === 'close') {
        uni.navigateBack()
      }
    }
  }
}
</script>

<style scoped>
.container{width:100%;height:100vh}
</style>
