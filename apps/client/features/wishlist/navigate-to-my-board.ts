import { getMyBoard } from "./api";

export type NavigateToMyWishBoardResult =
  | { ok: true; slug: string }
  | { ok: false; reason: "no_slug" | "fetch_failed" };

type RouterLike = {
  push: (href: string) => void;
  replace: (href: string) => void;
};

/**
 * `/wishlist` 중간 페이지 없이 내 보드 슬러그로 이동한다.
 * 실패 시 호출부에서 `/wishlist`(리다이렉트 페이지) 등으로 폴백하면 된다.
 */
export async function navigateToMyWishBoard(
  router: RouterLike,
  options?: { replace?: boolean },
): Promise<NavigateToMyWishBoardResult> {
  try {
    const board = await getMyBoard();
    const slug = board.data.boardSlug?.trim();
    if (!slug) return { ok: false, reason: "no_slug" };
    const path = `/wishlist/${encodeURIComponent(slug)}`;
    if (options?.replace) router.replace(path);
    else router.push(path);
    return { ok: true, slug };
  } catch {
    return { ok: false, reason: "fetch_failed" };
  }
}
