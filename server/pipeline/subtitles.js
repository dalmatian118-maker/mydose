import { VIDEO } from "../config.js";
import { FONTS } from "../lib/fonts.js";

// 릴스 자막(ASS). 인스타그램 UI(상단 프로필, 하단 캡션·버튼)를 피해서 배치합니다.
//  - Caption: 내레이션을 짧게 끊어서 하단 중앙에 순서대로
//  - Title:   장면 핵심 키워드(on_screen_text)를 상단에
//  - Hook:    첫 장면 키워드는 더 크게, 노란 박스로 튀어나오듯

const MAX_CHARS = 14; // 한 줄 최대 글자 수 (세로 화면에서 한눈에 읽히는 길이)

/** 내레이션을 자막 조각으로 나눕니다. */
export function chunkNarration(text, maxChars = MAX_CHARS) {
  const pieces = text
    .replace(/\s+/g, " ")
    .trim()
    .split(/(?<=[.,!?…~])\s+/)
    .filter(Boolean);

  const chunks = [];
  for (const piece of pieces) {
    if (piece.length <= maxChars) {
      chunks.push(piece);
      continue;
    }
    let line = "";
    for (const word of piece.split(" ")) {
      if (line && (line + " " + word).length > maxChars) {
        chunks.push(line);
        line = word;
      } else {
        line = line ? `${line} ${word}` : word;
      }
    }
    if (line) chunks.push(line);
  }
  // 자막에서는 끝의 마침표·쉼표를 빼는 편이 깔끔합니다 (? ! 는 유지)
  return chunks.map((c) => c.replace(/[.,]+$/, "")).filter(Boolean);
}

/** 조각별 표시 시간: 글자 수에 비례해 음성 길이를 나눕니다. */
export function timeChunks(chunks, start, voiceSeconds, sceneEnd) {
  const weights = chunks.map((c) => Math.max(1, c.replace(/\s/g, "").length));
  const total = weights.reduce((a, b) => a + b, 0);
  let t = start;
  return chunks.map((text, i) => {
    const isLast = i === chunks.length - 1;
    const end = isLast ? sceneEnd : t + (voiceSeconds * weights[i]) / total;
    const item = { text, start: t, end };
    t = end;
    return item;
  });
}

function assTime(seconds) {
  const cs = Math.max(0, Math.round(seconds * 100));
  const h = Math.floor(cs / 360000);
  const m = Math.floor((cs % 360000) / 6000);
  const s = Math.floor((cs % 6000) / 100);
  return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.${String(cs % 100).padStart(2, "0")}`;
}

function escapeAss(text) {
  return text.replace(/\\/g, "＼").replace(/[{}]/g, "").replace(/\n/g, "\\N");
}

/**
 * @param {Array} scenes  대본 장면
 * @param {{scenes:number[], voice:number[]}} timing  planTiming 결과
 */
export function buildAss(scenes, timing) {
  const { width, height } = VIDEO;
  const cap = FONTS.caption.family;
  const title = FONTS.title.family;
  // 색상 형식: &HAABBGGRR
  const header = `[Script Info]
ScriptType: v4.00+
PlayResX: ${width}
PlayResY: ${height}
WrapStyle: 2
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Caption,${cap},66,&H00FFFFFF,&H00FFFFFF,&H00000000,&H64000000,1,0,0,0,100,100,0,0,1,6,2,2,80,80,520,1
Style: Title,${title},84,&H00FFFFFF,&H00FFFFFF,&HB4141414,&H00000000,0,0,0,0,100,100,0,0,3,22,0,8,90,90,330,1
Style: Hook,${title},104,&H00141414,&H00141414,&H0000D7FF,&H00000000,0,0,0,0,100,100,0,0,3,26,0,8,80,80,330,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;

  const lines = [];
  let sceneStart = 0;
  scenes.forEach((scene, i) => {
    const sceneEnd = sceneStart + timing.scenes[i];
    const keyword = scene.on_screen_text?.trim();
    if (keyword) {
      const isHook = i === 0;
      const pop = isHook ? "{\\fscx130\\fscy130\\t(0,180,\\fscx100\\fscy100)}" : "{\\fad(120,0)}";
      lines.push(`Dialogue: 1,${assTime(sceneStart)},${assTime(sceneEnd)},${isHook ? "Hook" : "Title"},,0,0,0,,${pop}${escapeAss(keyword)}`);
    }
    const chunks = timeChunks(chunkNarration(scene.narration), sceneStart, timing.voice[i], sceneEnd);
    for (const c of chunks) {
      lines.push(`Dialogue: 0,${assTime(c.start)},${assTime(c.end)},Caption,,0,0,0,,${escapeAss(c.text)}`);
    }
    sceneStart = sceneEnd;
  });

  return header + lines.join("\n") + "\n";
}
