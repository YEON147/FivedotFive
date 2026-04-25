# 1) Build stage
FROM eclipse-temurin:21-jdk AS build
WORKDIR /workspace

# [수정] 처음부터 루트에서 시작해서 소스를 다 복사합니다.
COPY . .

# [수정] 소스를 다 복사한 '후'에 서버 폴더로 들어가서 권한을 줍니다.
WORKDIR /workspace/apps/server
RUN chmod +x gradlew && sed -i 's/\r$//' gradlew

# 빌드 실행
RUN --mount=type=cache,target=/root/.gradle \
    ./gradlew --no-daemon clean bootJar -x test

############################
# 2) Runtime stage
############################
FROM eclipse-temurin:21-jre AS runtime
WORKDIR /app

# 보안 유저 설정
RUN useradd -m appuser
USER appuser

# 결과물 jar 복사 (경로 주의!)
COPY --from=build /workspace/apps/server/build/libs/*.jar /app/app.jar

EXPOSE 8080
ENTRYPOINT ["java","-XX:MaxRAMPercentage=75","-jar","/app/app.jar"]