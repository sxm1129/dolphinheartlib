# 项目 Review：Bug 与待优化项

**日期**: 2025-02-07  
**范围**: server、dolphinheartmula-studio、frontend、文档

---

## 一、潜在 Bug

### 1. Studio：切换项目时 getTasks 竞态

**位置**: `dolphinheartmula-studio/pages/Studio.tsx`，`useEffect` 依赖 `[currentProjectId]` 拉取该项目的最近完成任务。

**现象**: 用户快速切换项目时，先发起的 `getTasks(project_id: A)` 可能晚于 `getTasks(project_id: B)` 返回。若 A 的响应后到达，会执行 `setAudioTaskId` / `setAudioUrl` / `setDuration` 等，此时 `currentProjectId` 已是 B，导致当前展示的是项目 B，但音频/时长却是项目 A 的。

**建议**: 在 `getTasks(...).then((res) => { ... })` 内先判断「当前是否仍为该 project」再更新 state，例如在 then 中比对 `currentProjectId === 请求时传入的 projectId`（可用 ref 保存「本次请求的 projectId」），不一致则直接 return，不 setState。

**已修复**: 使用 `currentProjectIdRef` 与请求时快照 `requestedId`，在 then/finally 中仅当 `currentProjectIdRef.current === requestedId` 时更新 state。

---

### 2. Studio：轮询过程中组件卸载导致 setState

**位置**: `handleGenerateAudio` 内调用 `pollTaskStatus`，轮询期间会多次 `setAudioTaskStatus` 等。

**现象**: 若用户在生成过程中离开 Studio 页（或组件卸载），轮询仍在进行，回调中继续 setState，可能触发「在已卸载组件上更新 state」的警告或内存泄漏。

**建议**: 使用 ref 标记 mounted（如 `isMountedRef.current`），在 `pollTaskStatus` 的回调中仅当 `isMountedRef.current` 为 true 时 setState；或在 `useEffect` 清理函数中设 `cancelled = true`，轮询回调里先判断再更新。若后续引入可取消的请求，也可用 AbortController 取消轮询。

**已修复**: 使用 `isMountedRef`，在 useEffect 清理中设为 false；在 poll 回调及 handleGenerateAudio 的 await 后均先判断 `isMountedRef.current` 再 setState / setIsGeneratingAudio(false)。

---

### 3. API_BASE 末尾斜杠导致 URL 双斜杠

**位置**: `dolphinheartmula-studio/services/api.ts`，`const API_BASE = import.meta.env.VITE_API_BASE || '...'`，后续拼接 `${API_BASE}/tasks/...`。

**现象**: 若环境变量配置为 `http://host:10010/api/`（末尾带 `/`），拼接后得到 `http://host:10010/api//tasks/...`，部分环境或代理可能异常。

**建议**: 在取用 API_BASE 时统一去掉末尾斜杠，例如 `API_BASE.replace(/\/+$/, '')`，再参与拼接。

**已修复**: `dolphinheartmula-studio/services/api.ts` 中 `API_BASE` 定义为 `(import.meta.env.VITE_API_BASE || '...').replace(/\/+$/, '')`。

---

### 4. 列表 API 未传 page 时与 page=0 的语义

**位置**: `dolphinheartmula-studio/services/api.ts` 中 `fetchProjects`、`getTasks` 等，`if (params?.page) searchParams.set('page', ...)`。

**现象**: 当显式传 `page: 0` 时不会设置 query，后端会使用默认值（通常为 1）。若未来前端出现 0-based 分页，会与预期不符。

**建议**: 当前列表未暴露「第 0 页」场景，可维持现状；若后续做分页 UI，建议用 `params.page != null` 或区分「未传」与「传 0」再决定是否 set。

**已修复**: `fetchProjects` 与 `getTasks` 中改为 `params?.page != null`、`params?.page_size != null` 再 set，以支持显式传 0。

---

## 二、待优化项

### 1. Studio：新生成时使用的 duration 来源

**位置**: `handleGenerateAudio` 中 `max_audio_length_ms: duration * 1000`，`duration` 来自 state。

**现象**: `duration` 会在「加载该项目最近一次完成任务」时被设为该任务的 `max_audio_length_ms`（例如 30s）。若用户未改 duration 就点「生成音频」，新任务会按 30s 请求，可能短于预期。

**建议**: 新生成时使用固定默认时长（如 240_000 ms）或单独「生成时长」输入；或在加载历史任务时仅用其 duration 做播放/展示，新生成时另用一默认值（如 180s）写入 `max_audio_length_ms`。视产品需求二选一或并存。

**已优化**: 使用常量 `DEFAULT_GENERATION_MS = 240_000`，`handleGenerateAudio` 中 `max_audio_length_ms` 固定为该值；完成后更新项目时长与本地 duration 也按该值换算。

---

### 2. Studio：项目已删除（404）时的提示与上下文

**位置**: `useEffect` 中当 `currentProjectId` 存在且 `currentProject === null` 时调用 `getProject(currentProjectId)`。

**现象**: 若项目已被删除，`getProject` 返回 404，当前仅不执行 `setCurrentProject`，标题仍为「未命名」，用户不知道是「未选项目」还是「项目不存在」。

**建议**: 在 catch 中区分 404，设置轻量提示（如「项目不存在或已删除」）并可选地清空 `currentProjectId` 与 localStorage 中的项目 id，避免后续请求继续带已删项目 id。

**已优化**: getProject 失败且 message 含 `404` 或 `Not Found` 时调用 `setCurrentProject(null)` 并设置 `projectNotFound` 状态；顶部展示「项目不存在或已删除」条（可关闭）。`getProject` 错误信息中增加 `response.status` 以便可靠识别 404。

---

### 3. frontend getTasks 未支持 project_id

**位置**: `frontend/src/api.ts` 的 `getTasks`（若存在）或任务列表请求。

**现象**: 后端 `GET /api/tasks` 已支持 `project_id` 筛选，旧版 frontend 的 `getTasks` 未传该参数，无法按项目过滤任务。

**建议**: 若希望旧版 frontend 与 Studio 行为一致（按项目看任务），在 `getTasks` 参数与 query 中增加可选 `project_id`；否则可保持现状。

**已优化**: `frontend/src/api.ts` 的 `getTasks` 增加可选参数 `projectId?: string`，有值时写入 query `project_id`。

---

### 4. Library loadProjects 与 useEffect 依赖

**位置**: `dolphinheartmula-studio/pages/Library.tsx`，`useEffect(() => { loadProjects(); }, [debouncedSearch, selectedGenre])`。

**现象**: `loadProjects` 未加入依赖数组，exhaustive-deps 可能告警；若加入且未用 useCallback，会因每次渲染新函数导致重复执行。

**建议**: 使用 `useCallback(loadProjects, [debouncedSearch, selectedGenre])` 包装 `loadProjects`，再将此回调加入 useEffect 依赖，既满足 lint 又避免多余请求。或保持现状并加 eslint-disable 注释说明「仅希望在 debouncedSearch/selectedGenre 变化时请求」。

**已优化**: `loadProjects` 改为 `useCallback(..., [debouncedSearch, selectedGenre])`，`useEffect` 依赖 `[loadProjects]`。

---

### 5. Worker version 为空字符串

**位置**: `server/workers.py`，`params.get("version", HEARTMULA_VERSION)` 传入 pipeline。

**现象**: 若前端或接口误传 `version: ""`，会覆盖默认值，`from_pretrained(..., version="")` 可能不符合 heartlib 预期。

**建议**: 在 worker 或路由层将空字符串视为未传，例如 `version = params.get("version") or HEARTMULA_VERSION`，仅当有非空 version 时使用传入值。

**已优化**: `server/workers.py` 中 `version = params.get("version") or HEARTMULA_VERSION` 后再传入 `from_pretrained`。

---

### 6. Studio 参数 topk 与 topP 的映射

**位置**: `handleGenerateAudio` 中 `topk: Math.round(topP * 100)`，后端/ heartlib 的 topk 默认约 50。

**现象**: 前端 `topP` 为 0.9 时发送 `topk: 90`，需确认 heartlib 的 topk 语义（是否为 1–100 或其它范围），避免与默认 50 不一致导致效果异常。

**建议**: 查阅 heartlib 文档或源码确认 topk 含义与取值范围；若应为 0–1，则不要乘 100；若为整数则保持现状并可在 UI 或文档中说明。

**已优化**: `handleGenerateAudio` 中 `topk = Math.min(100, Math.max(1, Math.round(topP * 100)))`，并加注释说明 UI topP 0–1 映射为 1–100 整数，避免传 0 或超范围。

---

## 三、小结

| 类型     | 数量 | 建议优先级 |
|----------|------|------------|
| 潜在 Bug | 4    | 1、2 建议修复；3 建议修复；4 可观察 |
| 待优化   | 6    | 1、2 可优先；其余按需 |

**优先建议**: 修复 **getTasks 竞态**（1）、**轮询卸载 setState**（2）、**API_BASE 末尾斜杠**（3）；再视需求做 **duration 默认值/新生成逻辑**（优化 1）、**404 项目提示与清空**（优化 2）。其余项可在迭代中按需处理。
