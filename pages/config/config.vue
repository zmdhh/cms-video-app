<template>
  <view class="page">
    <view class="card">
      <view class="card-title">数据源管理</view>
      <view class="source-list" v-if="sources.length > 0">
        <view
          class="source-item"
          v-for="source in sources"
          :key="source.id"
          :class="{ active: source.active }"
        >
          <view class="source-info" @tap="activateSource(source.id)">
            <view class="source-name">
              <text class="active-dot" v-if="source.active">●</text>
              <text class="active-dot off" v-else>○</text>
              {{ source.name }}
            </view>
            <text class="source-api">{{ source.api }}</text>
          </view>
          <view class="source-actions">
            <text class="act-btn" @tap="editSource(source)">编辑</text>
            <text class="act-btn del" @tap="delSource(source.id)"
              v-if="sources.length > 1">删除</text>
          </view>
        </view>
      </view>

      <view class="empty-state" v-if="sources.length === 0">
        <text class="empty-text">暂无数据源</text>
        <text class="empty-hint">点击下方按钮添加 Apple CMS 接口地址</text>
      </view>

      <button class="btn btn-add" @tap="showAdd = true">+ 添加数据源</button>
    </view>

    <view class="card" v-if="showAdd">
      <view class="card-title">{{ editingId ? '编辑数据源' : '添加数据源' }}</view>
      <view class="input-group">
        <text class="label">名称</text>
        <input class="input" v-model="formName" placeholder="如: Apple CMS" placeholder-style="color:#666" />
      </view>
      <view class="input-group">
        <text class="label">接口地址</text>
        <input class="input" v-model="formApi" placeholder="https://xxx/api.php/provide/vod" placeholder-style="color:#666" />
      </view>
      <view class="btn-row">
        <button class="btn btn-primary" @tap="saveSource">保存</button>
        <button class="btn btn-outline" @tap="cancelEdit">取消</button>
      </view>
    </view>

    <view class="card" v-if="activeSource">
      <view class="card-title">当前源测试</view>
      <view class="info-row">
        <text class="label">名称：</text>
        <text class="value">{{ activeSource.name }}</text>
      </view>
      <view class="info-row">
        <text class="label">地址：</text>
        <text class="value small">{{ activeSource.api }}</text>
      </view>
      <button class="btn btn-test" @tap="testConnection" :disabled="testing">
        {{ testing ? '测试中...' : '测试连接' }}
      </button>
      <view class="result" v-if="testResult" :class="testOk ? 'ok' : 'fail'">
        {{ testResult }}
      </view>
    </view>

    <view class="card">
      <view class="card-title">广告过滤</view>
      <view class="switch-row">
        <text class="label">启用广告过滤</text>
        <switch :checked="blockAd" @change="toggleBlockAd" color="#22c55e" />
      </view>
      <view class="hint">过滤m3u8流中的广告分段标记 (#EXT-X-DISCONTINUITY)</view>
    </view>

    <view class="card">
      <view class="card-title">分类显示</view>
      <view class="switch-row">
        <text class="label">隐藏父级分类</text>
        <switch :checked="hideParent" @change="toggleHideParent" color="#22c55e" />
      </view>
      <view class="hint">如"电影片""连续剧"等无内容的父级分类不显示</view>
    </view>

    <view class="card">
      <view class="card-title">关于</view>
      <view class="info-row">
        <text>Apple CMS 视频客户端 v1.0</text>
      </view>
      <view class="info-row">
        <text>ArtPlayer + hls.js · 多源自由切换</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { getSources, getActiveSource, setSources, setActiveSource, addSource, updateSource, removeSource, requestApi } from '@/utils/api.js'

const sources = ref([])
const activeSource = computed(() => sources.value.find(s => s.active) || sources.value[0] || {})
const showAdd = ref(false)
const editingId = ref('')
const formName = ref('')
const formApi = ref('')
const testing = ref(false)
const testResult = ref('')
const testOk = ref(false)
const blockAd = ref(true)
const hideParent = ref(true)

onMounted(() => {
  sources.value = getSources()
  try {
    blockAd.value = uni.getStorageSync('enable_blockad') !== false
    hideParent.value = uni.getStorageSync('hide_parent_categories') !== false
  } catch (e) { /* ignore */ }
})

function activateSource(id) {
  setActiveSource(id)
  sources.value = getSources()
  uni.showToast({ title: '已切换数据源', icon: 'success' })
}

function editSource(source) {
  editingId.value = source.id
  formName.value = source.name
  formApi.value = source.api
  showAdd.value = true
}

function delSource(id) {
  uni.showModal({
    title: '确认删除',
    content: '删除后不可恢复',
    success: (res) => {
      if (res.confirm) {
        sources.value = removeSource(id)
      }
    }
  })
}

function saveSource() {
  if (!formName.value.trim() || !formApi.value.trim()) {
    uni.showToast({ title: '请填写完整信息', icon: 'none' })
    return
  }
  if (editingId.value) {
    sources.value = updateSource(editingId.value, {
      name: formName.value.trim(),
      api: formApi.value.trim()
    })
  } else {
    sources.value = addSource(formName.value.trim(), formApi.value.trim())
  }
  showAdd.value = false
  editingId.value = ''
  formName.value = ''
  formApi.value = ''
  uni.showToast({ title: '保存成功', icon: 'success' })
}

function cancelEdit() {
  showAdd.value = false
  editingId.value = ''
  formName.value = ''
  formApi.value = ''
}

function toggleBlockAd(e) {
  blockAd.value = e.detail.value
  uni.setStorageSync('enable_blockad', e.detail.value)
}

function toggleHideParent(e) {
  hideParent.value = e.detail.value
  uni.setStorageSync('hide_parent_categories', e.detail.value)
}

function testConnection() {
  testing.value = true
  testResult.value = ''
  requestApi({ ac: 'list' }).then(data => {
    if (data.code === 1) {
      testOk.value = true
      testResult.value = `连接成功! 分类: ${(data.class || []).length}，视频: ${data.total || 0}`
    } else {
      testOk.value = false
      testResult.value = '返回数据格式异常'
    }
  }).catch(err => {
    testOk.value = false
    testResult.value = '连接失败: ' + (err.message || err.errMsg || '未知错误')
  }).finally(() => {
    testing.value = false
  })
}
</script>

<style scoped>
.page { padding: 20rpx; min-height: 100vh; }
.card { background: #1a1a2e; border-radius: 16rpx; padding: 30rpx; margin-bottom: 20rpx; }
.card-title { font-size: 32rpx; font-weight: bold; color: #22c55e; margin-bottom: 24rpx; }
.source-list { margin-bottom: 20rpx; }
.empty-state { text-align: center; padding: 40rpx 0; }
.empty-text { font-size: 28rpx; color: #888; display: block; margin-bottom: 12rpx; }
.empty-hint { font-size: 24rpx; color: #555; display: block; }
.source-item { display: flex; align-items: center; justify-content: space-between; padding: 20rpx 16rpx; background: #0f0f23; border-radius: 12rpx; margin-bottom: 12rpx; border: 1px solid transparent; }
.source-item.active { border-color: #22c55e; }
.source-info { flex: 1; }
.source-name { font-size: 28rpx; color: #e0e0e0; margin-bottom: 6rpx; }
.active-dot { color: #22c55e; }
.active-dot.off { color: #444; }
.source-api { font-size: 22rpx; color: #888; word-break: break-all; }
.source-actions { display: flex; gap: 16rpx; flex-shrink: 0; }
.act-btn { font-size: 24rpx; color: #60a5fa; padding: 8rpx 12rpx; }
.act-btn.del { color: #ef4444; }
.btn-add { width: 100%; height: 72rpx; background: transparent; border: 1px dashed #22c55e; color: #22c55e; border-radius: 12rpx; font-size: 28rpx; display: flex; align-items: center; justify-content: center; }
.input-group { margin-bottom: 20rpx; }
.input-group .label { font-size: 26rpx; color: #999; margin-bottom: 10rpx; display: block; }
.input { width: 100%; height: 80rpx; background: #0f0f23; border: 1px solid #333; border-radius: 12rpx; padding: 0 24rpx; font-size: 28rpx; color: #e0e0e0; box-sizing: border-box; }
.btn-row { display: flex; gap: 20rpx; }
.btn { flex: 1; height: 72rpx; border-radius: 12rpx; font-size: 28rpx; display: flex; align-items: center; justify-content: center; border: none; }
.btn-primary { background: #22c55e; color: #fff; }
.btn-outline { background: transparent; border: 1px solid #22c55e; color: #22c55e; }
.btn-test { width: 100%; height: 72rpx; background: #2563eb; color: #fff; border-radius: 12rpx; font-size: 28rpx; display: flex; align-items: center; justify-content: center; border: none; margin-top: 16rpx; }
.btn-test[disabled] { opacity: 0.5; }
.hint { font-size: 24rpx; color: #888; margin-top: 16rpx; }
.result { margin-top: 20rpx; padding: 16rpx; border-radius: 8rpx; font-size: 26rpx; }
.result.ok { background: rgba(34,197,94,0.1); color: #22c55e; }
.result.fail { background: rgba(239,68,68,0.1); color: #ef4444; }
.switch-row { display: flex; align-items: center; justify-content: space-between; }
.info-row { font-size: 26rpx; color: #ccc; margin-bottom: 8rpx; }
.info-row .label { color: #888; }
.info-row .value.small { font-size: 22rpx; word-break: break-all; }
</style>
