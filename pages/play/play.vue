<template>
  <view class="player-page">
    <view class="nav-top" v-if="!fullscreen">
      <view class="nav-back" @tap="goBack"><text class="back-icon">‹</text></view>
      <text class="nav-title">{{ srcTitle }}</text>
      <text class="ep-info" v-if="epTotal">{{ epIdx + 1 }}/{{ epTotal }}</text>
    </view>

    <view class="rate-bar">
      <text class="rate-label">倍速</text>
      <view class="rate-options">
        <view class="rate-btn" v-for="r in rates" :key="r.value"
          :class="{active:rate===r.value}" @tap="setRate(r.value)">{{ r.label }}</view>
      </view>
      <view class="rate-btn ext" @tap="openExternal">外部播放</view>
      <view class="rate-btn h5" @tap="openH5Player">H5增强</view>
    </view>

    <video
      id="playVideo"
      class="video"
      :src="curUrl"
      :autoplay="true"
      :controls="true"
      object-fit="contain"
      @play="onPlay"
      @error="onError"
      @fullscreenchange="onFs"
      @ended="onEnded"
      @timeupdate="onTime"
      poster=""
    ></video>

    <view class="episodes-panel" v-if="!fullscreen && epTotal > 0">
      <view class="panel-header">
        <text class="panel-title">选集</text>
        <view class="source-tabs" v-if="srcKeys.length > 1">
          <view class="source-tab" v-for="(k,i) in srcKeys" :key="k"
            :class="{active:curSrc===k}" @tap="switchSrc(k)">线{{i+1}}</view>
        </view>
      </view>
      <view class="ep-grid">
        <view class="ep-tag" v-for="(t,i) in curTitles" :key="i"
          :class="{current:i===epIdx}" @tap="switchEp(i)">{{t}}</view>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      allSrcs: {}, curSrc: 'main', curUrls: [], curTitles: [],
      epIdx: 0, epTotal: 0, srcTitle: '', fullscreen: false,
      rate: 1,
      rates: [
        { label: '0.5x', value: 0.5 }, { label: '0.75x', value: 0.75 },
        { label: '1x', value: 1 }, { label: '1.25x', value: 1.25 },
        { label: '1.5x', value: 1.5 }, { label: '2x', value: 2 }
      ],
      saveTimer: null, currentTime: 0
    }
  },
  computed: {
    srcKeys() { return Object.keys(this.allSrcs) },
    curUrl() { return this.curUrls[this.epIdx] || '' }
  },
  onLoad(options) {
    let allSrcs = { main: { urls: [], titles: [] } }
    try {
      const raw = uni.getStorageSync('player_episodes')
      if (raw) { const p = JSON.parse(raw); if (Object.keys(p).length > 0) allSrcs = p }
    } catch(e) {}

    this.curSrc = uni.getStorageSync('player_current_source') || 'main'
    this.allSrcs = allSrcs
    this.epIdx = parseInt(options.episode) || 0

    const src = allSrcs[this.curSrc] || allSrcs[Object.keys(allSrcs)[0]] || { urls: [], titles: [] }
    this.curUrls = src.urls
    this.curTitles = src.titles
    this.epTotal = this.curUrls.length
    this.srcTitle = decodeURIComponent(options.title || '')

    this.restoreProgress()
  },
  mounted() { this.startSaveTimer() },
  onUnload() { this.stopSaveTimer(); this.saveHistory() },
  methods: {
    setRate(val) {
      this.rate = val
      const ctx = uni.createVideoContext('playVideo')
      if (ctx) { try { ctx.playbackRate(Number(val)) } catch(e) {} }
    },
    openExternal() {
      const url = this.curUrl
      if (!url) return
      // #ifdef APP-PLUS
      try {
        const Intent = plus.android.importClass('android.content.Intent')
        const Uri = plus.android.importClass('android.net.Uri')
        const intent = new Intent(Intent.ACTION_VIEW)
        intent.setDataAndType(Uri.parse(url), 'video/*')
        intent.addFlags(0x10000000)
        plus.android.runtimeMainActivity().startActivity(intent)
      } catch(e) {
        plus.runtime.openURL(url)
      }
      // #endif
    },
    openH5Player() {
      const url = this.curUrl
      if (!url) return
      uni.setStorageSync('h5_player_data', JSON.stringify({
        url: url, title: this.srcTitle || '', poster: ''
      }))
      uni.navigateTo({ url: '/pages/play-h5/play-h5' })
    },
    onPlay() {},
    onError(e) {},
    onFs(e) { this.fullscreen = e.detail.fullScreen },
    onEnded() { this.saveHistory(); if (this.epIdx < this.epTotal - 1) this.epIdx++ },
    onTime(e) { if (e.detail && e.detail.currentTime) this.currentTime = e.detail.currentTime },

    switchSrc(k) {
      if (k === this.curSrc) return
      const src = this.allSrcs[k]; if (!src) return
      this.curSrc = k; this.curUrls = src.urls; this.curTitles = src.titles
      this.epTotal = src.urls.length; this.epIdx = 0
    },
    switchEp(i) { if (i !== this.epIdx) this.epIdx = i },

    saveHistory() {
      if (!this.srcTitle || this.currentTime < 5) return
      try {
        const p = getCurrentPages(); const cur = p[p.length - 1]
        const id = cur?.options?.id || ''
        const data = {
          id, title: this.srcTitle, epIdx: this.epIdx, epTotal: this.epTotal,
          time: this.currentTime, curSrc: this.curSrc, saveTime: Date.now()
        }
        uni.setStorageSync('ph_' + id, data)
        const list = uni.getStorageSync('history_list') || []
        const idx = list.findIndex(h => h.id === id)
        if (idx >= 0) list.splice(idx, 1)
        list.unshift(data)
        if (list.length > 100) list.length = 100
        uni.setStorageSync('history_list', list)
      } catch(e) {}
    },

    restoreProgress() {
      try {
        const p = getCurrentPages(); const cur = p[p.length - 1]
        const id = cur?.options?.id || ''
        const data = uni.getStorageSync('ph_' + id)
        if (data && data.time > 5) {
          this.epIdx = data.epIdx || 0
          this.currentTime = data.time
          if (data.curSrc && this.allSrcs[data.curSrc]) this.curSrc = data.curSrc
        }
      } catch(e) {}
    },

    startSaveTimer() {
      this.saveTimer = setInterval(() => this.saveHistory(), 5000)
    },
    stopSaveTimer() {
      if (this.saveTimer) { clearInterval(this.saveTimer); this.saveTimer = null }
    },
    goBack() { uni.navigateBack() }
  }
}
</script>

<style>page{background:#000!important}</style>
<style scoped>
.player-page{background:#000;min-height:100vh}
.nav-top{display:flex;align-items:center;padding:0 20rpx;height:88rpx;background:#111;gap:16rpx}
.nav-back{display:flex;align-items:center}
.back-icon{font-size:48rpx;color:#22c55e;line-height:1}
.nav-title{flex:1;font-size:26rpx;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ep-info{font-size:22rpx;color:#888}
.rate-bar{display:flex;align-items:center;padding:8rpx 24rpx;background:#1a1a1a;gap:16rpx;z-index:10}
.rate-label{font-size:22rpx;color:#888;flex-shrink:0}
.rate-options{display:flex;gap:10rpx}
.rate-btn{padding:2rpx 14rpx;border-radius:4rpx;font-size:20rpx;color:#aaa;background:#222}
.rate-btn.active{background:#22c55e;color:#fff}
.rate-btn.ext{margin-left:auto;background:#2563eb;color:#fff}
.rate-btn.h5{background:#a855f7;color:#fff}
.video{width:100%;height:420rpx;background:#000}
.episodes-panel{padding:24rpx;background:#111}
.panel-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:20rpx}
.panel-title{font-size:30rpx;font-weight:bold;color:#22c55e}
.source-tabs{display:flex;gap:12rpx}
.source-tab{padding:8rpx 20rpx;border-radius:6rpx;font-size:24rpx;color:#aaa;background:#222}
.source-tab.active{background:#22c55e;color:#fff}
.ep-grid{display:flex;flex-wrap:wrap;gap:16rpx}
.ep-tag{width:calc(25% - 12rpx);padding:14rpx 0;text-align:center;background:#222;border-radius:8rpx;font-size:24rpx;color:#ccc}
.ep-tag.current{background:#22c55e;color:#fff}
</style>
