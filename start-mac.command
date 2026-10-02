#!/bin/bash
# 더블클릭으로 실행 (처음 한 번은 마우스 오른쪽 클릭 → 열기)
cd "$(dirname "$0")" || exit 1

if ! command -v node > /dev/null 2>&1; then
  echo ""
  echo "[!] Node.js 가 설치되어 있지 않아요."
  echo "    열리는 페이지에서 LTS 버전을 설치한 뒤, 이 파일을 다시 실행해주세요."
  open "https://nodejs.org/ko/download"
  read -r -p "엔터를 누르면 창이 닫혀요."
  exit 1
fi

if [ ! -d node_modules ]; then
  echo "처음 실행이라 필요한 프로그램을 설치하고 있어요. 1~3분 정도 걸려요..."
  if ! npm install; then
    echo "[!] 설치에 실패했어요. 인터넷 연결을 확인하고 다시 실행해주세요."
    read -r -p "엔터를 누르면 창이 닫혀요."
    exit 1
  fi
fi

OPEN_BROWSER=1 node server/index.js
