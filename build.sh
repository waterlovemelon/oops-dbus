#!/usr/bin/env bash
#
# Oops DBus 打包脚本
# 用法:
#   ./build.sh              # 默认打包为 AppImage
#   ./build.sh appimage     # 打包为 AppImage
#   ./build.sh deb          # 打包为 deb 安装包
#   ./build.sh portable     # 打包为便携版目录（带无后缀可执行启动脚本）
#

set -euo pipefail

# 加载 nvm（非交互式 bash 不会自动加载 nvm）
export NVM_DIR="${NVM_DIR:-$HOME/.config/nvm}"
[[ -s "$NVM_DIR/nvm.sh" ]] && source "$NVM_DIR/nvm.sh"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

APP_NAME="Oops DBus"
APP_NAME_LOWER="oops-dbus"
VERSION=$(node -p "require('./package.json').version")
BUILD_DIR="$SCRIPT_DIR/build"
DIST_DIR="$SCRIPT_DIR/dist"
DIST_ELECTRON_DIR="$SCRIPT_DIR/dist-electron"

# 颜色
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

info()  { echo -e "${CYAN}[INFO]${NC} $*"; }
ok()    { echo -e "${GREEN}[OK]${NC} $*"; }
warn()  { echo -e "${YELLOW}[WARN]${NC} $*"; }
error() { echo -e "${RED}[ERROR]${NC} $*" >&2; }

# ---------- 前置检查 ----------
check_deps() {
    local missing=()
    command -v node  >/dev/null || missing+=(node)
    command -v npm   >/dev/null || missing+=(npm)

    if [[ ${#missing[@]} -gt 0 ]]; then
        error "缺少依赖: ${missing[*]}"
        exit 1
    fi

    if [[ ! -d node_modules ]]; then
        info "node_modules 不存在，正在安装依赖..."
        npm install
    fi
}

# ---------- Vite 构建 ----------
build_vite() {
    info "正在构建前端和主进程 (tsc + vite build)..."
    npm run build:vite
    ok "Vite 构建完成"
}

# ---------- AppImage 打包 ----------
build_appimage() {
    info "正在打包 AppImage..."
    npx electron-builder --linux AppImage
    ok "AppImage 打包完成"

    local appimage
    appimage=$(find "$SCRIPT_DIR/dist" -name "*.AppImage" -type f | head -1)
    if [[ -n "$appimage" ]]; then
        local target="$SCRIPT_DIR/${APP_NAME_LOWER}-${VERSION}-x86_64.AppImage"
        mv "$appimage" "$target"
        chmod +x "$target"
        ok "输出: $target"
    else
        warn "未找到生成的 AppImage，请检查 build/ 目录"
    fi
}

# ---------- deb 打包（UOS 规范） ----------
build_deb() {
    info "正在按 UOS 规范打包 deb..."
    bash "$SCRIPT_DIR/scripts/build-uos-deb.sh"
}

# ---------- 便携版打包（带无后缀可执行文件） ----------
build_portable() {
    info "正在打包便携版..."

    # 使用 electron-builder 的 dir 模式输出目录
    npx electron-builder --linux dir
    ok "Electron 目录构建完成"

    # 找到输出目录
    local unpacked
    unpacked=$(find "$SCRIPT_DIR/dist" -name "linux-unpacked" -type d | head -1)
    if [[ -z "$unpacked" ]]; then
        unpacked="$SCRIPT_DIR/dist/linux-unpacked"
    fi

    if [[ ! -d "$unpacked" ]]; then
        error "未找到构建输出目录"
        exit 1
    fi

    # 便携版输出目录
    local portable_dir="$SCRIPT_DIR/${APP_NAME_LOWER}-${VERSION}-portable"
    rm -rf "$portable_dir"

    info "复制文件到便携版目录..."
    cp -r "$unpacked" "$portable_dir"

    # 创建无后缀的可执行启动脚本
    cat > "$portable_dir/${APP_NAME_LOWER}" << 'LAUNCHER'
#!/usr/bin/env bash
#
# Oops DBus 启动器
#
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec "$SCRIPT_DIR/oops-dbus" "$@"
LAUNCHER
    chmod +x "$portable_dir/${APP_NAME_LOWER}"

    # 创建桌面快捷方式文件
    cat > "$portable_dir/${APP_NAME_LOWER}.desktop" << EOF
[Desktop Entry]
Name=Oops DBus
Comment=Modern D-Bus introspection tool
Exec=$portable_dir/${APP_NAME_LOWER} %U
Icon=$portable_dir/resources/assets/icons/png/256x256.png
Type=Application
Categories=Development;
Terminal=false
StartupWMClass=oops-dbus
EOF
    chmod +x "$portable_dir/${APP_NAME_LOWER}.desktop"

    ok "便携版打包完成"
    echo ""
    info "目录: $portable_dir/"
    info "启动: $portable_dir/${APP_NAME_LOWER}"
    info "      或直接运行: $portable_dir/oops-dbus"
    echo ""
    info "可将整个目录拷贝到任意位置使用，无需安装"
}

# ---------- 主流程 ----------
main() {
    local target="${1:-appimage}"

    echo ""
    echo "=========================================="
    echo "  $APP_NAME v$VERSION"
    echo "  打包目标: $target"
    echo "=========================================="
    echo ""

    check_deps
    build_vite

    case "$target" in
        appimage)
            build_appimage
            ;;
        deb)
            build_deb
            ;;
        portable)
            build_portable
            ;;
        *)
            error "未知目标: $target"
            echo "用法: $0 [appimage|deb|portable]"
            exit 1
            ;;
    esac

    echo ""
    ok "打包完成！"
}

main "$@"
