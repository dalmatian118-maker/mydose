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
// 선생님이 나눠주는 반 공용 설정 파일. 프로그램 폴더에 넣어두면 자동으로 읽습니다.
export const CLASS_SETTINGS_FILE = path.join(ROOT, "class-settings.json");
fs.mkdirSync(DATA_DIR, { recursive: true });

// 릴스 규격: 9:16 세로, 1080x1920, 30fps, 30초 이내
export const VIDEO = { width: 1080, height: 1920, fps: 30, maxSeconds: 30 };

export const ELEVENLABS_MODELS = {
  eleven_multilingual_v2: "표준 · 안정적인 한국어 (권장)",
  eleven_flash_v2_5: "빠르고 저렴 (크레딧 절반)",
  eleven_v3: "감정 표현이 풍부 (실험적)",
};

// 화면에서 입력한 API 키는 이 컴퓨터의 data/settings.json 에만 저장됩니다.
// 우선순위: 내 설정(data/settings.json) > 반 공용 설정(class-settings.json) > .env
export const KEY_FIELDS = ["anthropicKey", "elevenlabsKey", "openaiKey", "pexelsKey", "pixabayKey"];
const OPTION_FIELDS = ["elevenlabsModel"];

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return {};
  }
}

let saved = readJson(SETTINGS_FILE);

/** 알려진 항목만 골라냅니다 (설정 파일을 불러올 때 이상한 값이 섞이지 않게) */
export function pickSettings(obj = {}) {
  const out = {};
  for (const f of KEY_FIELDS) if (typeof obj[f] === "string" && obj[f].trim()) out[f] = obj[f].trim();
  if (obj.elevenlabsModel in ELEVENLABS_MODELS) out.elevenlabsModel = obj.elevenlabsModel;
  return out;
}

export function getConfig() {
  const classSettings = pickSettings(readJson(CLASS_SETTINGS_FILE));
  const get = (field, env) => saved[field] || classSettings[field] || process.env[env] || "";
  return {
    port: Number(process.env.PORT || 3000),
    host: process.env.HOST || "127.0.0.1",
    demoMode: process.env.DEMO_MODE === "1",
    claudeModel: process.env.CLAUDE_MODEL || "claude-opus-5-5",
    anthropicKey: get("anthropicKey", "ANTHROPIC_API_KEY"),
    openaiKey: get("openaiKey", "OPENAI_API_KEY"),
    elevenlabsKey: get("elevenlabsKey", "ELEVENLABS_API_KEY"),
    elevenlabsModel: get("elevenlabsModel", "ELEVENLABS_MODEL") || "eleven_multilingual_v2",
    pexelsKey: get("pexelsKey", "PEXELS_API_KEY"),
    pixabayKey: get("pixabayKey", "PIXABAY_API_KEY"),
    usingClassSettings: Object.keys(classSettings).length > 0,
    openaiImageModel: process.env.OPENAI_IMAGE_MODEL || "gpt-image-1",
    openaiTtsModel: process.env.OPENAI_TTS_MODEL || "gpt-4o-mini-tts",
  };
}

/** 화면에 보여줄 설정 (키는 끝 4자리만) */
export function publicSettings() {
  const c = getConfig();
  const mask = (k) => (k ? `••••${k.slice(-4)}` : "");
  return {
    ...Object.fromEntries(KEY_FIELDS.map((f) => [f, mask(c[f])])),
    elevenlabsModel: c.elevenlabsModel,
    elevenlabsModels: ELEVENLABS_MODELS,
    usingClassSettings: c.usingClassSettings,
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

/** 선생님용: 지금 쓰는 키를 반 공용 설정 파일 내용으로 만듭니다. */
export function exportClassSettings() {
  const c = getConfig();
  return {
    _안내: "이 파일을 프로그램 폴더(start-windows.bat 옆)에 넣으면 학생은 키를 입력하지 않아도 돼요. 수업이 끝나면 각 서비스에서 키를 삭제하세요.",
    exportedAt: new Date().toISOString(),
    ...pickSettings(Object.fromEntries([...KEY_FIELDS, ...OPTION_FIELDS].map((f) => [f, c[f]]))),
  };
}

/** 학생용: 받은 반 공용 설정 파일을 불러와 내 설정으로 저장합니다. */
export function importSettings(obj) {
  const picked = pickSettings(obj);
  if (!Object.keys(picked).length) throw new Error("설정 파일에 API 키가 없어요");
  Object.assign(saved, picked);
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(saved, null, 2), { mode: 0o600 });
  return Object.keys(picked);
}

export function providerStatus() {
  const c = getConfig();
  return {
    script: c.demoMode ? "demo" : c.anthropicKey ? "claude" : "missing",
    stock: c.pexelsKey ? "pexels" : c.pixabayKey ? "pixabay" : "none",
    image: c.openaiKey ? "openai" : "placeholder",
    voice: c.elevenlabsKey ? "elevenlabs" : c.openaiKey ? "openai" : "silent",
    video: "kenburns",
  };
}
