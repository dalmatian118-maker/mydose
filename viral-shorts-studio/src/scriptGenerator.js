import Anthropic from '@anthropic-ai/sdk';
import { config } from './config.js';

const SYSTEM_PROMPT = `You write short-form video scripts (TikTok/Reels/Shorts, 20-45 seconds)
optimized for high retention and shareability: a hook in the first 2 seconds, a fast pace,
a clear payoff, and a caption+hashtags built for discovery.

Respond with ONLY a JSON object, no prose, no markdown fences, matching this shape:
{
  "title": string,
  "hook": string,               // spoken/on-screen line for the first 2 seconds
  "musicMood": string,          // one of: "upbeat" | "dramatic" | "chill" | "suspense" | "comedic"
  "caption": string,            // social post caption
  "hashtags": string[],         // 5-10 relevant hashtags, no leading #
  "scenes": [
    {
      "narration": string,       // line spoken/captioned during this scene
      "visualPrompt": string,    // a vivid, concrete visual description for a text-to-video model
      "durationSec": number      // 2-6 seconds
    }
  ]
}
Keep the total duration between 20 and 45 seconds. Use 4-8 scenes.`;

export async function generateScript(topic) {
  if (!config.anthropicApiKey) {
    throw new Error(
      'ANTHROPIC_API_KEY is not set. Add it to .env (see .env.example) to generate scripts.'
    );
  }

  const client = new Anthropic({ apiKey: config.anthropicApiKey });

  const userPrompt = topic
    ? `Write a viral short-form video script about: ${topic}`
    : `Pick a broadly appealing, currently-relevant topic and write a viral short-form video script about it.`;

  const response = await client.messages.create({
    model: 'claude-sonnet-5',
    max_tokens: 2000,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userPrompt }],
  });

  const text = response.content
    .filter((block) => block.type === 'text')
    .map((block) => block.text)
    .join('');

  let script;
  try {
    script = JSON.parse(text);
  } catch (err) {
    throw new Error(`Could not parse script JSON from model output: ${err.message}\n${text}`);
  }

  return script;
}
