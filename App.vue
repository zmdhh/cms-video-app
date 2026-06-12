<script>
export default {
  onLaunch() {
    console.log('App launched')
    // #ifdef APP-PLUS
    plus.screen.lockOrientation('portrait')
    setTimeout(() => this.checkUpdate(), 3000)
    // #endif
  },
  methods: {
    checkUpdate() {
      // #ifdef APP-PLUS
      uni.request({
        url: 'https://api.github.com/repos/zmdhh/cms-video-app/releases/latest',
        timeout: 10000,
        success: (res) => {
          try {
            const tag = res.data.tag_name || ''
            const newVer = tag.replace(/^v/, '')
            const curVer = plus.runtime.version
            const assets = res.data.assets || []
            const apk = assets.find(a => a.name && a.name.endsWith('.apk'))
            if (this.compareVer(newVer, curVer) > 0 && apk) {
              uni.showModal({
                title: '发现新版本 ' + tag,
                content: '是否下载更新？',
                confirmText: '更新',
                cancelText: '取消',
                success: (r) => {
                  if (r.confirm) this.downloadUpdate(apk.browser_download_url)
                }
              })
            }
          } catch(e) {}
        }
      })
      // #endif
    },
    compareVer(v1, v2) {
      const a = (v1 || '0').split('.').map(Number)
      const b = (v2 || '0').split('.').map(Number)
      for (let i = 0; i < 3; i++) {
        if ((a[i] || 0) > (b[i] || 0)) return 1
        if ((a[i] || 0) < (b[i] || 0)) return -1
      }
      return 0
    },
    downloadUpdate(url) {
      // #ifdef APP-PLUS
      const dtask = plus.downloader.createDownload(url, {}, (d, status) => {
        if (status === 200) {
          plus.runtime.install(d.filename, {}, () => {
            plus.runtime.restart()
          })
        } else {
          uni.showToast({ title: '下载失败', icon: 'none' })
        }
      })
      dtask.start()
      uni.showToast({ title: '正在下载更新...', icon: 'none', duration: 2000 })
      // #endif
    }
  }
}
</script>

<style>
page {
  background-color: #0f0f23;
  color: #e0e0e0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}
::-webkit-scrollbar {
  width: 0;
  height: 0;
}
</style>
