import type { NextConfig } from "next";

/**
 * API 프록시: 위에서부터 첫 매칭이 적용됩니다.
 *
 * - 정상 클라이언트는 `/api/...` 로 요청 → 마지막 규칙으로 백엔드 `.../api/...` 전달.
 * - 배포 환경에서 리버스 프록시·게이트웨이가 `/api` prefix 를 떼면 `/boards/me` 처럼
 *   Next 로 들어와 매칭 실패 → 백엔드(Spring은 `/api/boards` 만 매핑)에 안 가고 500 등이 날 수 있음.
 *   그 경우 아래 `boards` / `users` / `rankings` 보정 규칙이 `/api` 를 다시 붙여 줌.
 *
 * 학교 검색(NEIS)은 Spring이 아니라 Next `app/front-api/schools/search/route.ts`에서 처리합니다.
 * `/api/*` 는 전부 백엔드로 넘기므로 해당 경로는 `/front-api/...` 로 둡니다.
 *
 * 로컬 Spring: 기본값 http://127.0.0.1:8080
 * 원격: BACKEND_REWRITE_TARGET=https://...(슬래시 없이 origin)
 *
 * 정적 에셋(상대 /stickers 등 404 방지): ASSET_CDN_REWRITE_TARGET=CloudFront·S3 웹사이트 등 오리진(슬래시 없음).
 * 설정 후 `next dev` 재시작 필요.
 *
 * 프론트 코드 점검: `fetch`·apiClient 경로는 항상 `/api/...` 로 시작하는지 확인
 * (`/boards/me` 절대 경로만 쓰면 브라우저는 동일 오리진에 두고 /api 가 빠질 수 있음)
 */
const backendOrigin =
  process.env.BACKEND_REWRITE_TARGET?.replace(/\/$/, "") ||
  "http://127.0.0.1:8080";

/**
 * 이미지 상대 경로(/stickers/..., /wallpapers/..., /icons/...)를 퍼블릭 CDN/S3로 넘깁니다.
 * DB의 assetKey는 `assets/` 없이 `stickers/...` 형태이므로, 실제 객체 경로는 `assets/` 를 붙입니다.
 * NEXT_PUBLIC_ASSET_BASE_URL 을 쓰면 브라우저가 CDN에 직접 가므로 이 리라이트는 타지 않습니다.
 */
const assetCdnOrigin = process.env.ASSET_CDN_REWRITE_TARGET?.replace(/\/$/, "");

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "192.168.31.153",
    "172.24.245.200",
    "192.168.0.12",
    "172.26.208.1",
    "172.26.1.182",
  ],
  async rewrites() {
    const assetRewrites = assetCdnOrigin
      ? [
          {
            source: "/stickers/:path*",
            destination: `${assetCdnOrigin}/assets/stickers/:path*`,
          },
          {
            source: "/wallpapers/:path*",
            destination: `${assetCdnOrigin}/assets/wallpapers/:path*`,
          },
          {
            source: "/icons/:path*",
            destination: `${assetCdnOrigin}/assets/icons/:path*`,
          },
        ]
      : [];

    return [
      ...assetRewrites,
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
