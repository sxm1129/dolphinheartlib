# 页面状态保持 (Page State Preservation)

## 设计目标

- **切换页面不丢状态**：在项目库、Studio、歌词转录、音频实验室之间切换时，各页面的表单与结果保持不丢失。
- **可选刷新保持**：重要页面可配置为在浏览器刷新后仍恢复部分状态（如 Studio 的歌词、标签）。

## 两层机制

### 1. 保持挂载 + 隐藏 (Keep mounted, hide inactive)

- **位置**：`App.tsx` 中四个主视图（Library、Studio、Transcribe、AudioLab）始终挂载，仅通过 CSS `hidden` 控制显隐。
- **效果**：切换页面时组件不卸载，所有 React state 自然保留（歌词、音频 URL、任务 ID、表单等）。
- **适用**：所有页面的所有状态，无需改代码即可生效。

### 2. PageStateContext：内存 + 可选 session 持久化

- **位置**：`contexts/PageStateContext.tsx`
- **能力**：
  - 按视图 ID（ViewMode）存储键值对，切换视图时从内存中读写。
  - 可选 `persist: true`，将对应视图的状态写入 `sessionStorage`，刷新后恢复（仅支持可 JSON 序列化的值）。
- **使用方式**：在页面内用 `usePageStateSlice(viewId, key, initialValue, { persist?: true })` 替代 `useState`，即可将该字段纳入统一存储并在需要时持久化。

```ts
import { usePageStateSlice } from '../contexts/PageStateContext';
import { ViewMode } from '../types';

// 仅内存保持（依赖“保持挂载”即可，无需 persist）
const [foo, setFoo] = usePageStateSlice(ViewMode.STUDIO, 'foo', '');

// 刷新后仍恢复
const [lyrics, setLyrics] = usePageStateSlice(ViewMode.STUDIO, 'lyrics', DEFAULT_LYRICS, { persist: true });
```

- **注意**：`persist: true` 时，值会经 `JSON.stringify` 写入 sessionStorage，不支持 File、函数等非可序列化类型；这类状态仅通过“保持挂载”保留。

## 当前接入

- **Studio**：`lyrics`、`tags` 使用 `usePageStateSlice(ViewMode.STUDIO, ...)` 且 `persist: true`，切换页面与刷新后都会恢复。
- 其他页面可逐步将需要保持（或需要刷新恢复）的字段改为 `usePageStateSlice`。

## 扩展

- 新页面：在 `App.tsx` 中增加一个始终挂载的视图容器（同现有四页），即可自动获得“切换不丢状态”；若需刷新保持，再对关键字段使用 `usePageStateSlice(..., { persist: true })`。
- 若将来改为按需挂载（卸载不可见页以省内存），只需保证在卸载前将状态写入 PageState 存储，挂载时从存储恢复即可，API 已支持。
