# 项目整体 Review：未完成功能分析

**日期**: 2025-02-07  
**范围**: dolphinheartlib 仓库（server、dolphinheartmula-studio、frontend、文档）

---

## 一、项目结构概览

| 模块 | 说明 | 状态 |
|------|------|------|
| **server** | FastAPI：项目/任务/上传/模型 API，Worker 调用 heartlib 生成与转录 | 核心已实现，单测覆盖 models + tasks |
| **dolphinheartmula-studio** | Vite+React，Library / Studio / Audio Lab 三栏，项目绑定、生成、导出、参考音频 | 见下节缺口 |
| **frontend** | 旧版：任务列表、提交生成、提交转录、任务详情（无 project 概念） | 独立可用，与 Studio 行为未完全对齐 |
| **docs** | studio_feature_checklist、review_report、studio_flows、generation_control_analysis | 已更新 |

---

## 二、未完成 / 缺失功能

### 1. Studio：缺少「生成音频」入口（重要） — 已实现

**现象**：`handleGenerateAudio` 已实现（调用 generateAudio、轮询、播放、回写项目），但 **界面上没有任何按钮或操作会调用它**。

**已做**：在 Studio 左侧配置区（参考音频区域下方、VRAM 条上方）增加「生成音频」/「Generate Music」主按钮，`onClick` 绑定 `handleGenerateAudio`；生成中显示 loading 并禁用，无歌词时禁用并显示「请在上方填写歌词后启用」提示。多语言键：`studio.generateMusic`、`studio.generateMusicHint`。

---

### 2. Audio Lab：无实际业务逻辑

**现状**：仅保留布局与简短说明，Stem 分离、多轨编辑、导出混音等无后端或前端逻辑。  
**建议**：若短期不排期，保持「仅 UI」并在清单中注明；若规划中，需单独排期（后端 API + 前端联调）。

---

### 3. frontend（10000）与 Studio 行为差异（可选） — 已实现

**现状**：旧版 frontend 的 `createGenerate` 未传 `project_id`、`ref_file_id`，任务列表/生成/转录为独立页，无「项目」概念。  
**已做**：`frontend/src/api.ts` 中 `GeneratePayload` 增加可选 `project_id`、`ref_file_id`；`createGenerate` 在请求体中按需携带二者（非空时）。当前提交页无项目/参考音频选择 UI，但 API 已支持，便于后续与 Studio 行为一致或扩展。

---

### 4. 分享与预设的扩展（可选 / 未来）

- **分享**：当前复制的是「当前页 URL」。若需「分享当前项目/作品」直达链接，需后端分享 token 或 hash 路由（如 `/#/studio?project=id`）并据此加载项目。
- **预设**：预设仅存 localStorage，换设备或清缓存会丢失；若需多端同步，可后续增加预设 API 与同步逻辑。

---

## 三、已完成与已修复项（对照 review_report / checklist）

- Checkpoint/version 参与生成、刷新后项目标题、编辑后标题同步、删除项目后清空上下文、模型列表过滤隐藏目录、文档与清单一致。
- 错误与加载：Studio/Library 错误条、防抖、Checkpoint/任务 loading。
- 参考音频与导出：文档化（ref_audio 仅 pipeline 支持时生效；导出 CORS 说明）。
- 后端：models 60s 缓存、迁移前判断 project_id 列是否存在。

---

## 四、结论汇总

| 类别 | 项 | 优先级 | 状态 |
|------|----|--------|------|
| **未完成** | Studio 缺少「生成音频」按钮（handleGenerateAudio 未接 UI） | **高** | **已实现** |
| **未完成** | Audio Lab 仅 UI，无 Stem/多轨等后端与逻辑 | 中（视产品规划） | 保持现状 |
| **可选** | frontend 支持 project_id/ref_file_id | 低 | **已实现** |
| **可选** | 分享当前项目链接、预设多端同步 | 低 | 未做 |

当前 Studio 已支持从左侧「生成音频」按钮触发 `handleGenerateAudio`；frontend 生成接口已支持可选 `project_id`、`ref_file_id`。
