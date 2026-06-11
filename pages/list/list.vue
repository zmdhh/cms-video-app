<template>
  <view class="page">
    <view class="grid" v-if="list.length > 0">
      <view
        class="card"
        v-for="item in list"
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

    <view class="load-more" v-if="list.length < totalCount">
      <text v-if="loading" class="loading-text">加载中...</text>
      <text v-else class="load-text" @tap="loadMore">点击加载更多</text>
    </view>

    <view class="empty" v-if="!loading && list.length === 0">
      <text>暂无数据</text>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { onPullDownRefresh } from '@dcloudio/uni-app'
import { fetchVideoList } from '@/utils/api.js'

const list = ref([])
const page = ref(1)
const totalCount = ref(0)
const loading = ref(false)

onMounted(() => {
  loadList()
})

onPullDownRefresh(() => {
  loadList(true).finally(() => {
    uni.stopPullDownRefresh()
  })
})

function loadList(isRefresh) {
  if (loading.value) return Promise.resolve()
  loading.value = true
  const pages = getCurrentPages()
  const current = pages[pages.length - 1]
  const type = current?.options?.type || ''
  const title = current?.options?.title || '分类列表'
  if (title) {
    uni.setNavigationBarTitle({ title: decodeURIComponent(title) })
  }
  const p = isRefresh ? 1 : page.value
  return fetchVideoList({ type, page: p }).then(data => {
    if (isRefresh) {
      list.value = data.list
      page.value = 1
    } else {
      list.value = [...list.value, ...data.list]
    }
    totalCount.value = data.total
  }).catch(() => {}).finally(() => {
    loading.value = false
  })
}

function loadMore() {
  page.value++
  loadList()
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
