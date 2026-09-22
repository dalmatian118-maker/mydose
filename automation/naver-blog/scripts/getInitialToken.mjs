// 최초 1회만 로컬에서 실행하는 스크립트.
// 브라우저로 네이버 로그인 동의를 진행하고, 발급받은 refresh_token 을 화면에 출력해준다.
// 사용법: NAVER_CLIENT_ID=... NAVER_CLIENT_SECRET=... node scripts/getInitialToken.mjs
import { createServer } from "node:http";
import { randomUUID } from "node:crypto";
import { exchangeCodeForToken } from "../src/naverAuth.mjs";

const PORT = 8787;
const REDIRECT_URI = `http://localhost:${PORT}/callback`;

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    console.error(`환경변수 ${name} 가 필요합니다. 네이버 개발자센터에서 발급받은 값을 설정하세요.`);
    process.exit(1);
  }
  return value;
}

const clientId = requireEnv("NAVER_CLIENT_ID");
const clientSecret = requireEnv("NAVER_CLIENT_SECRET");
const state = randomUUID();

const authorizeUrl = new URL("https://nid.naver.com/oauth2.0/authorize");
authorizeUrl.searchParams.set("response_type", "code");
authorizeUrl.searchParams.set("client_id", clientId);
authorizeUrl.searchParams.set("redirect_uri", REDIRECT_URI);
authorizeUrl.searchParams.set("state", state);

console.log("\n네이버 개발자센터 앱 설정의 'Callback URL' 에 아래 주소가 등록되어 있어야 합니다:");
console.log(`  ${REDIRECT_URI}\n`);
console.log("아래 URL을 브라우저에서 열어 네이버 로그인 동의를 진행하세요:\n");
console.log(authorizeUrl.toString());
console.log("\n(동의 후 이 창은 자동으로 종료됩니다)\n");

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  if (url.pathname !== "/callback") {
    res.writeHead(404).end();
    return;
  }

  const code = url.searchParams.get("code");
  const returnedState = url.searchParams.get("state");

  if (!code || returnedState !== state) {
    res.writeHead(400, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("인증에 실패했습니다 (code 또는 state 불일치). 터미널을 확인하세요.");
    server.close();
    process.exit(1);
    return;
  }

  try {
    const tokenData = await exchangeCodeForToken({ clientId, clientSecret, code, state });
    res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("인증이 완료되었습니다. 터미널에서 refresh_token 을 확인하세요. 이 창은 닫으셔도 됩니다.");

    console.log("\n인증 성공! 아래 값을 automation/naver-blog/.env 와 GitHub Secrets 에 저장하세요.\n");
    console.log(`NAVER_REFRESH_TOKEN=${tokenData.refresh_token}`);
    console.log(`\n(참고용) 최초 access_token: ${tokenData.access_token}`);
  } catch (err) {
    res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("토큰 교환 중 오류가 발생했습니다. 터미널을 확인하세요.");
    console.error(err);
  } finally {
    server.close();
  }
});

server.listen(PORT);
