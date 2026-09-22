// 블로그 카테고리 번호(categoryNo)를 확인하기 위한 헬퍼 스크립트.
// 사용법: NAVER_CLIENT_ID=... NAVER_CLIENT_SECRET=... NAVER_REFRESH_TOKEN=... node scripts/listCategories.mjs
import { getAccessTokenFromEnv } from "../src/naverAuth.mjs";
import { listCategories } from "../src/naverBlogApi.mjs";

const accessToken = await getAccessTokenFromEnv();
const data = await listCategories(accessToken);
console.log(JSON.stringify(data, null, 2));
