#!/usr/bin/env bash
# SSAFY 백엔드 제출용 산출물 생성 (apps/server)
# - S14P31F205-backend.jar : Spring Boot 실행 JAR (bootJar)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SERVER="$ROOT/apps/server"
OUT="$ROOT/dist/submission"
ARTIFACT_PREFIX="S14P31F205-backend"

mkdir -p "$OUT"

echo ">>> bootJar 빌드 (테스트 제외)"
(cd "$SERVER" && ./gradlew --no-daemon clean bootJar -x test)

JAR_PATH="$(ls -1 "$SERVER/build/libs/"*.jar | grep -v -- '-plain\.jar$' | head -1)"
if [[ -z "${JAR_PATH}" ]]; then
  echo "ERROR: bootJar 결과를 찾을 수 없습니다." >&2
  exit 1
fi

cp "$JAR_PATH" "$OUT/${ARTIFACT_PREFIX}.jar"
echo ">>> JAR: $OUT/${ARTIFACT_PREFIX}.jar"
echo ""
echo "완료. 실행: java -jar dist/submission/${ARTIFACT_PREFIX}.jar (Java 21)"
