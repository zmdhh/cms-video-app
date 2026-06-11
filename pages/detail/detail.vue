<template>
  <view class="page" v-if="detail">
    <view class="hero">
      <image class="cover" :src="detail.poster" mode="aspectFill" />
      <view class="hero-mask">
        <view class="hero-info">
          <text class="hero-title">{{ detail.title }}</text>
          <view class="hero-tags">
            <text class="tag" v-if="detail.year">{{ detail.year }}</text>
            <text class="tag" v-if="detail.area">{{ detail.area }}</text>
            <text class="tag" v-if="detail.lang">{{ detail.lang }}</text>
            <text class="tag" v-if="detail.typeName">{{ detail.typeName }}</text>
            <text class="tag green" v-if="detail.remarks">{{ detail.remarks }}</text>
          </view>
        </view>
      </view>
    </view>

    <view class="section">
      <view class="section-title">简介</view>
      <text class="desc">{{ detail.content || '暂无简介' }}</text>
    </view>

    <view class="section" v-if="detail.director">
      <view class="info-row">
        <text class="label">导演：</text>
        <text class="value">{{ detail.director }}</text>
      </view>
    </view>
    <view class="section" v-if="detail.actor">
      <view class="info-row">
        <text class="label">主演：</text>
        <text class="value line2">{{ detail.actor }}</text>
      </view>
    </view>

    <view class="section" v-if="detail.episodes.length > 0">
      <view class="section-title">
        播放列表 (共{{ detail.episodes.length }}集)
      </view>

      <view class="source-tabs" v-if="sourceKeys.length > 1">
        <scroll-view scroll-x class="scroll-x">
          <view class="tab-list">
            <view
              class="tab"
              v-for="(key, i) in sourceKeys"
              :key="key"
              :class="{ active: currentSource === key }"
              @tap="switchSource(key)"
            >线路{{ i + 1 }}</view>
          </view>
        </scroll-view>
      </view>

      <view class="episode-grid">
        <view
          class="ep-item"
          v-for="(title, i) in currentEpisodes.titles"
          :key="i"
          @tap="playEpisode(i)"
        >{{ title }}</view>
      </view>

      <view class="play-main" v-if="currentEpisodes.urls.length > 0">
        <button class="btn-play" @tap="playEpisode(0)">内置播放</button>
        <button class="btn-h5" @tap="openH5Player">H5增强播放</button>
        <button class="btn-ext" @tap="openExternal">外部播放器</button>
      </view>
    </view>

    <view class="empty" v-if="detail.episodes.length === 0">
      <text>暂无播放源</text>
    </view>
  </view>

  <view class="page loading-page" v-else-if="loading">
    <text class="loading-text">加载中...</text>
  </view>
  <view class="page error-page" v-else>
    <text class="error-text">获取详情失败</text>
    <button class="retry-btn" @tap="loadDetail">重试</button>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { fetchVideoDetail } from '@/utils/api.js'

const detail = ref(null)
const loading = ref(true)
const currentSource = ref('main')
const allEpisodes = ref({})
const currentId = ref('')

function loadDetail(id) {
  if (!id) {
    loading.value = false
    return
  }
  loading.value = true
  currentId.value = id
  fetchVideoDetail(id).then(data => {
    if (data) {
      detail.value = data
      allEpisodes.value = {
        main: { urls: data.episodes, titles: data.episodesTitles }
      }
      if (data.episodesGroups) {
        Object.assign(allEpisodes.value, data.episodesGroups)
      }
    }
    loading.value = false
  }).catch(() => {
    uni.showToast({ title: '网络请求失败', icon: 'none' })
    loading.value = false
  })
}

onLoad((options) => {
  const id = options?.id
  const title = options?.title
  if (title) {
    uni.setNavigationBarTitle({ title: decodeURIComponent(title) })
  }
  loadDetail(id)
})

const sourceKeys = computed(() => Object.keys(allEpisodes.value))

const currentEpisodes = computed(() => {
  return allEpisodes.value[currentSource.value] || { urls: [], titles: [] }
})

function switchSource(key) {
  currentSource.value = key
}

function playEpisode(index) {
  const ep = currentEpisodes.value
  if (!ep.urls[index]) return
  const params = [
    `id=${detail.value.id}`,
    `title=${encodeURIComponent(detail.value.title)}`,
    `poster=${encodeURIComponent(detail.value.poster)}`,
    `episode=${index}`,
    `total=${ep.urls.length}`,
    `currentSource=${encodeURIComponent(currentSource.value)}`
  ]
  uni.setStorageSync('player_episodes', JSON.stringify(allEpisodes.value))
  uni.setStorageSync('player_current_source', currentSource.value)
  uni.navigateTo({
    url: `/pages/play/play?${params.join('&')}`
  })
}

function openExternal() {
  const url = currentEpisodes.value.urls[0]
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
}

function openH5Player() {
  const url = currentEpisodes.value.urls[0]
  if (!url) return
  const title = detail.value ? detail.value.title : ''
  const poster = detail.value ? detail.value.poster : ''
  uni.navigateTo({
    url: '/pages/play-h5/play-h5?url=' + encodeURIComponent(url) +
      '&title=' + encodeURIComponent(title) +
      '&poster=' + encodeURIComponent(poster)
  })
}
</script>

<style scoped>
.page {
  min-height: 100vh;
}
.hero {
  position: relative;
  width: 100%;
  height: 420rpx;
}
.cover {
  width: 100%;
  height: 100%;
}
.hero-mask {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 60rpx 30rpx 30rpx;
  background: linear-gradient(transparent, rgba(0,0,0,0.85));
}
.hero-title {
  font-size: 40rpx;
  font-weight: bold;
  color: #fff;
}
.hero-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  margin-top: 16rpx;
}
.hero-tags .tag {
  padding: 4rpx 16rpx;
  background: rgba(255,255,255,0.15);
  border-radius: 6rpx;
  font-size: 22rpx;
  color: #ddd;
}
.tag.green {
  color: #22c55e;
  background: rgba(34,197,94,0.2);
}
.section {
  padding: 24rpx 30rpx;
  background: #1a1a2e;
  margin-top: 4rpx;
}
.section-title {
  font-size: 30rpx;
  font-weight: bold;
  color: #22c55e;
  margin-bottom: 16rpx;
}
.desc {
  font-size: 26rpx;
  color: #999;
  line-height: 1.6;
}
.info-row {
  display: flex;
  font-size: 26rpx;
}
.label {
  color: #888;
  flex-shrink: 0;
}
.value {
  color: #ccc;
}
.value.line2 {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
}
.source-tabs {
  margin-bottom: 16rpx;
}
.scroll-x {
  white-space: nowrap;
}
.tab-list {
  display: inline-flex;
  gap: 16rpx;
}
.tab {
  display: inline-block;
  padding: 10rpx 28rpx;
  border-radius: 8rpx;
  font-size: 26rpx;
  color: #aaa;
  background: #0f0f23;
  flex-shrink: 0;
}
.tab.active {
  background: #22c55e;
  color: #fff;
}
.episode-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}
.ep-item {
  width: calc(25% - 12rpx);
  padding: 14rpx 0;
  text-align: center;
  background: #0f0f23;
  border-radius: 8rpx;
  font-size: 24rpx;
  color: #ccc;
}
.ep-item:active {
  background: #22c55e;
  color: #fff;
}
.play-main {
  margin-top: 30rpx;
}
.btn-play {
  width: 100%;
  height: 80rpx;
  background: #22c55e;
  color: #fff;
  border-radius: 12rpx;
  font-size: 30rpx;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  margin-bottom: 16rpx;
}
.btn-ext {
  width: 100%;
  height: 80rpx;
  background: #2563eb;
  color: #fff;
  border-radius: 12rpx;
  font-size: 30rpx;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  margin-bottom: 16rpx;
}
.btn-h5 {
  width: 100%;
  height: 80rpx;
  background: #a855f7;
  color: #fff;
  border-radius: 12rpx;
  font-size: 30rpx;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  margin-bottom: 16rpx;
}
.empty {
  text-align: center;
  padding: 100rpx 0;
  color: #888;
  font-size: 28rpx;
}
.loading-page {
  display: flex;
  align-items: center;
  justify-content: center;
}
.loading-text {
  color: #888;
  font-size: 28rpx;
}
.error-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 100rpx 0;
}
.error-text {
  color: #ef4444;
  font-size: 28rpx;
  margin-bottom: 20rpx;
}
.retry-btn {
  width: 200rpx;
  height: 72rpx;
  background: #2563eb;
  color: #fff;
  border-radius: 12rpx;
  font-size: 28rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
}
</style>
