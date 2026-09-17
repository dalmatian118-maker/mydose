#!/usr/bin/env node
import { Command } from 'commander';
import path from 'node:path';
import fs from 'node:fs/promises';
import { config } from './config.js';
import { generateScript } from './scriptGenerator.js';
import { HypitClient, generatePlaceholderClip, ensureDir } from './hypitClient.js';
import { composeShort } from './videoEditor.js';

const program = new Command();

program
  .name('shorts')
  .description('Generate a viral short-form video script and render it into a finished clip.')
  .option('-t, --topic <topic>', 'topic/idea for the short (omit to let the model pick one)')
  .option('-n, --name <name>', 'output folder name (default: timestamp)')
  .option('--dry-run', 'skip the Hypit API and use local placeholder clips instead', false)
  .parse(process.argv);

const opts = program.opts();

async function main() {
  const runName = opts.name ?? `short-${Date.now()}`;
  const workDir = path.join(config.paths.output, runName);
  ensureDir(workDir);

  console.log('▶ Generating script...');
  const script = await generateScript(opts.topic);
  await fs.writeFile(path.join(workDir, 'script.json'), JSON.stringify(script, null, 2));
  console.log(`  "${script.title}" — ${script.scenes.length} scenes, mood: ${script.musicMood}`);

  const useDryRun = opts.dryRun || !config.hypit.apiKey;
  if (useDryRun && !opts.dryRun) {
    console.log('  (no HYPIT_API_KEY set — falling back to placeholder clips; pass --dry-run to silence this)');
  }

  const hypit = useDryRun ? null : new HypitClient();
  const clipPaths = [];

  for (const [i, scene] of script.scenes.entries()) {
    const clipPath = path.join(workDir, `scene-${i + 1}.mp4`);
    console.log(`▶ Rendering scene ${i + 1}/${script.scenes.length}...`);
    if (useDryRun) {
      await generatePlaceholderClip({ prompt: scene.visualPrompt, durationSec: scene.durationSec, outputPath: clipPath });
    } else {
      await hypit.generateClip({ prompt: scene.visualPrompt, durationSec: scene.durationSec, outputPath: clipPath });
    }
    clipPaths.push(clipPath);
  }

  console.log('▶ Composing final short (subtitles + music)...');
  const outputPath = path.join(workDir, 'final.mp4');
  await composeShort({ clipPaths, scenes: script.scenes, musicMood: script.musicMood, workDir, outputPath });

  await fs.writeFile(
    path.join(workDir, 'caption.txt'),
    `${script.caption}\n\n${script.hashtags.map((h) => `#${h}`).join(' ')}\n`
  );

  console.log(`\n✅ Done: ${outputPath}`);
}

main().catch((err) => {
  console.error('✖', err.message);
  process.exit(1);
});
