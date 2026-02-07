# dolphinheartmula-studio 前端专项 Review

**范围**: `/data1/workspace/dolphinheartlib/dolphinheartmula-studio` 仅此前端项目  
**日期**: 2025-02-07

---

## 一、Bug

### 1. Library.tsx 重复 export default

**位置**: `pages/Library.tsx` 文件末尾。

**现象**: 存在两行 `export default Library;`，虽不导致运行错误，但冗余且可能在某些工具下触发告警。

**建议**: 删除其中一行。

**已修复**: 已删除重复的 `export default Library`。

---

### 2. Studio 歌词生成 API Key 与响应结构

**位置**: `pages/Studio.tsx` 中 `handleGenerateLyrics`，使用 `process.env.API_KEY` 与 `response.text`。

**现象**: 
- `vite.config.ts` 通过 `define` 将 `env.GEMINI_API_KEY` 注入为 `process.env.API_KEY`，在未配置 `.env` 中 `GEMINI_API_KEY` 时为空串，调用 Gemini 会失败且无明确提示。
- 若 `@google/genai` SDK 返回结构不是 `response.text`（例如 `response.candidates?.[0]?.content?.parts?.[0]?.text`），会导致取不到歌词。

**建议**: 
- 在 `handleGenerateLyrics` 的 catch 中 set 一个用户可见错误状态（如 `lyricsError`），并展示「歌词生成失败，请检查 API Key 或网络」。
- 根据当前使用的 `@google/genai` 版本文档确认取文本的正确路径，必要时做可选链与 fallback。

**已修复**: 增加 `lyricsError` 状态；无 API Key 时提示「未配置 API Key」；catch 中设置错误文案并展示在歌词栏下方（可关闭）；取文本时使用 `(response as { text?: string }).text ?? response.candidates?.[0]?.content?.parts?.[0]?.text ?? ''` 并增加多语言键 `lyricsError` / `lyricsErrorNoKey` / `lyricsErrorEmpty`。

---

### 3. Project 与 API 返回的 tags 类型一致性问题

**位置**: `types.ts` 中 `Project.tags: string[]`；后端 `ProjectResponse.tags` 为 `List[str]`，JSON 为数组。

**现象**: 若某处返回或存储了 `tags` 的 JSON 字符串，前端直接 `project.tags?.map` 会按字符迭代。当前后端返回数组，无问题；仅需在「从列表/详情归一化」时保证数组（如 `Array.isArray(p.tags) ? p.tags : []`）。

**建议**: 在 `fetchProjects` 的 normalize 中统一：`tags: Array.isArray(p.tags) ? p.tags : (typeof p.tags === 'string' ? (try JSON.parse) : [])`，避免日后接口变化导致展示异常。

**已修复**: Library 的 `loadProjects` 中对列表项做归一化：`tags: Array.isArray(p.tags) ? p.tags : (typeof p.tags === 'string' ? (() => { try { return JSON.parse(p.tags); } catch { return []; } })() : [])`。

---

## 二、待优化项

### 1. api.ts 未使用的类型导入

**位置**: `services/api.ts` 首行 `import { Project, GenConfig } from '../types'`。

**现象**: `GenConfig` 未在文件中使用。

**建议**: 移除 `GenConfig`，仅保留 `import { Project } from '../types'`（若 Project 有使用）；若 Project 也未使用可一并移除。

**已优化**: 已移除未使用的 `GenConfig` 导入。

---

### 2. Library 列表加载中状态

**位置**: `pages/Library.tsx`，`loading` 为 true 时仅列表区域可能先空再出数据。

**现象**: 未在 loading 时展示明确「加载中」提示或骨架，用户可能误以为无数据。

**建议**: 当 `loading` 为 true 时展示简短文案（如「加载中…」）或骨架占位，再在 `!loading` 时展示列表与「新建」卡片。

**现状**: 已实现：`loading` 时展示 `Loader2` + `t('lib.loading')`（「正在加载项目…」/「Loading projects...」）。

---

### 3. Library 新建/编辑弹窗文案未走多语言

**位置**: `pages/Library.tsx` 中「新建项目」「编辑项目」「项目名称」「音乐类型」「标签（逗号分隔）」「取消」「创建」「保存」等为中文硬编码。

**现象**: 与侧边栏、Studio 等使用 `t('...')` 的多语言不一致，切换英文后弹窗仍为中文。

**建议**: 在 `LanguageContext` 的 `lib` 下增加对应 key（如 `newProject`, `editProject`, `projectName`, `genre`, `tagsComma`, `cancel`, `create`, `save`），弹窗内改用 `t('lib.xxx')`。

**已优化**: 已增加 `lib.newProject`、`editProject`、`projectName`、`genre`、`tagsComma`、`cancel`、`create`、`save`、`projectNamePlaceholder`、`tagsPlaceholder`、`edit`、`openInStudio`、`delete`、`comingSoon`（中英文）；新建/编辑弹窗与卡片更多菜单均改用 `t('lib.xxx')`。

---

### 4. Sidebar「收藏」入口无行为

**位置**: `components/Sidebar.tsx`，Favorites 项使用 `navItemClass(false)` 且无 `onClick`。

**现象**: 点击无任何切换或跳转，易让用户认为功能存在。

**建议**: 若无规划，可改为禁用样式或加 tooltip「即将推出」；若规划为独立视图，可增加 `onClick` 切换至占位视图或路由。

**已优化**: 收藏项增加 `opacity-60 cursor-not-allowed`、`title={t('lib.comingSoon')}` 及右侧文案「(即将推出)」，明确为未开放功能。

---

### 5. Studio 预设缺少 topP 字段时的安全取值

**位置**: `pages/Studio.tsx`，`handlePresetChange` 中从 `preset` 读 `topP` 等；自定义预设的 `GenPreset` 含 `topP`。

**现象**: 若 localStorage 中旧数据缺少 `topP`，则 `setTopP(preset.topP)` 可能为 `undefined`，影响后续生成参数。

**建议**: 使用安全默认值，例如 `setTopP(preset.topP ?? 0.9)`，其它字段同理。

**已优化**: `handlePresetChange` 中 `checkpoint`、`temperature`、`topP`、`seamless` 均使用 `??` 默认值，避免 localStorage 旧数据缺字段。

---

### 6. AudioLab 仅 UI、无实际请求

**位置**: `pages/AudioLab.tsx`。

**现象**: 与 checklist 一致，仅布局与「Coming Soon」说明，无后端调用或状态持久化。

**建议**: 保持现状，在文档/清单中注明「仅 UI」；若排期再做 Stem 等需单独设计与联调。

---

### 7. 错误信息中未包含 HTTP 状态码（部分接口）

**位置**: `services/api.ts` 中 `createProject`、`updateProject`、`deleteProject` 等，失败时仅 `response.statusText`。

**现象**: 与已修复的 `getProject`（含 status）不一致；排查 403/404/500 时不如带 status 直观。

**建议**: 与 `getProject` 一致，抛出 `Failed to xxx: ${response.status} ${response.statusText}`，便于 404 等分支处理。

**已优化**: `createProject`、`updateProject`、`deleteProject`、`fetchProjects` 失败时错误信息均已包含 `response.status`。

---

## 三、小结

| 类型   | 数量 | 说明 |
|--------|------|------|
| Bug    | 3    | 重复 export；歌词生成 API Key/响应与错误提示；tags 归一化加固 |
| 待优化 | 7    | 未使用导入；Library loading/多语言；Sidebar 收藏；预设默认值；AudioLab 说明；API 错误信息 |

**建议优先**: 修掉重复 export（1）；为歌词生成增加用户可见错误提示并确认 Gemini 响应结构（2）；Library 列表 normalize 时对 `tags` 做数组保护（3）。其余按迭代节奏处理。
