const WRITE_POST_URL = "https://openapi.naver.com/blog/writePost.json";
const LIST_CATEGORY_URL = "https://openapi.naver.com/blog/listCategory.json";

// 네이버 오픈 API 응답은 성공 시에도 200이 아닌 경우가 있어 message.code 로 별도 확인한다.
async function callNaverApi(url, accessToken, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(options.headers ?? {}),
    },
  });

  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`네이버 API 응답 파싱 실패 (status ${res.status}): ${text}`);
  }

  if (!res.ok || data?.message?.code >= 400 || data?.errorCode) {
    throw new Error(`네이버 API 오류 (status ${res.status}): ${JSON.stringify(data)}`);
  }
  return data;
}

export async function listCategories(accessToken) {
  return callNaverApi(LIST_CATEGORY_URL, accessToken);
}

export async function writePost(accessToken, { title, contents, categoryNo, openType = "all" }) {
  const body = new URLSearchParams({
    title,
    contents,
    "options.openType": openType,
  });
  if (categoryNo) {
    body.set("categoryNo", String(categoryNo));
  }

  return callNaverApi(WRITE_POST_URL, accessToken, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
    body,
  });
}
