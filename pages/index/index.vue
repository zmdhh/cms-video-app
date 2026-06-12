<template>
  <view class="page">
    <view class="cate-scroll">
      <scroll-view scroll-x class="scroll-x">
        <view class="cate-list">
          <view class="cate-item" :class="{ active: currentType === '' }" @tap="switchType('')">推荐</view>
          <view class="cate-item" :class="{ active: currentType === '_fav' }" @tap="switchType('_fav')">★收藏</view>
          <view class="cate-item" :class="{ active: currentType === '_hist' }" @tap="switchType('_hist')">◷历史</view>
          <view class="cate-split">|</view>
          <view
            class="cate-item"
            v-for="item in categories"
            :key="item.id"
            :class="{ active: currentType === item.id }"
            @tap="switchType(item.id)"
          >{{ item.name }}</view>
        </view>
      </scroll-view>
    </view>

    <view class="grid" v-if="list.length > 0">
      <view class="card" v-for="item in list" :key="item.id">
        <image class="poster" :src="item.poster" mode="aspectFill" @tap="goDetail(item)" />
        <view class="fav-btn" @tap.stop="currentType==='_hist' ? delHistory(item) : toggleFav(item)">
          {{ currentType==='_hist' ? '✕' : (isFav(item) ? '★' : '☆') }}
        </view>
        <view class="card-info" @tap="goDetail(item)">
          <text class="title">{{ item.title }}</text>
          <view class="meta">
            <text class="type-name" v-if="item.typeName">{{ item.typeName }}</text>
            <text class="remarks" v-if="item.remarks">{{ item.remarks }}</text>
          </view>
        </view>
      </view>
    </view>

    <view class="empty" v-if="!loading && list.length === 0">
      <text>{{ currentType ? '该分类暂无数据，切推荐查看更多' : '暂无数据，请检查接口设置' }}</text>
    </view>

    <view class="clear-bar" v-if="currentType === '_hist' && list.length > 0">
      <text class="clear-btn" @tap="clearHistory">清空历史</text>
    </view>

    <view class="load-more" v-if="list.length > 0 && hasMore && currentType !== '_fav' && currentType !== '_hist'">
      <text v-if="loading">加载中...</text>
      <text v-else @tap="loadMore">
        {{ total > 0 ? `加载更多 (已加载${allVideos.length}/共${total}条)` : '加载更多' }}
      </text>
    </view>

    <view class="back-top" v-if="showBackTop" @tap="scrollToTop">▲</view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { onPullDownRefresh, onReachBottom, onPageScroll } from '@dcloudio/uni-app'
import { fetchCategories, fetchVideoList } from '@/utils/api.js'

const categories = ref([])
const currentType = ref('')
const allVideos = ref([])
const loading = ref(false)
const page = ref(1)
const total = ref(0)
const hasMore = ref(true)
const showBackTop = ref(false)

const list = computed(() => {
  if (currentType.value === '_fav') return allVideos.value.filter(v => favIds.value.includes(v.id))
  if (currentType.value === '_hist') return histVideos.value
  return allVideos.value
})

const favIds = ref([])
try { favIds.value = uni.getStorageSync('fav_ids') || [] } catch(e) {}

const histVideos = ref([])
function loadHist() {
  try {
    var list = uni.getStorageSync('history_list') || []
    var cutoff = Date.now() - 30 * 24 * 3600 * 1000
    list = list.filter(function(h) { return h.saveTime > cutoff })
    if (list.length > 50) list.length = 50
    histVideos.value = list
    uni.setStorageSync('history_list', list)
  } catch(e) { histVideos.value = [] }
}

let tabHandler = null

onMounted(() => {
  loadCategories()
  loadPage(1)
  tabHandler = (filter) => { if (filter !== currentType.value) switchType(filter) }
  uni.$on('index_switch', tabHandler)
})

onUnmounted(() => { if (tabHandler) uni.$off('index_switch', tabHandler) })

function loadCategories() {
  fetchCategories().then(data => {
    const hideParent = uni.getStorageSync('hide_parent_categories') !== false
    if (hideParent) {
      const parents = new Set(data.filter(c => c.pid !== '0').map(c => c.pid))
      categories.value = data.filter(c => c.pid === '0' ? !parents.has(c.id) : true)
    } else {
      categories.value = data
    }
  }).catch(() => {})
}

onPullDownRefresh(() => {
  allVideos.value = []
  page.value = 1
  hasMore.value = true
  loadPage(1).finally(() => uni.stopPullDownRefresh())
})

onReachBottom(() => {
  if (!loading.value && hasMore.value) loadMore()
})

onPageScroll((e) => { showBackTop.value = e.scrollTop > 1000 })

function scrollToTop() { uni.pageScrollTo({ scrollTop: 0, duration: 300 }) }

function loadPage(p) {
  if (loading.value || !hasMore.value) return Promise.resolve()
  loading.value = true
  const type = currentType.value || undefined
  return fetchVideoList({ type, page: p }).then(data => {
    if (p === 1) allVideos.value = data.list
    else {
      const ids = new Set(allVideos.value.map(v => v.id))
      const newItems = data.list.filter(v => !ids.has(v.id))
      if (newItems.length === 0) hasMore.value = false
      allVideos.value = [...allVideos.value, ...newItems]
    }
    if (data.list.length === 0) hasMore.value = false
    page.value = p
    if (data.total > 0) total.value = data.total
  }).finally(() => { loading.value = false })
}

function switchType(id) {
  if (id === currentType.value) return
  currentType.value = id
  if (id === '_fav') return
  if (id === '_hist') { loadHist(); return }
  allVideos.value = []
  page.value = 1
  hasMore.value = true
  total.value = 0
  loadPage(1)
}

function loadMore() { loadPage(page.value + 1) }

function isFav(item) { return favIds.value.includes(item.id) }
function toggleFav(item) {
  const ids = [...favIds.value]
  if (ids.includes(item.id)) favIds.value = ids.filter(id => id !== item.id)
  else favIds.value = [item.id, ...ids]
  uni.setStorageSync('fav_ids', favIds.value)
}

function goDetail(item) {
  uni.navigateTo({ url: `/pages/detail/detail?id=${item.id}&title=${encodeURIComponent(item.title)}` })
}

function delHistory(item) {
  var list = uni.getStorageSync('history_list') || []
  list = list.filter(function(h) { return h.id !== item.id })
  uni.setStorageSync('history_list', list)
  loadHist()
}

function clearHistory() {
  uni.showModal({
    title: '确认清空',
    content: '确定删除所有历史记录？',
    success: function(res) {
      if (res.confirm) {
        uni.setStorageSync('history_list', [])
        loadHist()
      }
    }
  })
}
</script>

<style scoped>
.page {
  min-height: 100vh;
}
.cate-scroll {
  background: #1a1a2e;
  padding: 16rpx 0;
}
.scroll-x {
  white-space: nowrap;
}
.cate-list {
  display: inline-flex;
  padding: 0 20rpx;
  gap: 16rpx;
}
.cate-item {
  display: inline-block;
  padding: 12rpx 28rpx;
  border-radius: 100rpx;
  font-size: 26rpx;
  color: #aaa;
  background: #0f0f23;
  white-space: nowrap;
  flex-shrink: 0;
}
.cate-item.active {
  background: #22c55e;
  color: #fff;
}
.cate-split {
  display: inline-block;
  color: #333;
  font-size: 26rpx;
  padding: 12rpx 8rpx;
}
.grid {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
  padding: 20rpx;
}
.card {
  width: calc(33.33% - 12rpx);
  border-radius: 12rpx;
  overflow: hidden;
  background: #1a1a2e;
  position: relative;
}
.poster {
  width: 100%;
  height: 260rpx;
}
.fav-btn {
  position: absolute;
  top: 8rpx;
  right: 8rpx;
  font-size: 36rpx;
  z-index: 2;
  padding: 4rpx;
  color: #f59e0b;
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
.load-more {
  text-align: center;
  padding: 30rpx;
  color: #22c55e;
  font-size: 26rpx;
}
.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 88rpx;
  background: #1a1a2e;
  display: flex;
  align-items: center;
  justify-content: space-around;
  z-index: 100;
  border-top: 1px solid #222;
}
.bot-tab {
  font-size: 26rpx;
  color: #aaa;
  padding: 10rpx 24rpx;
  border-radius: 8rpx;
}
.bot-tab.active {
  background: #22c55e;
  color: #fff;
}
.back-top {
  position: fixed;
  bottom: 160rpx;
  right: 30rpx;
  width: 72rpx;
  height: 72rpx;
  background: rgba(34,197,94,0.8);
  color: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36rpx;
  z-index: 99;
}
.clear-bar {
  text-align: right;
  padding: 10rpx 20rpx;
}
.clear-btn {
  color: #ef4444;
  font-size: 26rpx;
}
</style>
