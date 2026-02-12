# 婚礼邀请函 Wedding Invitation

一个极简风格的在线婚礼邀请函，支持为每位宾客生成专属邀请链接。

## ✨ 功能特点

- 📱 **移动端优先** — 专为手机浏览优化的全屏滚动体验
- 🎵 **背景音乐** — 自动播放 BGM，支持自定义音乐
- 📷 **封面照片** — 支持自定义婚纱照作为封面
- 💌 **个性化邀请** — 为每位宾客生成「送呈 XX 台启」专属链接
- ✅ **RSVP 回复** — 宾客可在线填写是否出席及参加人数，支持随时修改
- 📊 **统计看板** — 后台实时查看回复状态、参加人数、预估总人数
- 🌿 **草坪仪式** — 可选邀请宾客参加下午草坪婚礼典礼
- 🌸 **浪漫特效** — 飘落花瓣、星光闪烁、心跳动画等视觉效果
- 🔧 **全环境变量配置** — 新人信息、日期、文案均可通过环境变量自定义
- 🐳 **容器化部署** — Docker 一键启动

## 📁 项目结构

```
wedding/
├── Dockerfile
├── docker-compose.yml
├── run_local.sh            # 本地调试启动脚本
├── gen_mock_photo.py       # 生成 mock 封面照片
├── server/
│   ├── app.py              # Flask 后端
│   └── requirements.txt
├── templates/
│   ├── invitation.html     # 邀请函页面
│   ├── admin_login.html    # 后台登录
│   └── admin_dashboard.html # 后台管理
├── static/
│   ├── css/
│   │   ├── invitation.css  # 邀请函样式（含花瓣/闪烁动画）
│   │   └── admin.css       # 后台样式
│   └── js/
│       ├── invitation.js   # 邀请函脚本（音乐/花瓣/淡入）
│       └── admin.js        # 后台脚本
├── music/
│   └── bgm.ogg            # 默认背景音乐（烧录到容器）
├── photo/
│   └── cover.jpg           # 默认封面照片（烧录到容器）
└── data/                   # 运行时持久化数据
    ├── guests.json         # 宾客数据
    ├── music/              # 自定义音乐（优先级高于默认）
    └── photo/              # 自定义照片（优先级高于默认）
```

## 🚀 快速启动

### 本地调试

```bash
# 一键启动（自动安装依赖、生成 mock 照片）
./run_local.sh

# 或者手动启动
pip3 install -r server/requirements.txt
python3 gen_mock_photo.py          # 生成 mock 封面照片
DATA_DIR=./data PHOTO_DIR=./data/photo MUSIC_DIR=./data/music python3 server/app.py
```

启动后访问：
- 邀请函首页：http://localhost:5000
- 管理后台：http://localhost:5000/admin （默认密码 `admin123`）

### Docker Compose（生产部署）

1. 编辑 `docker-compose.yml` 中的环境变量，填入你的婚礼信息
2. 启动服务：

```bash
docker compose up -d
```

3. 访问：
   - 邀请函首页：`http://your-domain:5000`
   - 管理后台：`http://your-domain:5000/admin`

## ⚙️ 环境变量

### 必填信息

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `GROOM_NAME` | 新郎姓名 | 新郎 |
| `BRIDE_NAME` | 新娘姓名 | 新娘 |
| `WEDDING_DATE` | 婚礼公历日期 | 2026年10月01日 |
| `WEDDING_DATE_WEEKDAY` | 星期几 | 星期四 |
| `BANQUET_TIME` | 婚宴时间 | 18:00 |
| `CEREMONY_TIME` | 草坪典礼时间 | 16:00 |
| `WEDDING_VENUE` | 婚宴地点 | 某某酒店·草坪厅 |
| `WEDDING_ADDRESS` | 详细地址（可选） | 空 |

### 管理与安全

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `ADMIN_PASSWORD` | 后台管理密码 | admin123 |
| `SECRET_KEY` | Flask Session 密钥 | change-me-in-production |

### 媒体文件

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `BGM_FILENAME` | BGM 文件名 | bgm.ogg |
| `COVER_PHOTO` | 封面照片文件名 | cover.jpg |

**音乐优先级**：`data/music/` > 容器内置 `music/`
**照片优先级**：`data/photo/` > 容器内置 `photo/`

### 可选文案

| 变量 | 说明 |
|------|------|
| `COVER_SUBTITLE` | 封面副标题 |
| `INVITE_TITLE` | 邀请区标题 |
| `INVITE_TEXT` | 邀请正文（支持 `\n` 换行及 `{wedding_date}` 等占位符） |
| `CEREMONY_INVITE_TEXT` | 草坪仪式邀请文案 |
| `STORY_TITLE` | 故事区标题 |
| `STORY_TEXT` | 故事正文 |
| `DETAILS_TITLE` | 详情区标题 |
| `CEREMONY_LABEL` | 典礼标签 |
| `BANQUET_LABEL` | 婚宴标签 |
| `VENUE_LABEL` | 地点标签 |
| `CLOSING_TEXT` | 结尾文字 |
| `FOOTER_TEXT` | 页脚文字 |

### RSVP 回复功能文案

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `RSVP_TITLE` | RSVP区标题 | 期待您的回复 |
| `RSVP_SUBTITLE` | RSVP副标题 | 请告知我们您是否能够出席 |
| `RSVP_QUESTION` | 询问问题 | 您是否能够出席我们的婚礼？ |
| `RSVP_YES_TEXT` | "参加"按钮文字 | 我会参加 |
| `RSVP_NO_TEXT` | "不参加"按钮文字 | 无法出席 |
| `RSVP_GUEST_COUNT_LABEL` | 人数选择标签 | 请选择参加人数： |
| `RSVP_SUBMIT_TEXT` | 提交按钮文字 | 确认提交 |
| `RSVP_CHANGE_TEXT` | 修改回复按钮文字 | 修改回复 |
| `RSVP_THANK_YOU` | 参加感谢消息 | 感谢您来见证我们的幸福时刻！ |
| `RSVP_REGRET` | 不参加遗憾消息 | 很遗憾您无法出席。 |

## 📋 使用流程

### 1. 部署

```bash
# 修改 docker-compose.yml 中的环境变量
docker compose up -d
```

### 2. 替换素材（可选）

将你的婚纱照和 BGM 放入持久化卷中：

```bash
# 查看卷的实际路径
docker volume inspect wedding_data

# 或使用 docker cp
docker cp my-wedding-photo.jpg wedding-invitation:/app/data/photo/cover.jpg
docker cp my-bgm.ogg wedding-invitation:/app/data/music/bgm.ogg
```

### 3. 管理宾客

1. 访问 `/admin`，输入管理密码登录
2. 输入宾客姓名
3. 勾选 **「邀请参加草坪仪式」**（如果该宾客需要参加下午的草坪典礼）
4. 点击「生成链接」，系统生成专属 URL
5. 将链接发送给对应宾客

### 4. 宾客体验

宾客打开链接后看到的邀请函包含：
- 🌸 飘落花瓣动画 + 背景音乐
- 📷 封面婚纱照
- 💌 个性化「送呈 XX 台启」
- 🌿 草坪仪式邀请（如已勾选）
- 📍 婚礼详情（时间、地点）
- 💕 结语祝福

## 🎨 页面说明

### 前台（邀请函）

由 5 个全屏区块组成，手机滚动浏览：

| 区块 | 内容 | 特效 |
|------|------|------|
| 封面 | 照片 + 新人姓名 + 日期 | 照片缓慢缩放、星光闪烁 |
| 邀请 | 送呈台启 + 邀请辞 + 草坪仪式 | 淡入动画 |
| 故事 | 我们的故事 | 淡入动画 |
| 详情 | 典礼/婚宴时间 + 地点 | 卡片悬浮效果 |
| 结语 | 祝福语 + 新人姓名 | 心跳动画 |

全局特效：飘落花瓣 🌸

### 后台（管理面板）

- 密码保护登录
- 添加宾客（姓名 + 是否邀请草坪仪式）
- 生成/复制/删除专属链接
- 查看所有已生成的邀请

## 📦 数据持久化

所有运行时数据存放在 `DATA_DIR`（默认 `/app/data`）：

```
data/
├── guests.json    # 宾客数据（姓名、是否参加仪式、专属码）
├── music/         # 自定义音乐（可选，优先级高于内置）
└── photo/         # 自定义照片（可选，优先级高于内置）
```

使用 Docker Volume 挂载即可持久化，所有数据在同一目录下，方便备份与迁移。
