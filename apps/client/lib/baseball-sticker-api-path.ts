/**
 * 구단 보드에서 스티커 API `GET .../folders/baseball/{team}` 의 `{team}` 세그먼트.
 * S3·DB는 `stickers/baseball/{팀태그}/…`(giants, bears, common 등)이므로 API도 동일한 태그를 씁니다.
 * 폴더 id가 실수로 `lottegiants`처럼 boardSlug와 같을 때만 → 해당 구단 팀 태그로 교정합니다.
 */

/** boardSlug → `stickers/baseball/{tag}/` 의 세그먼트 (서버 TeamDataInitializer teamTag 와 동일) */
const TEAM_TAG_BY_BOARD_SLUG: Record<string, string> = {
  lottegiants: "giants",
  ncdinos: "dinos",
  samsung: "lions",
  eagles: "eagles",
  kiwoom: "heroes",
  twins: "twins",
  doosan: "bears",
  kia: "tigers",
  ssg: "landers",
  wiz: "wiz",
};

/**
 * `baseball/{tail}` 의 tail과 선택적 boardSlug로 API용 `{team}` 한 세그먼트 결정.
 * - `common` 은 그대로
 * - tail 이 구단 boardSlug 와 같으면 → 해당 구단 팀 태그(giants …)
 * - 그 외는 tail 그대로 (이미 팀 태그인 경우 등)
 */
export function resolveBaseballStickerTeamApiSegment(
  folderTail: string,
  boardSlug?: string | null,
): string {
  const t = folderTail.trim().toLowerCase();
  if (!t || t === "common") return "common";

  const slug = boardSlug?.trim().toLowerCase() ?? "";
  const tag = slug ? TEAM_TAG_BY_BOARD_SLUG[slug] : undefined;

  if (slug && tag && t === slug) {
    return tag;
  }

  return t;
}
