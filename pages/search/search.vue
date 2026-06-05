<template>
  <view class="page">
    <view class="search-bar">
      <view class="search-input-wrap">
        <text class="icon">🔍</text>
        <input
          class="search-input"
          v-model="keyword"
          placeholder="搜索视频名称"
          placeholder-style="color:#666"
          confirm-type="search"
          @confirm="doSearch"
        />
        <text class="clear" v-if="keyword" @tap="clearSearch">✕</text>
      </view>
      <button class="search-btn" @tap="doSearch">搜索</button>
    </view>

    <view class="history" v-if="!keyword && history.length > 0 && results.length === 0">
      <view class="section-title">搜索历史</view>
      <view class="history-tags">
        <view
          class="tag"
          v-for="(item, i) in history"
          :key="i"
          @tap="searchFromHistory(item)"
        >{{ item }}</view>
        <view class="tag clear-tag" @tap="clearHistory">清除历史</view>
      </view>
    </view>

    <view class="results" v-if="results.length > 0">
      <view class="section-title">共 {{ total }} 条结果</view>
      <view class="grid">
        <view
          class="card"
          v-for="item in results"
          :key="item.id"
          @tap="goDetail(item)"
        >
          <image class="poster" :src="item.poster" mode="aspectFill" lazy-load />
          <view class="card-info">
            <text class="title">{{ item.title }}</text>
            <view class="meta">
              <text class="remarks" v-if="item.remarks">{{ item.remarks }}</text>
              <text class="year">{{ item.year }}</text>
            </view>
          </view>
        </view>
      </view>
      <view class="load-more" v-if="results.length < total">
        <text v-if="loading" class="loading-text">加载中...</text>
        <text v-else class="load-text" @tap="loadMore">加载更多</text>
      </view>
    </view>

    <view class="empty" v-if="!loading && results.length === 0 && searched">
      <text>未找到相关视频</text>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { searchVideos } from '@/utils/api.js'

const keyword = ref('')
const results = ref([])
const total = ref(0)
const page = ref(1)
const loading = ref(false)
const searched = ref(false)
const history = ref([])

try {
  history.value = uni.getStorageSync('search_history') || []
} catch (e) {
  history.value = []
}

function doSearch() {
  if (!keyword.value.trim()) return
  page.value = 1
  results.value = []
  searched.value = true
  addHistory(keyword.value.trim())
  fetchResults()
}

function searchFromHistory(kw) {
  keyword.value = kw
  doSearch()
}

function clearSearch() {
  keyword.value = ''
  results.value = []
  searched.value = false
}

function clearHistory() {
  history.value = []
  uni.setStorageSync('search_history', [])
}

function addHistory(kw) {
  const arr = history.value.filter(h => h !== kw)
  arr.unshift(kw)
  if (arr.length > 20) arr.pop()
  history.value = arr
  uni.setStorageSync('search_history', arr)
}

function fetchResults() {
  if (loading.value) return
  loading.value = true
  searchVideos({ keyword: keyword.value.trim(), page: page.value }).then(data => {
    results.value = page.value === 1 ? data.list : [...results.value, ...data.list]
    total.value = data.total
  }).catch(() => {
    uni.showToast({ title: '搜索失败', icon: 'none' })
  }).finally(() => {
    loading.value = false
  })
}

function loadMore() {
  page.value++
  fetchResults()
}

function goDetail(item) {
  uni.navigateTo({
    url: `/pages/detail/detail?id=${item.id}&title=${encodeURIComponent(item.title)}`
  })
}
</script>

<style scoped>
.page {
  padding: 20rpx;
  min-height: 100vh;
}
.search-bar {
  display: flex;
  gap: 16rpx;
  margin-bottom: 24rpx;
}
.search-input-wrap {
  flex: 1;
  display: flex;
  align-items: center;
  background: #1a1a2e;
  border-radius: 12rpx;
  padding: 0 20rpx;
  height: 72rpx;
}
.search-input-wrap .icon {
  font-size: 32rpx;
  margin-right: 12rpx;
}
.search-input {
  flex: 1;
  height: 100%;
  font-size: 28rpx;
  color: #e0e0e0;
}
.clear {
  font-size: 32rpx;
  color: #888;
  padding: 8rpx;
}
.search-btn {
  width: 120rpx;
  height: 72rpx;
  background: #22c55e;
  color: #fff;
  border-radius: 12rpx;
  font-size: 28rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
}
.section-title {
  font-size: 30rpx;
  font-weight: bold;
  color: #ccc;
  margin-bottom: 20rpx;
}
.history-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}
.tag {
  padding: 10rpx 24rpx;
  background: #1a1a2e;
  border-radius: 100rpx;
  font-size: 26rpx;
  color: #aaa;
}
.clear-tag {
  color: #ef4444;
}
.grid {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}
.card {
  width: calc(33.33% - 12rpx);
  border-radius: 12rpx;
  overflow: hidden;
  background: #1a1a2e;
}
.poster {
  width: 100%;
  height: 260rpx;
}
.card-info {
  padding: 12rpx 16rpx;
}
.title {
  font-size: 26rpx;
  color: #e0e0e0;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
  line-height: 1.4;
}
.meta {
  display: flex;
  gap: 12rpx;
  margin-top: 6rpx;
}
.remarks {
  font-size: 22rpx;
  color: #22c55e;
}
.year {
  font-size: 22rpx;
  color: #888;
}
.load-more {
  text-align: center;
  padding: 30rpx;
}
.load-text {
  color: #22c55e;
  font-size: 26rpx;
}
.loading-text {
  color: #888;
  font-size: 26rpx;
}
.empty {
  text-align: center;
  padding: 100rpx 0;
  color: #888;
  font-size: 28rpx;
}
</style>
