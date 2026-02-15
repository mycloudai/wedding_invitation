# 婚礼邀请函 Wedding Invitation

一个极简风格的在线婚礼邀请函，支持为每位宾客生成专属邀请链接。

## ✨ 功能特点

- 📱 **移动端优先** — 专为手机浏览优化的全屏滚动体验
- 🎵 **背景音乐** — 自动播放 BGM，支持自定义音乐
- 📷 **封面照片** — 支持自定义婚纱照作为封面
- 💌 **个性化邀请** — 为每位宾客生成「送呈 XX 台启」专属链接，一键复制发送消息
- ✅ **RSVP 回复** — 宾客可在线填写是否出席及参加人数，支持随时修改
- 📊 **统计看板** — 后台实时查看回复状态、参加人数、预估总人数，支持导出参加者名单
- 🎨 **多种主题** — 6 款配色主题（经典米色、浪漫粉色、优雅蓝色、清新绿色、薰衣草紫、喜庆红色），后台一键切换
- 🌿 **草坪仪式** — 可选邀请宾客参加下午草坪婚礼典礼
- 🌸 **浪漫特效** — 飘落花瓣、星光闪烁、心跳动画等视觉效果
- 📍 **一键导航** — 婚礼地点卡片内嵌高德地图 / 百度地图导航按钮
- 📅 **加入日历** — 宾客一键下载 `.ics` 文件，添加婚礼到手机日历
- 📲 **微信分享预览** — Open Graph 标签，微信转发链接时自动显示封面照片和婚礼信息
- 👁 **访问记录** — 后台实时查看每位宾客首次打开邀请函的时间和查看次数
- 🔧 **全环境变量配置** — 新人信息、日期、文案均可通过环境变量自定义
- 🐳 **容器化部署** — Docker 一键启动，支持 Kubernetes 部署

## 📸 截图预览

### 后台管理

| 登录 | 主题设置 · 生成邀请函 |
|------|------|
| <img src="screenshot/1-admin-portal-login.png" width="420"> | <img src="screenshot/2-creat-invitation.png" width="420"> |

| 复制邀请消息 | 回复统计看板 |
|------|------|
| <img src="screenshot/3-copy-invitation-message-and-send.png" width="420"> | <img src="screenshot/9-admin-portal-response-overview-page.png" width="420"> |

### 宾客邀请函（手机端）

<table>
  <tr>
    <td align="center"><img src="screenshot/4-invitation-main-page.png" width="160"><br><sub>打开邀请函</sub></td>
    <td align="center"><img src="screenshot/5-invitation-page1.png" width="160"><br><sub>封面</sub></td>
    <td align="center"><img src="screenshot/6-invitation-page2.png" width="160"><br><sub>邀请 & 详情</sub></td>
    <td align="center"><img src="screenshot/7-invitation-page3.png" width="160"><br><sub>故事 & 结语</sub></td>
    <td align="center"><img src="screenshot/8-invitation-rsvp-page.png" width="160"><br><sub>RSVP 回复</sub></td>
  </tr>
</table>

---

## 📁 项目结构

```
wedding/
├── Dockerfile
├── docker-compose.yml
├── docker-compose.dev.yml  # 开发环境配置
├── run_local.sh            # 本地调试启动脚本
├── gen_mock_photo.py       # 生成 mock 封面照片
├── LICENSE
├── server/
│   ├── app.py              # Flask 后端
│   └── requirements.txt
├── templates/
│   ├── invitation.html     # 邀请函页面
│   ├── admin_login.html    # 后台登录
│   └── admin_dashboard.html # 后台管理
├── static/
│   ├── css/
│   │   ├── invitation.css  # 邀请函样式（含花瓣/闪烁动画、多主题）
│   │   └── admin.css       # 后台样式
│   └── js/
│       ├── invitation.js   # 邀请函脚本（音乐/花瓣/RSVP）
│       └── admin.js        # 后台脚本
├── music/
│   └── bgm.ogg            # 默认背景音乐（烧录到容器）
├── photo/
│   └── cover.jpg           # 默认封面照片（烧录到容器）
├── k8s/                    # Kubernetes 部署文件
│   ├── configmap.yaml
│   ├── deployment.yaml
│   ├── service.yaml
│   ├── ingress.yaml
│   ├── secret.yaml
│   └── nfs-pv-pvc.yaml
└── data/                   # 运行时持久化数据（gitignored）
    ├── guests.json         # 宾客数据
    ├── theme.json          # 当前主题设置
    ├── music/              # 自定义音乐（优先级高于默认）
    └── photo/              # 自定义照片（优先级高于默认）
```

## 🐳 最新镜像

<!-- LATEST_IMAGE_START -->
| 标签 | 镜像地址 |
|------|------|
| `latest` | `registry.cn-shanghai.aliyuncs.com/jihaoyun/wedding_invitation:latest` |
| `8970feb4` | `registry.cn-shanghai.aliyuncs.com/jihaoyun/wedding_invitation:8970feb4` |

*最后构建：2026-02-15 14:32 UTC · 平台：`linux/amd64` · [查看 Actions](https://github.com/mycloudai/wedding_invitation/actions)*
<!-- LATEST_IMAGE_END -->

## 🚀 快速启动

> **📌 设计说明：根目录 `/` 故意返回 404。**
> 邀请函没有公开首页——每位宾客只能通过后台生成的专属链接 `/i/<code>` 访问自己的邀请函。
> 部署完成后，请先登录 `/admin` 管理后台，为每位宾客生成链接并发送，宾客才能打开邀请函。

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
- 管理后台：`http://localhost:5050/admin` （默认密码 `admin123`）

### Docker Compose（推荐生产部署）

1. 编辑 `docker-compose.yml` 中的环境变量，填入你的婚礼信息
2. **务必修改** `ADMIN_PASSWORD` 和 `SECRET_KEY`
3. 启动服务：

```bash
docker compose up -d
```

4. 访问管理后台：`http://your-domain:5000/admin`

### Kubernetes 部署

```bash
# 1. 修改 k8s/configmap.yaml 中的婚礼信息
# 2. 修改 k8s/secret.yaml 中的管理密码和 Session 密钥
# 3. 按需配置持久化存储（k8s/nfs-pv-pvc.yaml）

kubectl apply -f k8s/
```

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

> ⚠️ **生产环境请务必修改 `ADMIN_PASSWORD` 和 `SECRET_KEY`**

### 媒体文件

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `BGM_FILENAME` | BGM 文件名 | bgm.ogg |
| `COVER_PHOTO` | 封面照片文件名 | cover.jpg |

**音乐优先级**：`data/music/` > 容器内置 `music/`
**照片优先级**：`data/photo/` > 容器内置 `photo/`

### 导航与日历

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `WEDDING_DATE_ISO` | ISO 格式婚礼日期，用于日历文件（如 `2026-10-01`）。不填则自动从 `WEDDING_DATE` 解析中文日期 | 自动解析 |
| `MAP_LINK_AMAP` | 自定义高德地图导航链接 | 自动根据地点名称生成搜索链接 |
| `MAP_LINK_BAIDU` | 自定义百度地图导航链接 | 自动根据地点名称生成搜索链接 |

> **提示**：若婚礼地点较偏僻或自动定位不准，建议在高德/百度地图 App 中找到准确位置后复制分享链接，填入 `MAP_LINK_AMAP` / `MAP_LINK_BAIDU` 覆盖默认值。

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
2. **主题设置**：在"主题设置"区块选择喜欢的配色主题，实时生效
3. **生成邀请函**：输入宾客姓名，勾选是否邀请草坪仪式，点击「生成链接」
4. 复制专属链接或一键复制邀请消息，发送给对应宾客
5. **查看回复**：在"回复统计"区块查看已回复/未回复/参加人数，点击数字查看名单
6. **导出名单**：点击「导出参加宾客名单」下载 CSV 文件
7. 支持在宾客列表中编辑名字、删除邀请

### 4. 宾客体验

宾客打开链接后看到的邀请函包含：
- 🌸 飘落花瓣动画 + 背景音乐
- 📷 封面婚纱照
- 💌 个性化「送呈 XX 台启」
- 🌿 草坪仪式邀请（如已勾选）
- 📍 婚礼详情（时间、地点）
- 💕 结语祝福
- ✅ RSVP 回复（是否出席 + 参加人数）

## 🎨 页面说明

### 前台（邀请函）

由 4 个全屏区块组成，手机滚动浏览：

| 区块 | 内容 | 特效 |
|------|------|------|
| 封面 | 照片 + 新人姓名 + 日期 | 照片缓慢缩放、星光闪烁 |
| 邀请 | 送呈台启 + 邀请辞 + 草坪仪式 + 婚礼详情 | 淡入动画 |
| 故事 | 我们的故事 + 结语 | 淡入动画 |
| RSVP | 出席回复 + 人数确认 | 淡入动画 |

全局特效：飘落花瓣 🌸、浮动爱心 💕、滚动星光 ✦

### 后台（管理面板）

- 密码保护登录
- **主题切换**：6 款配色主题，实时预览并保存
- **生成邀请函**：输入姓名，可选草坪仪式，生成专属 URL + 一键复制邀请消息
- **回复统计**：已回复/未回复/参加/不参加/草坪仪式人数/预估总人数，点击查看名单
- **导出名单**：一键导出参加宾客 CSV（含姓名、人数、是否参加草坪仪式）
- **宾客管理**：打开邀请函、复制邀请信息、编辑名字（弹窗）、删除

## 📦 数据持久化

所有运行时数据存放在 `DATA_DIR`（默认 `/app/data`）：

```
data/
├── guests.json    # 宾客数据（姓名、是否参加仪式、RSVP回复）
├── theme.json     # 当前主题设置（首次启动自动创建，默认经典米色）
├── music/         # 自定义音乐（可选，优先级高于内置）
└── photo/         # 自定义照片（可选，优先级高于内置）
```

使用 Docker Volume 挂载即可持久化，所有数据在同一目录下，方便备份与迁移。

## 🛠️ 开发

### 环境要求

- Python 3.10+
- Flask 3.x

### 本地开发

```bash
# 安装依赖
pip3 install -r server/requirements.txt

# 生成 mock 照片（仅首次需要）
python3 gen_mock_photo.py

# 启动（使用 run_local.sh 会自动设置环境变量）
./run_local.sh
```

> **注意**：`fcntl` 文件锁为 Unix/Linux/macOS 专用，Windows 本地开发需要替换为 `msvcrt` 或去掉锁机制。

### API 接口

| 方法 | 路径 | 说明 | 需要登录 |
|------|------|------|----------|
| GET | `/i/<code>` | 查看邀请函（自动记录访问） | 否 |
| GET | `/i/<code>/calendar.ics` | 下载日历文件 | 否 |
| POST | `/api/rsvp/<code>` | 提交 RSVP | 否 |
| POST | `/api/guests` | 创建宾客 | 是 |
| PATCH | `/api/guests/<code>` | 修改宾客名字 | 是 |
| DELETE | `/api/guests/<code>` | 删除宾客 | 是 |
| GET | `/api/theme` | 获取当前主题 | 是 |
| POST | `/api/theme` | 设置主题 | 是 |

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建功能分支 (`git checkout -b feature/your-feature`)
3. 提交改动 (`git commit -m 'Add your feature'`)
4. 推送分支 (`git push origin feature/your-feature`)
5. 创建 Pull Request

## 📄 License

MIT License — 详见 [LICENSE](LICENSE)
