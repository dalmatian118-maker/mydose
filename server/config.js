import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

try {
  process.loadEnvFile();
} catch {
  // .env 파일이 없으면 환경변수와 화면 설정만 사용
}

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const DATA_DIR = path.join(ROOT, "data", "projects");
export const FONTS_DIR = path.join(ROOT, "assets", "fonts");
const SETTINGS_FILE = path.join(ROOT, "data", "settings.json");
fs.mkdirSync(DATA_DIR, { recursive: true });

// 릴스 규격: 9:16 세로, 1080x1920, 30fps, 30초 이내
export const VIDEO = { width: 1080, height: 1920, fps: 30, maxSeconds: 30 };

export const ELEVENLABS_MODELS = {
  eleven_multilingual_v2: "표준 · 안정적인 한국어 (권장)",
  eleven_flash_v2_5: "빠르고 저렴 (크레딧 절반)",
  eleven_v3: "감정 표현이 풍부 (실험적)",
};

// 학생이 화면에서 입력한 API 키는 이 컴퓨터의 data/settings.json 에만 저장됩니다.
const KEY_FIELDS = ["anthropicKey", "openaiKey", "elevenlabsKey"];
let saved = {};
try {
  saved = JSON.parse(fs.readFileSync(SETTINGS_FILE, "utf8"));
} catch {}

export function getConfig() {
  return {
    port: Number(process.env.PORT || 3000),
    host: process.env.HOST || "127.0.0.1",
    demoMode: process.env.DEMO_MODE === "1",
    claudeModel: process.env.CLAUDE_MODEL || "claude-opus-5-5",
    anthropicKey: saved.anthropicKey || process.env.ANTHROPIC_API_KEY || "",
    openaiKey: saved.openaiKey || process.env.OPENAI_API_KEY || "",
    elevenlabsKey: saved.elevenlabsKey || process.env.ELEVENLABS_API_KEY || "",
    elevenlabsModel: saved.elevenlabsModel || process.env.ELEVENLABS_MODEL || "eleven_multilingual_v2",
    openaiImageModel: process.env.OPENAI_IMAGE_MODEL || "gpt-image-1",
    openaiTtsModel: process.env.OPENAI_TTS_MODEL || "gpt-4o-mini-tts",
  };
}

/** 화면에 보여줄 설정 (키는 끝 4자리만) */
export function publicSettings() {
  const c = getConfig();
  const mask = (k) => (k ? `••••${k.slice(-4)}` : "");
  return {
    anthropicKey: mask(c.anthropicKey),
    openaiKey: mask(c.openaiKey),
    elevenlabsKey: mask(c.elevenlabsKey),
    elevenlabsModel: c.elevenlabsModel,
    elevenlabsModels: ELEVENLABS_MODELS,
  };
}

/** 빈 문자열은 '변경 없음', null 은 '삭제' */
export function updateSettings(patch) {
  for (const field of KEY_FIELDS) {
    if (patch[field] === null) delete saved[field];
    else if (typeof patch[field] === "string" && patch[field].trim()) saved[field] = patch[field].trim();
  }
  if (patch.elevenlabsModel in ELEVENLABS_MODELS) saved.elevenlabsModel = patch.elevenlabsModel;
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(saved, null, 2), { mode: 0o600 });
}

export function providerStatus() {
  const c = getConfig();
  return {
    script: c.demoMode ? "demo" : c.anthropicKey ? "claude" : "missing",
    image: c.openaiKey ? "openai" : "placeholder",
    voice: c.elevenlabsKey ? "elevenlabs" : c.openaiKey ? "openai" : "silent",
    video: "kenburns",
  };
}
