# 포팅 매뉴얼 (Porting Manual)

> **프로젝트명**: 오쩜오 (fivetofive)  
> **저장소**: GitLab `S14P31F205` (모노레포)  
> **팀**: SSAFY 14기  
> **도메인**: [https://fivedotfive.co.kr](https://fivedotfive.co.kr)  
> **최종 수정일**: 2026-05-20

---

## 목차

1. [프로젝트 개요 및 아키텍처](#1-프로젝트-개요-및-아키텍처)
2. [사용 제품 및 버전 정보](#2-사용-제품-및-버전-정보)
3. [빌드 시 사용되는 환경 변수](#3-빌드-시-사용되는-환경-변수)
4. [빌드 및 배포 절차](#4-빌드-및-배포-절차)
5. [서버 배포 구성 (Docker Compose)](#5-서버-배포-구성-docker-compose)
6. [배포 시 특이사항](#6-배포-시-특이사항)
7. [DB 접속 정보 및 프로퍼티 파일 목록](#7-db-접속-정보-및-프로퍼티-파일-목록)
8. [외부 서비스 정보](#8-외부-서비스-정보)

---

## 1. 프로젝트 개요 및 아키텍처

### 1.1 서비스 소개

**오쩜오**는 위시보드·롤링페이퍼 기반 소셜 선물·응원 서비스입니다. 사용자는 위시리스트를 만들고, 방문자가 댓글·스티커·선물 아이콘으로 응원할 수 있습니다. 카카오 소셜 로그인, S3 에셋 등을 사용합니다.

### 1.2 시스템 아키텍처

```
                    ┌─────────────────────────────────┐
                    │   Caddy (리버스 프록시, 운영 EC2)   │
                    │   HTTPS — /etc/caddy/Caddyfile     │
                    └────────────┬────────────────────┘
                                 │
              ┌──────────────────┼──────────────────┐
              │                  │                  │
       ┌──────▼──────┐    ┌───────▼───────┐   (Blue/Green)
       │  Frontend   │    │   Backend     │   backend-blue  :8081
       │  (Next.js)  │    │ (Spring Boot) │   backend-green :8082
       │  포트: 3000  │    │  포트: 8080   │   (활성 1대만 Caddy 연결)
       └─────────────┘    └───────┬───────┘
                                  │
                    ┌─────────────┼─────────────┐
                    │             │             │
             ┌──────▼──────┐ ┌────▼────┐ ┌──────▼──────┐
             │ PostgreSQL  │ │  Redis  │ │   AWS S3    │
             │  (Flyway)   │ │ :6379   │ │  (에셋 CDN)  │
             └─────────────┘ └─────────┘ └─────────────┘
```

로컬 개발 시 프론트는 Next.js `rewrites`로 백엔드(`localhost:8080`)에 프록시합니다.

### 1.3 서비스 구성


| 서비스                | 역할                               | 포트 (운영)                             | 기술 스택                       |
| ------------------ | -------------------------------- | ----------------------------------- | --------------------------- |
| **Backend (API)**  | REST API, 인증(JWT), 비즈니스 로직       | 8080 (컨테이너), 8081/8082 (Blue/Green) | Spring Boot 3.5.13, Java 21 |
| **Frontend (Web)** | SSR/SPA (Next.js App Router)     | 3000                                | Next.js 16.2.4, React 19    |
| **PostgreSQL**     | 메인 DB, Flyway 마이그레이션             | 5432 (컨테이너), 5433 (로컬 호스트)          | PostgreSQL 16               |
| **Redis**          | Refresh 토큰·캐시                    | 6379                                | Redis 7                     |
| **Caddy**          | HTTPS, API/정적 라우팅, Blue/Green 전환 | 80/443                              | Caddy (호스트 설치)              |


소스 경로: `apps/server/` (백엔드), `apps/client/` (프론트), `infra/` (Compose·배포 스크립트).

---

## 2. 사용 제품 및 버전 정보

### 2.1 개발 환경 (IDE)


| 구분                               | 버전    |
| -------------------------------- | ----- |
| IntelliJ IDEA / VS Code / Cursor | 최신 권장 |
| Git                              | 2.40+ |


### 2.2 Backend


| 구분            | 제품/기술                        | 버전             |
| ------------- | ---------------------------- | -------------- |
| **JDK**       | Eclipse Temurin (OpenJDK)    | **21**         |
| **빌드 도구**     | Gradle (Wrapper)             | **8.14.4**     |
| **프레임워크**     | Spring Boot                  | **3.5.13**     |
| **WAS**       | 내장 Tomcat                    | Spring Boot 내장 |
| **ORM**       | Hibernate / Spring Data JPA  | Spring Boot 종속 |
| **DB 마이그레이션** | Flyway                       | Spring Boot 종속 |
| **보안**        | Spring Security + JWT (jjwt) | **0.12.6**     |
| **캐시**        | Spring Data Redis            | Spring Boot 종속 |
| **유틸**        | Lombok                       | Spring Boot 종속 |


### 2.3 Frontend


| 구분                  | 제품/기술          | 버전              |
| ------------------- | -------------- | --------------- |
| **런타임 (Docker 빌드)** | Node.js        | **24** (Alpine) |
| **런타임 (로컬 권장)**     | Node.js        | **20+**         |
| **프레임워크**           | Next.js        | **16.2.4**      |
| **UI**              | React          | **19.2.4**      |
| **상태관리**            | Zustand        | **5.0.12**      |
| **CSS**             | Tailwind CSS   | **4.x**         |
| **아이콘**             | Phosphor Icons | **2.1.10**      |


### 2.4 인프라


| 구분            | 제품/기술                            | 버전                                            |
| ------------- | -------------------------------- | --------------------------------------------- |
| **데이터베이스**    | PostgreSQL                       | **16**                                        |
| **캐시**        | Redis                            | **7**                                         |
| **리버스 프록시**   | Caddy                            | 운영 EC2 호스트                                    |
| **컨테이너**      | Docker + Docker Compose          | 최신                                            |
| **CI/CD**     | GitLab CI/CD                     | `.gitlab-ci.yml`                              |
| **이미지 레지스트리** | GitHub Container Registry (GHCR) | `ghcr.io/<user>/server-image`, `client-image` |
| **서버**        | AWS EC2                          | SSH 배포 (`deploy.sh`)                          |


---

## 3. 빌드 시 사용되는 환경 변수

### 3.1 Backend 환경 변수

`infra/.env`, GitLab CI/CD Variables, 또는 로컬 `apps/server/.env.local` 로 설정합니다.


| 환경 변수                                | 설명                 | 예시/비고                                                               |
| ------------------------------------ | ------------------ | ------------------------------------------------------------------- |
| `SPRING_PROFILES_ACTIVE`             | Spring 프로필         | `local` / `prod`                                                    |
| **[DB]**                             |                    |                                                                     |
| `DB_URL`                             | JDBC URL           | `jdbc:postgresql://oh-jjeom-oh-postgres:5432/oh_jjeom_oh` (Compose) |
| `DB_USERNAME`                        | DB 사용자             | `postgres`                                                          |
| `DB_PASSWORD`                        | DB 비밀번호            | `(보안 정보)`                                                           |
| **[Redis]**                          |                    |                                                                     |
| `REDIS_HOST`                         | Redis 호스트          | `oh-jjeom-oh-redis`                                                 |
| `REDIS_PORT`                         | Redis 포트           | `6379`                                                              |
| **[JWT]**                            |                    |                                                                     |
| `JWT_SECRET`                         | JWT 서명 키 (32자 이상)  | `(보안 정보)`                                                           |
| **[OAuth]**                          |                    |                                                                     |
| `KAKAO_CLIENT_ID`                    | 카카오 REST API 키     | `(보안 정보)`                                                           |
| `KAKAO_CLIENT_SECRET`                | 카카오 시크릿            | `(보안 정보)`                                                           |
| **[관리자 시드]**                         |                    |                                                                     |
| `ADMIN_PASSWORD`                     | 관리자 초기 비밀번호        | `AdminDataInitializer`                                              |
| `ADMIN2_USERNAME`, `ADMIN2_PASSWORD` | (선택) 두 번째 관리자      |                                                                     |
| **[AWS S3]**                         |                    |                                                                     |
| `AWS_ACCESS_KEY`, `AWS_SECRET_KEY`   | S3 IAM             | `(보안 정보)`                                                           |
| `S3_BUCKET`                          | 버킷명                | `five-dot-five` (기본)                                                |
| `AWS_REGION`                         | 리전                 | `ap-northeast-2`                                                    |
| **[기타]**                             |                    |                                                                     |
| `MAIL_PASSWORD`                      | Gmail SMTP         | 운영 메일 발송                                                            |
| `FRONTEND_URL`                       | CORS·OAuth 리다이렉트 등 | `https://fivedotfive.co.kr`                                         |


### 3.2 Frontend 환경 변수 (빌드 시 `--build-arg`)

Docker 빌드·GitLab CI에서 주입되며, `**NEXT_PUBLIC_`* 는 빌드 시 번들에 고정**됩니다.


| 환경 변수                            | 설명                              |
| -------------------------------- | ------------------------------- |
| `NEXT_PUBLIC_API_URL`            | 브라우저가 호출하는 API 베이스 URL          |
| `BACKEND_REWRITE_TARGET`         | Next.js `rewrites` 대상 (SSR/프록시) |
| `NEXT_PUBLIC_SITE_URL`           | 사이트 URL (OG 등)                  |
| `NEXT_PUBLIC_ASSET_BASE_URL`     | 정적 에셋/CDN 베이스 URL               |
| `NEXT_PUBLIC_NEIS_API_KEY`       | NEIS 학교 API 키                   |
| `NEXT_PUBLIC_NEIS_API_BASE_URL`  | NEIS API 베이스                    |
| `NEXT_PUBLIC_IMAGE_REMOTE_HOSTS` | `next/image` 허용 호스트             |
| `NEXT_PUBLIC_OG_ENABLED`         | OG 메타 활성화 여부                    |
| `NEXT_PUBLIC_NGROK_URL`          | (선택) ngrok 개발용                  |


### 3.3 GitLab CI/CD Variables

GitLab > Settings > CI/CD > Variables 에 등록합니다.


| 환경 변수                                     | 설명                                  |
| ----------------------------------------- | ----------------------------------- |
| `GHCR_USER`, `GHCR_TOKEN`                 | GHCR 로그인·푸시                         |
| `DB_USERNAME`, `DB_PASSWORD`              | DB (스테이징 배포 job)                    |
| `JWT_SECRET`, `KAKAO_`*, `ADMIN_PASSWORD` | 백엔드                                 |
| `AWS_*`, `MAIL_PASSWORD`                  | 외부 연동                               |
| `NEXT_PUBLIC_*`, `BACKEND_REWRITE_TARGET` | 프론트 빌드                              |
| `EC2_PEM_KEY`, `EC2_HOST`                 | 운영 SSH 배포 (`deploy_production`)     |
| `SERVER_IMAGE_TAG`, `CLIENT_IMAGE_TAG`    | compose에서 `dev` / `prod` / `hotfix` |


---

## 4. 빌드 및 배포 절차

### 4.1 로컬 개발 환경 구성

#### DB·Redis

```bash
cd infra
docker compose -f docker-compose.local.yml up -d
```

- PostgreSQL: `localhost:5433`, DB `oh_jjeom_oh`, user `postgres`, password `1234`
- Redis: `localhost:6379`

#### Backend

```bash
cd apps/server
cp .env.local.example .env.local   # 최초 1회

export JWT_SECRET=<32자 이상>
export KAKAO_CLIENT_ID=<카카오 키>
export KAKAO_CLIENT_SECRET=<카카오 시크릿>
export ADMIN_PASSWORD=<관리자 비밀번호>

./gradlew bootRun --args='--spring.profiles.active=local'
```

- API: `http://localhost:8080`
- 헬스: `GET http://localhost:8080/api/health`
- 스키마: Flyway `apps/server/src/main/resources/db/migration/` (V1~)

#### Frontend

```bash
cd apps/client
npm install
npm run dev
```

- UI: `http://localhost:3000`

### 4.2 Docker 빌드 (수동)

저장소 **루트**에서 실행 (백엔드 Dockerfile이 모노레포 루트 컨텍스트).

#### Backend

```bash
docker build -t ghcr.io/<GHCR_USER>/server-image:dev -f apps/server/Dockerfile .
```

- 멀티 스테이지: `eclipse-temurin:21-jdk` → `eclipse-temurin:21-jre`

#### Frontend

```bash
docker build \
  --build-arg NEXT_PUBLIC_API_URL=https://fivedotfive.co.kr \
  --build-arg BACKEND_REWRITE_TARGET=https://fivedotfive.co.kr \
  --build-arg NEXT_PUBLIC_SITE_URL=https://fivedotfive.co.kr \
  --build-arg NEXT_PUBLIC_ASSET_BASE_URL=<CDN URL> \
  -t ghcr.io/<GHCR_USER>/client-image:dev \
  -f apps/client/Dockerfile .
```

### 4.3 CI/CD 파이프라인 (GitLab CI/CD)

`.gitlab-ci.yml` 기준.

#### 파이프라인 스테이지

```
build → deploy
```


| Job                 | 스테이지   | 트리거                                       | 동작                          |
| ------------------- | ------ | ----------------------------------------- | --------------------------- |
| `build_backend`     | build  | `develop`, `master`, `master-hotfix` push | server-image 빌드·GHCR 푸시     |
| `build_frontend`    | build  | 동일                                        | client-image 빌드·GHCR 푸시     |
| `deploy_staging`    | deploy | `develop` (현재 수동 배포 안내)                   | (비활성/수동)                    |
| `deploy_production` | deploy | `master` push 후 **수동**                    | EC2 SSH → `infra/deploy.sh` |


#### 이미지 태그


| 브랜치             | `SERVER_IMAGE_TAG` / `CLIENT_IMAGE_TAG` |
| --------------- | --------------------------------------- |
| `develop`       | `dev`                                   |
| `master`        | `prod`                                  |
| `master-hotfix` | `hotfix`                                |


---

## 5. 서버 배포 구성 (Docker Compose)

### 5.1 서버 디렉터리 구조 (예시)

운영 EC2에서 저장소·`infra/` 기준으로 배포합니다.

```
/home/ubuntu/S14P31F205/infra/
├── .env                    # Compose·배포용 (git 제외)
├── .env.example
├── docker-compose.yml      # 운영: postgres, redis, client, backend-blue/green
├── docker-compose.local.yml
├── docker-compose.test.yml # Caddy 테스트용
├── Caddyfile               # 참고용 (실제는 /etc/caddy/Caddyfile)
└── deploy.sh               # Blue/Green 배포 스크립트
```

### 5.2 Docker Compose 서비스 (`docker-compose.yml`)


| 서비스             | 이미지                        | 포트              | 비고                            |
| --------------- | -------------------------- | --------------- | ----------------------------- |
| `postgres`      | `postgres:16`              | 5433→5432 (호스트) | volume `postgres_data`        |
| `redis`         | `redis:7`                  | 6379            | volume `redis_data`           |
| `client`        | `ghcr.io/.../client-image` | 3000            | Next.js                       |
| `backend-blue`  | `ghcr.io/.../server-image` | 8081→8080       | Blue 슬롯                       |
| `backend-green` | `ghcr.io/.../server-image` | 8082→8080       | Green 슬롯                      |
| `backend`       | (레거시 단일)                   | 8080            | compose에 존재, Blue/Green 시 비활성 |


네트워크: `oh-jjeom-oh-net` (bridge).

### 5.3 배포 스크립트 (`deploy.sh`) 흐름

1. `/etc/caddy/Caddyfile` 에서 현재 활성 포트(8081 또는 8082) 확인
2. 비활성 색(blue/green)에 새 이미지 pull · `docker compose up`
3. `http://localhost:<새포트>/api/health` 헬스체크 (최대 40회)
4. Caddy를 새 포트로 `reload` (트래픽 전환)
5. 20초 후 이전 backend 컨테이너 `stop`

```bash
cd /home/ubuntu/S14P31F205/infra
export SERVER_IMAGE_TAG=prod CLIENT_IMAGE_TAG=prod
./deploy.sh
```

---

## 6. 배포 시 특이사항

### 6.1 Caddy·Blue/Green

- 운영 Caddy는 호스트에 설치 (`/etc/caddy/Caddyfile`). 저장소 `infra/Caddyfile` 은 참고용입니다.
- API는 `reverse_proxy` 로 활성 백엔드(8081 또는 8082)로 전달, 그 외는 Next.js(3000).
- 배포 중 잠깐 두 백엔드가 동시에 떠 있을 수 있으나, 트래픽은 한 대만 연결됩니다.

### 6.2 Flyway·DB

- 운영: `spring.jpa.hibernate.ddl-auto=validate` — **수동 DDL 금지**, 마이그레이션만 사용.
- checksum 불일치 시 기동 실패 → `flyway_schema_history` 정합성 확인.

### 6.3 애플리케이션 Initializer

- `AdminDataInitializer`, `TeamDataInitializer`, `SsafyDataInitializer` 가 기동 시 계정·보드를 보정·생성합니다.
- 로컬 DB에 닉네임 중복 등이 있으면 `SsafyDataInitializer` 가 실패할 수 있습니다 (`findByNickname` 폴백 적용됨).

### 6.4 프론트 빌드 타임 env

- `NEXT_PUBLIC_`* 변경 시 **client 이미지 재빌드·재배포** 필요 (런타임 env만으로는 반영되지 않음).

### 6.5 타임존

- JVM: `JAVA_TOOL_OPTIONS=-Duser.timezone=Asia/Seoul` (compose).

### 6.6 ADMIN 에셋 sync (`POST /api/admin/assets/sync`)

- 관리자가 위시보드 꾸미기 모드 진입 시 S3→DB 에셋 동기화 호출.
- 운영 500 시 **AWS 자격증명·S3 ListBucket 권한** 및 서버 로그 확인.

---

## 7. DB 접속 정보 및 프로퍼티 파일 목록

### 7.1 데이터베이스 접속 정보


| 항목                | 값                                                                     |
| ----------------- | --------------------------------------------------------------------- |
| **DBMS**          | PostgreSQL **16**                                                     |
| **DB 이름**         | `oh_jjeom_oh`                                                         |
| **호스트 (로컬)**      | `localhost`                                                           |
| **포트 (로컬)**       | `5433`                                                                |
| **호스트 (Compose)** | `oh-jjeom-oh-postgres`                                                |
| **포트 (Compose)**  | `5432`                                                                |
| **사용자/비밀번호**      | `DB_USERNAME` / `DB_PASSWORD` (운영), 로컬 compose 기본 `postgres` / `1234` |
| **스키마 관리**        | Flyway (`apps/server/src/main/resources/db/migration/`)               |


### 7.2 Redis 접속 정보


| 항목                | 값                   |
| ----------------- | ------------------- |
| **호스트 (로컬)**      | `localhost`         |
| **호스트 (Compose)** | `oh-jjeom-oh-redis` |
| **포트**            | `6379`              |


### 7.3 DB 스키마 제출물 (schema-only)

개인정보·운영 row 미포함. **[exec/schema.sql](./schema.sql)** 참고. 재생성 방법은 [exec/README.md](./README.md).

### 7.4 시연·시드 계정 (코드 기준, 비밀번호는 env/시드)


| 계정          | username        | 비고                       |
| ----------- | --------------- | ------------------------ |
| 관리자         | `ohjeomoh` (기본) | `ADMIN_PASSWORD` 로 최초 생성 |
| 구단 (예)      | `lottegiants` 등 | `TeamDataInitializer`    |
| SSAFY 반 (예) | `ssafy15dj1` 등  | 시드 시 공통 비밀번호 `SsafyDj26` |


### 7.5 주요 프로퍼티·설정 파일


| 파일 경로                                                          | 설명                    |
| -------------------------------------------------------------- | --------------------- |
| `apps/server/src/main/resources/application.yml`               | 공통 설정                 |
| `apps/server/src/main/resources/application-prod.yml`          | 운영 프로필                |
| `apps/server/src/main/resources/application-local.yml.example` | 로컬 예시                 |
| `apps/server/.env.local.example`                               | 로컬 env 템플릿            |
| `apps/client/next.config.ts`                                   | rewrites, image hosts |
| `apps/client/Dockerfile`                                       | 프론트 멀티 스테이지 빌드        |
| `apps/server/Dockerfile`                                       | 백엔드 멀티 스테이지 빌드        |
| `infra/docker-compose.yml`                                     | 운영 Compose            |
| `infra/docker-compose.local.yml`                               | 로컬 DB/Redis           |
| `infra/.env.example`                                           | 운영 env 템플릿            |
| `infra/deploy.sh`                                              | Blue/Green 배포         |
| `.gitlab-ci.yml`                                               | CI/CD                 |
| `exec/schema.sql`                                              | schema-only DDL (제출용) |


---

## 8. 외부 서비스 정보

### 8.1 GitHub Container Registry (GHCR)


| 항목     | 설명                                           |
| ------ | -------------------------------------------- |
| **용도** | `server-image`, `client-image` 저장            |
| **인증** | `GHCR_USER`, `GHCR_TOKEN` (GitLab Variables) |


### 8.2 카카오 개발자


| 항목               | 설명                                                      |
| ---------------- | ------------------------------------------------------- |
| **용도**           | 소셜 로그인 (OAuth2)                                         |
| **Redirect URI** | `https://fivedotfive.co.kr/api/login/oauth2/code/kakao` |
| **환경 변수**        | `KAKAO_CLIENT_ID`, `KAKAO_CLIENT_SECRET`                |


### 8.3 AWS S3


| 항목        | 설명                                               |
| --------- | ------------------------------------------------ |
| **용도**    | 위시/롤링 스티커·배경·프로필 등 에셋                            |
| **버킷**    | `five-dot-five` (기본, `S3_BUCKET`)                |
| **환경 변수** | `AWS_ACCESS_KEY`, `AWS_SECRET_KEY`, `AWS_REGION` |


### 8.4 NEIS Open API


| 항목        | 설명                                                          |
| --------- | ----------------------------------------------------------- |
| **용도**    | 학교 정보 (프론트)                                                 |
| **환경 변수** | `NEXT_PUBLIC_NEIS_API_KEY`, `NEXT_PUBLIC_NEIS_API_BASE_URL` |


### 8.5 Gmail SMTP


| 항목        | 설명              |
| --------- | --------------- |
| **용도**    | 운영 메일 발송        |
| **환경 변수** | `MAIL_PASSWORD` |


---

> **참고**: 비밀번호·토큰·시크릿 등은 본 문서에 실제 값을 기재하지 않습니다. GitLab CI/CD Variables 또는 팀 비밀 공유 채널에서 별도 수령하세요.

