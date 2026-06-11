<template>
  <view class="page">
    <view class="cate-scroll">
      <scroll-view scroll-x class="scroll-x">
        <view class="cate-list">
          <view class="cate-item active">⭐收藏</view>
        </view>
      </scroll-view>
    </view>

    <view class="grid" v-if="list.length > 0">
      <view class="card" v-for="item in list" :key="item.id">
        <image class="poster" :src="item.poster" mode="aspectFill" @tap="goDetail(item)" />
        <view class="fav-btn" @tap.stop="toggleFav(item)">❤️</view>
        <view class="card-info" @tap="goDetail(item)">
          <text class="title">{{ item.title }}</text>
          <view class="meta">
            <text class="type-name" v-if="item.typeName">{{ item.typeName }}</text>
            <text class="remarks" v-if="item.remarks">{{ item.remarks }}</text>
          </view>
        </view>
      </view>
    </view>

    <view class="empty" v-if="list.length === 0">
      <text>暂无收藏，去首页❤️添加</text>
    </view>

    <view class="back-top" v-if="showBackTop" @tap="scrollToTop">▲</view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { onPageScroll } from '@dcloudio/uni-app'
import { fetchVideoList } from '@/utils/api.js'

const allVideos = ref([])
const loading = ref(false)
const showBackTop = ref(false)

const favIds = ref([])
try { favIds.value = uni.getStorageSync('fav_ids') || [] } catch(e) {}

const list = computed(() => {
  if (favIds.value.length === 0) return allVideos.value
  return allVideos.value.filter(v => favIds.value.includes(v.id))
})

onMounted(() => { loadAll() })
onPageScroll((e) => { showBackTop.value = e.scrollTop > 1000 })

function loadAll() {
  if (favIds.value.length === 0) return
  const ids = favIds.value.join(',')
  if (!ids) return
  loading.value = true
  fetchVideoList({}).then(data => {
    allVideos.value = data.list.filter(v => favIds.value.includes(v.id))
  }).catch(() => {}).finally(() => { loading.value = false })
}

function scrollToTop() { uni.pageScrollTo({ scrollTop: 0, duration: 300 }) }

function isFav(item) { return favIds.value.includes(item.id) }
function toggleFav(item) {
  favIds.value = favIds.value.filter(id => id !== item.id)
  uni.setStorageSync('fav_ids', favIds.value)
}

function goDetail(item) {
  uni.navigateTo({ url: `/pages/detail/detail?id=${item.id}&title=${encodeURIComponent(item.title)}` })
}
</script>

<style scoped>
.page{min-height:100vh}
.cate-scroll{background:#1a1a2e;padding:16rpx 0}
.scroll-x{white-space:nowrap}
.cate-list{display:inline-flex;padding:0 20rpx;gap:16rpx}
.cate-item{display:inline-block;padding:12rpx 28rpx;border-radius:100rpx;font-size:26rpx;color:#aaa;background:#0f0f23;white-space:nowrap;flex-shrink:0}
.cate-item.active{background:#22c55e;color:#fff}
.grid{display:flex;flex-wrap:wrap;gap:16rpx;padding:20rpx}
.card{width:calc(33.33% - 12rpx);border-radius:12rpx;overflow:hidden;background:#1a1a2e;position:relative}
.poster{width:100%;height:260rpx}
.fav-btn{position:absolute;top:8rpx;right:8rpx;font-size:32rpx;z-index:2;padding:4rpx}
.card-info{padding:12rpx 16rpx}
.title{font-size:26rpx;color:#e0e0e0;display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;overflow:hidden;line-height:1.4}
.meta{display:flex;gap:12rpx;margin-top:6rpx}
.remarks{font-size:22rpx;color:#22c55e}
.type-name{font-size:22rpx;color:#888}
.empty{text-align:center;padding:100rpx 0;color:#888;font-size:28rpx}
.back-top{position:fixed;bottom:160rpx;right:30rpx;width:72rpx;height:72rpx;background:rgba(34,197,94,0.8);color:#fff;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:36rpx;z-index:99}
</style>
