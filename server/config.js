import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

try {
  process.loadEnvFile();
} catch {
  // .env 파일이 없으면 환경변수만 사용
}

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const DATA_DIR = path.join(ROOT, "data", "projects");
export const FONTS_DIR = path.join(ROOT, "assets", "fonts");
fs.mkdirSync(DATA_DIR, { recursive: true });

// 릴스 규격: 9:16 세로, 1080x1920, 30fps, 30초 이내
export const VIDEO = { width: 1080, height: 1920, fps: 30, maxSeconds: 30 };

export const config = {
  port: Number(process.env.PORT || 3000),
  demoMode: process.env.DEMO_MODE === "1",
  claudeModel: process.env.CLAUDE_MODEL || "claude-opus-5-5",
  openaiKey: process.env.OPENAI_API_KEY || "",
  openaiImageModel: process.env.OPENAI_IMAGE_MODEL || "gpt-image-1",
  openaiTtsModel: process.env.OPENAI_TTS_MODEL || "gpt-4o-mini-tts",
  openaiTtsVoice: process.env.OPENAI_TTS_VOICE || "nova",
};

export function providerStatus() {
  return {
    script: config.demoMode ? "demo" : "claude",
    image: config.openaiKey ? "openai" : "placeholder",
    voice: config.openaiKey ? "openai" : "silent",
    video: "kenburns",
  };
}
