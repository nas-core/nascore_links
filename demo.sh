#!/bin/bash

# NasCore Links 演示脚本
# 展示系统的主要功能

echo "=================================="
echo "    NasCore Links 功能演示"
echo "=================================="

# 检查Go环境
if ! command -v go &> /dev/null; then
    echo "错误: 未找到 Go 环境，请先安装 Go"
    exit 1
fi

# 清理旧数据
if [ -f "links.db" ]; then
    echo "清理旧数据库..."
    rm links.db
fi

echo "正在编译程序..."
go build -o nascore-links .

if [ $? -ne 0 ]; then
    echo "编译失败！"
    exit 1
fi

# 启动演示
echo ""
echo "🎯 演示场景 1: 管理员用户"
echo "=================================="
echo "功能: 管理员可以创建公开和私有链接"
echo ""
echo "即将启动管理员模式演示..."
echo "请在浏览器中访问: http://localhost:8082"
echo ""
echo "演示步骤:"
echo "1. 创建公开分类 '开发工具'"
echo "2. 添加公开链接 'GitHub - https://github.com'"
echo "3. 创建私有分类 '个人收藏'"
echo "4. 添加私有链接 '我的笔记'"
echo "5. 测试搜索功能"
echo ""
echo "按 Enter 键开始管理员演示，按 Ctrl+C 停止..."
read -r

USER=admin PORT=8082 ./nascore-links &
ADMIN_PID=$!

echo "管理员演示已启动，PID: $ADMIN_PID"
echo "现在你可以在浏览器中体验管理员功能"
echo ""
echo "演示完成后，按 Enter 键继续下一个演示..."
read -r

# 停止管理员演示
kill $ADMIN_PID 2>/dev/null
sleep 2

echo ""
echo "🎯 演示场景 2: 普通用户"
echo "=================================="
echo "功能: 普通用户只能创建私有链接，可查看公开内容"
echo ""
echo "即将启动普通用户模式演示..."
echo "请在浏览器中访问: http://localhost:8083"
echo ""
echo "演示步骤:"
echo "1. 查看管理员创建的公开内容"
echo "2. 创建私有分类 '学习资料'"
echo "3. 添加私有链接（注意：没有公开选项）"
echo "4. 测试搜索功能"
echo "5. 验证无法编辑管理员的内容"
echo ""
echo "按 Enter 键开始普通用户演示，按 Ctrl+C 停止..."
read -r

USER=testuser PORT=8083 ./nascore-links &
USER_PID=$!

echo "普通用户演示已启动，PID: $USER_PID"
echo "现在你可以在浏览器中体验普通用户功能"
echo ""
echo "演示完成后，按 Enter 键继续..."
read -r

# 停止普通用户演示
kill $USER_PID 2>/dev/null
sleep 2

echo ""
echo "🎯 演示场景 3: 搜索功能测试"
echo "=================================="
echo "功能: 展示三种搜索方式的区别"
echo ""
echo "搜索功能说明:"
echo "1. 快速检索 - 在本地数据中搜索"
echo "2. Bing搜索 - 在新窗口打开Bing搜索"
echo "3. Google搜索 - 在新窗口打开Google搜索"
echo ""
echo "测试步骤:"
echo "1. 在搜索框输入 'github'"
echo "2. 点击'快速检索'按钮"
echo "3. 清除搜索，输入 'golang'"
echo "4. 点击'Bing搜索'按钮"
echo "5. 点击'Google搜索'按钮"
echo ""
echo "按 Enter 键开始搜索功能演示..."
read -r

USER=admin PORT=8084 ./nascore-links &
SEARCH_PID=$!

echo "搜索演示已启动，PID: $SEARCH_PID"
echo "访问 http://localhost:8084 测试搜索功能"
echo ""
echo "演示完成后，按 Enter 键继续..."
read -r

# 停止搜索演示
kill $SEARCH_PID 2>/dev/null
sleep 2

echo ""
echo "🎯 演示场景 4: 界面交互测试"
echo "=================================="
echo "功能: 展示界面的各种交互特性"
echo ""
echo "交互特性:"
echo "1. 鼠标悬浮在链接上显示工具提示"
echo "2. 点击链接标题旁的 'ℹ' 按钮显示详情"
echo "3. 公共区域大按钮样式"
echo "4. 分类区域紧凑布局"
echo "5. 响应式设计"
echo ""
echo "键盘快捷键:"
echo "- Ctrl+K: 聚焦搜索框"
echo "- Ctrl+N: 添加新链接"
echo "- Ctrl+Shift+N: 添加新分类"
echo "- F5: 刷新数据"
echo "- ESC: 关闭模态框或清除搜索"
echo ""
echo "按 Enter 键开始交互演示..."
read -r

USER=admin PORT=8085 ./nascore-links &
INTERACT_PID=$!

echo "交互演示已启动，PID: $INTERACT_PID"
echo "访问 http://localhost:8085 测试界面交互"
echo ""
echo "演示完成后，按 Enter 键结束所有演示..."
read -r

# 清理
kill $INTERACT_PID 2>/dev/null
sleep 1

echo ""
echo "🎉 演示完成！"
echo "=================================="
echo ""
echo "总结："
echo "✅ 管理员权限：可创建公开/私有内容"
echo "✅ 用户权限：只能创建私有内容"
echo "✅ 双区域布局：公共区域 + 分类区域"
echo "✅ 搜索功能：本地检索 + 外部搜索"
echo "✅ 交互特性：悬浮提示 + 详情切换"
echo "✅ 响应式设计：适配各种设备"
echo ""
echo "系统特点："
echo "• 数据隔离：用户间数据完全隔离"
echo "• 权限控制：精确的权限管理"
echo "• 现代界面：美观的渐变动画效果"
echo "• 便捷操作：丰富的快捷键支持"
echo ""
echo "部署建议："
echo "• 生产环境：使用反向代理(nginx)"
echo "• 数据备份：定期备份 links.db 文件"
echo "• 用户管理：通过环境变量控制用户权限"
echo ""
echo "开发扩展："
echo "• 可添加用户注册登录功能"
echo "• 可集成网站图标获取"
echo "• 可添加标签系统"
echo "• 可支持批量导入导出"
echo ""
echo "感谢体验 NasCore Links！"
