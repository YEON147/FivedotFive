/**
 * GET /api/me/boards-all 등에서 오는 `type` 문자열이 스펙마다 달라질 수 있어 느슨하게 매칭합니다.
 * (예: WISH_BOARD / WISHBOARD, ROLLING_PAPER / ROLLINGPAPER)
 */
export function isRollingPaperListType(type: string | null | undefined): boolean {
  const n = String(type ?? "")
    .trim()
    .toUpperCase()
    .replace(/-/g, "_");
  return n === "ROLLING_PAPER" || n === "ROLLINGPAPER";
}

export function listEntryHref(type: string | null | undefined, slug: string): string {
  const s = slug.trim();
  if (!s) return "/wishlist";
  if (isRollingPaperListType(type)) {
    return `/rolling-paper/${encodeURIComponent(s)}`;
  }
  return `/wishlist/${encodeURIComponent(s)}`;
}
