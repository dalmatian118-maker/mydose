import { VIDEO } from "../config.js";
import { ffmpeg } from "../lib/ffmpeg.js";

// 장면 영상 클립 만들기.
//  - 사진(생성/업로드): 켄 번즈 효과(천천히 확대·축소·이동)로 움직임을 줍니다.
//  - 업로드 영상: 장면 길이에 맞게 자르고(짧으면 반복) 9:16으로 맞춥니다.
// AI 영상 생성 API(Runway, Kling, Veo 등)를 붙이려면 이 파일에 provider를 추가하면 됩니다.

const { width: W, height: H, fps: FPS } = VIDEO;
const ENCODE = ["-c:v", "libx264", "-preset", "veryfast", "-crf", "20", "-pix_fmt", "yuv420p", "-r", String(FPS), "-an"];

function zoompanExpr(motion, frames) {
  const p = `(on/${frames})`;
  const center = { x: "iw/2-(iw/zoom/2)", y: "ih/2-(ih/zoom/2)" };
  switch (motion) {
    case "zoom_out":
      return { z: `1.15-0.15*${p}`, ...center };
    case "pan_left":
      return { z: "1.15", x: `(iw-iw/zoom)*(1-${p})`, y: center.y };
    case "pan_right":
      return { z: "1.15", x: `(iw-iw/zoom)*${p}`, y: center.y };
    case "static":
      return { z: `1.03+0.02*${p}`, ...center };
    case "zoom_in":
    default:
      return { z: `1+0.15*${p}`, ...center };
  }
}

export async function clipFromImage({ image, seconds, motion, outPath }) {
  const frames = Math.max(1, Math.round(seconds * FPS));
  const { z, x, y } = zoompanExpr(motion, frames);
  // 2배로 키운 뒤 zoompan 하면 움직임이 덜 떨립니다.
  const vf = [
    `scale=${W * 2}:${H * 2}:force_original_aspect_ratio=increase`,
    `crop=${W * 2}:${H * 2}`,
    `zoompan=z='${z}':x='${x}':y='${y}':d=${frames}:s=${W}x${H}:fps=${FPS}`,
  ].join(",");
  await ffmpeg(["-i", image, "-vf", vf, "-frames:v", String(frames), ...ENCODE, outPath]);
  return outPath;
}

export async function clipFromVideo({ video, seconds, outPath }) {
  const vf = `scale=${W}:${H}:force_original_aspect_ratio=increase,crop=${W}:${H},fps=${FPS},setsar=1`;
  await ffmpeg(["-stream_loop", "-1", "-i", video, "-t", seconds.toFixed(3), "-vf", vf, ...ENCODE, outPath]);
  return outPath;
}
