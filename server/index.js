import path from "node:path";
import fs from "node:fs";
import express from "express";
import multer from "multer";
import { ROOT, DATA_DIR, config, providerStatus } from "./config.js";
import { ensureFonts } from "./lib/fonts.js";
import { createProject, getProject, projectDir, publicView, save } from "./store.js";
import { makePreview, mediaKind } from "./pipeline/media.js";
import { generateScript } from "./pipeline/script.js";
import { validateScript } from "./pipeline/schema.js";
import { renderProject } from "./pipeline/render.js";

const MAX_MEDIA = 8;

const app = express();
app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(ROOT, "public")));
app.use("/files", express.static(DATA_DIR));

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, _file, cb) => cb(null, path.join(projectDir(req.project.id), "uploads")),
    filename: (_req, file, cb) => cb(null, `${Date.now()}_${Math.random().toString(36).slice(2, 8)}${path.extname(file.originalname).toLowerCase()}`),
  }),
  limits: { fileSize: 200 * 1024 * 1024, files: MAX_MEDIA + 1 },
});

function loadProject(req, res, next) {
  const project = getProject(req.params.id);
  if (!project) return res.status(404).json({ error: "프로젝트를 찾을 수 없어요" });
  req.project = project;
  next();
}

async function runScript(project) {
  project.stage = "scripting";
  project.error = null;
  save(project);
  try {
    project.script = await generateScript(project.brief, project.media);
    project.stage = "script_ready";
  } catch (err) {
    console.error(err);
    project.stage = "error";
    project.error = `대본 생성 실패: ${err.message}`;
  }
  save(project);
}

app.get("/api/status", (_req, res) => {
  res.json({ providers: providerStatus(), model: config.claudeModel });
});

// 1단계: 브랜드 스토리 + 미디어 업로드 → 대본 생성 시작
app.post(
  "/api/projects",
  (req, _res, next) => {
    req.project = createProject({});
    next();
  },
  upload.fields([{ name: "media", maxCount: MAX_MEDIA }, { name: "bgm", maxCount: 1 }]),
  async (req, res) => {
    const project = req.project;
    const { brandName = "", story = "", audience = "", tone = "" } = req.body;
    if (story.trim().length < 30) {
      fs.rmSync(projectDir(project.id), { recursive: true, force: true });
      return res.status(400).json({ error: "브랜드 스토리를 30자 이상 써주세요" });
    }
    project.brief = { brandName: brandName.trim(), story: story.trim(), audience: audience.trim(), tone: tone.trim() };

    let descriptions = [];
    try {
      descriptions = JSON.parse(req.body.mediaDescriptions || "[]");
    } catch {}
    const files = req.files?.media || [];
    for (const [i, file] of files.entries()) {
      const kind = mediaKind(file.mimetype, file.originalname);
      if (kind !== "image" && kind !== "video") continue;
      const media = { id: `m${project.media.length + 1}`, kind, file: file.path, description: String(descriptions[i] || "").slice(0, 200) };
      try {
        media.previewPath = await makePreview(media, path.dirname(file.path));
        project.media.push(media);
      } catch (err) {
        console.warn(`미디어 처리 실패 (${file.originalname}):`, err.message);
        project.uploadWarnings.push(`'${file.originalname}' 파일은 읽을 수 없어서 뺐어요 (jpg, png, mp4, mov 권장).`);
      }
    }
    const bgm = req.files?.bgm?.[0];
    if (bgm && mediaKind(bgm.mimetype, bgm.originalname) === "audio") project.bgm = bgm.path;

    save(project);
    runScript(project);
    res.status(201).json(publicView(project));
  },
);

app.get("/api/projects/:id", loadProject, (req, res) => res.json(publicView(req.project)));

app.post("/api/projects/:id/script/regenerate", loadProject, (req, res) => {
  if (["scripting", "rendering"].includes(req.project.stage)) return res.status(409).json({ error: "작업 중이에요. 잠시 후 다시 시도해주세요" });
  runScript(req.project);
  res.json(publicView(req.project));
});

// 2단계: 학생이 고친 대본 저장
app.put("/api/projects/:id/script", loadProject, (req, res) => {
  const project = req.project;
  if (["scripting", "rendering"].includes(project.stage)) return res.status(409).json({ error: "작업 중에는 대본을 바꿀 수 없어요" });
  try {
    project.script = validateScript(req.body, project.media.map((m) => m.id));
  } catch (err) {
    const msg = err.issues?.map((i) => i.message).join(", ") || err.message;
    return res.status(400).json({ error: `대본 형식 오류: ${msg}` });
  }
  project.stage = "script_ready";
  save(project);
  res.json(publicView(project));
});

// 3단계: 영상 만들기
app.post("/api/projects/:id/render", loadProject, (req, res) => {
  const project = req.project;
  if (!project.script) return res.status(400).json({ error: "대본이 아직 없어요" });
  if (["scripting", "rendering"].includes(project.stage)) return res.status(409).json({ error: "이미 작업 중이에요" });
  renderProject(project).catch((err) => {
    console.error(err);
    const running = project.steps.find((s) => s.status === "running");
    if (running) running.status = "error";
    project.stage = "error";
    project.error = `영상 생성 실패: ${err.message.split("\n")[0]}`;
    save(project);
  });
  res.json(publicView(project));
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: err.message });
});

await ensureFonts();
app.listen(config.port, () => {
  const p = providerStatus();
  console.log(`\n🎬 브랜드 릴스 스튜디오: http://localhost:${config.port}`);
  console.log(`   대본: ${p.script === "demo" ? "데모 대본" : config.claudeModel} | 이미지: ${p.image} | 목소리: ${p.voice} | 영상: ${p.video}\n`);
});
