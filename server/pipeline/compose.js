import fs from "node:fs";
import path from "node:path";
import { FONTS_DIR } from "../config.js";
import { ffmpeg, filterPath } from "../lib/ffmpeg.js";

/**
 * 장면 클립 + 장면 음성 + 자막(+배경음악)을 합쳐 최종 mp4를 만듭니다.
 */
export async function compose({ dir, clips, voices, timing, assPath, bgm, outPath }) {
  // 1) 영상 클립 이어 붙이기 (같은 인코딩 설정이라 재인코딩 없이)
  const listFile = path.join(dir, "clips.txt");
  fs.writeFileSync(listFile, clips.map((c) => `file '${path.resolve(c).replace(/'/g, "'\\''")}'`).join("\n"));
  const silentVideo = path.join(dir, "video_noaudio.mp4");
  await ffmpeg(["-f", "concat", "-safe", "0", "-i", listFile, "-c", "copy", silentVideo]);

  // 2) 음성: 장면마다 속도 조절 → 장면 길이에 맞춰 무음 채우기 → 순서대로 잇기
  const inputs = ["-i", silentVideo];
  voices.forEach((v) => inputs.push("-i", v));
  const filters = [];
  voices.forEach((_, i) => {
    const tempo = timing.tempo !== 1 ? `atempo=${timing.tempo},` : "";
    filters.push(`[${i + 1}:a]${tempo}apad,atrim=0:${timing.scenes[i]},asetpts=PTS-STARTPTS[a${i}]`);
  });
  filters.push(`${voices.map((_, i) => `[a${i}]`).join("")}concat=n=${voices.length}:v=0:a=1[voice]`);

  let audioOut = "[voice]";
  if (bgm) {
    // 배경음악은 작게 깔고 끝에서 서서히 줄입니다.
    const bgmIndex = voices.length + 1;
    inputs.push("-stream_loop", "-1", "-i", bgm);
    const fadeStart = Math.max(0, timing.total - 1.5);
    filters.push(`[${bgmIndex}:a]aformat=sample_rates=44100:channel_layouts=mono,volume=0.12,atrim=0:${timing.total},afade=t=out:st=${fadeStart}:d=1.5[bgm]`);
    filters.push(`[voice][bgm]amix=inputs=2:duration=first:normalize=0[mix]`);
    audioOut = "[mix]";
  }

  // 3) 자막 입히기
  filters.push(`[0:v]ass='${filterPath(assPath)}':fontsdir='${filterPath(FONTS_DIR)}'[v]`);

  await ffmpeg([
    ...inputs,
    "-filter_complex", filters.join(";"),
    "-map", "[v]", "-map", audioOut,
    "-c:v", "libx264", "-preset", "medium", "-crf", "20", "-pix_fmt", "yuv420p",
    "-c:a", "aac", "-b:a", "160k", "-ar", "44100",
    "-t", String(timing.total),
    "-movflags", "+faststart",
    outPath,
  ]);
  fs.rmSync(silentVideo, { force: true });
  return outPath;
}

export async function makeCover(video, outPath) {
  await ffmpeg(["-ss", "0.6", "-i", video, "-frames:v", "1", "-q:v", "3", outPath]);
  return outPath;
}
