import { getAccessTokenFromEnv } from "./naverAuth.mjs";
import { writePost } from "./naverBlogApi.mjs";
import { generatePost, pickTopic } from "./contentGenerator.mjs";

async function main() {
  const topic = pickTopic();
  console.log(`[publish] 오늘의 주제: ${topic}`);

  const { title, contents } = await generatePost(topic);
  console.log(`[publish] 생성된 제목: ${title}`);

  const accessToken = await getAccessTokenFromEnv();

  const categoryNo = process.env.NAVER_CATEGORY_NO || undefined;
  const openType = process.env.NAVER_POST_OPEN_TYPE || "all";

  const result = await writePost(accessToken, { title, contents, categoryNo, openType });
  console.log("[publish] 발행 완료:", JSON.stringify(result));
}

main().catch((err) => {
  console.error("[publish] 실패:", err);
  process.exit(1);
});
