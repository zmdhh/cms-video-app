# CMS Video App

基于 uni-app 的 Apple CMS 视频客户端，支持多源切换、分类浏览、m3u8 播放、倍速控制、播放记录和收藏。

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
├── App.vue                    # 全局入口
├── main.js                    # Vue 实例
├── manifest.json              # App 配置
├── pages.json                 # 路由 + TabBar
├── pages/
│   ├── index/index.vue        # 首页（分类 + 视频列表 + 收藏/历史入口）
│   ├── detail/detail.vue      # 详情（封面/简介/选集/线路切换）
│   ├── play/play.vue          # 播放（倍速/自动续播/进度保存）
│   ├── search/search.vue      # 搜索
│   ├── config/config.vue      # 设置（多源管理/广告过滤）
│   ├── fav/index.vue          # 收藏页
│   └── hist/index.vue         # 历史记录页
└── utils/
    ├── api.js                 # Apple CMS API 封装 + m3u8 解析
    └── player-utils.js        # hls.js 自定义加载器 + 广告过滤
```

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

## 已知限制

- 播放页广告过滤依赖 `plus.io` API（仅 App 端支持）
- 部分 API 仅返回首页视频，分类需服务端支持 `t` 参数
