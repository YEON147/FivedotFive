# syntax=docker/dockerfile:1.6

############################
# 1) Build stage
############################
FROM eclipse-temurin:21-jdk AS build
WORKDIR /workspace

# 우리 프로젝트 구조에 맞게 경로 확인
# apps/server 폴더 안에서 실행될 것이므로 현재 폴더(.)의 파일들을 복사합니다.
COPY apps/server/gradlew apps/server/gradlew.bat apps/server/settings.gradle* apps/server/build.gradle* ./
COPY apps/server/gradle/ ./gradle/

RUN chmod +x gradlew && sed -i 's/\r$//' gradlew

# 의존성 캐시 (빌드 속도 향상)
RUN --mount=type=cache,target=/root/.gradle \
    ./gradlew --no-daemon dependencies || true

# 소스 전체 복사
COPY . .

# bootJar 생성 (테스트 제외)
RUN --mount=type=cache,target=/root/.gradle \
    ./gradlew --no-daemon clean bootJar -x test

############################
# 2) Runtime stage
############################
FROM eclipse-temurin:21-jre AS runtime
WORKDIR /app

# 보안을 위한 유저 생성
RUN useradd -m appuser
USER appuser

# 빌드 결과물 복사
COPY --from=build /workspace/build/libs/*.jar /app/app.jar

EXPOSE 8080

# 메모리 최적화 옵션 포함 실행
ENTRYPOINT ["java","-XX:MaxRAMPercentage=75","-jar","/app/app.jar"]