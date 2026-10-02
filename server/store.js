import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { DATA_DIR } from "./config.js";
import { DEFAULT_VOICE } from "./pipeline/voice.js";

// 프로젝트 = 학생 한 명의 릴스 작업 1건. data/projects/<id>/project.json 에 저장됩니다.
const cache = new Map();

export function projectDir(id) {
  return path.join(DATA_DIR, id);
}

export function createProject(brief) {
  const id = crypto.randomUUID().slice(0, 12);
  fs.mkdirSync(path.join(projectDir(id), "uploads"), { recursive: true });
  const project = {
    id,
    createdAt: new Date().toISOString(),
    brief,
    media: [],
    bgm: null,
    voice: { ...DEFAULT_VOICE },
    script: null,
    stage: "new", // new → scripting → script_ready → rendering → done | error
    steps: [],
    warnings: [],
    uploadWarnings: [],
    error: null,
    output: null,
  };
  save(project);
  return project;
}

export function getProject(id) {
  if (!/^[a-f0-9-]{12}$/.test(id)) return null;
  if (cache.has(id)) return cache.get(id);
  const file = path.join(projectDir(id), "project.json");
  if (!fs.existsSync(file)) return null;
  const project = JSON.parse(fs.readFileSync(file, "utf8"));
  cache.set(id, project);
  return project;
}

export function save(project) {
  cache.set(project.id, project);
  fs.writeFileSync(path.join(projectDir(project.id), "project.json"), JSON.stringify(project, null, 2));
}

/** 브라우저로 보낼 때는 서버 내부 경로를 빼고 보냅니다. */
export function publicView(project) {
  const url = (p) => (p ? `/files/${project.id}/${path.relative(projectDir(project.id), p).split(path.sep).join("/")}` : null);
  return {
    id: project.id,
    brief: project.brief,
    media: project.media.map((m) => ({ id: m.id, kind: m.kind, description: m.description, preview: url(m.previewPath) })),
    hasBgm: Boolean(project.bgm),
    voice: { ...DEFAULT_VOICE, ...project.voice },
    voicePreview: project.voicePreview ? url(project.voicePreview) : null,
    script: project.script,
    stage: project.stage,
    steps: project.steps,
    warnings: [...(project.uploadWarnings || []), ...project.warnings],
    error: project.error,
    output: project.output && {
      video: url(project.output.video),
      cover: url(project.output.cover),
      duration: project.output.duration,
      credits: project.output.credits || [],
      scenes: project.output.scenes?.map((s) => ({ image: url(s.image) })),
    },
  };
}
