import { spawn } from "node:child_process";
import ffmpegStatic from "ffmpeg-static";
import ffprobeStatic from "ffprobe-static";

// 우선순위: 환경변수 > npm에 포함된 ffmpeg > 시스템 ffmpeg
const FFMPEG = process.env.FFMPEG_PATH || ffmpegStatic || "ffmpeg";
const FFPROBE = process.env.FFPROBE_PATH || ffprobeStatic?.path || "ffprobe";

function run(bin, args) {
  return new Promise((resolve, reject) => {
    const proc = spawn(bin, args, { stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    proc.stdout.on("data", (d) => (stdout += d));
    proc.stderr.on("data", (d) => (stderr += d));
    proc.on("error", reject);
    proc.on("close", (code) => {
      if (code === 0) resolve({ stdout, stderr });
      else reject(new Error(`${bin} 실패 (code ${code}):\n${stderr.slice(-2000)}`));
    });
  });
}

export function ffmpeg(args) {
  return run(FFMPEG, ["-hide_banner", "-loglevel", "error", "-y", ...args]);
}

export async function probeDuration(file) {
  const { stdout } = await run(FFPROBE, [
    "-v", "error",
    "-show_entries", "format=duration",
    "-of", "default=noprint_wrappers=1:nokey=1",
    file,
  ]);
  const seconds = parseFloat(stdout.trim());
  if (!Number.isFinite(seconds)) throw new Error(`길이를 읽을 수 없음: ${file}`);
  return seconds;
}

// ffmpeg 필터 인자 안에서 쓰는 경로 이스케이프 (ass=..., fontsdir=...)
export function filterPath(p) {
  return p.replace(/\\/g, "/").replace(/:/g, "\\:").replace(/'/g, "\\'");
}

/** 자막(libass)·움직임(zoompan) 필터가 있는 ffmpeg인지 확인 */
export async function checkFfmpeg() {
  try {
    const { stdout } = await run(FFMPEG, ["-hide_banner", "-filters"]);
    const missing = ["ass", "zoompan"].filter((f) => !new RegExp(`\\s${f}\\s`).test(stdout));
    if (missing.length) {
      console.warn(`⚠️  ffmpeg에 필요한 기능이 없어요: ${missing.join(", ")}`);
      return { ok: false, missing };
    }
    return { ok: true };
  } catch (err) {
    console.warn(`⚠️  ffmpeg를 실행할 수 없어요: ${err.message}`);
    return { ok: false, error: err.message };
  }
}
