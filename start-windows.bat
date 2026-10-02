@echo off
chcp 65001 > nul
title 브랜드 릴스 스튜디오
cd /d "%~dp0"

where node > nul 2> nul
if errorlevel 1 (
  echo.
  echo [!] Node.js 가 설치되어 있지 않아요.
  echo     열리는 페이지에서 LTS 버전을 설치한 뒤, 이 파일을 다시 실행해주세요.
  start "" "https://nodejs.org/ko/download"
  pause
  exit /b 1
)

if not exist node_modules (
  echo 처음 실행이라 필요한 프로그램을 설치하고 있어요. 1~3분 정도 걸려요...
  call npm install
  if errorlevel 1 (
    echo [!] 설치에 실패했어요. 인터넷 연결을 확인하고 다시 실행해주세요.
    pause
    exit /b 1
  )
)

set OPEN_BROWSER=1
node server/index.js
pause
