#!/bin/bash
# 선생님 Mac을 수업 서버로 켜기: 같은 와이파이의 학생들이 브라우저로 접속해서 사용합니다.
# 먼저 start-mac.command 로 한 번 실행해서 ⚙️ 설정에 API 키를 저장해 두세요.
cd "$(dirname "$0")" || exit 1

if [ -z "$CLASS_CODE" ]; then
  echo ""
  read -r -p "학생들에게 알려줄 수업 코드를 정해 입력하세요 (예: reels2026): " CLASS_CODE
fi
if [ -z "$CLASS_CODE" ]; then
  echo "[!] 수업 코드가 비어 있어요. 다시 실행해주세요."
  read -r -p "엔터를 누르면 창이 닫혀요."
  exit 1
fi

echo ""
echo "수업 코드: $CLASS_CODE"
echo "※ Mac이 잠자기에 들어가지 않도록 이 창이 열려 있는 동안 잠자기를 막아요."
echo "※ '들어오는 네트워크 연결을 허용할까요?' 창이 뜨면 [허용]을 눌러주세요."
echo "※ 인터넷 주소(https://...trycloudflare.com)가 만들어지면 랜선 PC·와이파이·휴대폰 어디서나 접속돼요."
echo ""

# caffeinate: 서버가 켜져 있는 동안 Mac 잠자기 방지
CLASS_CODE="$CLASS_CODE" HOST=0.0.0.0 TUNNEL=1 caffeinate -i bash ./start-mac.command
