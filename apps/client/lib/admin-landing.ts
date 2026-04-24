import type { MyProfile } from "@/features/user/types";

/** 메인 랜딩에서 관리자 전용 CTA로 취급할 로그인 아이디 */
export const LANDING_ADMIN_USERNAME = "ohjeomoh";

/**
 * 공개 위시 보드 슬러그(댓글 페이지).
 * 배포 환경에서 슬러그가 다르면 `NEXT_PUBLIC_ADMIN_PUBLIC_BOARD_SLUG`로 지정.
 */
export const ADMIN_PUBLIC_BOARD_SLUG: string =
  (typeof process !== "undefined" &&
    process.env.NEXT_PUBLIC_ADMIN_PUBLIC_BOARD_SLUG?.trim()) ||
  LANDING_ADMIN_USERNAME;

export function isLandingAdminUser(profile: Pick<MyProfile, "username" | "role">): boolean {
  if (profile.role === "ADMIN") return true;
  return profile.username.trim().toLowerCase() === LANDING_ADMIN_USERNAME.toLowerCase();
}
