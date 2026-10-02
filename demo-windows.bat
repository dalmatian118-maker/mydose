@echo off
chcp 65001 > nul
rem API 키 없이 화면만 체험하기 (예시 대본, 색상 카드 이미지, 무음 + 자막)
set DEMO_MODE=1
call "%~dp0start-windows.bat"
