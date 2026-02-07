# 项目整体 Review 报告

**日期**: 2025-02-07  
**范围**: dolphinheartlib 仓库（后端 server/、dolphinheartmula-studio、frontend、文档）

---

## 一、未实现 / 待完善功能

### 1. Studio：Checkpoint/版本未参与生成（Bug） — 已修复

**现象**：左侧「Checkpoint」下拉仅影响展示，提交生成时未将所选 checkpoint/version 传给后端。

**修复**：`generateAudio` 的 payload 已增加 `version: checkpoint`，后端使用所选 checkpoint 作为 version。

---

### 2. Studio：刷新后项目标题丢失 — 已修复

**现象**：刷新后 `currentProjectId` 从 localStorage 恢复，但 `currentProject` 为 null，顶部显示「Untitled」。

**修复**：Studio 内增加 `useEffect`：当 `currentProjectId` 存在且 `currentProject === null` 时调用 `getProject(currentProjectId)` 并 `setCurrentProject(project)`。

---

### 3. Library：编辑当前打开项目后 Studio 标题不更新 — 已修复

**现象**：编辑当前打开的项目并保存后，Studio 顶部仍显示旧标题。

**修复**：`handleSaveEdit` 成功后若 `editProject.id === currentProjectId`，则 `setCurrentProject({ ...editProject, title, genre, tags })`。

---

### 4. 文档与清单不一致 — 已修复

**现象**：`docs/studio_feature_checklist.md` 第四节「四、简要对照表」仍将多项标为「待实现」（如打开项目、导出、参考音频、模型列表、Studio 绑定/回写），与当前已实现状态不符。

**建议**：将第四节表格中已实现项改为「已实现」，或删除/合并该节，避免与第三节重复且过时。

---

### 5. Audio Lab 无实际业务逻辑

**现状**：仅保留 UI 与「Coming Soon」说明，Stem 分离、多轨等无后端或前端逻辑。

**建议**：若短期不做，可保留现状；若规划中，需单独排期（后端 API + 前端联调）。

---

## 二、潜在 Bug 与边界情况

### 1. 后端 GET /api/models 可能返回隐藏目录 — 已修复

**现象**：未过滤以 `.` 开头的目录，会出现在前端下拉中。

**修复**：`list_models()` 中仅保留 `not d.name.startswith(".")` 的子目录。

---

### 2. 参考音频与 pipeline 兼容性 — 已文档化

**现象**：worker 中若 pipeline 不支持 `ref_audio_path`，会 `TypeError` 后 fallback 到无 ref 调用；若 pipeline 支持但参数名不同，会直接报错导致任务失败。

**已做**：在 `docs/studio_flows.md` 第六节「参考音频与导出说明」中说明参考音频仅当 pipeline 支持时生效，以及 heartlib 参数名需与后端一致。

---

### 3. 导出音频跨域 — 已文档化

**现象**：Studio 导出通过 `fetch(audioUrl)` 拉取音频；当 `VITE_API_BASE` 为跨域 URL 时，需后端 CORS 允许。当前 CORS 为 `allow_origins=["*"]`，一般可行；若部署后仍失败，需检查实际 Origin 与预检请求。

**已做**：在 `docs/studio_flows.md` 第六节中说明 CORS 现状及若生产环境仍失败可考虑后端下载 URL 或同源代理。

---

### 4. 删除项目后未清空当前项目上下文 — 已修复

**现象**：若用户在 Library 删除的正是当前在 Studio 打开的项目，ProjectContext 中仍保留该项目，Studio 可能仍显示已删项目或后续请求 404。

**修复**：`handleDeleteProject` 成功后若 `id === currentProjectId`，则 `setCurrentProject(null)`。

---

## 三、可优化项

### 1. 错误与加载状态 — 已优化

- **Studio**：生成失败、`updateProject` 失败时展示页面内错误条（可关闭）；Checkpoint 与任务加载增加 loading 态（下拉「加载中…」、标题旁 loading 图标）。
- **Library**：`loadProjects`、`createProject`、`updateProject`、`deleteProject` 失败时展示顶部错误条（可关闭）。

### 2. 加载与防抖 — 已优化

- **Library**：搜索框已做 400ms 防抖，`loadProjects` 仅在防抖后的 `debouncedSearch` 与 `selectedGenre` 变化时请求。
- **Studio**：`getModelList()`、`getTasks(project_id)` 已增加 loading 态（见上）。

### 3. 类型与 API 一致性

- **TaskResponse**：后端已返回 `project_id`，前端 `api.ts` 中 `TaskResponse` 已含 `project_id?`，无问题。
- **frontend（10000）**：旧版 frontend 的 `createGenerate` 未传 `project_id`/`ref_file_id`，若要与 studio 行为一致，可在该前端同样支持可选 `project_id`（当前为任务列表/生成/转录独立页，非必须）。

### 4. 后端

- **模型列表**：可增加缓存（如 60s TTL），避免每次 GET /api/models 都扫盘。
- **迁移**：`_add_project_id_to_tasks` 在 MySQL 下重复执行会报 Duplicate column，已通过异常信息忽略；若希望更稳，可先查询 information_schema 判断列是否存在再 ALTER。

### 5. 前端体验

- **Studio 分享**：当前复制的是「当前页 URL」，若未来支持「分享当前项目/当前作品」链接，需后端提供分享 token 或 hash 路由（如 `/#/studio?project=id`），并据此加载项目。
- **预设**：预设仅存 localStorage，换设备或清缓存会丢失；若需多端同步，可后续增加「预设」相关 API 与同步逻辑。

---

## 四、清单更新建议

建议在 `docs/studio_feature_checklist.md` 中：

1. **第四节「简要对照表」**：将「打开项目/编辑」「任务音频下载」「参考音频参与生成」「模型列表」「Studio 绑定/回写」改为「已实现」；「Audio Lab 实际功能」保持「待实现」或改为「仅 UI，无后端」。
2. **第三节**：已正确描述本轮实现，可保留；若希望与第四节统一，可在第四节注明「以第三节为准」。

---

## 五、总结

| 类别           | 数量 | 说明 |
|----------------|------|------|
| 未实现/待完善  | 5    | Checkpoint 未参与生成、刷新后标题、编辑后标题、文档过时、Audio Lab 无逻辑 |
| 潜在 Bug/边界  | 4    | 模型列表含隐藏目录、ref 与 pipeline 兼容、导出跨域、删除项目后上下文 |
| 可优化         | 若干 | 错误提示、防抖、loading、模型缓存、迁移判断、分享与预设扩展 |

优先建议修复：**Checkpoint/version 参与生成**、**刷新/编辑后项目标题**、**删除项目后清空上下文**、**模型列表过滤隐藏目录**，并更新清单文档第四节。
