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
  if (!res.ok) throw new Error(data.error || `요청 실패 (${res.status})`);
  return data;
}

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
api("/api/status").then(({ providers }) => {
  const label = {
    script: { claude: "대본 Claude", demo: "대본 데모" },
    image: { openai: "이미지 AI", placeholder: "이미지 임시카드" },
    voice: { openai: "목소리 AI", silent: "목소리 없음" },
  };
  $("#providers").innerHTML = Object.entries(label)
    .map(([k, map]) => `<span class="pill ${["demo", "placeholder", "silent"].includes(providers[k]) ? "off" : ""}">${map[providers[k]]}</span>`)
    .join("");
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
    const mediaSelect = $('[data-f="media_id"]', el);
    mediaSelect.innerHTML = `<option value="">AI 이미지 생성</option>` + project.media.map((m) => `<option value="${m.id}">내 ${m.kind === "video" ? "영상" : "사진"} ${m.id}${m.description ? ` · ${m.description.slice(0, 14)}` : ""}</option>`).join("");
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
}

function updateScene(el, scene) {
  $(".secs", el).textContent = `약 ${estimateSeconds(scene).toFixed(1)}초`;
  const media = project.media.find((m) => m.id === scene.media_id);
  $(".prompt", el).classList.toggle("hidden", Boolean(media));
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
  } else if (stage === "rendering") {
    showStep(3);
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
