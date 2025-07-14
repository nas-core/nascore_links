#!/bin/bash

# NasCore Links 启动脚本

# 设置默认值
DEFAULT_USER="admin"
DEFAULT_PORT="8080"

# 获取用户输入或使用默认值
USER_NAME=${1:-$DEFAULT_USER}
PORT_NUM=${2:-$DEFAULT_PORT}

echo "=================================="
echo "    NasCore Links 启动脚本"
echo "=================================="
echo "用户名: $USER_NAME"
echo "端口: $PORT_NUM"
echo "=================================="

# 检查端口是否被占用
if lsof -Pi :$PORT_NUM -sTCP:LISTEN -t >/dev/null ; then
    echo "错误: 端口 $PORT_NUM 已被占用"
    echo "正在尝试寻找可用端口..."

    # 尝试找到可用端口
    for port in {8080..8090}; do
        if ! lsof -Pi :$port -sTCP:LISTEN -t >/dev/null ; then
            PORT_NUM=$port
            echo "找到可用端口: $PORT_NUM"
            break
        fi
    done
fi

# 检查Go是否安装
if ! command -v go &> /dev/null; then
    echo "错误: 未找到 Go 环境，请先安装 Go"
    exit 1
fi

# 检查依赖
echo "检查依赖..."
go mod tidy

# 编译程序
echo "编译程序..."
if ! go build -o nascore-links .; then
    echo "错误: 编译失败"
    exit 1
fi

echo "编译成功！"

# 启动程序
echo "启动 NasCore Links..."
echo "访问地址: http://localhost:$PORT_NUM"
echo "按 Ctrl+C 停止服务"
echo ""

USER=$USER_NAME PORT=$PORT_NUM ./nascore-links
