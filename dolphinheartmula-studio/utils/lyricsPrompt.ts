/**
 * HeartMuLa-optimized Lyrics Generation Prompts
 * 
 * 专业歌词生成提示词系统，针对 HeartMuLa 模型优化
 * - 支持多语言：English, 中文, 日本語, 한국어, Español
 * - 遵循 HeartMuLa 标准歌词格式
 */

export type LyricsLanguage = 'en' | 'zh' | 'ja' | 'ko' | 'es';

export interface LyricsLanguageOption {
  code: LyricsLanguage;
  label: string;
  flag: string;
  nativeName: string;
}

export const LYRICS_LANGUAGES: LyricsLanguageOption[] = [
  { code: 'en', label: 'English', flag: '🇺🇸', nativeName: 'English' },
  { code: 'zh', label: 'Chinese', flag: '🇨🇳', nativeName: '中文' },
  { code: 'ja', label: 'Japanese', flag: '🇯🇵', nativeName: '日本語' },
  { code: 'ko', label: 'Korean', flag: '🇰🇷', nativeName: '한국어' },
  { code: 'es', label: 'Spanish', flag: '🇪🇸', nativeName: 'Español' },
];

/**
 * HeartMuLa 歌词结构说明（按语言）
 */
const STRUCTURE_INSTRUCTIONS: Record<LyricsLanguage, string> = {
  en: `
Structure the lyrics using EXACTLY these section markers:
- [Intro] - Optional instrumental intro (can be empty or 1-2 lines)
- [Verse] - 4-6 lines per verse, storytelling content
- [Prechorus] - 2-4 lines building to chorus
- [Chorus] - 4-6 lines, memorable hook, can repeat
- [Bridge] - 2-4 lines, emotional contrast
- [Outro] - 1-3 lines closing

Rules:
- Use rhyme schemes (AABB, ABAB, or ABCB)
- Keep lines 6-12 words each
- Avoid contractions in formal styles
- Each section on new line after the marker
`.trim(),

  zh: `
使用以下标准段落标记组织歌词：
- [Intro] - 可选前奏（可空或1-2行）
- [Verse] - 每段4-6行，叙事内容
- [Prechorus] - 2-4行，为副歌铺垫
- [Chorus] - 4-6行，朗朗上口的副歌
- [Bridge] - 2-4行，情感转折
- [Outro] - 1-3行收尾

规则：
- 注意押韵（可以是AABB、ABAB或交叉韵）
- 每行控制在10-20字
- 语言自然流畅，符合口语习惯
- 标记后另起一行开始歌词
`.trim(),

  ja: `
以下の構成マーカーを使用して歌詞を構成してください：
- [Intro] - 前奏（空欄または1-2行）
- [Verse] - 各バース4-6行、ストーリーテリング
- [Prechorus] - 2-4行、サビへの盛り上がり
- [Chorus] - 4-6行、キャッチーなサビ
- [Bridge] - 2-4行、感情的なコントラスト
- [Outro] - 1-3行でクロージング

ルール：
- 韻を踏むこと
- 1行は15-30文字程度
- 自然な日本語表現を使用
- マーカーの後は改行してから歌詞を開始
`.trim(),

  ko: `
다음 표준 섹션 마커를 사용하여 가사를 구성하세요:
- [Intro] - 선택적 인트로 (비워두거나 1-2줄)
- [Verse] - 벌스당 4-6줄, 스토리텔링
- [Prechorus] - 2-4줄, 후렴구로 이어지는 빌드업
- [Chorus] - 4-6줄, 기억에 남는 후렴구
- [Bridge] - 2-4줄, 감정적 대비
- [Outro] - 1-3줄로 마무리

규칙:
- 운율을 맞추세요
- 각 줄은 10-25자 정도로
- 자연스러운 한국어 표현 사용
- 마커 다음에 줄바꿈 후 가사 시작
`.trim(),

  es: `
Estructura la letra usando EXACTAMENTE estos marcadores de sección:
- [Intro] - Intro opcional (puede estar vacío o 1-2 líneas)
- [Verse] - 4-6 líneas por verso, contenido narrativo
- [Prechorus] - 2-4 líneas construyendo hacia el estribillo
- [Chorus] - 4-6 líneas, gancho memorable
- [Bridge] - 2-4 líneas, contraste emocional
- [Outro] - 1-3 líneas de cierre

Reglas:
- Usa esquemas de rima (AABB, ABAB, o ABCB)
- Mantén las líneas de 6-12 palabras
- Nueva línea después de cada marcador
`.trim(),
};

/**
 * 生成专业的歌词 Prompt
 */
export function buildLyricsPrompt(params: {
  language: LyricsLanguage;
  genre: string;
  mood: string;
  topic?: string;
}): string {
  const { language, genre, mood, topic } = params;
  
  const langInstruction: Record<LyricsLanguage, string> = {
    en: 'Write the lyrics entirely in English.',
    zh: '请完全使用中文撰写歌词。',
    ja: '歌詞はすべて日本語で書いてください。',
    ko: '가사는 전부 한국어로 작성해 주세요.',
    es: 'Escribe la letra completamente en español.',
  };

  const roleIntro: Record<LyricsLanguage, string> = {
    en: 'You are a professional songwriter creating lyrics for AI music generation (HeartMuLa model).',
    zh: '你是一位专业词曲作者，正在为 AI 音乐生成模型 (HeartMuLa) 创作歌词。',
    ja: 'あなたはプロの作詞家で、AI音楽生成モデル（HeartMuLa）用の歌詞を作成しています。',
    ko: '당신은 AI 음악 생성 모델(HeartMuLa)을 위한 가사를 작성하는 전문 작사가입니다.',
    es: 'Eres un compositor profesional creando letras para generación de música con IA (modelo HeartMuLa).',
  };

  const structureGuide = STRUCTURE_INSTRUCTIONS[language];
  
  // 构建参数描述
  const paramLines = [
    language === 'zh' ? `风格: ${genre}` :
    language === 'ja' ? `ジャンル: ${genre}` :
    language === 'ko' ? `장르: ${genre}` :
    language === 'es' ? `Género: ${genre}` :
    `Genre: ${genre}`,
    
    language === 'zh' ? `情绪: ${mood}` :
    language === 'ja' ? `ムード: ${mood}` :
    language === 'ko' ? `분위기: ${mood}` :
    language === 'es' ? `Estado de ánimo: ${mood}` :
    `Mood: ${mood}`,
  ];
  
  if (topic?.trim()) {
    const topicLabel = 
      language === 'zh' ? '主题/关键词' :
      language === 'ja' ? 'テーマ/キーワード' :
      language === 'ko' ? '주제/키워드' :
      language === 'es' ? 'Tema/Palabras clave' :
      'Topic/Keywords';
    paramLines.push(`${topicLabel}: ${topic}`);
  }

  const outputInstruction: Record<LyricsLanguage, string> = {
    en: 'Output ONLY the lyrics with section markers. No explanations or additional text.',
    zh: '只输出带有段落标记的歌词，不要解释或添加其他文字。',
    ja: 'セクションマーカー付きの歌詞のみを出力してください。説明や追加テキストは不要です。',
    ko: '섹션 마커가 포함된 가사만 출력하세요. 설명이나 추가 텍스트는 불필요합니다.',
    es: 'Genera SOLO la letra con marcadores de sección. Sin explicaciones ni texto adicional.',
  };

  return `${roleIntro[language]}

${langInstruction[language]}

${structureGuide}

${paramLines.join('\n')}

${outputInstruction[language]}`;
}

/**
 * 根据浏览器语言获取默认歌词语言
 */
export function getDefaultLyricsLanguage(): LyricsLanguage {
  const browserLang = navigator.language.toLowerCase();
  if (browserLang.startsWith('zh')) return 'zh';
  if (browserLang.startsWith('ja')) return 'ja';
  if (browserLang.startsWith('ko')) return 'ko';
  if (browserLang.startsWith('es')) return 'es';
  return 'en';
}

/**
 * 从 localStorage 获取或设置歌词语言偏好
 */
const LYRICS_LANG_KEY = 'heartmula_lyrics_language';

export function getLyricsLanguagePreference(): LyricsLanguage {
  const saved = localStorage.getItem(LYRICS_LANG_KEY);
  if (saved && LYRICS_LANGUAGES.some(l => l.code === saved)) {
    return saved as LyricsLanguage;
  }
  return getDefaultLyricsLanguage();
}

export function setLyricsLanguagePreference(lang: LyricsLanguage): void {
  localStorage.setItem(LYRICS_LANG_KEY, lang);
}
