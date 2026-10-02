import fs from "node:fs";
import Anthropic from "@anthropic-ai/sdk";
import { getConfig } from "../config.js";
import { SYSTEM_PROMPT, SCRIPT_JSON_SCHEMA } from "./playbook.js";
import { validateScript } from "./schema.js";
import { DEMO_SCRIPT } from "./demo-script.js";

let client;
let clientKey;
function getClient(apiKey) {
  // 설정 화면에서 키를 바꾸면 새 클라이언트를 만듭니다.
  if (!client || clientKey !== apiKey) {
    // 반 전체가 동시에 누르면 요청 한도(429)에 걸릴 수 있어 SDK 자동 재시도 횟수를 늘립니다.
    client = new Anthropic({ apiKey, maxRetries: 8 });
    clientKey = apiKey;
  }
  return client;
}

/**
 * 브랜드 스토리 → 릴스 대본(JSON)
 * @param {object} brief  { brandName, story, audience, tone }
 * @param {Array} media   [{ id, kind: "image"|"video", description, previewPath }]
 */
export async function generateScript(brief, media) {
  const config = getConfig();
  if (config.demoMode) return validateScript(structuredClone(DEMO_SCRIPT), media.map((m) => m.id));
  if (!config.anthropicKey) throw new Error("Claude API 키가 없어요. 오른쪽 위 ⚙️ 설정에서 입력해주세요.");

  const content = [];
  // 학생이 올린 사진/영상(대표 프레임)을 Claude가 직접 보고 장면에 배치하도록 함께 보냅니다.
  for (const m of media) {
    content.push({ type: "text", text: `[${m.id}] ${m.kind === "video" ? "영상(대표 프레임)" : "사진"} — 학생 설명: ${m.description || "(없음)"}` });
    if (m.previewPath) {
      content.push({
        type: "image",
        source: { type: "base64", media_type: "image/jpeg", data: fs.readFileSync(m.previewPath).toString("base64") },
      });
    }
  }
  content.push({
    type: "text",
    text: [
      `브랜드 이름: ${brief.brandName || "(미정)"}`,
      `타깃 시청자: ${brief.audience || "(미정)"}`,
      `원하는 분위기: ${brief.tone || "진솔하고 따뜻하게"}`,
      `사용 가능한 미디어 ID: ${media.length ? media.map((m) => m.id).join(", ") : "없음 (모든 장면 이미지 생성)"}`,
      "",
      "<brand_story>",
      brief.story,
      "</brand_story>",
      "",
      "위 브랜드 스토리로 30초 이내 인스타그램 릴스 대본을 작성해주세요.",
    ].join("\n"),
  });

  const stream = getClient(config.anthropicKey).beta.messages.stream({
    model: config.claudeModel,
    max_tokens: 16000,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content }],
    thinking: { type: "adaptive" },
    output_config: {
      effort: "high",
      format: { type: "json_schema", schema: SCRIPT_JSON_SCHEMA },
    },
    // 안전 분류기에 의해 거절되면 서버에서 다른 모델로 자동 재시도
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
  });
  let message;
  try {
    message = await stream.finalMessage();
  } catch (err) {
    if (err instanceof Anthropic.RateLimitError || err instanceof Anthropic.InternalServerError) {
      throw new Error("지금 반 전체 요청이 몰려 있어요. 1~2분 뒤에 '대본 다시 쓰기'를 눌러주세요.");
    }
    if (err instanceof Anthropic.AuthenticationError) throw new Error("Claude API 키가 올바르지 않아요. ⚙️ 설정을 확인해주세요.");
    throw err;
  }

  if (message.stop_reason === "refusal") {
    throw new Error("이 스토리로는 대본을 만들 수 없다는 응답을 받았어요. 내용을 조금 바꿔서 다시 시도해주세요.");
  }
  if (message.stop_reason === "max_tokens") {
    throw new Error("대본이 너무 길어져 중간에 끊겼어요. 다시 시도해주세요.");
  }
  const text = message.content.filter((b) => b.type === "text").map((b) => b.text).join("");
  return validateScript(JSON.parse(text), media.map((m) => m.id));
}
