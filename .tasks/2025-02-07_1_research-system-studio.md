# Task Context
**File**: 2025-02-07_1
**Created**: 2025-02-07
**Branch**: main
**Mode**: RESEARCH

# Task Description
深入分析系统；启动后端与重构后的 dolphinheartmula-studio 项目；检查是否有 bug。

# Project Overview
- **dolphinheartlib**：根仓库，含 HeartLib 库 (src/heartlib)、FastAPI 后端 (server/)、旧前端 (frontend/)、重构 Studio (dolphinheartmula-studio/)。
- **后端**：FastAPI，路由 /api/projects、/api/tasks、/api/uploads；DB 为 MySQL（.env 配置）或 SQLite；任务队列为进程内线程池。
- **dolphinheartmula-studio**：Vite + React，默认请求 `VITE_API_BASE || http://localhost:10010/api`，端口 3000。

# Analysis

## 系统结构
- 后端入口：`server/main.py`，startup 时 `init_db()`、`queue_start()`。
- 配置：`server/config.py` 读 `.env`；`DB_HOST` 存在则用 MySQL，否则 SQLite。
- 前端 API：`dolphinheartmula-studio/services/api.ts` 与后端 schema 对齐（projects CRUD、tasks generate/get/poll、uploads、getAudioUrl）。

## 启动验证结果
- 后端：已用 `uvicorn server.main:app --host 0.0.0.0 --port 10010` 启动；MySQL 已建库建表；GET /api/projects 返回 200；GET /api/tasks/:id/audio 返回 404（符合无任务预期）。
- 前端：已用 `npm run dev` 启动于 http://localhost:3000；根路径与 /index.css 均返回 200。

## 发现的 Bug / 问题

### 1. index.html 重复加载入口脚本（Bug）
**文件**: `dolphinheartmula-studio/index.html`  
**位置**: body 末尾  
**现象**: 存在两条 script 标签：
- `<script type="module" src="./index.tsx"></script>`
- `<script type="module" src="/index.tsx"></script>`
**影响**: 同一应用可能挂载两次到 `#root`，导致重复渲染、状态或事件异常。

### 2. Audio Lab 返回按钮不可见（UX Bug）
**文件**: `dolphinheartmula-studio/App.tsx`  
**位置**: ViewMode.AUDIO_LAB 时的 Back 按钮  
**现象**: `className` 含 `opacity-0` 且 `absolute`，按钮不可见，仅保留可点击区域。  
**影响**: 用户无法发现返回入口，需去掉 opacity-0 或改为可见样式。

### 3. 后端端口文档不一致（文档/配置）
**现象**: `server/README.md` 写的是 `--port 8000`；DEPLOY.md 与 dolphinheartmula-studio 默认使用 10010。  
**影响**: 若按 README 用 8000 启动后端，前端默认无法连通；需统一为 10010 或在 README 中说明与前端约定端口。

### 4. 依赖环境
**现象**: 使用 MySQL 时需安装 `pymysql`；当前通过 `pip install -r server/requirements.txt` 安装后启动正常。  
**建议**: README 中明确需在项目根或虚拟环境中执行 `pip install -r server/requirements.txt`。

## 未发现问题的部分
- 后端与前端 API 路径一致：/api/projects、/api/tasks、/api/uploads。
- FastAPI 路由顺序：tasks 的 `GET /{task_id}` 只匹配单段；files 的 `GET /{task_id}/audio` 正确匹配两段，无冲突。
- Generate 请求：Studio 发送 lyrics、tags、temperature、topk、cfg_scale、max_audio_length_ms，与 backend GenerateRequest 兼容；version 可选。
- Library 对 projects 的 created_at/createdAt 做了归一化，展示正常。

# Current Step
"EXECUTE COMPLETE"

# Task Progress
- 2025-02-07: 完成系统梳理、后端与 studio 启动、API 与路由检查、bug 与文档问题记录。
- 2025-02-07: EXECUTE — Modified: dolphinheartmula-studio/index.html (removed duplicate script); dolphinheartmula-studio/App.tsx (Back button visible); server/README.md (port 10010). Changes: checklist items 1–3 implemented. Reason: plan approval. Blockers: none. Status: UNCONFIRMED

# Final Review
(待后续 REVIEW 后填写)
