import { test } from "node:test";
import assert from "node:assert/strict";
import { chunkNarration, timeChunks, buildAss } from "../server/pipeline/subtitles.js";
import { planTiming } from "../server/pipeline/timing.js";
import { validateScript } from "../server/pipeline/schema.js";
import { DEMO_SCRIPT } from "../server/pipeline/demo-script.js";

test("자막은 14자 이하 조각으로 나뉘고 끝 마침표가 빠진다", () => {
  const chunks = chunkNarration("세수만 하면 얼굴이 빨개지던 동생 때문에 시작했거든요. 정말요?");
  assert.ok(chunks.every((c) => c.length <= 14), chunks.join("|"));
  assert.equal(chunks.at(-1), "정말요?");
  assert.ok(!chunks.some((c) => c.endsWith(".")));
});

test("자막 시간은 장면 시작~끝을 빈틈없이 채운다", () => {
  const items = timeChunks(["가나다", "가나다라마바"], 2, 3, 5.5);
  assert.equal(items[0].start, 2);
  assert.equal(items[0].end, items[1].start);
  assert.equal(items.at(-1).end, 5.5);
});

test("30초 안이면 말 속도를 바꾸지 않는다", () => {
  const t = planTiming([3, 4, 5, 4], ["hook", "story", "value", "cta"]);
  assert.equal(t.tempo, 1);
  assert.ok(t.total <= 30);
});

test("30초를 넘으면 말 속도를 올려 30초 안에 맞춘다", () => {
  const t = planTiming([6, 6, 6, 6, 6], ["hook", "story", "story", "value", "cta"]);
  assert.ok(t.tempo > 1 && t.tempo <= 1.25);
  assert.ok(t.total <= 30, String(t.total));
  assert.equal(t.overLimit, false);
});

test("너무 긴 대본은 속도 상한에서 멈추고 초과를 알린다", () => {
  const t = planTiming([10, 10, 10, 10], ["hook", "story", "value", "cta"]);
  assert.equal(t.tempo, 1.25);
  assert.equal(t.overLimit, true);
});

test("업로드되지 않은 media_id는 지우고 이미지 프롬프트를 채운다", () => {
  const raw = structuredClone(DEMO_SCRIPT);
  raw.scenes[0].media_id = "m9";
  raw.scenes[0].image_prompt = "";
  const s = validateScript(raw, ["m1"]);
  assert.equal(s.scenes[0].media_id, "");
  assert.ok(s.scenes[0].image_prompt.length > 0);
});

test("ASS 자막에 후킹·타이틀·내레이션이 모두 들어간다", () => {
  const s = validateScript(structuredClone(DEMO_SCRIPT));
  const t = planTiming(s.scenes.map(() => 3), s.scenes.map((x) => x.role));
  const ass = buildAss(s.scenes, t);
  assert.match(ass, /,Hook,,.*47개 전부 실패/);
  assert.match(ass, /,Title,,/);
  assert.match(ass, /,Caption,,0,0,0,,첫 비누는 전부 버렸어요/);
});

import { normalizeVoice, describeVoice } from "../server/pipeline/voice.js";

test("목소리 설정은 잘못된 값을 기본값으로 고치고 속도를 0.8~1.2로 제한한다", () => {
  const v = normalizeVoice({ gender: "robot", age: "old", style: "calm", speed: 3 });
  assert.equal(v.gender, "female");
  assert.equal(v.age, "old");
  assert.equal(v.speed, 1.2);
  assert.equal(describeVoice(v), "50대 이상 여성, 차분하게");
});
