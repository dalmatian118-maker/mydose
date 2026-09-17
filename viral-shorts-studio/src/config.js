import 'dotenv/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

export const config = {
  anthropicApiKey: process.env.ANTHROPIC_API_KEY ?? '',
  hypit: {
    apiKey: process.env.HYPIT_API_KEY ?? '',
    baseUrl: process.env.HYPIT_API_BASE_URL ?? 'https://api.hypit.ai',
    model: process.env.HYPIT_MODEL ?? 'seedance',
  },
  paths: {
    root: projectRoot,
    output: path.join(projectRoot, 'output'),
    music: path.join(projectRoot, 'assets', 'music'),
  },
};
