/**
 * 서버가 내려주는 `assetKey`(예: `stickers/balloon/balloon-01.png`, `icons/icon-000.png`)를 이미지 URL로 만듭니다.
 * S3 객체 키는 `assets/{assetKey}` 형태이므로, 베이스는 `.../assets` 까지(끝 슬래시 없음) 두면 됩니다.
 *
 * - `NEXT_PUBLIC_ASSET_BASE_URL`: 최우선. origin·호스트만 넣어도 끝에 `/assets`를 붙여 맞춤(이미 `.../assets`면 그대로).
 * - 로컬 `next dev` + 위 미설정: 퍼블릭 S3 직접 URL을 기본 사용(CDN 없을 때).
 * - 그 외: `/${assetKey}` → `next.config` 의 `ASSET_CDN_REWRITE_TARGET` 리라이트 또는 `public/` 정적 파일.
 */
const DEFAULT_DEV_S3_ASSET_BASE =
  "https://five-dot-five.s3.ap-northeast-2.amazonaws.com/assets";

function resolveAssetBaseUrl(): string {
  if (typeof process === "undefined") {
    return "";
  }
  const fromEnv = (process.env.NEXT_PUBLIC_ASSET_BASE_URL ?? "")
    .trim()
    .replace(/\/+$/, "");
  if (fromEnv) {
    return fromEnv.endsWith("/assets") ? fromEnv : `${fromEnv}/assets`;
  }
  if (process.env.NODE_ENV === "development") {
    return DEFAULT_DEV_S3_ASSET_BASE;
  }
  return "";
}

export function getAssetImageUrl(assetKey: string): string {
  const base = resolveAssetBaseUrl();
  const key = assetKey.replace(/^\//, "");
  if (base) {
    return `${base}/${encodeURI(key)}`;
  }
  return `/${encodeURI(key)}`;
}
