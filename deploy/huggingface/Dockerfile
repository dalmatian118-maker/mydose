# Hugging Face Spaces (Docker) 용: GitHub에서 최신 코드를 받아 수업 서버로 실행합니다.
FROM node:22-slim

RUN apt-get update \
    && apt-get install -y --no-install-recommends git ca-certificates \
    && rm -rf /var/lib/apt/lists/*

ARG REPO=dalmatian118-maker/mydose
ARG BRANCH=claude/inspiring-brown-u0fd9x

# 브랜치에 새 커밋이 생기면 캐시를 무시하고 다시 받도록 (Space의 "Factory rebuild" 때 최신 코드 반영)
ADD https://api.github.com/repos/${REPO}/git/refs/heads/${BRANCH} /tmp/version.json
RUN git clone --depth 1 --branch ${BRANCH} https://github.com/${REPO}.git /app

WORKDIR /app
ENV NODE_ENV=production \
    HOSTED=1 \
    PORT=7860

RUN npm ci --omit=dev \
    && node scripts/download-font.js \
    && mkdir -p data \
    && chown -R node:node /app

# Hugging Face Spaces 는 uid 1000 사용자로 실행합니다 (node 이미지의 node 사용자 = 1000)
USER node
EXPOSE 7860
CMD ["node", "server/index.js"]
