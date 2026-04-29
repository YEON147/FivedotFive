/**
 * 구단 공개 위시·댓글 보드 slug (`/wishlist/{slug}`).
 * 서버 `TeamBoardSlug` 및 구단 계정 boardSlug 와 동일해야 합니다.
 */
export type KboTeamBoardSlug = (typeof KBO_TEAM_WISHLIST_BOARDS)[number]["slug"];

export const KBO_TEAM_WISHLIST_BOARDS = [
  { slug: "lottegiants", label: "롯데 자이언츠" },
  { slug: "ncdinos", label: "NC 다이노스" },
  { slug: "samsung", label: "삼성 라이온즈" },
  { slug: "eagles", label: "한화 이글스" },
  { slug: "kiwoom", label: "키움 히어로즈" },
  { slug: "twins", label: "LG 트윈스" },
  { slug: "doosan", label: "두산 베어스" },
  { slug: "kia", label: "KIA 타이거즈" },
  { slug: "ssg", label: "SSG 랜더스" },
  { slug: "wiz", label: "KT wiz" },
] as const;
