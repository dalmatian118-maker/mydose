import fs from "node:fs";
import path from "node:path";
import { FONTS_DIR } from "../config.js";

// 자막: Noto Sans KR / 후킹 타이틀: Black Han Sans (둘 다 SIL Open Font License)
export const FONTS = {
  caption: { family: "Noto Sans KR", file: "NotoSansKR.ttf", url: "https://raw.githubusercontent.com/google/fonts/main/ofl/notosanskr/NotoSansKR%5Bwght%5D.ttf" },
  title: { family: "Black Han Sans", file: "BlackHanSans-Regular.ttf", url: "https://raw.githubusercontent.com/google/fonts/main/ofl/blackhansans/BlackHanSans-Regular.ttf" },
};

export async function ensureFonts({ verbose = false } = {}) {
  fs.mkdirSync(FONTS_DIR, { recursive: true });
  let ok = true;
  for (const font of Object.values(FONTS)) {
    const target = path.join(FONTS_DIR, font.file);
    if (fs.existsSync(target)) continue;
    try {
      const res = await fetch(font.url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      fs.writeFileSync(target, Buffer.from(await res.arrayBuffer()));
      if (verbose) console.log(`폰트 다운로드 완료: ${font.file}`);
    } catch (err) {
      ok = false;
      console.warn(`⚠️  폰트 다운로드 실패 (${font.file}): ${err.message}\n   ${font.url} 에서 받아 ${FONTS_DIR} 에 넣어주세요.`);
    }
  }
  return { ok };
}
