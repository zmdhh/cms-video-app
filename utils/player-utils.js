import Hls from 'hls.js'

export function filterAdsFromM3U8(m3u8Content) {
  if (!m3u8Content) return ''
  const lines = m3u8Content.split('\n')
  const filtered = []
  for (let i = 0; i < lines.length; i++) {
    if (!lines[i].includes('#EXT-X-DISCONTINUITY')) {
      filtered.push(lines[i])
    }
  }
  return filtered.join('\n')
}

export class CustomHlsJsLoader extends Hls.DefaultConfig.loader {
  constructor(config) {
    super(config)
    const load = this.load.bind(this)
    this.load = function (context, config, callbacks) {
      if (context.type === 'manifest' || context.type === 'level') {
        const onSuccess = callbacks.onSuccess
        callbacks.onSuccess = function (response, stats, context) {
          if (response.data && typeof response.data === 'string') {
            response.data = filterAdsFromM3U8(response.data)
          }
          return onSuccess(response, stats, context, null)
        }
      }
      load(context, config, callbacks)
    }
  }
}

export function createHlsPlayer(videoElement, url, options = {}) {
  const hls = new Hls({
    debug: false,
    enableWorker: true,
    lowLatencyMode: true,
    maxBufferLength: 30,
    backBufferLength: 30,
    maxBufferSize: 60 * 1000 * 1000,
    loader: options.blockAd ? CustomHlsJsLoader : Hls.DefaultConfig.loader,
    ...options.hlsConfig
  })

  hls.loadSource(url)
  hls.attachMedia(videoElement)

  hls.on(Hls.Events.ERROR, function (event, data) {
    if (data.fatal) {
      switch (data.type) {
        case Hls.ErrorTypes.NETWORK_ERROR:
          hls.startLoad()
          break
        case Hls.ErrorTypes.MEDIA_ERROR:
          hls.recoverMediaError()
          break
        default:
          hls.destroy()
          break
      }
    }
  })

  return hls
}

export function getVideoInfoFromM3u8(m3u8Url) {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    video.muted = true
    video.preload = 'metadata'

    const pingStart = performance.now()
    let pingTime = 0

    fetch(m3u8Url, { method: 'HEAD', mode: 'no-cors' })
      .then(() => { pingTime = performance.now() - pingStart })
      .catch(() => { pingTime = performance.now() - pingStart })

    const hls = new Hls()
    const timeout = setTimeout(() => {
      hls.destroy()
      video.remove()
      reject(new Error('Timeout'))
    }, 4000)

    video.onerror = () => {
      clearTimeout(timeout)
      hls.destroy()
      video.remove()
      reject(new Error('Load failed'))
    }

    let loadSpeed = '未知'
    let hasSpeed = false
    let hasMeta = false
    let fragStart = 0

    const tryResolve = () => {
      if (hasMeta && hasSpeed) {
        clearTimeout(timeout)
        const w = video.videoWidth
        let quality = '未知'
        if (w > 0) {
          if (w >= 3840) quality = '4K'
          else if (w >= 2560) quality = '2K'
          else if (w >= 1920) quality = '1080p'
          else if (w >= 1280) quality = '720p'
          else if (w >= 854) quality = '480p'
          else quality = 'SD'
        }
        hls.destroy()
        video.remove()
        resolve({ quality, loadSpeed, pingTime: Math.round(pingTime) })
      }
    }

    hls.on(Hls.Events.FRAG_LOADING, () => { fragStart = performance.now() })
    hls.on(Hls.Events.FRAG_LOADED, (event, data) => {
      if (fragStart > 0 && data && data.payload && !hasSpeed) {
        const t = performance.now() - fragStart
        const size = data.payload.byteLength || 0
        if (t > 0 && size > 0) {
          const kbps = size / 1024 / (t / 1000)
          loadSpeed = kbps >= 1024 ? `${(kbps / 1024).toFixed(1)} MB/s` : `${kbps.toFixed(1)} KB/s`
          hasSpeed = true
          tryResolve()
        }
      }
    })

    hls.on(Hls.Events.ERROR, (event, data) => {
      if (data.fatal) {
        clearTimeout(timeout)
        hls.destroy()
        video.remove()
        reject(new Error(data.type))
      }
    })

    video.onloadedmetadata = () => { hasMeta = true; tryResolve() }
    hls.loadSource(m3u8Url)
    hls.attachMedia(video)
  })
}
