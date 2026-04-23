import type { NextConfig } from "next";

/**
 * API 프록시: 첫 번째 매칭만 적용됩니다.
 * 예전 설정은 `/api/*`를 모두 배포 서버로 보내 로컬 백엔드(8080)가 아닌 원격에서 401이 났습니다.
 *
 * 로컬 Spring: 기본값 http://127.0.0.1:8080 (백엔드 기동 필요)
 * 원격만 쓸 때: BACKEND_REWRITE_TARGET=https://k14f205.p.ssafy.io
 */
const backendOrigin =
  process.env.BACKEND_REWRITE_TARGET?.replace(/\/$/, "") ||
  "http://127.0.0.1:8080";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "192.168.31.153",
    "172.24.245.200",
    "192.168.0.12",
    "172.26.208.1",
    "172.26.1.182",
  ],
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${backendOrigin}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
