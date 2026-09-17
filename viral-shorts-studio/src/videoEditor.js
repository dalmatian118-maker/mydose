import fs from 'node:fs/promises';
import path from 'node:path';
import ffmpegStatic from 'ffmpeg-static';
import ffprobeStatic from 'ffprobe-static';
import ffmpeg from 'fluent-ffmpeg';
import { config } from './config.js';

ffmpeg.setFfmpegPath(ffmpegStatic);
ffmpeg.setFfprobePath(ffprobeStatic.path);

function toSrtTimestamp(seconds) {
  const ms = Math.round((seconds % 1) * 1000);
  const totalSec = Math.floor(seconds);
  const s = totalSec % 60;
  const m = Math.floor(totalSec / 60) % 60;
  const h = Math.floor(totalSec / 3600);
  const pad = (n, len = 2) => String(n).padStart(len, '0');
  return `${pad(h)}:${pad(m)}:${pad(s)},${pad(ms, 3)}`;
}

/** Builds an .srt subtitle file from scene narrations, in order, back to back. */
export async function buildSrt(scenes, outputPath) {
  let cursor = 0;
  const blocks = scenes.map((scene, i) => {
    const start = cursor;
    const end = cursor + scene.durationSec;
    cursor = end;
    return `${i + 1}\n${toSrtTimestamp(start)} --> ${toSrtTimestamp(end)}\n${scene.narration}\n`;
  });
  await fs.writeFile(outputPath, blocks.join('\n'));
  return outputPath;
}

/** Concatenates clips (in order) into a single video file. */
function concatClips(clipPaths, outputPath) {
  return new Promise((resolve, reject) => {
    const command = ffmpeg();
    clipPaths.forEach((clip) => command.input(clip));
    command
      .on('error', reject)
      .on('end', () => resolve(outputPath))
      .mergeToFile(outputPath, path.dirname(outputPath));
  });
}

/** Burns an .srt file into a video as hardcoded subtitles. */
function burnSubtitles(inputPath, srtPath, outputPath) {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .videoFilters(`subtitles=${srtPath.replace(/:/g, '\\:')}`)
      .on('error', reject)
      .on('end', () => resolve(outputPath))
      .save(outputPath);
  });
}

const MOOD_TO_FILENAME = {
  upbeat: 'upbeat.mp3',
  dramatic: 'dramatic.mp3',
  chill: 'chill.mp3',
  suspense: 'suspense.mp3',
  comedic: 'comedic.mp3',
};

/** Finds a background track for the given mood in assets/music, if present. */
async function findMusicTrack(mood) {
  const preferred = path.join(config.paths.music, MOOD_TO_FILENAME[mood] ?? '');
  try {
    await fs.access(preferred);
    return preferred;
  } catch {
    const files = await fs.readdir(config.paths.music).catch(() => []);
    const anyTrack = files.find((f) => /\.(mp3|wav|m4a)$/i.test(f));
    return anyTrack ? path.join(config.paths.music, anyTrack) : null;
  }
}

/** Mixes a background music track under the video's existing audio (if any), looped/trimmed to length, with a fade out. */
function addBackgroundMusic(inputPath, musicPath, outputPath) {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .input(musicPath)
      .inputOptions(['-stream_loop', '-1'])
      .complexFilter([
        '[1:a]volume=0.25[music]',
        '[0:a][music]amix=inputs=2:duration=first:dropout_transition=2[aout]',
      ])
      .outputOptions(['-map', '0:v', '-map', '[aout]', '-shortest'])
      .on('error', reject)
      .on('end', () => resolve(outputPath))
      .save(outputPath);
  });
}

/**
 * Full compose pipeline: concatenate clips -> burn subtitles from scene narration
 * -> mix in background music matching the script's mood (if a track is available).
 */
export async function composeShort({ clipPaths, scenes, musicMood, workDir, outputPath }) {
  const concatPath = path.join(workDir, 'concat.mp4');
  const srtPath = path.join(workDir, 'subtitles.srt');
  const subtitledPath = path.join(workDir, 'subtitled.mp4');

  await concatClips(clipPaths, concatPath);
  await buildSrt(scenes, srtPath);
  await burnSubtitles(concatPath, srtPath, subtitledPath);

  const musicPath = await findMusicTrack(musicMood);
  if (musicPath) {
    await addBackgroundMusic(subtitledPath, musicPath, outputPath);
  } else {
    await fs.copyFile(subtitledPath, outputPath);
  }

  return outputPath;
}
