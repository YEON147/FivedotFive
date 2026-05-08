import type { MyProfile } from "@/features/user/types";

/** 메인 랜딩에서 관리자 전용 CTA로 취급할 로그인 아이디 */
export const LANDING_ADMIN_USERNAME = "ohjeomoh";

/**
 * 메인 랜딩「위시리스트 구경가기」등이 이동하는 공개 보드 URL 세그먼트 (`/wishlist/[slug]` → `GET /api/boards/{slug}`).
 * 서버는 **위시보드 `boardSlug` 문자열만** 조회하며 user id·username으로는 조회하지 않는다.
 * ohjeomoh 계정의 실제 슬러그는 `GET /api/boards/me`(해당 계정으로 로그인) 응답의 `slug`(type=WISH_BOARD) 또는 `/api/boards/me/list`으로 확인하고,
 * 로컬/배포에서는 아래 env에 그 값을 넣는다.
 */
export const ADMIN_PUBLIC_BOARD_SLUG: string =
  (typeof process !== "undefined" &&
    process.env.NEXT_PUBLIC_ADMIN_PUBLIC_BOARD_SLUG?.trim()) ||
  LANDING_ADMIN_USERNAME;

/** 메인 랜딩「구경가기」등 → 공개 위시리스트 `/wishlist/[slug]` (슬러그 없으면 랭킹 폴백) */
export function adminPublicWishlistHref(): string {
  const slug = ADMIN_PUBLIC_BOARD_SLUG.trim();
  if (!slug) return "/ranking";
  return `/wishlist/${encodeURIComponent(slug)}`;
}

export function isLandingAdminUser(profile: Pick<MyProfile, "username" | "role">): boolean {
  if (profile.role === "ADMIN") return true;
  return profile.username.trim().toLowerCase() === LANDING_ADMIN_USERNAME.toLowerCase();
}
