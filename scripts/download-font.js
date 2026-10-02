// 자막/타이틀용 한글 폰트(OFL 라이선스)를 assets/fonts 에 내려받습니다.
import { ensureFonts } from "../server/lib/fonts.js";

const result = await ensureFonts({ verbose: true });
if (!result.ok) process.exit(1);
