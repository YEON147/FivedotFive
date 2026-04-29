/**
 * 브라우저에서 백엔드 오리진을 바꿔야 할 때만 사용합니다.
 *
 * - **미설정(기본)**: 상대 경로 `/api/...` → Next 개발 서버·배포 프록시가 백엔드로 넘김.
 *   로컬에서 `127.0.0.1:8080`으로 직접 멀티파트 POST 하면 OS/브라우저에서
 *   `ERR_CONNECTION_RESET` 이 나는 경우가 있어, 기본은 동일 오리진(3000)을 권장합니다.
 *
 * - **직접 백엔드**: `.env.local` 에 예:
 *   `NEXT_PUBLIC_API_BROWSER_BASE=http://127.0.0.1:8080`
 *
 * JWT는 `Authorization`, 백엔드 CORS는 기존 설정 사용.
 */
export function resolveBrowserApiUrl(path: string): string {
  const base = process.env.NEXT_PUBLIC_API_BROWSER_BASE?.replace(/\/$/, "");
  if (!base) return path;
  if (!path.startsWith("/")) return `${base}/${path}`;
  return `${base}${path}`;
}
