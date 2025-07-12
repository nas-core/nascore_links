# NasCore Links - 多用户网址导航管理系统

一个基于 Go 和 SQLite 的多用户网址导航管理系统，支持分类管理和权限控制。

## 功能特点

- **多用户支持**: 支持管理员和普通用户，权限分离
- **分类管理**: 支持网址分类，标签页切换
- **权限控制**: 管理员可选择创建公开或私有链接，普通用户只能创建私有链接
- **双区域布局**: 公共区域（大按钮）+ 分类区域（紧凑布局）
- **智能搜索**: 支持本地快速检索和外部搜索引擎（Bing、Google）
- **悬浮提示**: 鼠标悬浮显示网址和描述，或点击信息按钮查看
- **响应式设计**: 适配桌面和移动设备
- **现代化界面**: 基于参考样式的美观界面
- **实时操作**: 支持添加、编辑、删除操作，无需刷新页面

## 技术栈

- **后端**: Go 1.24+, modernc.org/sqlite
- **前端**: 原生 JavaScript, CSS3, HTML5
- **数据库**: SQLite
- **日志**: zap
- **部署**: go:embed 嵌入静态资源

## 快速开始

### 环境要求

- Go 1.24 或更高版本
- 支持 SQLite 的系统

### 安装依赖

```bash
go mod tidy
```

### 运行

```bash
# 以管理员身份运行
USER=admin PORT=8080 go run .

# 以普通用户身份运行
USER=testuser PORT=8080 go run .
```

### 编译

```bash
go build -o nascore-links .
```

### 运行编译后的程序

```bash
# 以管理员身份运行
USER=admin PORT=8080 ./nascore-links

# 以普通用户身份运行
USER=testuser PORT=8080 ./nascore-links
```

## 环境变量

| 变量名 | 说明       | 默认值  | 示例                |
| ------ | ---------- | ------- | ------------------- |
| `USER` | 当前用户名 | `guest` | `admin`, `testuser` |
| `PORT` | 服务端口   | `8080`  | `8080`, `3000`      |

## 用户权限

### 管理员 (admin)

- 可以选择创建公开或私有的分类和链接
- 公开内容对所有用户可见
- 私有内容只有自己可见
- 可以管理自己创建的所有内容
- 可以查看所有公开内容和自己的私有内容

### 普通用户

- 只能创建私有分类和链接
- 只能管理自己创建的内容
- 可以查看管理员创建的公开内容和自己的私有内容

## API 接口

### 分类管理

- `GET /api/categories` - 获取分类列表
- `POST /api/category` - 创建分类
- `PUT /api/category` - 更新分类
- `DELETE /api/category?id={id}` - 删除分类

### 链接管理

- `GET /api/links?category_id={id}` - 获取链接列表
- `POST /api/link` - 创建链接
- `PUT /api/link` - 更新链接
- `DELETE /api/link?id={id}` - 删除链接

### 响应格式

所有 API 返回统一格式：

```json
{
  "code": 0,
  "message": "success",
  "data": {}
}
```

- `code`: 状态码，0 表示成功，非 0 表示失败
- `message`: 状态信息
- `data`: 返回数据

## 快捷键

- `Ctrl/Cmd + K` - 聚焦搜索框
- `Ctrl/Cmd + N` - 添加新链接
- `Ctrl/Cmd + Shift + N` - 添加新分类
- `F5` - 刷新数据
- `ESC` - 关闭模态框或清除搜索

## 数据库结构

### categories 表

```sql
CREATE TABLE categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    user_id TEXT NOT NULL,
    is_public BOOLEAN DEFAULT FALSE,
    sort_num INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### links 表

```sql
CREATE TABLE links (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    url TEXT NOT NULL,
    description TEXT,
    category_id INTEGER,
    user_id TEXT NOT NULL,
    is_public BOOLEAN DEFAULT FALSE,
    sort_num INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(category_id) REFERENCES categories(id)
);
```

## 界面功能

### 页面布局

**公共区域**

- 显示管理员创建的公开链接
- 大按钮样式，便于快速访问
- 渐变背景，视觉突出

**分类区域**

- 按分类组织链接
- 紧凑卡片布局
- 支持标签页切换

### 搜索功能

**搜索框**

- 支持实时搜索（300ms防抖）
- 搜索范围：标题、描述、网址
- 自动显示/隐藏清除按钮

**搜索按钮**

- **快速检索**: 在当前数据中搜索
- **Bing搜索**: 在新窗口中使用Bing搜索
- **Google搜索**: 在新窗口中使用Google搜索

### 交互特性

**鼠标悬浮提示**

- 悬浮在链接卡片上显示完整网址和描述
- 自动避免超出屏幕边界

**信息按钮**

- 点击链接标题旁的 "ℹ" 按钮
- 切换显示/隐藏链接详情

**权限选择**（仅管理员）

- 创建分类时可选择是否公开
- 创建链接时可选择是否公开
- 默认选中公开选项

## 开发

### 项目结构

```
nascore_links/
├── main.go              # 主程序入口
├── static/              # 静态资源
│   ├── css/
│   │   └── style.css    # 主样式表
│   └── js/
│       ├── api.js       # API 接口模块
│       ├── modal.js     # 模态框管理模块
│       └── app.js       # 主应用逻辑
├── templates/
│   └── index.html       # 主页模板
├── go.mod
├── go.sum
└── README.md
```

### 添加新功能

1. 后端 API 添加到 `main.go` 中对应的处理器
2. 前端功能添加到相应的 JS 模块中
3. 样式更新到 `style.css`

## 部署

### 使用 systemd (Linux)

创建服务文件 `/etc/systemd/system/nascore-links.service`:

```ini
[Unit]
Description=NasCore Links Service
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/nascore-links
Environment=USER=admin
Environment=PORT=8080
ExecStart=/opt/nascore-links/nascore-links
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

启动服务：

```bash
sudo systemctl daemon-reload
sudo systemctl enable nascore-links
sudo systemctl start nascore-links
```

### 使用 Docker

创建 `Dockerfile`:

```dockerfile
FROM golang:1.24-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN go build -o nascore-links .

FROM alpine:latest
RUN apk --no-cache add ca-certificates
WORKDIR /root/
COPY --from=builder /app/nascore-links .
EXPOSE 8080
CMD ["./nascore-links"]
```

构建和运行：

```bash
docker build -t nascore-links .
docker run -e USER=admin -e PORT=8080 -p 8080:8080 nascore-links
```

## 故障排除

### 常见问题

1. **端口占用**

   ```bash
   # 查看端口占用
   lsof -i :8080
   # 或者换个端口
   PORT=8081 go run .
   ```

2. **权限问题**

   ```bash
   # 确保数据库文件有写权限
   chmod 644 links.db
   ```

3. **编译错误**
   ```bash
   # 清理模块缓存
   go clean -modcache
   go mod tidy
   ```

## 贡献

欢迎提交 Issue 和 Pull Request！

## 许可证

本项目采用 MIT 许可证。

## 作者

Powered by nascore.eu.org
