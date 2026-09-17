# viral-shorts-studio

Node.js pipeline for producing short-form (TikTok/Reels/Shorts) videos end to end:

1. **Script generation** — Claude writes a hook, scene-by-scene narration + visual
   prompts, a caption, hashtags, and a music mood, optimized for retention/shareability.
2. **Clip generation** — each scene's visual prompt is sent to [Hypit.ai](https://hypit.ai/)
   (bring-your-own-key) to render a video/image clip.
3. **Composition** — clips are concatenated, subtitles are burned in from the
   narration, and a background music track is mixed in based on the script's mood.

This is a standalone sub-project, independent of the rest of this repository.

## Setup

```bash
cd viral-shorts-studio
npm install
cp .env.example .env
# edit .env: ANTHROPIC_API_KEY (required), HYPIT_API_KEY (optional, see below)
```

Add royalty-free background tracks to `assets/music/` named `upbeat.mp3`,
`dramatic.mp3`, `chill.mp3`, `suspense.mp3`, `comedic.mp3` (matching the
`musicMood` values the script generator can produce). Any track present will be
used as a fallback if the exact mood file is missing; if none are present, the
final video is produced without music.

## Usage

```bash
# Full run (needs HYPIT_API_KEY in .env)
npm run generate -- --topic "why cats knock things off tables"

# No Hypit key yet? Render with local placeholder clips instead, to check the
# script generation + editing pipeline end to end:
npm run generate -- --topic "..." --dry-run

# Let Claude pick the topic
npm run generate
```

Each run writes to `output/<name>/`: `script.json` (the generated script),
`caption.txt` (post caption + hashtags), per-scene clips, and `final.mp4`.

## Hypit integration status

`src/hypitClient.js` implements a REST client against a **placeholder**
request/response contract (`POST {baseUrl}/v1/generate` with a Bearer token),
because this environment's network access to hypit.ai was blocked while
building this project, so the real API shape could not be confirmed.

Once you have Hypit API docs and a key:

1. Set `HYPIT_API_KEY` (and `HYPIT_API_BASE_URL` / `HYPIT_MODEL` if needed) in `.env`.
2. Update `buildRequestBody()` and the response-handling branch in
   `HypitClient.generateClip()` in `src/hypitClient.js` to match Hypit's actual
   contract (request fields, auth header name, and whether the response is a
   JSON payload with a media URL or a direct binary stream).

Nothing else in the pipeline depends on those details — script generation and
video composition are decoupled from the Hypit client.
