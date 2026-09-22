# 네이버 블로그 자동 발행 (창업 트렌드)

네이버 공식 **로그인 오픈 API + 블로그 API**를 이용해, "창업 트렌드" 주제의 글을 매일 자동 생성/발행하는 자동화입니다.
브라우저를 대신 조작하는 방식이 아니라, 네이버가 제공하는 정식 API를 OAuth2 인증으로 호출하므로 계정 제재 위험 없이 사용할 수 있습니다.

## 동작 방식

1. `src/contentGenerator.mjs` 가 주제 목록(`TOPICS`)을 날짜 기준으로 순환 선택하고, `ANTHROPIC_API_KEY` 가 설정되어 있으면 Claude로 글을 생성합니다. 키가 없으면 템플릿 글로 대체됩니다.
2. `src/naverAuth.mjs` 가 저장된 `refresh_token` 으로 매 실행마다 새 `access_token` 을 발급받습니다.
3. `src/naverBlogApi.mjs` 가 `access_token` 으로 `writePost.json` 을 호출해 글을 발행합니다.
4. `.github/workflows/naver-blog-publish.yml` 이 매일 KST 09:00에 위 과정을 자동 실행합니다 (`workflow_dispatch` 로 수동 실행도 가능).

## 사전 준비 (최초 1회)

### 1. 네이버 개발자센터 앱 등록

1. https://developers.naver.com/apps/#/register 에서 애플리케이션 등록
2. 사용 API에 **네이버 로그인**, **블로그** 두 가지 추가
3. 네이버 로그인 → 제공 정보에서 필요한 항목 선택
4. Callback URL 에 `http://localhost:8787/callback` 등록 (최초 토큰 발급용)
5. **블로그 API는 네이버 로그인 기능에 대한 검수(심사)가 필요합니다.** 검수 승인 전까지는 본인 계정으로 개발 단계 테스트만 가능하니, 먼저 테스트로 정상 동작을 확인한 뒤 심사를 신청하세요.
6. 발급된 `Client ID`, `Client Secret` 확인

### 2. 최초 refresh_token 발급

```bash
cd automation/naver-blog
NAVER_CLIENT_ID=발급받은ID NAVER_CLIENT_SECRET=발급받은SECRET node scripts/getInitialToken.mjs
```

터미널에 출력되는 URL을 브라우저에서 열어 네이버 로그인 동의를 완료하면, 터미널에 `NAVER_REFRESH_TOKEN` 값이 출력됩니다.

### 3. 환경변수 설정

`.env.example` 을 복사해 `.env` 를 만들고 값을 채웁니다.

```bash
cp .env.example .env
```

| 변수 | 설명 |
|---|---|
| `NAVER_CLIENT_ID` / `NAVER_CLIENT_SECRET` | 네이버 개발자센터 발급 값 |
| `NAVER_REFRESH_TOKEN` | 2단계에서 발급받은 값 |
| `NAVER_CATEGORY_NO` | (선택) 글을 발행할 카테고리 번호. `npm run categories` 로 조회 |
| `NAVER_POST_OPEN_TYPE` | `all`(전체공개, 기본) / `closed` / `neighbor` / `agreedNeighbor` |
| `ANTHROPIC_API_KEY` | (선택) Claude로 글 생성. 없으면 템플릿 글 사용 |

### 4. 로컬 테스트

```bash
node --env-file=.env src/publish.mjs
```

(Node 20.6 미만이라면 `.env` 값을 직접 `export` 하거나 `dotenv-cli` 등을 사용하세요.)

## 정기 자동 발행 설정 (GitHub Actions)

GitHub 저장소 **Settings → Secrets and variables → Actions** 에 아래 Secrets를 등록하면, `.github/workflows/naver-blog-publish.yml` 워크플로우가 매일 자동 실행됩니다.

- `NAVER_CLIENT_ID`
- `NAVER_CLIENT_SECRET`
- `NAVER_REFRESH_TOKEN`
- `NAVER_CATEGORY_NO` (선택)
- `NAVER_POST_OPEN_TYPE` (선택)
- `ANTHROPIC_API_KEY` (선택)

발행 주기는 워크플로우 파일의 `cron: "0 0 * * *"` (KST 09:00) 값을 원하는 스케줄로 수정하면 됩니다. Actions 탭에서 **Run workflow** 버튼으로 즉시 수동 실행해 테스트할 수도 있습니다.

## 콘텐츠 주제 커스터마이징

`src/contentGenerator.mjs` 상단의 `TOPICS` 배열에 원하는 소재를 추가/수정하세요. 날짜를 시드로 순환 선택하므로, 배열 길이만큼의 소재가 순서대로 반복됩니다.

## 참고

- 네이버 블로그 글쓰기 API: `POST https://openapi.naver.com/blog/writePost.json` (`title`, `contents`, `categoryNo`, `options.openType` 등)
- 네이버 로그인 토큰 발급/갱신: `https://nid.naver.com/oauth2.0/token`
- 실제 API 응답 필드는 네이버 개발자센터 문서 및 `npm run categories` 실행 결과로 재확인하는 것을 권장합니다 (본 저장소 네트워크 환경에서는 `developers.naver.com` 접근이 제한되어 공개 Swagger 스펙 기준으로 작성했습니다).
