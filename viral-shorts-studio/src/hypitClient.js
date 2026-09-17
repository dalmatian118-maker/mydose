import fs from 'node:fs';
import fs_promises from 'node:fs/promises';
import path from 'node:path';
import { config } from './config.js';

/**
 * Thin client for Hypit.ai's generation API.
 *
 * NOTE: Hypit's exact request/response contract could not be verified from this
 * environment (network access to hypit.ai is blocked here), so the request shape
 * below is a best-effort placeholder. Once you have real API docs, adjust
 * `buildRequestBody()` and the response handling in `generateClip()` to match.
 * Everything else in this project (script generation, editing) is decoupled from
 * this client, so fixing the HTTP contract here is the only change needed.
 */
export class HypitClient {
  constructor({ apiKey = config.hypit.apiKey, baseUrl = config.hypit.baseUrl, model = config.hypit.model } = {}) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.model = model;
  }

  buildRequestBody({ prompt, durationSec }) {
    return {
      model: this.model,
      prompt,
      duration_seconds: durationSec,
    };
  }

  async generateClip({ prompt, durationSec, outputPath }) {
    if (!this.apiKey) {
      throw new Error(
        'HYPIT_API_KEY is not set. Add it to .env, or run with --dry-run to use placeholder clips instead.'
      );
    }

    const res = await fetch(`${this.baseUrl}/v1/generate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(this.buildRequestBody({ prompt, durationSec })),
    });

    if (!res.ok) {
      throw new Error(`Hypit API request failed: ${res.status} ${res.statusText} - ${await res.text()}`);
    }

    const contentType = res.headers.get('content-type') ?? '';

    if (contentType.includes('application/json')) {
      const data = await res.json();
      const mediaUrl = data.url ?? data.output_url ?? data.video_url;
      if (!mediaUrl) {
        throw new Error(`Unexpected Hypit response shape, no media URL found: ${JSON.stringify(data)}`);
      }
      const mediaRes = await fetch(mediaUrl);
      const buffer = Buffer.from(await mediaRes.arrayBuffer());
      await fs_promises.writeFile(outputPath, buffer);
    } else {
      const buffer = Buffer.from(await res.arrayBuffer());
      await fs_promises.writeFile(outputPath, buffer);
    }

    return outputPath;
  }
}

/**
 * Generates a placeholder clip locally with ffmpeg (a solid color card) so the
 * rest of the pipeline can be built/tested before a real Hypit key is available.
 * The scene's visual prompt still ends up on screen via the burned-in subtitles
 * in videoEditor.js, so placeholder runs stay meaningful to preview.
 */
export async function generatePlaceholderClip({ durationSec, outputPath }) {
  const ffmpegPath = (await import('ffmpeg-static')).default;
  const { spawn } = await import('node:child_process');

  await new Promise((resolve, reject) => {
    const args = [
      '-y',
      '-f', 'lavfi',
      '-i', `color=c=${randomColor()}:s=1080x1920:d=${durationSec}`,
      '-t', String(durationSec),
      outputPath,
    ];
    const proc = spawn(ffmpegPath, args);
    let stderr = '';
    proc.stderr.on('data', (chunk) => { stderr += chunk; });
    proc.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`ffmpeg placeholder generation failed (code ${code}):\n${stderr}`));
    });
  });

  return outputPath;
}

function randomColor() {
  const colors = ['0x1f3a5f', '0x5f1f3a', '0x3a5f1f', '0x5f4a1f', '0x2f2f5f'];
  return colors[Math.floor(Math.random() * colors.length)];
}

export function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}
