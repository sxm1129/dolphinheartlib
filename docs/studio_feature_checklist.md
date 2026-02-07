# DolphinHeartMula Studio (3000) 功能清单

**前端**: http://39.102.122.9:3000/ (dolphinheartmula-studio)  
**后端**: http://39.102.122.9:10010/ (FastAPI，需 10010 支撑)

---

## 一、整体依赖关系

| 端 | 说明 |
|----|------|
| **3000** | Vite + React，`VITE_API_BASE` 默认 `http://localhost:10010/api`，生产/外网需配置为 `http://39.102.122.9:10010/api` 或同机房内网地址。 |
| **10010** | FastAPI：项目 CRUD、任务生成/转录、上传/删除参考音频、任务音频下载。Worker 需 conda `heartlib_env`（torch + heartlib）才能执行生成/转录。 |

---

## 二、已实现（前端 + 后端打通）

### 2.1 后端 API（10010）

| 能力 | 路由 | 说明 |
|------|------|------|
| 项目列表 | GET /api/projects | 分页、search、genre、status |
| 项目详情 | GET /api/projects/:id | 单项目 |
| 创建项目 | POST /api/projects | title, genre, tags, status, color |
| 更新项目 | PATCH /api/projects/:id | title, genre, tags, duration, status, color |
| 删除项目 | DELETE /api/projects/:id | |
| 创建生成任务 | POST /api/tasks/generate | lyrics, tags, max_audio_length_ms, topk, temperature, cfg_scale, version |
| 创建转录任务 | POST /api/tasks/transcribe | 上传音频 + 参数 |
| 任务列表 | GET /api/tasks | 分页、status、type |
| 任务详情 | GET /api/tasks/:id | |
| 任务音频 | GET /api/tasks/:id/audio | 返回音频文件 |
| 上传参考音频 | POST /api/uploads/audio | 返回 file_id 等 |
| 删除上传文件 | DELETE /api/uploads/:id | |

### 2.2 前端 Studio（3000）

| 模块 | 已实现 |
|------|--------|
| **Library** | 项目列表（调 fetchProjects）、搜索与类型筛选、新建项目（createProject）、删除项目（deleteProject）、卡片展示 title/genre/tags/status/duration/created_at |
| **Studio** | 歌词编辑、AI 歌词生成（Google GenAI，不依赖 10010）、**提交生成任务**（generateAudio → 轮询 pollTaskStatus）、**播放生成结果**（getAudioUrl + audio 元素）、参考音频上传（uploadReferenceAudio）与删除（deleteUploadedFile）、温度/TopP/Checkpoint 等参数、预设仅前端内存 |
| **Audio Lab** | 仅布局 + “Coming Soon” 遮罩，Back 返回 Library |
| **通用** | 侧边栏切换 Library / Studio / Audio Lab、多语言（LanguageContext） |

---

## 三、已实现（本轮完成）

### 3.1 前端（dolphinheartmula-studio）

| # | 任务 | 实现说明 |
|---|------|----------|
| 1 | Library → 打开项目进 Studio | ProjectContext + 卡片/Play/更多菜单「在 Studio 中打开」→ setCurrentProject + setCurrentView(STUDIO) |
| 2 | Studio 绑定当前项目 | 顶部显示 currentProject?.title；未选时显示「Untitled」；打开项目时拉取该 project 下最新已完成任务并播放 |
| 3 | 生成完成后回写项目 | 生成成功后 updateProject(currentProjectId, { duration, status: 'Generated' }) |
| 4 | Library 卡片 Play | 卡片头部与 Play 按钮点击 → openInStudio(project)；Studio 内按 project_id 拉取最新 completed 任务并 setAudioUrl |
| 5 | Library 卡片更多菜单 | 更多(⋮) 下拉：编辑、在 Studio 中打开、删除；编辑弹窗：title/genre/tags + updateProject |
| 6 | Studio 导出/下载 | 导出按钮：fetch(audioUrl) → blob → a.download |
| 7 | Studio 分享 | 分享按钮：navigator.clipboard.writeText(window.location.href) |
| 8 | 参考音频参与生成 | generateAudio 传 ref_file_id；后端 GenerateRequest.ref_file_id、worker 解析 UPLOAD_DIR 并传 ref_audio_path（若 pipeline 支持） |
| 9 | 模型列表从后端拉取 | getModelList() → GET /api/models，失败时回退默认列表 |
| 10 | 预设持久化 | 预设读写 localStorage（PRESETS_STORAGE_KEY），跨会话保留 |
| 11 | Audio Lab | 去掉全屏 Coming Soon 遮罩，保留说明文案，左侧轨道 UI 可见 |

### 3.2 后端（10010）

| # | 任务 | 实现说明 |
|---|------|----------|
| 12 | 模型列表 API | GET /api/models：读 MODEL_PATH 子目录或返回默认列表 |
| 13 | 生成接口支持参考音频 | GenerateRequest 增加 project_id、ref_file_id；tasks 表增加 project_id；list_tasks 支持 project_id 筛选；worker 根据 ref_file_id 解析路径并传 ref_audio_path（pipeline 不支持则忽略） |

### 3.3 配置与部署

| # | 任务 | 说明 |
|---|------|------|
| 14 | 外网/生产 API 地址 | 构建时设置 VITE_API_BASE；见 DEPLOY.md |
| 15 | 防火墙/安全组 | 运维配置 10010、3000 |

---

## 四、简要对照表

| 功能 | 前端 3000 | 后端 10010 | 状态 |
|------|------------|------------|------|
| 项目列表/搜索/筛选 | ✅ | ✅ | 已实现 |
| 新建/删除项目 | ✅ | ✅ | 已实现 |
| 打开项目 / 编辑项目 | ✅ | ✅ | 已实现（Library 更多菜单 + 编辑弹窗） |
| 生成任务 + 轮询 + 播放 | ✅ | ✅ | 已实现 |
| 任务音频下载/导出 | ✅ | ✅ | 已实现（Studio 导出按钮） |
| 参考音频上传/删除 | ✅ | ✅ | 已实现 |
| 参考音频参与生成 | ✅ | ✅ | 已实现（ref_file_id；version 由 Checkpoint 传入） |
| 模型列表 | ✅ | ✅ | 已实现（GET /api/models，过滤隐藏目录） |
| Studio 绑定项目 / 回写 | ✅ | ✅ | 已实现（含刷新后拉取项目标题、编辑/删除后同步上下文） |
| Audio Lab 实际功能 | 仅 UI | - | 待实现（Stem 等无后端） |

---

**相关文档**  
- 清单：`docs/studio_feature_checklist.md`  
- Review：`docs/review_report.md`  
- 流程与单测：`docs/studio_flows.md`（含后端 `server/tests/test_models.py` 说明）
