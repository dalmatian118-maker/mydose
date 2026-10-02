import fs from "node:fs";
import { config, VIDEO } from "../config.js";
import { ffmpeg } from "../lib/ffmpeg.js";

// 장면 이미지 생성. OPENAI_API_KEY가 있으면 AI 이미지, 없으면 색 그라데이션 임시 카드.

export function buildImagePrompt(scene, visualStyle) {
  return [
    scene.image_prompt.trim(),
    `Style: ${visualStyle}.`,
    "Vertical 9:16 composition, photorealistic, authentic candid feel.",
    "No text, no letters, no captions, no logos, no watermark.",
  ].join(" ");
}

async function generateWithOpenAI(prompt, outPath) {
  const res = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${config.openaiKey}` },
    body: JSON.stringify({ model: config.openaiImageModel, prompt, size: "1024x1536", n: 1 }),
  });
  if (!res.ok) throw new Error(`이미지 생성 실패 (HTTP ${res.status}): ${(await res.text()).slice(0, 300)}`);
  const json = await res.json();
  const b64 = json.data?.[0]?.b64_json;
  if (!b64) throw new Error("이미지 생성 응답에 이미지가 없어요");
  fs.writeFileSync(outPath, Buffer.from(b64, "base64"));
}

// 장면마다 색이 달라 보이도록 고른 차분한 그라데이션 팔레트
const PALETTE = [
  ["0x2b1d14", "0xc8a27a"],
  ["0x14212b", "0x7aa6c8"],
  ["0x1f2b14", "0xa6c87a"],
  ["0x2b1424", "0xc87aa9"],
  ["0x2b2614", "0xc8bb7a"],
  ["0x16142b", "0x8f7ac8"],
];

async function makePlaceholder(index, outPath) {
  const [c0, c1] = PALETTE[index % PALETTE.length];
  const { width: w, height: h } = VIDEO;
  await ffmpeg([
    "-f", "lavfi",
    "-i", `gradients=s=${w}x${h}:c0=${c0}:c1=${c1}:x0=0:y0=0:x1=${w}:y1=${h}:nb_colors=2:d=1`,
    "-vf", "noise=alls=8:allf=t",
    "-frames:v", "1",
    outPath,
  ]);
}

/** 장면 하나의 정지 이미지를 준비합니다. 반환: 이미지 경로 */
export async function prepareSceneImage({ scene, index, visualStyle, outPath }) {
  if (config.openaiKey) {
    await generateWithOpenAI(buildImagePrompt(scene, visualStyle), outPath);
  } else {
    await makePlaceholder(index, outPath);
  }
  return outPath;
}
