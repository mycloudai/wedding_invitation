#!/bin/bash
# ==========================================================================
# Docker Build & Push Script - Wedding Invitation
# 构建镜像并推送到阿里云容器镜像仓库
# ==========================================================================

set -e

# 镜像仓库配置
REGISTRY="registry.cn-shanghai.aliyuncs.com"
NAMESPACE="jihaoyun"
IMAGE_NAME="wedding_invitation"
FULL_IMAGE="${REGISTRY}/${NAMESPACE}/${IMAGE_NAME}"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}======================================${NC}"
echo -e "${GREEN}  Wedding Invitation - Build & Push  ${NC}"
echo -e "${GREEN}======================================${NC}"
echo ""

# 检查 Docker 是否运行
echo -e "${YELLOW}检查 Docker 状态...${NC}"
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}错误: Docker 未运行，请先启动 Docker Desktop${NC}"
    exit 1
fi
echo -e "${GREEN}Docker 运行正常${NC}"
echo ""


# 获取版本号（优先 git commit hash，否则用时间戳）
if [ -d .git ]; then
    if git rev-parse --verify HEAD >/dev/null 2>&1; then
        VERSION=$(git rev-parse --short HEAD)
        echo -e "${YELLOW}检测到 Git，使用 commit hash 作为版本: ${VERSION}${NC}"
    else
        VERSION=$(date +%Y%m%d-%H%M%S)
        echo -e "${YELLOW}Git 仓库无提交，使用时间戳作为版本: ${VERSION}${NC}"
    fi
else
    VERSION=$(date +%Y%m%d-%H%M%S)
    echo -e "${YELLOW}未检测到 Git，使用时间戳作为版本: ${VERSION}${NC}"
fi

# 询问是否自定义版本号
read -p "是否使用自定义版本号？(直接回车使用上述版本，或输入自定义版本): " CUSTOM_VERSION
if [ -n "$CUSTOM_VERSION" ]; then
    VERSION="$CUSTOM_VERSION"
    echo -e "${GREEN}使用自定义版本: ${VERSION}${NC}"
fi

# 询问目标平台
echo ""
echo -e "${YELLOW}选择目标平台:${NC}"
echo "  1. linux/amd64 (默认)"
echo "  2. linux/arm64"
echo "  3. linux/amd64,linux/arm64 (多平台)"
read -p "请选择 [1-3，默认 1]: " PLATFORM_CHOICE
case $PLATFORM_CHOICE in
    2) PLATFORM="linux/arm64" ;;
    3) PLATFORM="linux/amd64,linux/arm64" ;;
    *) PLATFORM="linux/amd64" ;;
esac
echo -e "${GREEN}目标平台: ${PLATFORM}${NC}"

IMAGE_TAG="${FULL_IMAGE}:${VERSION}"
IMAGE_LATEST="${FULL_IMAGE}:latest"

echo ""
echo -e "${GREEN}将构建镜像:${NC}"
echo -e "  - ${IMAGE_TAG}"
echo -e "  - ${IMAGE_LATEST}"
echo -e "  平台: ${PLATFORM}"
echo ""

# 询问 Docker 仓库账号密码
read -p "请输入阿里云镜像仓库用户名: " DOCKER_USERNAME
read -s -p "请输入阿里云镜像仓库密码: " DOCKER_PASSWORD
echo ""
echo ""

if [ -z "$DOCKER_USERNAME" ] || [ -z "$DOCKER_PASSWORD" ]; then
    echo -e "${RED}错误: 用户名或密码不能为空${NC}"
    exit 1
fi

# 登录 Docker 仓库
echo -e "${YELLOW}正在登录到 ${REGISTRY}...${NC}"

# 尝试使用 http 协议（阿里云镜像仓库特殊处理）
echo "$DOCKER_PASSWORD" | docker login --username "$DOCKER_USERNAME" --password-stdin "$REGISTRY" 2>&1

if [ $? -ne 0 ]; then
    echo ""
    echo -e "${YELLOW}尝试其他登录方式...${NC}"
    
    # 检查是否是证书问题，提供解决建议
    echo -e "${YELLOW}如果遇到证书验证错误，请检查:${NC}"
    echo -e "  1. Docker Desktop 是否正常运行"
    echo -e "  2. 系统时间是否准确"
    echo -e "  3. 尝试重启 Docker Desktop"
    echo ""
    echo -e "${RED}登录失败，请检查账号密码或网络连接${NC}"
    exit 1
fi

echo -e "${GREEN}登录成功！${NC}"
echo ""

# 构建镜像
echo -e "${YELLOW}正在构建 Docker 镜像...${NC}"
docker buildx build --platform "$PLATFORM" -t "$IMAGE_TAG" -t "$IMAGE_LATEST" --push .

if [ $? -ne 0 ]; then
    echo -e "${RED}镜像构建失败${NC}"
    exit 1
fi

echo -e "${GREEN}镜像构建成功！${NC}"
echo ""

echo ""
echo -e "${GREEN}======================================${NC}"
echo -e "${GREEN}  🎉 构建和推送完成！${NC}"
echo -e "${GREEN}======================================${NC}"
echo ""
echo -e "镜像已推送到:"
echo -e "  ${GREEN}${IMAGE_TAG}${NC}"
echo -e "  ${GREEN}${IMAGE_LATEST}${NC}"
echo ""
echo -e "平台支持: ${YELLOW}${PLATFORM}${NC}"
echo ""
echo -e "在 K8s 中使用:"
echo -e "  ${YELLOW}image: ${IMAGE_TAG}${NC}"
echo ""
echo -e "或使用 latest 标签:"
echo -e "  ${YELLOW}image: ${IMAGE_LATEST}${NC}"
echo ""
