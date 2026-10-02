import fs from "node:fs";
import path from "node:path";
import { getConfig, providerStatus } from "../config.js";
import { probeDuration } from "../lib/ffmpeg.js";
import { projectDir, save } from "../store.js";
import { prepareSceneImage } from "./images.js";
import { prepareSceneVoice, normalizeVoice, resolveElevenLabsVoice, describeVoice, estimateSpeechSeconds } from "./voice.js";
import { fetchStock, stockAvailable } from "./stock.js";
import { planTiming } from "./timing.js";
import { clipFromImage, clipFromVideo } from "./video.js";
import { buildAss } from "./subtitles.js";
import { compose, makeCover } from "./compose.js";

const STEPS = [
  ["images", "화면 준비 (사진·스톡 영상·이미지)"],
  ["voice", "목소리 생성"],
  ["video", "장면 영상 만들기"],
  ["subtitles", "자막 생성"],
  ["compose", "릴스 합성"],
];

/** 동시에 n개까지만 실행 (API 호출·인코딩이 몰리지 않게) */
async function mapLimit(items, n, fn) {
  const results = new Array(items.length);
  let next = 0;
  const workers = Array.from({ length: Math.min(n, items.length) }, async () => {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i], i);
    }
  });
  await Promise.all(workers);
  return results;
}

// ---------- 대기열: 서버 한 대를 반 전체가 쓸 때 동시에 몇 편만 만들고 나머지는 순서대로 ----------
const waiting = [];
let running = 0;

export function queuePosition(id) {
  return waiting.findIndex((w) => w.project.id === id) + 1; // 0 = 대기 중 아님
}

function pump() {
  while (running < getConfig().renderConcurrency && waiting.length) {
    const { project, resolve, reject } = waiting.shift();
    running++;
    renderProject(project)
      .then(resolve, reject)
      .finally(() => {
        running--;
        pump();
      });
  }
}

/** 렌더링을 대기열에 넣습니다. 끝나면 resolve */
export function enqueueRender(project) {
  project.stage = "queued";
  project.error = null;
  project.steps = [];
  save(project);
  return new Promise((resolve, reject) => {
    waiting.push({ project, resolve, reject });
    pump();
  });
}

export async function renderProject(project) {
  const dir = path.join(projectDir(project.id), "render");
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });

  const providers = providerStatus();
  project.stage = "rendering";
  project.error = null;
  project.output = null;
  project.warnings = [];
  project.steps = STEPS.map(([key, label]) => ({ key, label, status: "pending", detail: "" }));
  if (providers.voice === "silent") project.warnings.push("목소리 생성 API 키(ElevenLabs 또는 OpenAI)가 없어 무음 + 자막 버전으로 만들어요.");
  save(project);

  const step = (key, status, detail = "") => {
    const s = project.steps.find((x) => x.key === key);
    s.status = status;
    s.detail = detail;
    save(project);
  };

  const { script } = project;
  const scenes = script.scenes;
  const mediaById = Object.fromEntries(project.media.map((m) => [m.id, m]));

  // 1) 화면: 직접 올린 사진·영상 > 무료 스톡 영상 > AI 이미지 > 색상 카드
  step("images", "running");
  let done = 0;
  const usedStock = new Set();
  const credits = [];
  const fallbackScenes = [];
  const placeholderScenes = [];
  const visuals = await mapLimit(scenes, 3, async (scene, i) => {
    const media = mediaById[scene.media_id];
    let result;
    if (media?.kind === "video") result = { video: media.file, image: media.previewPath };
    else if (media?.kind === "image") result = { image: media.file };
    else {
      if (scene.visual === "stock" && stockAvailable()) {
        const stock = await fetchStock({
          query: scene.stock_query,
          minSeconds: estimateSpeechSeconds(scene.narration),
          used: usedStock,
          outBase: path.join(dir, `stock${i + 1}`),
        });
        if (stock) {
          result = stock.kind === "video" ? { video: stock.file } : { image: stock.file };
          credits.push({ scene: i + 1, ...stock.credit });
        } else fallbackScenes.push(i + 1);
      }
      if (!result) {
        if (providers.image === "placeholder") placeholderScenes.push(i + 1);
        result = { image: await prepareSceneImage({ scene, index: i, visualStyle: script.visual_style, outPath: path.join(dir, `scene${i + 1}.png`) }) };
      }
    }
    step("images", "running", `${++done}/${scenes.length}`);
    return result;
  });
  if (fallbackScenes.length) project.warnings.push(`${fallbackScenes.join(", ")}번 장면은 맞는 스톡 영상을 찾지 못해 다른 화면으로 채웠어요. 검색어를 바꿔보세요.`);
  if (placeholderScenes.length) project.warnings.push(`${placeholderScenes.join(", ")}번 장면은 색상 카드로 채웠어요. 직접 찍은 사진을 올리거나 '무료 스톡 영상'을 선택해보세요.`);
  step("images", "done", `${scenes.length}장면${credits.length ? ` · 스톡 ${credits.length}` : ""}`);

  // 2) 목소리
  step("voice", "running");
  let voice = normalizeVoice(project.voice);
  if (providers.voice === "elevenlabs") {
    voice = await resolveElevenLabsVoice(voice);
    project.voice = voice;
  }
  done = 0;
  // ElevenLabs는 요금제별 동시 요청 수가 작아서 학생 한 명당 2개씩만 보냅니다.
  const voices = await mapLimit(scenes, 2, async (scene, i) => {
    const out = await prepareSceneVoice({
      text: scene.narration,
      prevText: scenes[i - 1]?.narration,
      nextText: scenes[i + 1]?.narration,
      voice,
      voiceTone: script.voice_tone,
      outPath: path.join(dir, `voice${i + 1}.wav`),
    });
    step("voice", "running", `${++done}/${scenes.length}`);
    return out;
  });
  const voiceSeconds = await Promise.all(voices.map(probeDuration));
  const timing = planTiming(voiceSeconds, scenes.map((s) => s.role));
  if (timing.tempo > 1) project.warnings.push(`30초에 맞추려고 말 속도를 ${Math.round((timing.tempo - 1) * 100)}% 빠르게 했어요.`);
  if (timing.overLimit) project.warnings.push(`대본이 길어서 ${timing.total.toFixed(1)}초가 됐어요. 내레이션을 줄이면 30초 안에 들어와요.`);
  const voiceLabel = voice.voiceName || describeVoice(voice);
  step("voice", "done", providers.voice === "silent" ? "무음" : `${voiceLabel} · ${timing.voice.reduce((a, b) => a + b, 0).toFixed(1)}초`);

  // 3) 장면 영상 클립 (인코딩은 CPU를 많이 써서 2개씩)
  step("video", "running");
  done = 0;
  const clips = await mapLimit(scenes, 2, async (scene, i) => {
    const outPath = path.join(dir, `clip${i + 1}.mp4`);
    const seconds = timing.scenes[i];
    const v = visuals[i];
    if (v.video) await clipFromVideo({ video: v.video, seconds, outPath });
    else await clipFromImage({ image: v.image, seconds, motion: scene.motion, outPath });
    step("video", "running", `${++done}/${scenes.length}`);
    return outPath;
  });
  step("video", "done", `${clips.length}개`);

  // 4) 자막
  step("subtitles", "running");
  const assPath = path.join(dir, "subtitles.ass");
  fs.writeFileSync(assPath, buildAss(scenes, timing, { pointColor: script.point_color }));
  step("subtitles", "done");

  // 5) 합성
  step("compose", "running");
  const video = path.join(projectDir(project.id), "reels.mp4");
  await compose({ dir, clips, voices, timing, assPath, bgm: project.bgm, outPath: video });
  const cover = await makeCover(video, path.join(projectDir(project.id), "cover.jpg"));
  const duration = await probeDuration(video);
  step("compose", "done", `${duration.toFixed(1)}초`);

  credits.sort((a, b) => a.scene - b.scene);
  project.output = { video, cover, duration, credits, scenes: visuals.map((v) => ({ image: v.image })) };
  project.stage = "done";
  save(project);
}
