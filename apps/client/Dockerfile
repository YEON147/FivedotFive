# 1. 빌드 스테이지
FROM node:24-alpine AS builder
WORKDIR /app

# 의존성 설치
COPY package*.json ./
RUN npm ci

# 전체 소스 복사
COPY . .

# [중요] 빌드 시점에 백엔드 주소를 주입!
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

# 빌드 실행
RUN npm run build

# 2. 실행 스테이지
FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# 필요한 파일만 골라 담기
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000
# Next.js 서버 실행
CMD ["npm", "start"]