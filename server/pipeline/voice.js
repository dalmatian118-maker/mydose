import fs from "node:fs";
import { config } from "../config.js";
import { ffmpeg } from "../lib/ffmpeg.js";

// 장면별 내레이션 음성(wav, 44.1kHz mono). OPENAI_API_KEY가 없으면 예상 길이만큼 무음을 만듭니다.

/** 한국어 내레이션 예상 길이(초): 공백 제외 초당 약 6.5글자 */
export function estimateSpeechSeconds(text) {
  const chars = text.replace(/\s/g, "").length;
  return Math.max(1.2, chars / 6.5 + 0.2);
}

async function ttsWithOpenAI(text, instructions, outPath) {
  const res = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${config.openaiKey}` },
    body: JSON.stringify({
      model: config.openaiTtsModel,
      voice: config.openaiTtsVoice,
      input: text,
      instructions: `한국어로 자연스럽게 말하세요. 광고 성우처럼 과장하지 말고, 실제 사람이 진심으로 이야기하듯. 톤: ${instructions}`,
      response_format: "wav",
    }),
  });
  if (!res.ok) throw new Error(`목소리 생성 실패 (HTTP ${res.status}): ${(await res.text()).slice(0, 300)}`);
  const raw = `${outPath}.raw.wav`;
  fs.writeFileSync(raw, Buffer.from(await res.arrayBuffer()));
  // 앞뒤 무음 정리 + 포맷 통일
  await ffmpeg([
    "-i", raw,
    "-af", "silenceremove=start_periods=1:start_threshold=-50dB,areverse,silenceremove=start_periods=1:start_threshold=-50dB,areverse",
    "-ar", "44100", "-ac", "1", outPath,
  ]);
  fs.rmSync(raw, { force: true });
}

async function silence(seconds, outPath) {
  await ffmpeg(["-f", "lavfi", "-i", "anullsrc=r=44100:cl=mono", "-t", seconds.toFixed(3), outPath]);
}

export async function prepareSceneVoice({ text, voiceTone, outPath }) {
  if (config.openaiKey) await ttsWithOpenAI(text, voiceTone, outPath);
  else await silence(estimateSpeechSeconds(text), outPath);
  return outPath;
}
