/** 서버 `TeamBoardSlug` 및 공개 보드 slug 와 동일 — 야구단 전용 페이지 구분용 */
export const TEAM_BOARD_SLUGS = new Set([
  "lottegiants",
  "ncdinos",
  "samsung",
  "eagles",
  "kiwoom",
  "twins",
  "doosan",
  "kia",
  "ssg",
  "wiz",
]);

export function isTeamBoardSlug(slug: string): boolean {
  return TEAM_BOARD_SLUGS.has(slug.trim());
}
