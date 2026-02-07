# DolphinHeartMula Studio 部署文档

## 系统要求

| 组件 | 最低要求 |
|------|---------|
| Python | 3.11+ |
| Node.js | 18+ |
| MySQL | 8.0+ |
| 内存 | 8GB (推荐 16GB) |
| 磁盘 | 10GB 可用空间 |

---

## 一、环境准备

### 1.1 创建 Conda 环境

```bash
conda create -n dolphinheartlib_env python=3.11 -y
conda activate dolphinheartlib_env
```

### 1.2 克隆项目

```bash
git clone <项目仓库地址>
cd dolphinheartlib
```

---

## 二、后端部署

### 2.1 安装依赖

```bash
cd server
pip install -r requirements.txt
```

**依赖列表：**
- `fastapi` - Web 框架
- `uvicorn` - ASGI 服务器
- `pymysql` - MySQL 驱动
- `python-dotenv` - 环境变量管理
- `python-multipart` - 文件上传支持

### 2.2 配置环境变量

在项目根目录创建 `.env` 文件：

```env
# 数据库配置
DB_HOST=39.98.37.143
DB_PORT=3306
DB_USER=root
DB_PASSWORD=<你的密码>
DB_NAME=dolphinheartlib

# 模型配置
HEARTLIB_MODEL_PATH=./ckpt
HEARTLIB_OUTPUT_DIR=./output
HEARTLIB_CONCURRENCY=2
HEARTLIB_HEARTMULA_VERSION=3B

# OpenRouter API (歌词生成)
OPENROUTER_API_KEY=<你的 API Key>
```

> [!WARNING]
> 请勿将包含真实密码的 `.env` 文件提交到版本控制。

### 2.3 启动后端服务

```bash
# 开发模式
uvicorn server.main:app --host 0.0.0.0 --port 10010 --reload

# 生产模式
uvicorn server.main:app --host 0.0.0.0 --port 10010 --workers 4
```

**验证启动：**

```bash
curl http://localhost:10010/docs
# 应返回 Swagger UI HTML
```

---

## 三、前端部署

### 3.1 安装依赖

```bash
cd dolphinheartmula-studio
npm install
```

### 3.2 配置 API 地址（可选）

如需修改后端地址，创建 `.env` 文件：

```env
VITE_API_BASE=http://your-backend-server:10010/api
```

### 3.3 开发模式启动

```bash
npm run dev -- --host 0.0.0.0 --port 10011
```

### 3.4 生产构建

```bash
npm run build
```

构建产物位于 `dist/` 目录，可使用 Nginx 等静态服务器托管。

---

## 四、Nginx 配置示例

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # 前端静态文件
    location / {
        root /path/to/dolphinheartmula-studio/dist;
        try_files $uri $uri/ /index.html;
    }

    # 后端 API 代理
    location /api/ {
        proxy_pass http://127.0.0.1:10010/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        client_max_body_size 100M;
    }
}
```

---

## 五、Docker 部署（可选）

### 5.1 后端 Dockerfile

```dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY server/ ./server/
COPY .env .

RUN pip install --no-cache-dir -r server/requirements.txt

EXPOSE 10010
CMD ["uvicorn", "server.main:app", "--host", "0.0.0.0", "--port", "10010"]
```

### 5.2 前端 Dockerfile

```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY dolphinheartmula-studio/ .
RUN npm ci && npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
```

---

## 六、端口说明

| 服务 | 默认端口 | 用途 |
|------|---------|------|
| 后端 API | 10010 | FastAPI 服务 |
| 前端 | 10011 | Vite 开发服务器 |
| MySQL | 3306 | 数据库 |

---

## 七、常见问题

### Q: MySQL 连接失败
检查 `.env` 中的数据库配置，确保 MySQL 服务已启动且允许远程连接。

### Q: 文件上传失败
确保已安装 `python-multipart`：
```bash
pip install python-multipart
```

### Q: 前端无法连接后端
检查 CORS 配置和 `VITE_API_BASE` 环境变量是否正确。

---

## 八、快速启动脚本

创建 `start.sh`：

```bash
#!/bin/bash
source $(conda info --base)/etc/profile.d/conda.sh
conda activate dolphinheartlib_env

# 启动后端
cd /path/to/dolphinheartlib
uvicorn server.main:app --host 0.0.0.0 --port 10010 &

# 启动前端
cd dolphinheartmula-studio
npm run dev -- --port 10011 &

echo "Services started:"
echo "  Backend:  http://localhost:10010"
echo "  Frontend: http://localhost:10011"
```
