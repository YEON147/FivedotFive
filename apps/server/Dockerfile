# 1) Build stage
FROM eclipse-temurin:21-jdk AS build
# [수정] 일꾼이 일을 시작하는 위치를 아예 서버 폴더로 잡습니다.
WORKDIR /workspace/apps/server

# 빌드 재료 복사 (현재 폴더인 apps/server 기준)
COPY apps/server/gradlew apps/server/gradlew.bat apps/server/settings.gradle* apps/server/build.gradle* ./
COPY apps/server/gradle/ ./gradle/

RUN chmod +x gradlew && sed -i 's/\r$//' gradlew

# 소스 전체 복사 (루트에서부터 가져와야 함)
WORKDIR /workspace
COPY . .

# 다시 서버 폴더로 이동해서 빌드 실행
WORKDIR /workspace/apps/server
RUN --mount=type=cache,target=/root/.gradle \
    ./gradlew --no-daemon clean bootJar -x test

############################
# 2) Runtime stage
############################
FROM eclipse-temurin:21-jre AS runtime
WORKDIR /app

RUN useradd -m appuser
USER appuser

# [수정] 결과물 jar 파일 경로를 정확히 맞춥니다.
COPY --from=build /workspace/apps/server/build/libs/*.jar /app/app.jar

EXPOSE 8080
ENTRYPOINT ["java","-XX:MaxRAMPercentage=75","-jar","/app/app.jar"]