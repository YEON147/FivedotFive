/**
 * 서버가 내려주는 `assetKey`(예: backgrounds/forest.png)를 이미지 URL로 변환합니다.
 * `.env`에 `NEXT_PUBLIC_ASSET_BASE_URL`(슬래시 없이)을 두면 `BASE/assetKey` 형태로 붙입니다.
 */
export function getAssetImageUrl(assetKey: string): string {
  const base =
    typeof process !== "undefined"
      ? (process.env.NEXT_PUBLIC_ASSET_BASE_URL ?? "").replace(/\/$/, "")
      : "";
  const key = assetKey.replace(/^\//, "");
  if (base) {
    return `${base}/${encodeURI(key)}`;
  }
  return `/${encodeURI(key)}`;
}
