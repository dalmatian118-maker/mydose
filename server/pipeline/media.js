import path from "node:path";
import { ffmpeg } from "../lib/ffmpeg.js";

/**
 * 업로드된 사진/영상에서 Claude에게 보여줄 미리보기(JPEG, 최대 1024px)를 만듭니다.
 * 영상은 1초 지점 프레임을 사용합니다 (너무 짧으면 첫 프레임).
 */
export async function makePreview(media, dir) {
  const previewPath = path.join(dir, `${media.id}_preview.jpg`);
  const scale = "scale='min(1024,iw)':'min(1024,ih)':force_original_aspect_ratio=decrease";
  if (media.kind === "video") {
    try {
      await ffmpeg(["-ss", "1", "-i", media.file, "-frames:v", "1", "-vf", scale, "-q:v", "3", previewPath]);
    } catch {
      await ffmpeg(["-i", media.file, "-frames:v", "1", "-vf", scale, "-q:v", "3", previewPath]);
    }
  } else {
    await ffmpeg(["-i", media.file, "-frames:v", "1", "-vf", scale, "-q:v", "3", previewPath]);
  }
  return previewPath;
}

const IMAGE_EXT = [".jpg", ".jpeg", ".png", ".webp"];
const VIDEO_EXT = [".mp4", ".mov", ".m4v", ".webm"];
const AUDIO_EXT = [".mp3", ".m4a", ".wav", ".aac", ".ogg"];

/** 브라우저마다 MIME 타입이 다르게 올 수 있어 확장자도 함께 봅니다. */
export function mediaKind(mimetype = "", filename = "") {
  const ext = path.extname(filename).toLowerCase();
  if (mimetype.startsWith("image/") || IMAGE_EXT.includes(ext)) return "image";
  if (mimetype.startsWith("video/") || VIDEO_EXT.includes(ext)) return "video";
  if (mimetype.startsWith("audio/") || AUDIO_EXT.includes(ext)) return "audio";
  return null;
}
