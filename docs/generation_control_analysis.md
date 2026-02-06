# HeartMuLa 生成可控性分析（对照 Suno 与官网 Demo）

## 官网 Demo 说明 [heartmula.github.io](https://heartmula.github.io/)

- 页面上**仅有两类输入**：**Tag (Input)** 与 **Lyrics (Input)**，与当前开源 pipeline（tags + lyrics）一致。
- Abstract 中提到的「reference audio」「fine-grained musical attribute control（分段落自然语言风格）」在 Demo 表格中**没有**对应输入列，属规划/内部能力。
- 「可调参数多」体现在 **Tag 的丰富组合**：情绪、流派、乐器、场景等均写在同一行 Tag 中（逗号分隔），例如 `R&B, Keyboard, Regret, drum machine, electric guitar, synthesizer, soft`。官网示例已用于前端「常用标签」分组。

## 一、当前 HeartMuLa 的 conditioning 机制（代码事实）

模型**仅接受两类文本条件**，全部在 `music_generation.py` 的 `preprocess` 中：

1. **tags**：一段字符串，逗号分隔、无空格，会被包成 `<tag>...</tag>` 并转小写，再经 **tokenizer** 转成 token 序列，作为条件喂给模型。
2. **lyrics**：歌词正文，同样转小写后 tokenize，与 tags 拼成完整 prompt。

此外代码里预留了 **ref_audio**（参考音频），但当前实现为 `raise NotImplementedError("ref_audio is not supported yet.")`，即**尚未开放**。

因此：
- **没有**独立的「男生/女生」或「人声类型」接口；
- **没有** BPM、调性、力度等单独控制项；
- 男生/女生、风格、情绪等**只能通过 tags 这一条字符串**表达，例如：`male vocal,piano,sad` 或 `女声,钢琴,抒情`。  
  是否生效取决于：tokenizer 是否包含这些词、训练数据是否用过类似 tag。

## 二、与 Suno 的对比（常见可配置维度）

| 维度 | Suno 常见做法 | HeartMuLa 当前 |
|------|----------------|----------------|
| 风格/流派 | Style of Music 独立字段，可写 genre、mood、instrument | 无独立字段，全部放进 **tags** |
| 人声/性别 | 文案中写 [Male Vocal]/[Female Vocal]，或 API 有 singer gender | 无独立字段，只能写在 **tags**（如 male vocal, female, 男声, 女声） |
| BPM/速度 | 部分文档支持在描述里写 120 BPM 等 | 无专门接口，可尝试写在 **tags** 里（效果未保证） |
| 歌词结构 | [Intro]/[Verse]/[Chorus] 等写在歌词里 | 支持，写在 **lyrics** 里即可 |
| 参考音频 | 有「跟唱/克隆」类功能 | **ref_audio 已预留但未实现** |

结论：HeartMuLa 的「可配置」在实现上**只有 tags + lyrics**；若要接近 Suno 的体验，只能把「男生/女生、风格、情绪、BPM 等」都**编码进 tags（和必要时 lyrics）**，并在前端用提示/建议引导用户填写。

## 三、官方 README / TODOs 的说明

- **TODOs** 中写明计划支持：**reference audio conditioning**、**fine-grained controllable music generation**、**hot song generation**。  
  即：更细粒度控制、参考音频、热门曲风等都在规划中，**当前开源版本没有**。
- README 对 tags 的说明：参考 [issue #17](https://github.com/HeartMuLa/heartlib/issues/17)，官方**未给出**完整 tag 列表或 BPM/性别等规范，只说明「逗号分隔无空格」。

## 四、实操建议（男生/女生等如何控制）

1. **通过 tags 尝试人声/性别**  
   在「标签」中直接写英文或中文，例如：  
   `male vocal`, `female vocal`, `男声`, `女声`, `男生`, `女生`。  
   若 tokenizer 与训练数据支持，模型可能会有相应倾向；否则效果可能不稳定或无效。

2. **保持标签简洁、逗号分隔**  
   例如：`piano,female vocal,sad` 或 `钢琴,女声,抒情`。

3. **参考音频与更细控制**  
   等待官方实现 `ref_audio` 与「fine-grained controllable」后再做「音色/声线」级控制会更可靠。

---

*文档基于当前 heartlib 代码与 README 整理，若后续官方发布 tag 规范或新接口，以官方为准。*
