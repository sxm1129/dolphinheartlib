from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

from server.utils.llm import get_llm_client

router = APIRouter(prefix="/api/lyrics", tags=["lyrics"])


class LyricsGenerateRequest(BaseModel):
    language: str = "en"  # en, zh, ja, ko, es
    genre: str
    mood: str
    topic: Optional[str] = None


STRUCTURE_INSTRUCTIONS = {
    "en": """Structure the lyrics using EXACTLY these section markers:
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
- Each section on new line after the marker""",
    
    "zh": """使用以下标准段落标记组织歌词：
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
- 标记后另起一行开始歌词""",

    "ja": """以下の構成マーカーを使用して歌詞を構成してください：
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
- マーカーの後は改行してから歌詞を開始""",

    "ko": """다음 표준 섹션 마커를 사용하여 가사를 구성하세요:
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
- 마커 다음에 줄바꿈 후 가사 시작""",

    "es": """Estructura la letra usando EXACTAMENTE estos marcadores de sección:
- [Intro] - Intro opcional (puede estar vacío o 1-2 líneas)
- [Verse] - 4-6 líneas por verso, contenido narrativo
- [Prechorus] - 2-4 líneas construyendo hacia el estribillo
- [Chorus] - 4-6 líneas, gancho memorable
- [Bridge] - 2-4 líneas, contraste emocional
- [Outro] - 1-3 líneas de cierre

Reglas:
- Usa esquemas de rima (AABB, ABAB, o ABCB)
- Mantén las líneas de 6-12 palabras
- Nueva línea después de cada marcador"""
}

LANG_INSTRUCTION = {
    "en": 'Write the lyrics entirely in English.',
    "zh": '请完全使用中文撰写歌词。',
    "ja": '歌詞はすべて日本語で書いてください。',
    "ko": '가사는 전부 한국어로 작성해 주세요.',
    "es": 'Escribe la letra completamente en español.',
}

ROLE_INTRO = {
    "en": 'You are a professional songwriter creating lyrics for AI music generation (HeartMuLa model).',
    "zh": '你是一位专业词曲作者，正在为 AI 音乐生成模型 (HeartMuLa) 创作歌词。',
    "ja": 'あなたはプロの作詞家で、AI音楽生成モデル（HeartMuLa）用の歌詞を作成しています。',
    "ko": '당신은 AI 음악 생성 모델(HeartMuLa)을 위한 가사를 작성하는 전문 작사가입니다.',
    "es": 'Eres un compositor profesional creando letras para generación de música con IA (modelo HeartMuLa).',
}

OUTPUT_INSTRUCTION = {
    "en": 'Output ONLY the lyrics with section markers. No explanations or additional text.',
    "zh": '只输出带有段落标记的歌词，不要解释或添加其他文字。',
    "ja": 'セクションマーカー付きの歌詞のみを出力してください。説明や追加テキストは不要です。',
    "ko": '섹션 마커가 포함된 가사만 출력하세요. 설명이나 추가 텍스트는 불필요합니다.',
    "es": 'Genera SOLO la letra con marcadores de sección. Sin explicaciones ni texto adicional.',
}


def build_prompt(req: LyricsGenerateRequest) -> str:
    lang = req.language
    if lang not in STRUCTURE_INSTRUCTIONS:
        lang = "en"
    
    structure_guide = STRUCTURE_INSTRUCTIONS[lang]
    role = ROLE_INTRO.get(lang, ROLE_INTRO["en"])
    instruction = LANG_INSTRUCTION.get(lang, LANG_INSTRUCTION["en"])
    output_rule = OUTPUT_INSTRUCTION.get(lang, OUTPUT_INSTRUCTION["en"])

    # Build params description
    genre_label = "Genre"
    mood_label = "Mood"
    topic_label = "Topic/Keywords"

    if lang == "zh":
        genre_label = "风格"
        mood_label = "情绪"
        topic_label = "主题/关键词"
    elif lang == "ja":
        genre_label = "ジャンル"
        mood_label = "ムード"
        topic_label = "テーマ/キーワード"
    elif lang == "ko":
        genre_label = "장르"
        mood_label = "분위기"
        topic_label = "주제/키워드"
    elif lang == "es":
        genre_label = "Género"
        mood_label = "Estado de ánimo"
        topic_label = "Tema/Palabras clave"

    params_lines = [
        f"{genre_label}: {req.genre}",
        f"{mood_label}: {req.mood}",
    ]
    if req.topic and req.topic.strip():
        params_lines.append(f"{topic_label}: {req.topic}")
    
    params_text = "\n".join(params_lines)

    return f"""{role}

{instruction}

{structure_guide}

{params_text}

{output_rule}"""


@router.post("/generate")
async def generate_lyrics(req: LyricsGenerateRequest):
    """Generate lyrics using LLM."""
    try:
        client = get_llm_client()
    except ValueError as e:
        raise HTTPException(status_code=500, detail=str(e))
    
    prompt = build_prompt(req)
    
    try:
        lyrics = client.generate(prompt)
        return {"lyrics": lyrics}
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"LLM Generation Failed: {str(e)}")
