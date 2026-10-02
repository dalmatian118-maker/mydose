@echo off
chcp 65001 > nul
rem 선생님 PC를 수업 서버로 켜기: 같은 와이파이의 학생들이 브라우저로 접속해서 사용합니다.
rem 먼저 start-windows.bat 로 한 번 실행해서 설정에 API 키를 저장해 두세요.
cd /d "%~dp0"
if "%CLASS_CODE%"=="" set /p CLASS_CODE=학생들에게 알려줄 수업 코드를 정해 입력하세요 (예: reels2026): 
if "%CLASS_CODE%"=="" (
  echo [!] 수업 코드가 비어 있어요. 다시 실행해주세요.
  pause
  exit /b 1
)
echo.
echo 수업 코드: %CLASS_CODE%
echo ※ "Windows 방화벽" 창이 뜨면 [개인 네트워크]에 체크하고 [액세스 허용]을 눌러주세요.
echo ※ 방화벽 창이 안 뜨거나 허용 버튼이 막혀 있으면 학생들이 접속할 수 없어요 ^(학교 전산 담당자에게 3000번 포트 허용 요청^).
echo ※ 수업 중에는 PC가 절전 모드에 들어가지 않도록 전원 설정을 확인해주세요.
echo.
set HOST=0.0.0.0
call "%~dp0start-windows.bat"
