import fs from "node:fs";
import { getConfig, providerStatus } from "../config.js";
import { ffmpeg } from "../lib/ffmpeg.js";

// 장면별 내레이션 음성(wav, 44.1kHz mono)
//  - ElevenLabs (ELEVENLABS 키가 있으면 우선)
//  - OpenAI TTS
//  - 키가 없으면 예상 길이만큼 무음

export const VOICE_OPTIONS = {
  gender: { female: "여성", male: "남성" },
  age: { young: "10~20대", middle_aged: "30~40대", old: "50대 이상" },
  style: { warm: "따뜻하게", calm: "차분하게", bright: "밝고 경쾌하게", strong: "힘 있게" },
};

export const DEFAULT_VOICE = { gender: "female", age: "young", style: "warm", speed: 1.0, voiceId: "", voiceName: "", ownerId: "" };

export function normalizeVoice(v = {}) {
  const pick = (key) => (v[key] in VOICE_OPTIONS[key] ? v[key] : DEFAULT_VOICE[key]);
  const speed = Number(v.speed);
  return {
    gender: pick("gender"),
    age: pick("age"),
    style: pick("style"),
    speed: Number.isFinite(speed) ? Math.min(1.2, Math.max(0.8, speed)) : 1.0,
    voiceId: typeof v.voiceId === "string" ? v.voiceId.trim().slice(0, 64) : "",
    voiceName: typeof v.voiceName === "string" ? v.voiceName.slice(0, 80) : "",
    ownerId: typeof v.ownerId === "string" ? v.ownerId.trim().slice(0, 80) : "",
  };
}

/** 사람이 읽을 수 있는 목소리 설명 (TTS 지시문에 사용) */
export function describeVoice(voice) {
  return `${VOICE_OPTIONS.age[voice.age]} ${VOICE_OPTIONS.gender[voice.gender]}, ${VOICE_OPTIONS.style[voice.style]}`;
}

/** 한국어 내레이션 예상 길이(초): 공백 제외 초당 약 6.5글자 */
export function estimateSpeechSeconds(text) {
  const chars = text.replace(/\s/g, "").length;
  return Math.max(1.2, chars / 6.5 + 0.2);
}

// ---------- 공통 후처리: 앞뒤 무음 제거 + 속도 + 포맷 통일 ----------
async function finalize(raw, outPath, tempo = 1) {
  const trim = "silenceremove=start_periods=1:start_threshold=-50dB";
  const filters = [trim, "areverse", trim, "areverse"];
  if (Math.abs(tempo - 1) > 0.001) filters.push(`atempo=${tempo}`);
  await ffmpeg(["-i", raw, "-af", filters.join(","), "-ar", "44100", "-ac", "1", outPath]);
  fs.rmSync(raw, { force: true });
}

// ---------- ElevenLabs ----------
const ELEVEN_API = process.env.ELEVENLABS_BASE_URL || "https://api.elevenlabs.io";

// 말투별 voice_settings (stability가 낮을수록 감정 폭이 커짐)
const ELEVEN_STYLE = {
  warm: { stability: 0.5, style: 0.25 },
  calm: { stability: 0.65, style: 0.1 },
  bright: { stability: 0.4, style: 0.35 },
  strong: { stability: 0.4, style: 0.45 },
};

async function elevenFetch(pathname, options = {}) {
  const res = await fetch(`${ELEVEN_API}${pathname}`, {
    ...options,
    headers: { "xi-api-key": getConfig().elevenlabsKey, ...(options.body ? { "Content-Type": "application/json" } : {}), ...options.headers },
  });
  if (!res.ok) {
    const body = await res.text();
    const err = new Error(`ElevenLabs 오류 (HTTP ${res.status}): ${body.slice(0, 300)}`);
    err.status = res.status;
    throw err;
  }
  return res;
}

/** 공개 목소리 라이브러리에서 한국어 목소리 찾기. 결과가 없으면 조건을 하나씩 풀어서 다시 찾습니다. */
export async function searchElevenLabsVoices({ gender, age }) {
  const attempts = [
    { language: "ko", gender, age },
    { language: "ko", gender },
    { gender, age },
  ];
  for (const filter of attempts) {
    const params = new URLSearchParams({ page_size: "12", sort: "usage_character_count_1y", ...filter });
    const json = await (await elevenFetch(`/v1/shared-voices?${params}`)).json();
    const voices = (json.voices || []).map((v) => ({
      voiceId: v.voice_id,
      ownerId: v.public_owner_id,
      name: v.name,
      description: v.description || v.descriptive || "",
      gender: v.gender,
      age: v.age,
      language: v.language || "",
      previewUrl: v.preview_url || "",
      freeUsersAllowed: v.free_users_allowed,
    }));
    if (voices.length) return { voices, relaxed: filter !== attempts[0] };
  }
  return { voices: [], relaxed: true };
}

async function addSharedVoice(voice) {
  if (!voice.ownerId) return false;
  try {
    await elevenFetch(`/v1/voices/add/${encodeURIComponent(voice.ownerId)}/${encodeURIComponent(voice.voiceId)}`, {
      method: "POST",
      body: JSON.stringify({ new_name: voice.voiceName || "Reels voice" }),
    });
    return true;
  } catch {
    return false;
  }
}

async function ttsElevenLabs({ text, prevText, nextText, voice, outPath }) {
  const { elevenlabsModel: model } = getConfig();
  const tone = ELEVEN_STYLE[voice.style];
  const body = {
    text,
    model_id: model,
    voice_settings: {
      // eleven_v3는 stability 0, 0.5, 1 만 받습니다.
      stability: model === "eleven_v3" ? 0.5 : tone.stability,
      similarity_boost: 0.75,
      style: tone.style,
      use_speaker_boost: true,
      speed: voice.speed,
    },
  };
  if (model !== "eleven_multilingual_v2") body.language_code = "ko";
  if (model !== "eleven_v3") {
    // 앞뒤 문장을 알려주면 장면을 나눠 만들어도 억양이 자연스럽게 이어집니다.
    if (prevText) body.previous_text = prevText;
    if (nextText) body.next_text = nextText;
  }

  const request = () =>
    elevenFetch(`/v1/text-to-speech/${encodeURIComponent(voice.voiceId)}?output_format=mp3_44100_128`, {
      method: "POST",
      body: JSON.stringify(body),
    });
  let res;
  try {
    res = await request();
  } catch (err) {
    // 라이브러리 목소리는 내 계정에 추가해야 쓸 수 있는 경우가 있어, 추가 후 한 번 더 시도합니다.
    if (err.status >= 400 && err.status < 500 && (await addSharedVoice(voice))) res = await request();
    else throw err;
  }
  const raw = `${outPath}.raw.mp3`;
  fs.writeFileSync(raw, Buffer.from(await res.arrayBuffer()));
  await finalize(raw, outPath);
}

/** 목소리를 고르지 않았으면 성별·연령대 조건으로 첫 번째 한국어 목소리를 씁니다. */
export async function resolveElevenLabsVoice(voice) {
  if (voice.voiceId) return voice;
  const { voices } = await searchElevenLabsVoices(voice);
  if (!voices.length) throw new Error("조건에 맞는 ElevenLabs 목소리를 찾지 못했어요. 목소리를 직접 골라주세요.");
  const v = voices[0];
  return { ...voice, voiceId: v.voiceId, ownerId: v.ownerId, voiceName: v.name };
}

// ---------- OpenAI ----------
const OPENAI_VOICE = {
  female: { young: "coral", middle_aged: "nova", old: "sage" },
  male: { young: "ash", middle_aged: "echo", old: "onyx" },
};

async function ttsOpenAI({ text, voice, voiceTone, outPath }) {
  const config = getConfig();
  const res = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${config.openaiKey}` },
    body: JSON.stringify({
      model: config.openaiTtsModel,
      voice: OPENAI_VOICE[voice.gender][voice.age],
      input: text,
      instructions: `한국어로 자연스럽게 말하세요. 광고 성우처럼 과장하지 말고, 실제 사람이 진심으로 이야기하듯. 목소리: ${describeVoice(voice)}. 톤: ${voiceTone}`,
      response_format: "wav",
    }),
  });
  if (!res.ok) throw new Error(`목소리 생성 실패 (HTTP ${res.status}): ${(await res.text()).slice(0, 300)}`);
  const raw = `${outPath}.raw.wav`;
  fs.writeFileSync(raw, Buffer.from(await res.arrayBuffer()));
  await finalize(raw, outPath, voice.speed);
}

// ---------- 무음 ----------
async function silence(seconds, outPath) {
  await ffmpeg(["-f", "lavfi", "-i", "anullsrc=r=44100:cl=mono", "-t", seconds.toFixed(3), outPath]);
}

/**
 * @param {object} p { text, prevText, nextText, voice(normalizeVoice 결과), voiceTone, outPath }
 */
export async function prepareSceneVoice(p) {
  const provider = providerStatus().voice;
  if (provider === "elevenlabs") await ttsElevenLabs(p);
  else if (provider === "openai") await ttsOpenAI(p);
  else await silence(estimateSpeechSeconds(p.text) / p.voice.speed, p.outPath);
  return p.outPath;
}
