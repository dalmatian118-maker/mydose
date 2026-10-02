const $ = (s, el = document) => el.querySelector(s);
const ROLE_LABEL = { hook: "후킹", problem: "문제·계기", story: "이야기", turning_point: "전환점", value: "가치·결과", proof: "증거", cta: "마무리" };
const HOOK_LABEL = { question: "질문형", contrast: "반전형", confession: "고백형", number: "숫자형", pain: "공감형", curiosity: "궁금증형", mid_action: "현장형" };
const MAX_SECONDS = 30;

let project = null;
let script = null; // 편집 중인 대본
let pollTimer = null;
let mediaFiles = []; // { file, description }

// ---------- 공통 ----------
async function api(url, options = {}) {
  const res = await fetch(url, options);
  const data = await res.json().catch(() => ({}));
  if (data.needCode) showCodeGate();
  if (!res.ok) throw new Error(data.error || `요청 실패 (${res.status})`);
  return data;
}

// ---------- 수업 코드 (수업 서버 모드) ----------
function showCodeGate() {
  const gate = $("#codeGate");
  if (!gate.open) gate.showModal();
  gate.querySelector("input").focus();
}
$("#codeGate").addEventListener("cancel", (e) => e.preventDefault()); // ESC로 닫지 못하게
$("#codeForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  try {
    await api("/api/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code: e.target.code.value }) });
    location.reload();
  } catch (err) {
    $("#codeError").textContent = err.message;
    $("#codeError").classList.remove("hidden");
  }
});

function showError(msg) {
  const el = $("#error");
  el.textContent = msg;
  el.classList.toggle("hidden", !msg);
}

function showStep(n) {
  for (let i = 1; i <= 4; i++) $(`#step${i}`).classList.toggle("hidden", i !== n);
  document.querySelectorAll("#stepper li").forEach((li) => {
    const s = Number(li.dataset.step);
    li.classList.toggle("active", s === n);
    li.classList.toggle("done", s < n);
  });
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function estimateSeconds(scene) {
  const chars = scene.narration.replace(/\s/g, "").length;
  return Math.max(1.2, chars / 6.5 + 0.2) + (scene.role === "hook" ? 0.15 : 0.35);
}

// ---------- 상태 표시 ----------
let providers = {};
let hosted = false;
let uploadLimitMB = 200;
let voiceOptions = { gender: {}, age: {}, style: {} };
const PROVIDER_LABEL = {
  script: { claude: "대본 Claude", demo: "대본 데모", missing: "대본 키 필요" },
  stock: { pexels: "스톡 Pexels", pixabay: "스톡 Pixabay", none: "스톡 없음" },
  image: { openai: "이미지 AI", placeholder: "이미지 임시카드" },
  voice: { elevenlabs: "목소리 ElevenLabs", openai: "목소리 OpenAI", silent: "목소리 없음" },
};

function renderProviders() {
  $("#providers").innerHTML = Object.entries(PROVIDER_LABEL)
    .map(([k, map]) => `<span class="pill ${["demo", "placeholder", "silent", "missing", "none"].includes(providers[k]) ? "off" : ""}">${map[providers[k]]}</span>`)
    .join("");
}

async function refreshStatus() {
  const status = await api("/api/status");
  providers = status.providers;
  voiceOptions = status.voiceOptions;
  hosted = status.hosted;
  uploadLimitMB = status.uploadLimitMB;
  renderProviders();
  const urls = status.studentUrls || [];
  $("#teacherBar").classList.toggle("hidden", !urls.length);
  $("#studentUrls").textContent = urls.join("  /  ");
  // 수업 서버에서는 키를 서버에서 관리하므로 설정 버튼을 숨깁니다
  $("#settingsBtn").classList.toggle("hidden", hosted);
  if (!status.authed) return showCodeGate();
  if (!status.ffmpeg.ok) showError("영상 도구(ffmpeg)에 문제가 있어요. 프로그램 창의 안내를 확인해주세요.");
  if (providers.script === "missing") {
    if (hosted) showError("서버에 Claude API 키가 설정되지 않았어요. 선생님께 알려주세요.");
    else openSettings();
  }
  if (script) renderVoice();
}
refreshStatus();

// ---------- API 키 설정 ----------
const settingsDialog = $("#settings");
async function openSettings() {
  const s = await api("/api/settings");
  const f = $("#settingsForm");
  f.reset();
  f.elevenlabsModel.innerHTML = Object.entries(s.elevenlabsModels).map(([id, label]) => `<option value="${id}">${label}</option>`).join("");
  f.elevenlabsModel.value = s.elevenlabsModel;
  document.querySelectorAll("[data-saved]").forEach((el) => (el.textContent = s[el.dataset.saved] ? `저장됨 ${s[el.dataset.saved]}` : ""));
  $("#classNote").classList.toggle("hidden", !s.usingClassSettings);
  if (!settingsDialog.open) settingsDialog.showModal();
}
$("#settingsBtn").addEventListener("click", openSettings);
$("#settingsCancel").addEventListener("click", () => settingsDialog.close());
$("#importSettings").addEventListener("change", async (e) => {
  const file = e.target.files[0];
  e.target.value = "";
  if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    await api("/api/settings/import", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    await openSettings();
    refreshStatus();
    alert("설정을 불러왔어요 ✓");
  } catch (err) {
    alert(err instanceof SyntaxError ? "설정 파일 형식이 아니에요" : err.message);
  }
});
$("#settingsForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const f = e.target;
  const body = { elevenlabsModel: f.elevenlabsModel.value };
  for (const name of ["anthropicKey", "elevenlabsKey", "pexelsKey", "pixabayKey", "openaiKey"]) body[name] = f[name].value;
  try {
    await api("/api/settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    settingsDialog.close();
    showError("");
    refreshStatus();
  } catch (err) {
    showError(err.message);
  }
});

// ---------- 1단계: 스토리 ----------
const form = $("#storyForm");
let tone = "진솔하고 따뜻하게";
$("#toneChips").addEventListener("click", (e) => {
  const chip = e.target.closest(".chip");
  if (!chip) return;
  document.querySelectorAll("#toneChips .chip").forEach((c) => c.classList.toggle("active", c === chip));
  tone = chip.dataset.tone;
});
form.story.addEventListener("input", () => ($("#storyCount").textContent = `${form.story.value.length}자`));

function addFiles(list) {
  for (const file of list) {
    if (mediaFiles.length >= 8) break;
    if (!/^(image|video)\//.test(file.type)) continue;
    if (file.size > uploadLimitMB * 1024 * 1024) {
      alert(`'${file.name}' 파일이 너무 커요 (${uploadLimitMB}MB 이하). 영상은 짧게 잘라서 올려주세요.`);
      continue;
    }
    mediaFiles.push({ file, description: "" });
  }
  renderMediaList();
}

function renderMediaList() {
  const wrap = $("#mediaList");
  wrap.innerHTML = "";
  mediaFiles.forEach((m, i) => {
    const item = document.createElement("div");
    item.className = "media-item";
    const url = URL.createObjectURL(m.file);
    item.innerHTML = `
      ${m.file.type.startsWith("video/") ? `<video src="${url}" muted></video>` : `<img src="${url}" alt="">`}
      <input placeholder="무슨 사진인가요? (예: 첫 작업실)" maxlength="100" value="${m.description.replace(/"/g, "&quot;")}">
      <button type="button" class="icon" title="삭제">✕</button>`;
    $("input", item).addEventListener("input", (e) => (m.description = e.target.value));
    $("button", item).addEventListener("click", () => {
      mediaFiles.splice(i, 1);
      renderMediaList();
    });
    wrap.append(item);
  });
}

$("#mediaInput").addEventListener("change", (e) => addFiles(e.target.files));
const drop = $("#drop");
drop.addEventListener("dragover", (e) => {
  e.preventDefault();
  drop.classList.add("over");
});
drop.addEventListener("dragleave", () => drop.classList.remove("over"));
drop.addEventListener("drop", (e) => {
  e.preventDefault();
  drop.classList.remove("over");
  addFiles(e.dataTransfer.files);
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  showError("");
  const fd = new FormData();
  fd.append("brandName", form.brandName.value);
  fd.append("audience", form.audience.value);
  fd.append("tone", tone);
  fd.append("story", form.story.value);
  fd.append("mediaDescriptions", JSON.stringify(mediaFiles.map((m) => m.description)));
  mediaFiles.forEach((m) => fd.append("media", m.file));
  if (form.bgm.files[0]) fd.append("bgm", form.bgm.files[0]);

  $("#scriptBtn").disabled = true;
  try {
    project = await api("/api/projects", { method: "POST", body: fd });
    location.hash = project.id;
    showStep(2);
    poll();
  } catch (err) {
    showError(err.message);
  } finally {
    $("#scriptBtn").disabled = false;
  }
});

// ---------- 2단계: 대본 ----------
function renderScript() {
  $("#scriptTitle").textContent = script.title;
  $("#scriptConcept").textContent = script.concept;
  $("#structureNotes").textContent = script.structure_notes;

  const hooks = $("#hookOptions");
  hooks.innerHTML = "";
  const first = script.scenes[0];
  script.hook_options.forEach((h) => {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "hook";
    card.classList.toggle("selected", first && first.narration === h.narration);
    card.innerHTML = `<span class="tag">${HOOK_LABEL[h.type] || h.type}</span><strong></strong><em></em><small></small>`;
    $("strong", card).textContent = `“${h.narration}”`;
    $("em", card).textContent = h.on_screen_text;
    $("small", card).textContent = h.why;
    card.addEventListener("click", () => {
      first.narration = h.narration;
      first.on_screen_text = h.on_screen_text;
      renderScript();
    });
    hooks.append(card);
  });

  const wrap = $("#scenes");
  wrap.innerHTML = "";
  script.scenes.forEach((scene, i) => {
    const el = $("#sceneTpl").content.firstElementChild.cloneNode(true);
    $(".num", el).textContent = i + 1;
    $(".role", el).textContent = ROLE_LABEL[scene.role] || scene.role;
    const source = $(".source", el);
    source.innerHTML =
      project.media.map((m) => `<option value="${m.id}">📷 내 ${m.kind === "video" ? "영상" : "사진"} ${m.id}${m.description ? ` · ${m.description.slice(0, 14)}` : ""}</option>`).join("") +
      `<option value="stock">🎞 무료 스톡 영상${providers.stock === "none" ? " (키 필요)" : ""}</option>` +
      `<option value="ai">🎨 AI 이미지${providers.image === "placeholder" ? " (키 없음: 색상 카드)" : ""}</option>`;
    source.value = scene.media_id || scene.visual || "stock";
    source.addEventListener("change", () => {
      if (source.value === "stock" || source.value === "ai") {
        scene.media_id = "";
        scene.visual = source.value;
      } else scene.media_id = source.value;
      updateScene(el, scene);
    });
    el.querySelectorAll("[data-f]").forEach((input) => {
      input.value = scene[input.dataset.f] ?? "";
      input.addEventListener("input", () => {
        scene[input.dataset.f] = input.value;
        updateScene(el, scene);
        updateDuration();
      });
    });
    $(".del", el).addEventListener("click", () => {
      if (script.scenes.length <= 2) return;
      script.scenes.splice(i, 1);
      renderScript();
    });
    updateScene(el, scene);
    wrap.append(el);
  });

  $("#authCheck").innerHTML = "";
  script.authenticity_check.forEach((t) => {
    const li = document.createElement("li");
    li.textContent = t;
    $("#authCheck").append(li);
  });
  updateDuration();
  renderVoice();
}

function updateScene(el, scene) {
  $(".secs", el).textContent = `약 ${estimateSeconds(scene).toFixed(1)}초`;
  const media = project.media.find((m) => m.id === scene.media_id);
  const visual = media ? "media" : scene.visual || "stock";
  $(".prompt", el).classList.toggle("hidden", visual !== "ai");
  $(".stock-query", el).classList.toggle("hidden", visual !== "stock");
  let thumb = $(".thumb", el);
  if (media) {
    if (!thumb) {
      thumb = document.createElement("img");
      thumb.className = "thumb";
      $(".scene-head", el).after(thumb);
    }
    thumb.src = media.preview;
  } else thumb?.remove();
}

function updateDuration() {
  const total = script.scenes.reduce((a, s) => a + estimateSeconds(s), 0);
  const over = total > MAX_SECONDS;
  $("#durationLabel").textContent = `예상 ${total.toFixed(1)}초 / ${MAX_SECONDS}초`;
  $("#durationLabel").classList.toggle("over", over);
  const bar = $("#durationBar");
  bar.style.width = `${Math.min(100, (total / (MAX_SECONDS * 1.2)) * 100)}%`;
  bar.classList.toggle("over", over);
}

$("#regenBtn").addEventListener("click", async () => {
  if (!confirm("지금 대본은 사라지고 새로 써요. 계속할까요?")) return;
  try {
    project = await api(`/api/projects/${project.id}/script/regenerate`, { method: "POST" });
    script = null;
    poll();
  } catch (err) {
    showError(err.message);
  }
});

$("#renderBtn").addEventListener("click", async () => {
  showError("");
  try {
    await saveVoice();
    await api(`/api/projects/${project.id}/script`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(script),
    });
    project = await api(`/api/projects/${project.id}/render`, { method: "POST" });
    showStep(3);
    poll();
  } catch (err) {
    showError(err.message);
  }
});

// ---------- 목소리 ----------
let voiceSaveTimer = null;

function renderVoice() {
  const voice = project.voice;
  document.querySelectorAll("[data-voice]").forEach((wrap) => {
    const key = wrap.dataset.voice;
    wrap.innerHTML = Object.entries(voiceOptions[key] || {})
      .map(([value, label]) => `<button type="button" class="chip ${voice[key] === value ? "active" : ""}" data-value="${value}">${label}</button>`)
      .join("");
  });
  $("#voiceSpeed").value = voice.speed;
  $("#speedLabel").textContent = `${voice.speed.toFixed(2)}배`;

  const label = { elevenlabs: "ElevenLabs", openai: "OpenAI", silent: "API 키가 없어 무음 + 자막으로 만들어요" };
  $("#voiceProvider").textContent = label[providers.voice] || "";
  $("#elevenPanel").classList.toggle("hidden", providers.voice !== "elevenlabs");
  $("#previewVoice").classList.toggle("hidden", providers.voice === "silent");
  $("#chosenVoice").textContent =
    providers.voice === "elevenlabs"
      ? voice.voiceId
        ? `선택한 목소리: ${voice.voiceName || voice.voiceId}`
        : "목소리를 고르지 않으면 조건에 맞는 인기 한국어 목소리가 자동으로 정해져요."
      : "";
}

function changeVoice(patch) {
  const v = project.voice;
  // 성별·연령대를 바꾸면 이전에 고른 ElevenLabs 목소리는 해제
  if ((patch.gender && patch.gender !== v.gender) || (patch.age && patch.age !== v.age)) Object.assign(patch, { voiceId: "", voiceName: "", ownerId: "" });
  Object.assign(v, patch);
  renderVoice();
  clearTimeout(voiceSaveTimer);
  voiceSaveTimer = setTimeout(saveVoice, 400);
}

async function saveVoice() {
  clearTimeout(voiceSaveTimer);
  const updated = await api(`/api/projects/${project.id}/voice`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(project.voice),
  });
  project.voice = updated.voice;
}

document.querySelectorAll("[data-voice]").forEach((wrap) =>
  wrap.addEventListener("click", (e) => {
    const chip = e.target.closest(".chip");
    if (chip) changeVoice({ [wrap.dataset.voice]: chip.dataset.value });
  }),
);
$("#voiceSpeed").addEventListener("input", (e) => changeVoice({ speed: Number(e.target.value) }));

$("#findVoices").addEventListener("click", async () => {
  const btn = $("#findVoices");
  btn.disabled = true;
  $("#voiceHint").textContent = "찾는 중…";
  try {
    const { gender, age } = project.voice;
    const { voices, relaxed } = await api(`/api/voices/elevenlabs?gender=${gender}&age=${age}`);
    $("#voiceHint").textContent = voices.length
      ? `${voices.length}개를 찾았어요. 샘플은 다른 언어일 수 있으니 '내 대본으로 미리 듣기'로 확인해보세요.${relaxed ? " (조건에 딱 맞는 목소리가 적어서 범위를 넓혔어요)" : ""}`
      : "목소리를 찾지 못했어요. 조건을 바꿔보세요.";
    const list = $("#voiceList");
    list.innerHTML = "";
    for (const v of voices) {
      const item = document.createElement("div");
      item.className = `voice-item ${v.voiceId === project.voice.voiceId ? "selected" : ""}`;
      item.innerHTML = `<strong></strong><button type="button" class="ghost small">선택</button><small></small>${v.previewUrl ? `<audio controls preload="none" src="${v.previewUrl}"></audio>` : ""}`;
      $("strong", item).textContent = v.name;
      $("small", item).textContent = [v.language && v.language.toUpperCase(), v.description].filter(Boolean).join(" · ").slice(0, 120);
      $("button", item).addEventListener("click", () => {
        changeVoice({ voiceId: v.voiceId, voiceName: v.name, ownerId: v.ownerId });
        list.querySelectorAll(".voice-item").forEach((el) => el.classList.toggle("selected", el === item));
      });
      list.append(item);
    }
  } catch (err) {
    $("#voiceHint").textContent = err.message;
  } finally {
    btn.disabled = false;
  }
});

$("#previewVoice").addEventListener("click", async () => {
  const btn = $("#previewVoice");
  btn.disabled = true;
  btn.textContent = "만드는 중…";
  try {
    project = await api(`/api/projects/${project.id}/voice/preview`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(project.voice),
    });
    renderVoice();
    const audio = $("#voiceAudio");
    audio.src = project.voicePreview;
    audio.classList.remove("hidden");
    audio.play().catch(() => {});
  } catch (err) {
    showError(err.message);
  } finally {
    btn.disabled = false;
    btn.textContent = "▶ 내 대본으로 미리 듣기";
  }
});

// ---------- 3·4단계 ----------
const ICON = { pending: "○", running: "◐", done: "●", error: "✕" };
function renderProgress() {
  $("#progress").innerHTML = project.steps
    .map((s) => `<li class="${s.status}"><span class="ico">${ICON[s.status]}</span>${s.label}<small>${s.detail || ""}</small></li>`)
    .join("");
  for (const id of ["#warnings", "#warnings2"]) {
    $(id).innerHTML = project.warnings.map((w) => `<li>${w}</li>`).join("");
  }
}

function renderResult() {
  const out = project.output;
  $("#resultVideo").src = `${out.video}?t=${Date.now()}`;
  $("#resultVideo").poster = out.cover;
  $("#downloadBtn").href = out.video;
  $("#resultInfo").textContent = `${out.duration.toFixed(1)}초 · 1080×1920 · 인스타그램 릴스 규격`;
  const s = project.script;
  $("#captionText").value = `${s.caption}\n\n${s.hashtags.map((h) => `#${h.replace(/^#/, "")}`).join(" ")}`;
  const credits = out.credits || [];
  $("#creditsBox").classList.toggle("hidden", !credits.length);
  $("#credits").innerHTML = "";
  for (const c of credits) {
    const li = document.createElement("li");
    const a = document.createElement("a");
    a.href = c.page;
    a.target = "_blank";
    a.rel = "noopener";
    a.textContent = `${c.author || "작가 미상"} / ${c.site}`;
    li.append(`${c.scene}번 장면: `, a);
    $("#credits").append(li);
  }
}

$("#copyBtn").addEventListener("click", async () => {
  await navigator.clipboard.writeText($("#captionText").value);
  $("#copyBtn").textContent = "복사됨 ✓";
  setTimeout(() => ($("#copyBtn").textContent = "문구 복사"), 1500);
});
$("#backToScript").addEventListener("click", () => {
  script = structuredClone(project.script);
  renderScript();
  $("#scriptView").classList.remove("hidden");
  showStep(2);
});
$("#newProject").addEventListener("click", () => {
  location.hash = "";
  location.reload();
});

// ---------- 서버 상태 따라가기 ----------
async function poll() {
  clearTimeout(pollTimer);
  try {
    project = await api(`/api/projects/${project.id}`);
  } catch (err) {
    showError(err.message);
    return;
  }
  const { stage } = project;
  if (stage === "scripting") {
    showStep(2);
    $("#scriptLoading").classList.remove("hidden");
    $("#scriptView").classList.add("hidden");
  } else if (stage === "script_ready") {
    showStep(2);
    $("#scriptLoading").classList.add("hidden");
    $("#scriptView").classList.remove("hidden");
    if (!script) {
      script = structuredClone(project.script);
      renderScript();
    }
    return;
  } else if (stage === "queued" || stage === "rendering") {
    showStep(3);
    $("#queueInfo").classList.toggle("hidden", stage !== "queued");
    $("#queueInfo").textContent = project.queuePosition > 1 ? `⏳ 차례를 기다리는 중이에요 · 앞에 ${project.queuePosition - 1}명` : "⏳ 곧 시작해요";
    renderProgress();
  } else if (stage === "done") {
    showStep(4);
    renderProgress();
    renderResult();
    return;
  } else if (stage === "error") {
    showError(project.error);
    if (project.script) {
      script ??= structuredClone(project.script);
      renderScript();
      $("#scriptLoading").classList.add("hidden");
      $("#scriptView").classList.remove("hidden");
      if (project.steps.length) renderProgress();
      showStep(2);
    } else showStep(1);
    return;
  }
  pollTimer = setTimeout(poll, 1500);
}

// 새로고침해도 이어서 작업
if (location.hash.length > 1) {
  project = { id: location.hash.slice(1) };
  poll();
}
window.addEventListener("hashchange", () => location.reload());
