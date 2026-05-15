/**
 * 서버가 내려주는 `assetKey`(예: `stickers/balloon/balloon-01.png`, `icons/icon-000.png`)를 이미지 URL로 만듭니다.
 * S3 객체 키는 `assets/{assetKey}` 형태이므로, 베이스는 `.../assets` 까지(끝 슬래시 없음) 두면 됩니다.
 *
 * - `NEXT_PUBLIC_ASSET_BASE_URL`: 최우선. CDN 붙이면 이 값만 바꾸면 됨.
 * - 로컬 `next dev` + 위 미설정: 퍼블릭 S3 직접 URL을 기본 사용(CDN 없을 때).
 * - 그 외: `/${assetKey}` → `next.config` 의 `ASSET_CDN_REWRITE_TARGET` 리라이트 또는 `public/` 정적 파일.
 */
const DEFAULT_DEV_S3_ASSET_BASE =
  "https://five-dot-five.s3.ap-northeast-2.amazonaws.com/assets";

function resolveAssetBaseUrl(): string {
  if (typeof process === "undefined") {
    return "";
  }
  const fromEnv = (process.env.NEXT_PUBLIC_ASSET_BASE_URL ?? "").replace(
    /\/$/,
    "",
  );
  if (fromEnv) {
    return fromEnv;
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
