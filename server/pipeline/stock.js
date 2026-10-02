import fs from "node:fs";
import { getConfig } from "../config.js";
import { fetchWithRetry } from "../lib/http.js";

// 무료 스톡 영상·사진 (Pexels 우선, Pixabay 대체)
// 직접 찍은 사진이 없는 장면을 실제 촬영 영상으로 채웁니다. AI 영상 생성 비용 없이 움직이는 화면을 만들 수 있어요.

const hasHangul = (s) => /[가-힣]/.test(s);
const MAX_DOWNLOAD_HEIGHT = 2000; // 4K 원본은 너무 커서 1080p급 파일을 고릅니다
// 시간당 요청 한도에 걸리면 기다리지 않고 바로 다음 방법으로 넘어갑니다
const RETRY = { maxWaitMs: 15_000, maxDelayMs: 4_000 };

function pickVideoFile(files) {
  const candidates = files
    .filter((f) => f.link && f.height && f.height <= MAX_DOWNLOAD_HEIGHT && (f.file_type || "video/mp4") === "video/mp4")
    .sort((a, b) => Math.abs(a.height - 1920) - Math.abs(b.height - 1920));
  return candidates[0];
}

// ---------- Pexels ----------
async function pexels(pathname, params) {
  const url = `${process.env.PEXELS_BASE_URL || "https://api.pexels.com"}${pathname}?${new URLSearchParams(params)}`;
  const res = await fetchWithRetry(url, { headers: { Authorization: getConfig().pexelsKey } }, { label: "Pexels", ...RETRY });
  return res.json();
}

async function searchPexels(query, kind) {
  const params = { query, orientation: "portrait", per_page: "8" };
  if (hasHangul(query)) params.locale = "ko-KR";
  if (kind === "video") {
    params.size = "medium";
    const json = await pexels("/videos/search", params);
    return (json.videos || [])
      .map((v) => {
        const file = pickVideoFile(v.video_files || []);
        return file && { kind: "video", id: `pexels-v${v.id}`, url: file.link, duration: v.duration, credit: { site: "Pexels", author: v.user?.name || "", page: v.url } };
      })
      .filter(Boolean);
  }
  const json = await pexels("/v1/search", params);
  return (json.photos || []).map((p) => ({
    kind: "image",
    id: `pexels-p${p.id}`,
    url: p.src?.large2x || p.src?.original,
    credit: { site: "Pexels", author: p.photographer || "", page: p.url },
  }));
}

// ---------- Pixabay ----------
async function searchPixabay(query, kind) {
  const params = { key: getConfig().pixabayKey, q: query.slice(0, 100), per_page: "8", safesearch: "true" };
  if (hasHangul(query)) params.lang = "ko";
  if (kind === "video") {
    const res = await fetchWithRetry(`https://pixabay.com/api/videos/?${new URLSearchParams(params)}`, {}, { label: "Pixabay", ...RETRY });
    const json = await res.json();
    return (json.hits || [])
      .map((h) => {
        const file = ["large", "medium"].map((q) => h.videos?.[q]).find((f) => f?.url && f.height <= MAX_DOWNLOAD_HEIGHT) || h.videos?.medium;
        return file?.url && { kind: "video", id: `pixabay-v${h.id}`, url: file.url, duration: h.duration, credit: { site: "Pixabay", author: h.user || "", page: h.pageURL } };
      })
      .filter(Boolean);
  }
  params.orientation = "vertical";
  params.image_type = "photo";
  const res = await fetchWithRetry(`https://pixabay.com/api/?${new URLSearchParams(params)}`, {}, { label: "Pixabay", ...RETRY });
  const json = await res.json();
  return (json.hits || []).map((h) => ({
    kind: "image",
    id: `pixabay-p${h.id}`,
    url: h.largeImageURL || h.webformatURL,
    credit: { site: "Pixabay", author: h.user || "", page: h.pageURL },
  }));
}

export function stockAvailable() {
  const c = getConfig();
  return Boolean(c.pexelsKey || c.pixabayKey);
}

/**
 * 장면에 맞는 스톡 영상(없으면 사진)을 찾아 내려받습니다.
 * @param {Set<string>} used 다른 장면에서 이미 쓴 결과 (같은 영상 반복 방지)
 * @returns {Promise<null | {kind, file, credit}>}
 */
export async function fetchStock({ query, minSeconds, used, outBase }) {
  const c = getConfig();
  const sources = [c.pexelsKey && searchPexels, c.pixabayKey && searchPixabay].filter(Boolean);
  const errors = [];
  for (const kind of ["video", "image"]) {
    for (const search of sources) {
      let results;
      try {
        results = await search(query, kind);
      } catch (err) {
        errors.push(err.message);
        continue;
      }
      const fresh = results.filter((r) => !used.has(r.id));
      // 장면보다 긴 영상을 우선 (짧으면 반복 재생되어 어색함)
      const pick = fresh.find((r) => r.kind !== "video" || !r.duration || r.duration >= minSeconds) || fresh[0];
      if (!pick) continue;
      const file = `${outBase}.${kind === "video" ? "mp4" : "jpg"}`;
      try {
        const res = await fetchWithRetry(pick.url, {}, { label: pick.credit.site, ...RETRY });
        fs.writeFileSync(file, Buffer.from(await res.arrayBuffer()));
      } catch (err) {
        errors.push(err.message);
        continue;
      }
      used.add(pick.id);
      return { kind, file, credit: pick.credit };
    }
  }
  if (errors.length) console.warn(`스톡 검색 실패 (${query}):`, errors.join(" / "));
  return null;
}
