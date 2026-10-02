import { VIDEO } from "../config.js";

const GAP_AFTER_VOICE = 0.35; // 장면 전환 전 숨 고르기
const HOOK_GAP = 0.15; // 후킹 장면은 빠르게 넘어가도록 짧게
const SAFETY = 0.4; // 30초를 넘기지 않기 위한 여유
const MAX_TEMPO = 1.25; // 이 이상 빠르게 하면 말이 부자연스러워짐

/**
 * 목소리 길이로 장면 길이를 정합니다. 전체가 30초를 넘으면 말 속도를 살짝 올립니다.
 * @param {number[]} voiceSeconds 장면별 원래 음성 길이
 * @param {string[]} roles 장면 역할 (hook 등)
 */
export function planTiming(voiceSeconds, roles, maxSeconds = VIDEO.maxSeconds) {
  const gaps = roles.map((r) => (r === "hook" ? HOOK_GAP : GAP_AFTER_VOICE));
  const gapTotal = gaps.reduce((a, b) => a + b, 0);
  const voiceTotal = voiceSeconds.reduce((a, b) => a + b, 0);
  const budget = maxSeconds - SAFETY - gapTotal;

  let tempo = 1;
  if (voiceTotal > budget) tempo = Math.min(MAX_TEMPO, voiceTotal / budget);

  const voice = voiceSeconds.map((s) => s / tempo);
  const scenes = voice.map((s, i) => round(s + gaps[i]));
  const total = round(scenes.reduce((a, b) => a + b, 0));
  return { tempo: round(tempo, 3), voice: voice.map((s) => round(s)), scenes, total, overLimit: total > maxSeconds };
}

function round(n, digits = 3) {
  const f = 10 ** digits;
  return Math.round(n * f) / f;
}
