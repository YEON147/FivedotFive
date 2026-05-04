import raw from "./team-board-slugs.json";

/** 서버 `TeamBoardSlug` 및 공개 보드 slug 와 동일 — 목록은 `team-board-slugs.json` 에서 관리 */
export const TEAM_BOARD_SLUGS = new Set<string>(
  Array.isArray(raw.slugs) ? raw.slugs.map((s) => String(s).trim()) : [],
);

export function isTeamBoardSlug(slug: string): boolean {
  return TEAM_BOARD_SLUGS.has(slug.trim());
}
