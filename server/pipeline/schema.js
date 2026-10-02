import { z } from "zod";
import { HOOK_TYPES, SCENE_ROLES } from "./playbook.js";

const Scene = z.object({
  role: z.enum(Object.keys(SCENE_ROLES)),
  narration: z.string().trim().min(1, "내레이션이 비어 있는 장면이 있어요"),
  on_screen_text: z.string().default(""),
  media_id: z.string().default(""),
  // 직접 올린 미디어가 없을 때 화면 채우는 방법: 무료 스톡 영상 또는 AI 이미지
  visual: z.enum(["stock", "ai"]).default("stock"),
  stock_query: z.string().max(100).default(""),
  image_prompt: z.string().default(""),
  motion: z.enum(["zoom_in", "zoom_out", "pan_left", "pan_right", "static"]).default("zoom_in"),
  est_seconds: z.number().positive().max(15),
});

export const ScriptSchema = z.object({
  title: z.string(),
  concept: z.string(),
  hook_options: z.array(
    z.object({
      type: z.enum(Object.keys(HOOK_TYPES)),
      narration: z.string(),
      on_screen_text: z.string(),
      why: z.string(),
    }),
  ),
  structure_notes: z.string(),
  visual_style: z.string(),
  voice_tone: z.string(),
  scenes: z.array(Scene).min(2, "장면은 2개 이상 필요해요").max(10, "장면은 10개 이하로 해주세요"),
  caption: z.string(),
  hashtags: z.array(z.string()),
  authenticity_check: z.array(z.string()),
});

/** 편집된 대본을 검사하고, 업로드되지 않은 media_id 같은 흔한 실수를 고쳐서 돌려줍니다. */
export function validateScript(raw, mediaIds = []) {
  const script = ScriptSchema.parse(raw);
  for (const scene of script.scenes) {
    if (scene.media_id && !mediaIds.includes(scene.media_id)) scene.media_id = "";
    if (!scene.image_prompt.trim()) scene.image_prompt = "candid vertical photo related to the brand story, natural light";
    if (!scene.stock_query.trim()) scene.stock_query = scene.image_prompt.split(/[,.]/)[0].split(" ").slice(0, 4).join(" ");
  }
  return script;
}
