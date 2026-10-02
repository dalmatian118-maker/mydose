# Hugging Face Spaces (Docker) 용: GitHub에서 최신 코드를 받아 수업 서버로 실행합니다.
FROM node:22-slim

ARG REPO=dalmatian118-maker/mydose
ARG BRANCH=claude/inspiring-brown-u0fd9x

# GitHub 소스 압축본을 받습니다. 브랜치에 새 커밋이 생기면 내용이 바뀌어 다시 받습니다
# (Space의 Settings → Factory rebuild 때 최신 코드 반영)
ADD https://github.com/${REPO}/archive/refs/heads/${BRANCH}.tar.gz /tmp/src.tar.gz

WORKDIR /app
ENV NODE_ENV=production \
    HOSTED=1 \
    PORT=7860

RUN tar -xzf /tmp/src.tar.gz -C /app --strip-components=1 \
    && rm /tmp/src.tar.gz \
    && npm ci --omit=dev \
    && node scripts/download-font.js \
    && mkdir -p data \
    && chown -R node:node /app

# Hugging Face Spaces 는 uid 1000 사용자로 실행합니다 (node 이미지의 node 사용자 = 1000)
USER node
EXPOSE 7860
CMD ["node", "server/index.js"]
