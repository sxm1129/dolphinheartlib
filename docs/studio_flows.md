# DolphinHeartMula Studio 关键流程说明

本文档说明与「Checkpoint/version 参与生成」「刷新/编辑后项目标题」「删除项目后清空上下文」「模型列表过滤隐藏目录」相关的数据流与实现要点，便于联调与回归。

---

## 一、Checkpoint/Version 参与生成

### 流程

1. 用户在 Studio 左侧选择 **Checkpoint**（下拉数据来自 `GET /api/models` 或前端默认列表）。
2. 点击 **GENERATE** 时，前端将当前选中的 `checkpoint` 作为 `version` 传入 `generateAudio` payload。
3. 后端 `POST /api/tasks/generate` 接收 `GenerateRequest.version`，写入任务 params，worker 执行时使用该 version 加载/生成。

### 关键代码

- **前端**：`dolphinheartmula-studio/pages/Studio.tsx`  
  - `generateAudio({ ..., version: checkpoint, project_id, ref_file_id })`
- **后端**：`server/routes/tasks.py`  
  - `params["version"] = body.version`（默认 `"3B"`）；`server/workers.py` 中 `params.get("version", HEARTMULA_VERSION)` 传给 pipeline。

### 验证要点

- 切换 Checkpoint 后生成，任务 params 中应包含所选 `version`。
- 后端 worker 实际使用的 version 与请求一致（若 pipeline 仅支持部分值，可能报错，属预期需在文档或 UI 说明）。

---

## 二、刷新后项目标题恢复

### 流程

1. 用户从 Library 打开项目进入 Studio，`setCurrentProject(project)` 与 `setCurrentProjectId(project.id)` 被调用，并将 `project.id` 写入 localStorage（key: `dolphinheart_studio_current_project_id`）。
2. 用户在 Studio 页面 **刷新**：仅 `currentProjectId` 从 localStorage 恢复，`currentProject` 初始为 null。
3. Studio 内 `useEffect` 检测到 `currentProjectId` 存在且 `currentProject === null`，调用 `getProject(currentProjectId)`，成功后 `setCurrentProject(project)`，顶部标题恢复为项目名。

### 关键代码

- **前端**：`dolphinheartmula-studio/pages/Studio.tsx`  
  - `useEffect` 依赖 `[currentProjectId, currentProject]`：当 `currentProjectId && !currentProject` 时执行 `getProject(currentProjectId).then(setCurrentProject)`。
- **上下文**：`contexts/ProjectContext.tsx`  
  - 初始化时从 localStorage 读取 `currentProjectId`；不持久化完整 `currentProject`。

### 验证要点

- 从 Library 打开某项目 → 刷新 → 顶部应显示该项目标题而非「Untitled」。
- 若项目已被删除（404），`getProject` 失败，标题可保持 Untitled 或后续可加错误提示。

---

## 三、编辑/删除当前项目后 Studio 标题与上下文同步

### 流程（编辑）

1. 用户在 Library 对项目 A 点击「更多 → 编辑」，修改标题/类型/标签后保存。
2. 若项目 A 正是当前在 Studio 打开的项目（`editProject.id === currentProjectId`），保存成功后调用 `setCurrentProject({ ...editProject, title, genre, tags })`，Studio 顶部标题立即更新为新标题。

### 流程（删除）

1. 用户在 Library 对项目 B 点击「更多 → 删除」并确认。
2. 若项目 B 正是当前在 Studio 打开的项目（`id === currentProjectId`），删除成功后调用 `setCurrentProject(null)`，清空当前项目上下文，避免 Studio 仍持有已删项目导致后续请求 404 或展示异常。

### 关键代码

- **前端**：`dolphinheartmula-studio/pages/Library.tsx`  
  - `handleSaveEdit`：`updateProject` 成功后若 `editProject.id === currentProjectId`，则 `setCurrentProject({ ...editProject, title: editTitle, genre: editGenre, tags, createdAt: ... })`。  
  - `handleDeleteProject`：`deleteProject(id)` 成功后若 `id === currentProjectId`，则 `setCurrentProject(null)`。  
  - Library 通过 `useProject()` 获取 `currentProjectId` 与 `setCurrentProject`。

### 验证要点

- 在 Library 编辑当前打开项目的标题并保存，切回 Studio 后标题应为新标题。
- 在 Library 删除当前打开的项目后，Studio 应视为「未选项目」（标题可为 Untitled），再次生成等操作不依赖已删项目。

---

## 四、模型列表过滤隐藏目录

### 流程

1. 前端请求 `GET /api/models`，用于 Studio 的 Checkpoint 下拉。
2. 后端读取 `MODEL_PATH` 下子目录，仅保留 **非隐藏** 目录（名称不以 `.` 开头），排序后返回；若无有效子目录则返回默认列表。

### 关键代码

- **后端**：`server/routes/models.py`  
  - `list_models()`：`[d.name for d in path.iterdir() if d.is_dir() and not d.name.startswith(".")]`，再 `sorted(names)`；否则返回 `DEFAULT_MODELS`。

### 验证要点

- `MODEL_PATH` 下存在以 `.` 开头的目录（如 `._____temp`）时，响应中不应包含该名称。
- 无有效子目录或路径非目录时，应返回默认模型名称列表。

---

## 五、单测与回归

### 后端单测

- **位置**：`server/tests/test_models.py`、`server/tests/test_tasks.py`（依赖 `server/tests/conftest.py` 临时 DB 与 no-op 队列）
- **test_models 覆盖**：`GET /api/models`  
  - 过滤以 `.` 开头的子目录；  
  - 路径不存在/非目录/空目录时返回默认列表；  
  - 仅存在隐藏子目录时返回默认列表。
- **test_tasks 覆盖**：  
  - `POST /api/tasks/generate` 接受并持久化 `project_id`、`version`、`ref_file_id`，响应 201 与 `task_id`；  
  - `GET /api/tasks/{task_id}` 返回的 `project_id`、`params.version`、`params.ref_file_id` 与请求一致；  
  - `GET /api/tasks?project_id=X` 仅返回该项目的任务。
- **运行**：从仓库根目录执行  
  `pip install -r server/requirements-dev.txt` 后运行  
  `python -m pytest server/tests -v`  
  详见 `server/README.md` 的 Tests 小节。

### 前端回归与界面检查清单

以下建议在发版或大改动后做一次手工回归；可按模块勾选。

**Library**

- 列表加载：进入项目库，列表正常展示；无项目时为空状态。
- 搜索防抖：在搜索框连续输入，仅停止输入约 400ms 后再发请求（可通过网络面板确认请求节奏）。
- 错误提示：断网或接口报错时，页面顶部出现红色错误条，可点击关闭；创建/编辑/删除失败时同样展示错误条并可关闭。
- 打开项目：点击卡片或「在 Studio 中打开」进入 Studio，顶部显示该项目标题。
- 编辑当前项目：对当前在 Studio 打开的项目在 Library 中编辑标题并保存，切回 Studio 后标题立即更新为新标题。
- 删除当前项目：删除的正是 Studio 当前打开的项目时，Studio 视为未选项目（标题为「未命名」等），不再持有已删项目。

**Studio**

- 刷新后标题：从 Library 打开某项目后，在 Studio 页刷新，顶部应恢复显示该项目标题（或加载中后显示），而非一直「未命名」。
- Checkpoint 加载：进入 Studio 后，左侧 Checkpoint 下拉在请求模型列表时显示「加载中…」，加载完成后显示模型名或默认列表。
- 任务/作品加载：有当前项目时，加载该项目的最近完成任务时标题旁可短暂显示 loading 图标，加载完成后展示波形/播放等。
- 生成失败错误：触发一次会失败的生成（如错误参数或后端异常），页面顶部出现红色错误条，展示失败原因，可关闭。
- 更新项目失败：生成成功后若更新项目信息失败（如接口错误），顶部出现「更新项目失败」类错误条，可关闭。
- 参考音频：上传参考音频后发起生成，请求中应带 `ref_file_id`；后端 worker 若支持则使用，否则 fallback 无 ref。
- 导出：有生成结果时点击导出，应下载音频；若跨域失败，需按第六节检查 CORS 或改用后端下载 URL。

**通用**

- 切换 Checkpoint 后生成，后端任务 params 或日志中 `version` 为所选 Checkpoint。
- 分享：点击分享复制当前页 URL 到剪贴板，提示「链接已复制」。

文档与单测随代码变更更新；若 API 或前端状态结构有改动，请同步修改本文档与对应用例。

---

## 六、参考音频与导出说明

### 参考音频（ref_audio）

- 参考音频仅当 **pipeline 支持** 时生效。Worker 中若 pipeline 不接受 `ref_audio_path`（或参数名不同，如 `reference_audio`），会 fallback 到无 ref 调用；若需稳定使用，请根据 heartlib 实际 API 确认参数名并在文档或 UI 中说明。
- 前端通过 `ref_file_id` 将上传文件 ID 传给生成接口，后端在 worker 内解析为本地路径并传入 pipeline。

### 导出与跨域

- Studio 导出通过 `fetch(audioUrl)` 拉取音频；当 `VITE_API_BASE` 为跨域 URL 时，需后端 CORS 允许。当前后端 CORS 为 `allow_origins=["*"]`，一般可行。
- 若生产环境仍出现跨域导出失败，可考虑：由后端提供「下载用临时 URL」或通过当前页同源代理转发。
