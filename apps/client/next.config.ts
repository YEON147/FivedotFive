import type { NextConfig } from "next";

/**
 * API 프록시: 위에서부터 첫 매칭이 적용됩니다.
 *
 * - 정상 클라이언트는 `/api/...` 로 요청 → 마지막 규칙으로 백엔드 `.../api/...` 전달.
 * - 배포 환경에서 리버스 프록시·게이트웨이가 `/api` prefix 를 떼면 `/boards/me` 처럼
 *   Next 로 들어와 매칭 실패 → 백엔드(Spring은 `/api/boards` 만 매핑)에 안 가고 500 등이 날 수 있음.
 *   그 경우 아래 `boards` / `users` / `rankings` 보정 규칙이 `/api` 를 다시 붙여 줌.
 *
 * 로컬 Spring: 기본값 http://127.0.0.1:8080
 * 원격: BACKEND_REWRITE_TARGET=https://도메인:포트 (환경변수 값 끝에 슬래시+api 를 붙이지 말 것)
 *   — 예: .../api 로 두면 destination 이 .../api/api/boards... 가 되어 Spring 경로와 맞지 않고
 *     전 API가 4xx/5xx 로 떨어질 수 있음. 아래 `resolveBackendOrigin` 이 끝의 `/api` 를 한 번 제거함.
 *
 * 프론트 코드 점검: `fetch`·apiClient 경로는 항상 `/api/...` 로 시작하는지 확인
 * (`/boards/me` 절대 경로만 쓰면 브라우저는 동일 오리진에 두고 /api 가 빠질 수 있음)
 */
function resolveBackendOrigin(): string {
  const raw = (process.env.BACKEND_REWRITE_TARGET ?? "http://127.0.0.1:8080")
    .trim()
    .replace(/\/$/, "");
  if (raw === "") {
    return "http://127.0.0.1:8080";
  }
  // https://k14f205.p.ssafy.io/api 처럼 'API base' 를 잘못 넣은 경우 → origin 만 사용
  if (raw.endsWith("/api")) {
    return raw.slice(0, -"/api".length).replace(/\/$/, "") || "http://127.0.0.1:8080";
  }
  return raw;
}

const backendOrigin = resolveBackendOrigin();

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "192.168.31.153",
    "172.24.245.200",
    "192.168.0.12",
    "172.26.208.1",
    "172.26.1.182",
    "172.23.64.1"
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
