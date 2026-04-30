/**
 * `next/image` 대신 네이티브 `<img>`를 쓰는 경우 — 최적화 API·로더와 맞지 않는 소스.
 * (blob/data URL, SVG, GIF 애니메이션 등)
 */
export function shouldUseNativeImg(src: string): boolean {
  const s = (src ?? "").trim();
  if (!s) return true;
  if (s.startsWith("blob:") || s.startsWith("data:")) return true;
  const pathOnly = s.split(/[?#]/)[0]?.toLowerCase() ?? "";
  if (pathOnly.endsWith(".svg")) return true;
  if (pathOnly.endsWith(".gif")) return true;
  return false;
}
