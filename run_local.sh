#!/usr/bin/env bash
# ============================================================
# 本地调试启动脚本
# 用法: ./run_local.sh
# ============================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# ---------- 环境变量（本地调试用，按需修改） ----------
export DATA_DIR="$SCRIPT_DIR/data"
export MUSIC_DIR="$SCRIPT_DIR/data/music"
export PHOTO_DIR="$SCRIPT_DIR/data/photo"

export GROOM_NAME="${GROOM_NAME:-新郎}"
export BRIDE_NAME="${BRIDE_NAME:-新娘}"
export WEDDING_DATE="${WEDDING_DATE:-2026年10月01日}"
export WEDDING_DATE_WEEKDAY="${WEDDING_DATE_WEEKDAY:-星期四}"
export BANQUET_TIME="${BANQUET_TIME:-18:00}"
export CEREMONY_TIME="${CEREMONY_TIME:-16:00}"
export WEDDING_VENUE="${WEDDING_VENUE:-某某酒店·草坪厅}"
export WEDDING_ADDRESS="${WEDDING_ADDRESS:-}"
export ADMIN_PASSWORD="${ADMIN_PASSWORD:-admin123}"
export SECRET_KEY="${SECRET_KEY:-local-dev-secret}"
export BGM_FILENAME="${BGM_FILENAME:-bgm.ogg}"
export COVER_PHOTO="${COVER_PHOTO:-cover.jpg}"

# ---------- 创建数据目录 ----------
mkdir -p "$DATA_DIR"

# ---------- 安装依赖 ----------
if ! python3 -c "import flask" 2>/dev/null; then
    echo "📦 安装依赖..."
    pip3 install -r server/requirements.txt
fi

# ---------- 生成 mock 照片（如不存在） ----------
if [ ! -f "$SCRIPT_DIR/photo/cover.jpg" ]; then
    echo "🖼️  生成 mock 封面照片..."
    python3 gen_mock_photo.py
fi

# ---------- 启动 ----------
echo ""
echo "============================================"
echo "  💒 婚礼邀请函 · 本地调试"
echo "============================================"
echo "  邀请函：  http://localhost:5050"
echo "  管理后台：http://localhost:5050/admin"
echo "  管理密码：$ADMIN_PASSWORD"
echo "============================================"
echo ""

python3 server/app.py
