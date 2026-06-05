const SOURCES_KEY = 'api_sources'
const ACTIVE_KEY = 'api_active_source'

function generateId() {
  return 'src_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

export function getSources() {
  try {
    const raw = uni.getStorageSync(SOURCES_KEY)
    if (Array.isArray(raw) && raw.length > 0) return raw
  } catch (e) { /* ignore */ }
  return []
}

export function setSources(sources) {
  uni.setStorageSync(SOURCES_KEY, sources)
}

export function getActiveSource() {
  const sources = getSources()
  const active = sources.find(s => s.active)
  return active || sources[0] || null
}

export function getBaseUrl() {
  const source = getActiveSource()
  if (!source) return ''
  return source.api.replace(/\/+$/, '')
}

export function setActiveSource(sourceId) {
  const sources = getSources()
  sources.forEach(s => { s.active = (s.id === sourceId) })
  setSources(sources)
}

export function addSource(name, api) {
  const sources = getSources()
  sources.push({
    id: generateId(),
    name: name.trim() || '未命名',
    api: api.trim().replace(/\/+$/, ''),
    active: false
  })
  setSources(sources)
  return sources
}

export function updateSource(id, data) {
  const sources = getSources()
  const idx = sources.findIndex(s => s.id === id)
  if (idx >= 0) {
    if (data.name !== undefined) sources[idx].name = data.name
    if (data.api !== undefined) sources[idx].api = data.api.replace(/\/+$/, '')
  }
  setSources(sources)
  return sources
}

export function removeSource(id) {
  let sources = getSources()
  const target = sources.find(s => s.id === id)
  if (!target) return sources
  sources = sources.filter(s => s.id !== id)
  if (target.active && sources.length > 0) {
    sources[0].active = true
  }
  setSources(sources)
  return sources
}

export function requestApi(params = {}) {
  const baseUrl = getBaseUrl()
  if (!baseUrl) {
    return Promise.reject(new Error('请先添加数据源'))
  }
  return new Promise((resolve, reject) => {
    uni.request({
      url: baseUrl,
      data: params,
      timeout: 15000,
      dataType: 'json',
      success(res) {
        if (res.statusCode === 200 && res.data) {
          resolve(res.data)
        } else {
          reject(new Error(`HTTP ${res.statusCode}`))
        }
      },
      fail(err) {
        reject(err)
      }
    })
  })
}

export function fetchHomeData(page = 1) {
  return requestApi({ ac: 'list', page, h: 20 }).then(data => {
    if (data.code === 1) {
      const categories = (data.class || []).map(item => ({
        id: String(item.type_id),
        name: item.type_name
      }))
      const videos = (data.list || []).map(formatVideoItem)
      return { categories, list: videos, total: data.total || 0, pagecount: data.pagecount || 1 }
    }
    return { categories: [], list: [], total: 0, pagecount: 1 }
  })
}

export function fetchCategories() {
  return requestApi({ ac: 'class' }).then(data => {
    if (data.code === 1 && Array.isArray(data.class)) {
      return data.class.map(item => ({
        id: String(item.type_id),
        pid: String(item.type_pid || '0'),
        name: item.type_name
      }))
    }
    return []
  })
}

export function fetchVideoList({ type, page = 1 } = {}) {
  const params = { ac: 'videolist', pg: page }
  if (type) params.t = type
  return requestApi(params).then(data => {
    if (data.code === 1) {
      return {
        list: (data.list || []).map(formatVideoItem),
        total: data.total || 0,
        page: data.page || page,
        pagecount: data.pagecount || 1
      }
    }
    return { list: [], total: 0, page: 1, pagecount: 1 }
  })
}

export function searchVideos({ keyword, page = 1 } = {}) {
  return requestApi({ ac: 'videolist', wd: keyword, pg: page }).then(data => {
    if (data.code === 1) {
      return {
        list: (data.list || []).map(formatVideoItem),
        total: data.total || 0,
        page: data.page || page,
        pagecount: data.pagecount || 1
      }
    }
    return { list: [], total: 0, page: 1, pagecount: 1 }
  })
}

export function fetchVideoDetail(id) {
  return requestApi({ ac: 'detail', ids: id }).then(data => {
    if (data.code === 1 && data.list && data.list.length > 0) {
      return formatVideoItem(data.list[0])
    }
    return null
  })
}

export function formatVideoItem(item) {
  const parsed = parseVodPlayUrl(item.vod_play_url || '')
  return {
    id: String(item.vod_id),
    title: (item.vod_name || '').trim().replace(/\s+/g, ' '),
    poster: item.vod_pic || '',
    year: item.vod_year ? (item.vod_year.match(/\d{4}/)?.[0] || '') : '',
    remarks: item.vod_remarks || '',
    content: cleanHtml((item.vod_content || item.vod_blurb || '')),
    director: item.vod_director || '',
    actor: item.vod_actor || '',
    area: item.vod_area || '',
    lang: item.vod_lang || '',
    typeId: String(item.type_id || ''),
    typeName: item.type_name || '',
    className: item.vod_class || '',
    doubanId: item.vod_douban_id || 0,
    episodes: parsed.urls,
    episodesTitles: parsed.titles,
    episodesGroups: parsed.groups,
    totalEpisodes: parsed.urls.length
  }
}

export function parseVodPlayUrl(vodPlayUrl) {
  const urls = []
  const titles = []
  if (!vodPlayUrl) return { urls, titles, groups: {} }

  const groups = {}
  const sources = vodPlayUrl.split('$$$')

  sources.forEach((source, sourceIndex) => {
    const episodes = source.split('#')
    const groupUrls = []
    const groupTitles = []

    episodes.forEach(episode => {
      const parts = episode.split('$')
      if (parts.length >= 2) {
        const url = parts[parts.length - 1]
        const title = parts.slice(0, -1).join('$') || `第${groupTitles.length + 1}集`
        if (url.includes('.m3u8') || url.includes('.mp4')) {
          groupUrls.push(url)
          groupTitles.push(title)
        }
      }
    })

    if (groupUrls.length > 0) {
      groups[`source_${sourceIndex}`] = {
        urls: groupUrls,
        titles: groupTitles
      }
      if (groupUrls.length > urls.length) {
        urls.length = 0
        titles.length = 0
        urls.push(...groupUrls)
        titles.push(...groupTitles)
      }
    }
  })

  return { urls, titles, groups }
}

export function cleanHtml(text) {
  if (!text) return ''
  return text
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim()
}
