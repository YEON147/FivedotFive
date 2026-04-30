/**
 * 에셋 CDN(`NEXT_PUBLIC_ASSET_BASE_URL`)·S3·CloudFront 등 원격 풀 URL만 `next/image` 대신 `<img>`.
 * 상대 경로(`/stickers/...`, `/default_icon.png` 등)는 false → `next/image` 최적화 유지.
 */
export function shouldUseNativeImg(src: string): boolean {
  const s = (src ?? "").trim();
  if (!s) return false;
  if (!/^https?:\/\//i.test(s)) {
    return false;
  }
  try {
    const u = new URL(s);
    if (u.hostname === "localhost" || u.hostname === "127.0.0.1") {
      return false;
    }
    const raw = process.env.NEXT_PUBLIC_ASSET_BASE_URL?.trim();
    if (raw) {
      const withProto = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
      const assetHost = new URL(withProto).hostname;
      if (u.hostname === assetHost || u.hostname.endsWith(`.${assetHost}`)) {
        return true;
      }
    }
    if (u.hostname.endsWith(".amazonaws.com")) return true;
    if (u.hostname.includes("cloudfront.net")) return true;
    return false;
  } catch {
    return false;
  }
}
