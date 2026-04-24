import type { NextConfig } from "next";

/**
<<<<<<< HEAD
 * API 프록시: 첫 번째 매칭만 적용됩니다.
=======
 * API 프록시: 위에서부터 첫 매칭이 적용됩니다.
>>>>>>> origin/develop
 *
 * - 정상 클라이언트는 `/api/...` 로 요청 → 마지막 규칙으로 백엔드 `.../api/...` 전달.
 * - 배포 환경에서 리버스 프록시·게이트웨이가 `/api` prefix 를 떼면 `/boards/me` 처럼
 *   Next 로 들어와 매칭 실패 → 백엔드(Spring은 `/api/boards` 만 매핑)에 안 가고 500 등이 날 수 있음.
 *   그 경우 아래 `boards` / `users` / `rankings` 보정 규칙이 `/api` 를 다시 붙여 줌.
 *
 * 로컬 Spring: 기본값 http://127.0.0.1:8080
 * 원격: BACKEND_REWRITE_TARGET=https://...(슬래시 없이 origin)
 *
 * 프론트 코드 점검: `fetch`·apiClient 경로는 항상 `/api/...` 로 시작하는지 확인
 * (`/boards/me` 절대 경로만 쓰면 브라우저는 동일 오리진에 두고 /api 가 빠질 수 있음)
 */
const backendOrigin =
  process.env.BACKEND_REWRITE_TARGET?.replace(/\/$/, "") ||
  "https://k14f205.p.ssafy.io";

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
        source: "/boards/:path*",
        destination: `${backendOrigin}/api/boards/:path*`,
      },
      {
        source: "/users/:path*",
        destination: `${backendOrigin}/api/users/:path*`,
      },
      {
        source: "/rankings/:path*",
        destination: `${backendOrigin}/api/rankings/:path*`,
      },
      {
        source: "/api/:path*",
        destination: `${backendOrigin}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
