# CMS Video App · 跨平台视频播放器

> 基于 uni-app / Vue3 的免费 Apple CMS 视频客户端，支持 m3u8/HLS 播放、多源切换、倍速、收藏、历史记录。

## 功能

- **多源管理** — 自由添加/切换/编辑 Apple CMS 接口
- **分类浏览** — 自动获取分类，按分类筛选视频，支持分页加载
- **搜索引擎** — 关键词搜索，历史记录保存
- **m3u8 播放** — 原生视频播放器，支持系统硬解
- **倍速控制** — 0.5x ~ 2x 无极调速
- **播放记录** — 自动保存进度，断点续播
- **收藏管理** — 一键收藏，独立收藏页查看
- **广告过滤** — 可选屏蔽 m3u8 分段广告标记
- **跨平台** — App（Android/iOS）/ H5 / 小程序多端运行

## 技术栈

| 技术 | 用途 |
|------|------|
| uni-app (Vue 3) | 跨平台框架 |
| Apple CMS JSON API | 视频数据源 |
| 原生 `<video>` | 播放器（硬解 m3u8） |
| ArtPlayer + hls.js | 广告过滤（H5端） |

## 快速开始

1. 用 HBuilderX 打开项目
2. `npm install` 安装依赖
3. 运行到手机或模拟器
4. 在 **设置** 页添加 Apple CMS 接口地址（如 `https://example.com/api.php/provide/vod`）
5. 返回首页即可浏览

## 项目结构

```
├── App.vue                    # 全局入口 + 自动更新检查
├── main.js                    # Vue 实例
├── manifest.json              # App 配置
├── pages.json                 # 路由 + TabBar
├── pages/
│   ├── index/index.vue        # 首页（分类 + 视频列表 + 收藏/历史）
│   ├── detail/detail.vue      # 详情（封面/简介/选集/线路切换/播放）
│   ├── play/play.vue          # 内置播放（原生 video，保留）
│   ├── play-h5/play-h5.vue    # H5增强播放（ArtPlayer + hls.js）
│   ├── search/search.vue      # 搜索
│   ├── config/config.vue      # 设置（多源管理/广告过滤/检查更新）
│   ├── fav/index.vue          # 收藏页
│   └── hist/index.vue         # 历史记录页
├── static/player/             # H5播放器（离线包）
│   ├── index.html             # 播放器页面
│   ├── artplayer.js           # ArtPlayer 库
│   └── hls.min.js             # hls.js 库
├── h5-player/                 # H5播放器（GitHub Pages用）
└── utils/
    ├── api.js                 # Apple CMS API 封装 + 多源管理 + m3u8 解析
    └── player-utils.js        # hls.js 自定义加载器 + 广告过滤
```

## 功能

- **多源管理** — 添加/切换/编辑 Apple CMS 接口
- **分类浏览** — 自动获取分类，选中分类加载视频，下拉分页
- **搜索引擎** — 关键词搜索，历史记录
- **H5增强播放** — ArtPlayer + hls.js，内嵌 App 不跳出浏览器
- **智能去广告** — 自动检测短分段（<15段≈30秒）并删除
- **倍速控制** — 0.5x ~ 2x，H5播放器自带
- **全屏横屏** — 播放页自动转横屏，退出恢复竖屏
- **播放历史** — 自动保存进度，断点续播，30天自动清理
- **收藏管理** — 一键收藏，收藏页查看
- **外部播放器** — 调用系统播放器（MX Player/VLC等）
- **自动更新** — 启动时检查 GitHub Releases 新版本
- **跨平台** — App（Android/iOS）/ H5 多端运行

## 接口说明

支持标准 Apple CMS v10 JSON 接口：

| 端点 | 参数 | 说明 |
|------|------|------|
| `?ac=class` | — | 获取分类 |
| `?ac=videolist` | `t` `pg` | 分类视频列表 |
| `?ac=detail` | `ids` | 视频详情 |
| `?ac=videolist` | `wd` `pg` | 搜索 |

## 免责声明

本项目仅供**个人学习交流**之用，严禁用于任何商业或非法用途。

- 本软件不提供、不存储、不分发任何影视资源内容
- 用户自行添加的 API 接口与本项目无关
- 使用者需遵守当地法律法规，自行承担使用风险
- 请在下载后 24 小时内删除

## 版更说明

每次发布新版本时，在 GitHub Release 创建新 tag（如 `v1.0.2`）并上传 APK，App 启动时自动检测更新提示用户。

