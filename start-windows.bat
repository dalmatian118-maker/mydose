@echo off
chcp 65001 > nul
title 브랜드 릴스 스튜디오
cd /d "%~dp0"

rem 관리자 권한이 없어 Node.js를 설치할 수 없는 학교 PC용:
rem nodejs.org에서 "Windows 바이너리(.zip)"를 받아 압축을 푼 뒤, 폴더 이름을 node 로 바꿔 이 폴더 안에 넣으면 그걸 씁니다.
if exist "%~dp0node\node.exe" set "PATH=%~dp0node;%PATH%"

where node > nul 2> nul
if errorlevel 1 (
  echo.
  echo [!] Node.js 가 없어요. 둘 중 하나를 해주세요.
  echo     1^) 열리는 페이지에서 LTS 설치 파일^(.msi^)을 설치 ^(관리자 권한 필요^)
  echo     2^) 관리자 권한이 없으면: 같은 페이지에서 "Windows 바이너리 .zip" 을 받아 압축을 풀고,
  echo        폴더 이름을 node 로 바꿔 이 프로그램 폴더 안에 넣은 뒤 다시 실행
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
