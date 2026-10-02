import { VIDEO } from "../config.js";
import { FONTS } from "../lib/fonts.js";

// 릴스 자막(ASS). 인스타그램 UI(상단 프로필, 하단 캡션·버튼)를 피해서 배치합니다.
//  - Caption: 내레이션을 짧게 끊어서 하단 중앙에 순서대로. 강조 단어(emphasis)는 포인트 컬러로
//  - Hook:    첫 장면(후킹)에만 위쪽 큰 문구를 포인트 컬러 박스로 튀어나오듯

const MAX_CHARS = 12; // 한 줄 최대 글자 수 (큰 자막 기준, 세로 화면에서 한눈에 읽히는 길이)
const NBSP = "\u00a0";

/**
 * 내레이션을 자막 조각으로 나눕니다.
 * @param {string[]} keep 중간에 끊으면 안 되는 말 (강조 단어 등)
 */
export function chunkNarration(text, maxChars = MAX_CHARS, keep = []) {
  let joined = text.replace(/\s+/g, " ").trim();
  for (const k of keep.filter(Boolean)) joined = joined.replace(k, k.replace(/ /g, NBSP));
  const pieces = joined
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
  return chunks.map((c) => c.replace(/[.,]+$/, "").replaceAll(NBSP, " ")).filter(Boolean);
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

/** 자막 조각 안의 강조 단어를 포인트 컬러로 */
function highlight(text, word, pointColor) {
  if (!word || !text.includes(word)) return text;
  return text.replace(word, `{\\c${assColor(pointColor)}&}${word}{\\c&H00FFFFFF&}`);
}

/** #RRGGBB → ASS 색(&HBBGGRR) */
export function assColor(hex) {
  const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex || "") || [null, "FF", "D4", "00"];
  return `&H00${m[3]}${m[2]}${m[1]}`.toUpperCase();
}

/** 밝은 포인트 컬러 위에는 검은 글씨, 어두운 색 위에는 흰 글씨 */
function textOn(hex) {
  const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex || "");
  if (!m) return "&H00141414";
  const [r, g, b] = [m[1], m[2], m[3]].map((h) => parseInt(h, 16) / 255);
  return 0.299 * r + 0.587 * g + 0.114 * b > 0.6 ? "&H00141414" : "&H00FFFFFF";
}

function escapeAss(text) {
  return text.replace(/\\/g, "＼").replace(/[{}]/g, "").replace(/\n/g, "\\N");
}

/**
 * @param {Array} scenes  대본 장면
 * @param {{scenes:number[], voice:number[]}} timing  planTiming 결과
 */
export function buildAss(scenes, timing, { pointColor = "#FFD400" } = {}) {
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
Style: Caption,${cap},80,&H00FFFFFF,&H00FFFFFF,&H00000000,&H64000000,1,0,0,0,100,100,0,0,1,7,2,2,70,70,500,1
Style: Hook,${title},108,${textOn(pointColor)},${textOn(pointColor)},${assColor(pointColor)},&H00000000,0,0,0,0,100,100,0,0,3,26,0,8,80,80,330,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;

  const lines = [];
  let sceneStart = 0;
  scenes.forEach((scene, i) => {
    const sceneEnd = sceneStart + timing.scenes[i];
    // 위쪽 큰 문구는 첫 장면(후킹)에만
    const keyword = i === 0 ? scene.on_screen_text?.trim() : "";
    if (keyword) {
      const pop = "{\\fscx130\\fscy130\\t(0,180,\\fscx100\\fscy100)}";
      lines.push(`Dialogue: 1,${assTime(sceneStart)},${assTime(sceneEnd)},Hook,,0,0,0,,${pop}${escapeAss(keyword)}`);
    }
    const emphasis = scene.emphasis?.trim();
    const chunks = timeChunks(chunkNarration(scene.narration, MAX_CHARS, [emphasis]), sceneStart, timing.voice[i], sceneEnd);
    for (const c of chunks) {
      lines.push(`Dialogue: 0,${assTime(c.start)},${assTime(c.end)},Caption,,0,0,0,,${highlight(escapeAss(c.text), emphasis && escapeAss(emphasis), pointColor)}`);
    }
    sceneStart = sceneEnd;
  });

  return header + lines.join("\n") + "\n";
}
