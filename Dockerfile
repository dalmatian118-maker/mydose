# 수업 서버용 이미지 (Railway, Render, Fly.io 등 Docker를 지원하는 곳이면 어디서나)
FROM node:22-slim

WORKDIR /app
ENV NODE_ENV=production \
    HOSTED=1 \
    PORT=7860

COPY package.json package-lock.json ./
# ffmpeg-static 이 설치 중에 운영체제에 맞는 ffmpeg 를 내려받습니다
RUN npm ci --omit=dev

COPY . .
RUN node scripts/download-font.js \
    && mkdir -p data \
    && chown -R node:node /app

USER node
EXPOSE 7860
CMD ["node", "server/index.js"]
