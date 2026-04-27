#!/bin/bash

# 1. 현재 실행 중인 포트 확인 (Caddyfile에서 추출)
# 8081이 써있으면 현재 Blue가 서비스 중인 것임
CURRENT_PORT=$(grep -oP 'localhost:\K808[12]' /etc/caddy/Caddyfile)

if [ "$CURRENT_PORT" == "8081" ]; then
    TARGET_COLOR="green"
    TARGET_PORT=8082
    OLD_COLOR="blue"
    OLD_PORT=8081
else
    TARGET_COLOR="blue"
    TARGET_PORT=8081
    OLD_COLOR="green"
    OLD_PORT=8082
fi

echo ">>> 현재 서비스 포트: $CURRENT_PORT"
echo ">>> [$TARGET_COLOR] (포트: $TARGET_PORT) 배포를 시작합니다."

# 2. 새 버전 이미지 가져오기 및 컨테이너 실행
echo ">>> 최신 이미지를 가져옵니다 (Frontend & Backend-$TARGET_COLOR)"
docker compose pull client backend-$TARGET_COLOR

echo ">>> 인프라 컨테이너 상태 확인 및 실행"
docker compose up -d postgres redis

echo ">>> 프론트엔드(Client) 업데이트 시작"
docker compose up -d --no-deps client

echo ">>> 백엔드($TARGET_COLOR) 업데이트 시작"
docker compose up -d backend-$TARGET_COLOR

# 3. 헬스 체크 (새 서버가 뜰 때까지 대기)
echo ">>> 헬스 체크 시작 (http://localhost:$TARGET_PORT/api/health)..."
for retry_count in {1..20}
do
  RESPONSE=$(curl -s http://localhost:$TARGET_PORT/api/health)
  UP_COUNT=$(echo $RESPONSE | grep 'UP' | wc -l)

  if [ $UP_COUNT -ge 1 ]; then
      echo ">>> 신규 서버 헬스체크 성공!"
      break
  else
      echo ">>> 헬스 체크 중... (${retry_count}/20)"
  fi
  sleep 5
done

if [ $UP_COUNT -eq 0 ]; then
    echo ">>> 헬스 체크 실패. 배포를 중단합니다."
    exit 1
fi

# 4. Caddy 스위칭 (8081 <-> 8082)
echo ">>> Caddy 스위칭: $OLD_PORT -> $TARGET_PORT"
sudo sed -i "s/localhost:$OLD_PORT/localhost:$TARGET_PORT/g" /etc/caddy/Caddyfile
sudo systemctl reload caddy

# 5. 기존 서버 종료 (잠시 대기 후 종료)
echo ">>> 20초 후 이전 서버($OLD_COLOR)를 중지합니다."
sleep 20
docker stop backend-$OLD_COLOR
echo ">>> 배포 완료!"