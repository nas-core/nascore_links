# NasCore Links 使用示例

本文档提供了 NasCore Links 网址导航管理系统的使用示例和测试数据。

## 快速体验

### 1. 启动系统

```bash
# 以管理员身份启动
./start.sh admin 8080

# 或者以普通用户身份启动
./start.sh testuser 8080
```

### 2. 访问界面

打开浏览器访问 `http://localhost:8080`

## 示例场景

### 管理员操作示例

当以 `admin` 用户身份登录时，你可以：

1. **创建公开分类**
   - 分类名称：`开发工具`
   - 勾选"设为公开分类"
   - 所有用户都能看到这个分类

2. **添加公开链接**
   - 标题：`GitHub`
   - 网址：`https://github.com`
   - 描述：`全球最大的代码托管平台`
   - 分类：`开发工具`
   - 勾选"设为公开链接"

3. **创建私有内容**
   - 管理员也可以创建只有自己可见的私有分类和链接
   - 不勾选公开选项即可

### 普通用户操作示例

当以 `testuser` 用户身份登录时，你可以：

1. **查看公开内容**
   - 能看到管理员创建的所有公开分类和链接
   - 在公共区域和分类区域都能看到

2. **创建私有分类**
   - 分类名称：`个人收藏`
   - 说明：只有自己能看到这个分类（没有公开选项）

3. **添加私有链接**
   - 标题：`我的博客`
   - 网址：`https://myblog.com`
   - 描述：`个人技术博客`
   - 分类：`个人收藏`

## 界面功能演示

### 1. 双区域布局

**公共区域**

- 显示所有公开链接
- 大按钮样式，便于快速访问
- 渐变背景，视觉突出

**分类区域**

- 按分类组织显示链接
- 紧凑卡片布局，节省空间
- 支持标签页切换

### 2. 搜索功能

**三种搜索方式**

- **快速检索**: 在本地数据中搜索标题、描述、网址
- **Bing搜索**: 在新窗口中使用Bing搜索关键词
- **Google搜索**: 在新窗口中使用Google搜索关键词

**搜索演示**

```
1. 在搜索框输入 "github"
2. 点击"快速检索" - 显示包含github的本地链接
3. 点击"Bing搜索" - 在Bing中搜索github
4. 点击"Google搜索" - 在Google中搜索github
```

### 3. 交互特性

**鼠标悬浮提示**

- 悬浮在任何链接卡片上
- 自动显示完整网址和描述
- 智能定位，避免超出屏幕

**信息按钮**

- 点击链接标题旁的 "ℹ" 按钮
- 切换显示/隐藏链接详情
- 在分类区域的紧凑布局中特别有用

## 示例数据集

### 开发工具分类（公开）

| 名称           | 网址                          | 描述           |
| -------------- | ----------------------------- | -------------- |
| GitHub         | https://github.com            | 代码托管平台   |
| GitLab         | https://gitlab.com            | DevOps 平台    |
| Stack Overflow | https://stackoverflow.com     | 程序员问答社区 |
| VS Code        | https://code.visualstudio.com | 微软开源编辑器 |

### 在线工具分类（公开）

| 名称           | 网址                                     | 描述                |
| -------------- | ---------------------------------------- | ------------------- |
| JSON格式化     | https://jsonformatter.curiousconcept.com | JSON 在线格式化工具 |
| Base64编解码   | https://www.base64encode.org             | Base64 编解码工具   |
| 正则表达式测试 | https://regex101.com                     | 正则表达式在线测试  |
| 颜色选择器     | https://htmlcolorcodes.com               | HTML 颜色代码工具   |

### 技术文档分类（公开）

| 名称         | 网址                          | 描述            |
| ------------ | ----------------------------- | --------------- |
| MDN Web Docs | https://developer.mozilla.org | Web 开发文档    |
| Go官方文档   | https://golang.org/doc        | Go 语言官方文档 |
| React文档    | https://reactjs.org/docs      | React 框架文档  |
| Vue.js文档   | https://vuejs.org/guide       | Vue.js 框架文档 |

## 权限验证示例

### 测试用户权限隔离

```bash
# 1. 以管理员身份创建公开内容
USER=admin PORT=8080 ./nascore-links &

# 创建公开分类和链接...

# 2. 切换到普通用户
pkill nascore-links
USER=testuser PORT=8080 ./nascore-links &

# 验证：
# - 能看到管理员的公开内容
# - 但无法编辑管理员的内容
# - 只能创建私有内容

# 3. 切换回管理员
pkill nascore-links
USER=admin PORT=8080 ./nascore-links &

# 验证：
# - 看不到其他用户的私有内容
# - 只能看到自己的内容和公开内容
```

## 键盘快捷键演示

| 快捷键             | 功能                | 演示                 |
| ------------------ | ------------------- | -------------------- |
| `Ctrl + K`         | 聚焦搜索框          | 按下后直接输入搜索   |
| `Ctrl + N`         | 添加新链接          | 快速打开链接创建界面 |
| `Ctrl + Shift + N` | 添加新分类          | 快速打开分类创建界面 |
| `F5`               | 刷新数据            | 重新加载所有数据     |
| `ESC`              | 关闭模态框/清除搜索 | 取消当前操作         |

## API 测试示例

### 使用 curl 测试 API

```bash
# 获取分类列表
curl -X GET http://localhost:8080/api/categories

# 创建公开分类（管理员）
curl -X POST http://localhost:8080/api/category \
  -H "Content-Type: application/json" \
  -d '{"name":"API测试分类","sort_num":1,"is_public":true}'

# 创建私有分类（普通用户）
curl -X POST http://localhost:8080/api/category \
  -H "Content-Type: application/json" \
  -d '{"name":"私有分类","sort_num":1,"is_public":false}'

# 获取链接列表
curl -X GET http://localhost:8080/api/links

# 创建公开链接
curl -X POST http://localhost:8080/api/link \
  -H "Content-Type: application/json" \
  -d '{
    "title": "API测试链接",
    "url": "https://example.com",
    "description": "通过API创建的测试链接",
    "category_id": 1,
    "sort_num": 1,
    "is_public": true
  }'

# 按分类获取链接
curl -X GET "http://localhost:8080/api/links?category_id=1"
```

## 常见使用场景

### 1. 个人书签管理

```
场景：替代浏览器书签，跨设备同步
操作步骤：
1. 创建分类：工作、学习、娱乐、购物
2. 按分类整理常用网站
3. 添加详细描述便于搜索
4. 使用搜索功能快速找到需要的链接
```

### 2. 团队导航页面

```
场景：为团队提供统一的导航入口
操作步骤：
1. 管理员创建公开分类和链接
2. 包含：内部系统、开发工具、文档中心
3. 团队成员可添加个人收藏
4. 使用搜索功能快速访问资源
```

### 3. 客户资源整理

```
场景：为客户提供相关资源导航
操作步骤：
1. 按项目/客户创建分类
2. 整理相关文档、系统链接
3. 添加详细描述和使用说明
4. 客户可以直接访问需要的资源
```

## 高级功能示例

### 1. 数据导出

```javascript
// 在浏览器控制台执行
window.app.exportData()
```

### 2. 搜索功能扩展

```javascript
// 自定义搜索逻辑
function customSearch(query) {
  // 可以扩展搜索算法
  return window.app.performQuickSearch(query)
}
```

### 3. 响应式布局测试

```
测试不同屏幕尺寸：
1. 桌面端 (>768px) - 多列网格布局
2. 平板端 (768px-480px) - 双列布局
3. 手机端 (<480px) - 单列布局

验证功能：
- 搜索框自适应
- 按钮布局调整
- 模态框响应式
```

## 故障排除示例

### 常见问题及解决方案

**1. 端口被占用**

```bash
# 查看端口使用情况
lsof -i :8080

# 使用其他端口
PORT=8081 ./start.sh admin
```

**2. 权限问题**

```bash
# 检查环境变量
echo $USER

# 确保数据库文件权限
chmod 644 links.db
```

**3. 搜索不工作**

```javascript
// 检查JavaScript控制台是否有错误
// 验证搜索输入是否正确
console.log(window.app.filteredLinks)
```

**4. 样式问题**

```bash
# 检查静态文件是否正确加载
curl http://localhost:8080/static/css/style.css
```

## 性能优化示例

### 1. 大量数据处理

```javascript
// 当链接数量较多时，可以启用分页
const pageSize = 50
const currentPage = 1

// 或者使用虚拟滚动
function implementVirtualScroll() {
  // 实现虚拟滚动逻辑
}
```

### 2. 搜索优化

```javascript
// 使用防抖避免频繁搜索
const debouncedSearch = utils.debounce((query) => {
  window.app.performQuickSearch(query)
}, 300)
```

## 扩展开发示例

### 1. 添加图标支持

```javascript
// 扩展链接数据结构
const linkWithIcon = {
  title: 'GitHub',
  url: 'https://github.com',
  icon: 'https://github.com/favicon.ico',
  // ... 其他字段
}
```

### 2. 添加标签功能

```sql
-- 创建标签表
CREATE TABLE tags (
    id INTEGER PRIMARY KEY,
    name TEXT UNIQUE,
    color TEXT
);

-- 创建链接标签关联表
CREATE TABLE link_tags (
    link_id INTEGER,
    tag_id INTEGER,
    PRIMARY KEY (link_id, tag_id)
);
```

### 3. 批量操作

```javascript
// 批量导入链接
function importLinks(jsonData) {
  const links = JSON.parse(jsonData)
  return Promise.all(links.map((link) => api.createLink(link)))
}
```

## 部署示例

### 1. 使用Docker

```dockerfile
FROM golang:1.24-alpine AS builder
WORKDIR /app
COPY . .
RUN go build -o nascore-links .

FROM alpine:latest
RUN apk --no-cache add ca-certificates
WORKDIR /root/
COPY --from=builder /app/nascore-links .
COPY --from=builder /app/static ./static
COPY --from=builder /app/templates ./templates
EXPOSE 8080
CMD ["./nascore-links"]
```

### 2. 使用systemd

```ini
[Unit]
Description=NasCore Links
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/nascore-links
Environment=USER=admin
Environment=PORT=8080
ExecStart=/opt/nascore-links/nascore-links
Restart=always

[Install]
WantedBy=multi-user.target
```

### 3. 使用nginx反向代理

```nginx
server {
    listen 80;
    server_name links.example.com;

    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

这些示例可以帮助你快速上手和深度使用 NasCore Links 系统。根据实际需求，你可以灵活调整配置和扩展功能。
