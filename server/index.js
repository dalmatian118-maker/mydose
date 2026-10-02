import path from "node:path";
import fs from "node:fs";
import crypto from "node:crypto";
import os from "node:os";
import { exec } from "node:child_process";
import express from "express";
import multer from "multer";
import { ROOT, DATA_DIR, getConfig, providerStatus, publicSettings, updateSettings, exportClassSettings, importSettings } from "./config.js";
import { checkFfmpeg } from "./lib/ffmpeg.js";
import { startTunnel, stopTunnel } from "./lib/tunnel.js";
import { ensureFonts } from "./lib/fonts.js";
import { createProject, getProject, projectDir, publicView, save, cleanupOld, setQueuePositionProvider } from "./store.js";
import { makePreview, mediaKind } from "./pipeline/media.js";
import { generateScript } from "./pipeline/script.js";
import { validateScript } from "./pipeline/schema.js";
import { enqueueRender, queuePosition } from "./pipeline/render.js";
import { VOICE_OPTIONS, normalizeVoice, prepareSceneVoice, searchElevenLabsVoices, resolveElevenLabsVoice } from "./pipeline/voice.js";

const MAX_MEDIA = 8;
const BUSY = ["queued", "scripting", "rendering"];
const config = getConfig();
setQueuePositionProvider(queuePosition);

const app = express();
app.set("trust proxy", true);
app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(ROOT, "public")));

// ---------- 수업 서버 모드: 수업 코드를 아는 사람만 사용 ----------
const CODE_COOKIE = "reels_class";
const codeToken = (code) => crypto.createHash("sha256").update(`reels:${code.trim().toLowerCase()}`).digest("hex");

function isAuthed(req) {
  if (!config.hosted || !config.classCode) return true;
  const cookie = (req.headers.cookie || "").split(";").map((c) => c.trim().split("=")).find(([k]) => k === CODE_COOKIE);
  return cookie?.[1] === codeToken(config.classCode);
}

app.post("/api/login", async (req, res) => {
  const code = String(req.body?.code || "");
  if (!config.classCode || codeToken(code) !== codeToken(config.classCode)) {
    await new Promise((r) => setTimeout(r, 800)); // 무작위 대입 늦추기
    return res.status(401).json({ error: "수업 코드가 맞지 않아요" });
  }
  // Hugging Face 페이지 안(iframe)에서도 동작하도록 SameSite=None; Secure
  const secure = req.secure ? "; SameSite=None; Secure" : "; SameSite=Lax";
  res.setHeader("Set-Cookie", `${CODE_COOKIE}=${codeToken(config.classCode)}; Path=/; HttpOnly; Max-Age=${60 * 60 * 24 * 7}${secure}`);
  res.json({ ok: true });
});

app.use(["/api", "/files"], (req, res, next) => {
  if (req.path === "/status" || isAuthed(req)) return next();
  res.status(401).json({ error: "수업 코드를 먼저 입력해주세요", needCode: true });
});

// 수업 서버에서는 API 키를 화면에서 바꿀 수 없음 (서버 Secrets로만 관리)
app.use("/api/settings", (_req, res, next) => {
  if (config.hosted) return res.status(403).json({ error: "수업 서버에서는 선생님만 서버 설정에서 키를 바꿀 수 있어요" });
  next();
});

app.use("/files", express.static(DATA_DIR));

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, _file, cb) => cb(null, path.join(projectDir(req.project.id), "uploads")),
    filename: (_req, file, cb) => cb(null, `${Date.now()}_${Math.random().toString(36).slice(2, 8)}${path.extname(file.originalname).toLowerCase()}`),
  }),
  limits: { fileSize: config.uploadLimitMB * 1024 * 1024, files: MAX_MEDIA + 1 },
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

const ffmpegCheck = checkFfmpeg();

let publicUrl = null; // 인터넷 임시 주소 (TUNNEL=1 일 때)

/** 학생들이 접속할 주소: 인터넷 주소(있으면) + 같은 와이파이 주소 (예: http://192.168.0.12:3000) */
function studentUrls() {
  const urls = publicUrl ? [publicUrl] : [];
  for (const list of Object.values(os.networkInterfaces())) {
    for (const a of list || []) {
      if (a.family === "IPv4" && !a.internal && !a.address.startsWith("169.254.")) urls.push(`http://${a.address}:${config.port}`);
    }
  }
  return urls;
}
// 인터넷 주소(터널)로 들어온 요청도 이 컴퓨터에서 온 것처럼 보이므로, 프록시 헤더가 없을 때만 '선생님 화면'으로 봅니다.
const isLocalRequest = (req) =>
  ["127.0.0.1", "::1", "::ffff:127.0.0.1"].includes(req.socket.remoteAddress) &&
  !req.headers["cf-connecting-ip"] &&
  !req.headers["x-forwarded-for"];

app.get("/api/status", async (req, res) => {
  res.json({
    // 선생님 컴퓨터를 수업 서버로 쓸 때, 선생님 화면에만 학생 접속 주소를 보여줍니다
    studentUrls: config.hosted && isLocalRequest(req) && (config.host !== "127.0.0.1" || publicUrl) ? studentUrls() : [],
    providers: providerStatus(),
    model: config.claudeModel,
    ffmpeg: await ffmpegCheck,
    voiceOptions: VOICE_OPTIONS,
    hosted: config.hosted,
    authed: isAuthed(req),
    uploadLimitMB: config.uploadLimitMB,
  });
});

// API 키 설정 (이 컴퓨터에만 저장, 화면에는 끝 4자리만)
app.get("/api/settings", (_req, res) => res.json(publicSettings()));
app.put("/api/settings", (req, res) => {
  updateSettings(req.body || {});
  res.json({ settings: publicSettings(), providers: providerStatus() });
});

// 선생님용: 반 공용 설정 파일 내려받기
app.get("/api/settings/class-export", (_req, res) => {
  res.setHeader("Content-Disposition", 'attachment; filename="class-settings.json"');
  res.json(exportClassSettings());
});

// 학생용: 받은 설정 파일 불러오기
app.post("/api/settings/import", (req, res) => {
  try {
    const fields = importSettings(req.body || {});
    res.json({ imported: fields, settings: publicSettings(), providers: providerStatus() });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ElevenLabs 한국어 목소리 찾기 (성별·연령대)
app.get("/api/voices/elevenlabs", async (req, res) => {
  if (providerStatus().voice !== "elevenlabs") return res.status(400).json({ error: "ElevenLabs API 키를 먼저 설정해주세요" });
  const { gender, age } = normalizeVoice(req.query);
  res.json(await searchElevenLabsVoices({ gender, age }));
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
    try {
      project.voice = normalizeVoice(JSON.parse(req.body.voice || "{}"));
    } catch {}

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
  if (BUSY.includes(req.project.stage)) return res.status(409).json({ error: "작업 중이에요. 잠시 후 다시 시도해주세요" });
  runScript(req.project);
  res.json(publicView(req.project));
});

// 2단계: 학생이 고친 대본 저장
app.put("/api/projects/:id/script", loadProject, (req, res) => {
  const project = req.project;
  if (BUSY.includes(project.stage)) return res.status(409).json({ error: "작업 중에는 대본을 바꿀 수 없어요" });
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

// 목소리 선택 저장
app.put("/api/projects/:id/voice", loadProject, (req, res) => {
  const project = req.project;
  if (BUSY.includes(project.stage)) return res.status(409).json({ error: "작업 중에는 바꿀 수 없어요" });
  project.voice = normalizeVoice(req.body);
  save(project);
  res.json(publicView(project));
});

// 목소리 미리 듣기: 대본 앞부분을 실제 목소리로 읽어봅니다
app.post("/api/projects/:id/voice/preview", loadProject, async (req, res) => {
  const project = req.project;
  if (providerStatus().voice === "silent") return res.status(400).json({ error: "목소리 API 키(ElevenLabs 또는 OpenAI)를 먼저 설정해주세요" });
  let voice = normalizeVoice(req.body);
  if (providerStatus().voice === "elevenlabs") voice = await resolveElevenLabsVoice(voice);
  const text = project.script?.scenes.slice(0, 2).map((s) => s.narration).join(" ") || "안녕하세요. 제 브랜드 이야기를 들려드릴게요.";
  if (project.voicePreview) fs.rmSync(project.voicePreview, { force: true });
  const outPath = path.join(projectDir(project.id), `voice_preview_${Date.now()}.wav`);
  await prepareSceneVoice({ text, voice, voiceTone: project.script?.voice_tone || "", outPath });
  project.voice = voice;
  project.voicePreview = outPath;
  save(project);
  res.json(publicView(project));
});

// 3단계: 영상 만들기
app.post("/api/projects/:id/render", loadProject, (req, res) => {
  const project = req.project;
  if (!project.script) return res.status(400).json({ error: "대본이 아직 없어요" });
  if (BUSY.includes(project.stage)) return res.status(409).json({ error: "이미 작업 중이에요" });
  enqueueRender(project).catch((err) => {
    console.error(err);
    const running = project.steps?.find((s) => s.status === "running");
    if (running) running.status = "error";
    project.stage = "error";
    project.error = `영상 생성 실패: ${err.message.split("\n")[0]}`;
    save(project);
  });
  res.json(publicView(project));
});

app.use((err, _req, res, _next) => {
  if (err.code === "LIMIT_FILE_SIZE") return res.status(413).json({ error: `파일 하나는 ${config.uploadLimitMB}MB 이하만 올릴 수 있어요. 영상은 짧게 잘라서 올려주세요.` });
  console.error(err);
  res.status(500).json({ error: err.message });
});

await ensureFonts();
if (config.hosted) {
  if (!config.classCode) console.warn("⚠️  CLASS_CODE 가 없어서 링크를 아는 누구나 쓸 수 있어요. 수업 코드를 설정하세요.");
  // 학생 사진·영상이 서버에 오래 남지 않도록 정리
  cleanupOld(config.keepHours);
  setInterval(() => cleanupOld(config.keepHours), 3600_000).unref();
}
const { port, host } = config;
// 기본은 127.0.0.1: 이 컴퓨터에서만 접속 가능 (같은 와이파이의 다른 사람이 API 키를 쓰지 못하게)
app.listen(port, host, async () => {
  const url = `http://localhost:${port}`;
  const p = providerStatus();
  console.log(`\n🎬 브랜드 릴스 스튜디오: ${url}`);
  console.log(`   대본: ${p.script} | 스톡: ${p.stock} | 이미지: ${p.image} | 목소리: ${p.voice} | 영상: ${p.video}`);
  if (config.hosted) {
    console.log(`   수업 서버 모드 · 동시 제작 ${config.renderConcurrency}편 · ${host}:${port}`);
    const urls = studentUrls();
    if (urls.length && !process.env.SPACE_ID) {
      console.log("\n   👩‍🏫 학생들은 같은 와이파이에서 아래 주소로 접속하세요:");
      for (const u of urls) console.log(`      ${u}`);
      console.log("");
    }
  }
  console.log("   끝내려면 이 창을 닫거나 Ctrl+C 를 누르세요.\n");
  if (process.env.OPEN_BROWSER === "1") openBrowser(url);
  if (process.env.TUNNEL === "1") {
    console.log("   🌐 인터넷 주소를 만드는 중이에요 (최대 40초)...");
    publicUrl = await startTunnel(port);
    if (publicUrl) {
      console.log(`\n   🌐 인터넷 주소 (랜선·와이파이·휴대폰 어디서나): ${publicUrl}\n`);
    } else {
      console.log("   ⚠️  인터넷 주소를 만들지 못했어요. 같은 와이파이 주소로만 접속할 수 있어요.\n");
    }
  }
});

for (const sig of ["SIGINT", "SIGTERM", "SIGHUP"]) {
  process.on(sig, () => {
    stopTunnel();
    process.exit(0);
  });
}

function openBrowser(url) {
  const cmd = process.platform === "win32" ? `start "" "${url}"` : process.platform === "darwin" ? `open "${url}"` : `xdg-open "${url}"`;
  exec(cmd, () => {});
}
