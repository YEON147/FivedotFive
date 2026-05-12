import type { NextConfig } from "next";
import type {
  LocalPattern,
  RemotePattern,
} from "next/dist/shared/lib/image-config";

/**
 * API 프록시: 위에서부터 첫 매칭이 적용됩니다.
 *
 * - 정상 클라이언트는 `/api/...` 로 요청 → 마지막 규칙으로 백엔드 `.../api/...` 전달.
 * - 배포 환경에서 리버스 프록시·게이트웨이가 `/api` prefix 를 떼면 `/boards/me` 처럼
 *   Next 로 들어와 매칭 실패 → 백엔드(Spring은 `/api/boards` 만 매핑)에 안 가고 500 등이 날 수 있음.
 *   그 경우 아래 `boards` / `users` / `rankings` 보정 규칙이 `/api` 를 다시 붙여 줌.
 *
 * 학교 검색(NEIS)은 Spring이 아니라 Next `app/front-api/schools/search/route.ts`에서 처리합니다.
 * 해당 Route Handler 환경 변수: `NEXT_PUBLIC_NEIS_API_KEY`(권장), 호환용 `NEIS_API_KEY`.
 * `/api/*` 는 전부 백엔드로 넘기므로 해당 경로는 `/front-api/...` 로 둡니다.
 *
 * 로컬 Spring: 기본값 http://127.0.0.1:8080
 * 원격: BACKEND_REWRITE_TARGET=https://...(슬래시 없이 origin)
 *
 * 정적 에셋(상대 /stickers 등 404 방지): ASSET_CDN_REWRITE_TARGET=CloudFront·S3 웹사이트 등 오리진(슬래시 없음).
 * 설정 후 `next dev` 재시작 필요.
 *
 * ngrok 등 외부 접속: `apps/client/.env.local` 에 NEXT_PUBLIC_NGROK_URL (또는 추가 호스트는 NEXT_PUBLIC_ALLOWED_DEV_ORIGINS).
 * `/_next/image` 허용 호스트: 위 변수들 + NEXT_PUBLIC_SITE_URL + NEXT_PUBLIC_IMAGE_REMOTE_HOSTS(쉼표) — `buildImageRemotePatterns` 참고.
 *
 * 프론트 코드 점검: `fetch`·apiClient 경로는 항상 `/api/...` 로 시작하는지 확인
 * (`/boards/me` 절대 경로만 쓰면 브라우저는 동일 오리진에 두고 /api 가 빠질 수 있음)
 *
 * 단축 공유 링크 `FRONTEND_URL/share/{code}` 는 Spring `GET /share/{code}`(302)에서 처리.
 * 동일 오리진으로 노출되므로 여기서 백엔드로 넘깁니다.
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

/**
 * `.env.local` — NEXT_PUBLIC_NGROK_URL = 터널 전체 URL (예: https://xxxx.ngrok-free.app)
 * 추가 호스트는 NEXT_PUBLIC_ALLOWED_DEV_ORIGINS (쉼표, 호스트 또는 URL)
 */
function devOriginHostFromEnvEntry(entry: string): string {
  const t = entry.trim();
  if (!t) return "";
  if (/^https?:\/\//i.test(t)) {
    try {
      return new URL(t).hostname;
    } catch {
      return "";
    }
  }
  return t;
}

function hostnameFromTunnelUrl(url: string | undefined): string {
  const u = url?.trim();
  if (!u) return "";
  try {
    return new URL(u).hostname;
  } catch {
    return "";
  }
}

const tunnelHostsFromEnv = [
  hostnameFromTunnelUrl(process.env.NEXT_PUBLIC_NGROK_URL),
  ...(process.env.NEXT_PUBLIC_ALLOWED_DEV_ORIGINS ?? "")
    .split(",")
    .map(devOriginHostFromEnvEntry),
].filter(Boolean);

const extraAllowedDevOrigins = [...new Set(tunnelHostsFromEnv)];

function hostnameFromSiteUrl(url: string | undefined): string {
  const u = url?.trim();
  if (!u) return "";
  try {
    return new URL(
      /^https?:\/\//i.test(u) ? u : `https://${u}`,
    ).hostname;
  } catch {
    return "";
  }
}

/** 스테이징·배포 프론트 오리진 — 상대 에셋이 `/_next/image?url=https://(이 호스트)/icons/...` 로 잡힐 때 허용 */
const siteHostFromEnv = hostnameFromSiteUrl(
  process.env.NEXT_PUBLIC_SITE_URL,
);

/**
 * 쉼표 구분 호스트 또는 전체 URL.
 * CI/테스트에서 ngrok·스테이징 도메인을 빌드 타임에 넣을 때 사용.
 */
function imageRemoteHostsFromEnvList(raw: string | undefined): string[] {
  if (!raw?.trim()) return [];
  return raw
    .split(",")
    .map((s) => {
      const t = s.trim();
      if (!t) return "";
      return devOriginHostFromEnvEntry(t);
    })
    .filter(Boolean);
}

const imageRemoteHostsExtra = [
  ...new Set(imageRemoteHostsFromEnvList(process.env.NEXT_PUBLIC_IMAGE_REMOTE_HOSTS)),
];

function dedupeRemotePatterns(patterns: RemotePattern[]): RemotePattern[] {
  const seen = new Set<string>();
  const out: RemotePattern[] = [];
  for (const p of patterns) {
    const key = `${p.protocol ?? ""}|${p.hostname}|${p.port ?? ""}|${p.pathname ?? ""}|${p.search ?? ""}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(p);
  }
  return out;
}

/**
 * `next/image` 원격 최적화 — S3·CDN·터널·배포 호스트.
 *
 * - production에서 `getAssetImageUrl`이 `/icons/...`만 주면 `url`에 **현재 사이트 호스트**가 들어가므로,
 *   ngrok·스테이징 도메인은 `NEXT_PUBLIC_SITE_URL` / `NEXT_PUBLIC_IMAGE_REMOTE_HOSTS` /
 *   `NEXT_PUBLIC_NGROK_URL`·`NEXT_PUBLIC_ALLOWED_DEV_ORIGINS` 로 여기에 포함되게 합니다.
 * - S3 가상 호스트(`*.s3.*.amazonaws.com`)는 `**.amazonaws.com` 보조용으로 명시합니다.
 */
function buildImageRemotePatterns(): RemotePattern[] {
  const patterns: RemotePattern[] = [
    { protocol: "https", hostname: "**.amazonaws.com", pathname: "/**" },
    { protocol: "https", hostname: "*.s3.*.amazonaws.com", pathname: "/**" },
    { protocol: "https", hostname: "**.cloudfront.net", pathname: "/**" },
    { protocol: "https", hostname: "**.ngrok-free.app", pathname: "/**" },
    { protocol: "https", hostname: "**.ngrok.io", pathname: "/**" },
    { protocol: "https", hostname: "**.ngrok.app", pathname: "/**" },
    { protocol: "http", hostname: "localhost", pathname: "/**" },
    { protocol: "http", hostname: "127.0.0.1", pathname: "/**" },
  ];

  const raw = process.env.NEXT_PUBLIC_ASSET_BASE_URL?.trim();
  if (raw) {
    try {
      const withProto = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
      const u = new URL(withProto);
      const protocol = u.protocol === "http:" ? "http" : "https";
      patterns.push({
        protocol,
        hostname: u.hostname,
        port: u.port || undefined,
        pathname: "/**",
      });
    } catch {
      /* noop */
    }
  }

  const extraHosts = [
    siteHostFromEnv,
    ...extraAllowedDevOrigins,
    ...imageRemoteHostsExtra,
  ].filter(Boolean);

  for (const h of new Set(extraHosts)) {
    patterns.push({
      protocol: "https",
      hostname: h,
      pathname: "/**",
    });
  }

  return dedupeRemotePatterns(patterns);
}

/** Next 16+ `/_next/image` 로컬 `src` 허용 — `images.localPatterns` 미설정 시 거절됨 */
const imageLocalPatterns: LocalPattern[] = [
  /** `public/default_icon.png` — 위시 기본 선물 썸네일(`next/image`) */
  { pathname: "/default_icon.png" },
  { pathname: "/icons/**" },
  { pathname: "/stickers/**" },
  { pathname: "/wallpapers/**" },
  { pathname: "/rollingpaper/**" },
  { pathname: "/main/**" },
  { pathname: "/ranking/**" },
];

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    ...extraAllowedDevOrigins,
    "192.168.31.153",
    "172.24.245.200",
    "192.168.0.12",
    "172.26.208.1",
    "172.26.1.182",
  ],
  images: {
    remotePatterns: buildImageRemotePatterns(),
    localPatterns: imageLocalPatterns,
    ...(process.env.NODE_ENV === "development"
      ? { minimumCacheTTL: 0 }
      : {}),
  },
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
        source: "/share/:path*",
        destination: `${backendOrigin}/share/:path*`,
      },
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


