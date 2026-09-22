const TOKEN_URL = "https://nid.naver.com/oauth2.0/token";

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`환경변수 ${name} 가 설정되어 있지 않습니다.`);
  }
  return value;
}

async function requestToken(params) {
  const url = new URL(TOKEN_URL);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  const res = await fetch(url, { method: "GET" });
  const data = await res.json();

  if (!res.ok || data.error) {
    throw new Error(
      `네이버 토큰 요청 실패: ${data.error ?? res.status} ${data.error_description ?? ""}`
    );
  }
  return data;
}

// 최초 1회, scripts/getInitialToken.mjs 에서 authorization code 를 access/refresh token 으로 교환할 때 사용
export async function exchangeCodeForToken({ clientId, clientSecret, code, state }) {
  return requestToken({
    grant_type: "authorization_code",
    client_id: clientId,
    client_secret: clientSecret,
    code,
    state,
  });
}

// 매 실행마다 refresh_token 으로 새 access_token 을 발급받는다 (access_token 은 유효기간이 짧음)
export async function refreshAccessToken({ clientId, clientSecret, refreshToken }) {
  const data = await requestToken({
    grant_type: "refresh_token",
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
  });
  return data.access_token;
}

export async function getAccessTokenFromEnv() {
  const clientId = requireEnv("NAVER_CLIENT_ID");
  const clientSecret = requireEnv("NAVER_CLIENT_SECRET");
  const refreshToken = requireEnv("NAVER_REFRESH_TOKEN");
  return refreshAccessToken({ clientId, clientSecret, refreshToken });
}
