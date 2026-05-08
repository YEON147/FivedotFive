import { resolveWishBoardSlugForEditor } from "./api";

export type NavigateToMyWishBoardResult =
  | { ok: true; slug: string }
  | { ok: false; reason: "no_slug" | "fetch_failed" };

type RouterLike = {
  push: (href: string) => void;
  replace: (href: string) => void;
};

/**
 * `/wishlist` 중간 페이지 없이 내 위시보드 슬러그로 이동한다.
 * 최근 원본이 롤링페이퍼여도 목록에서 첫 위시보드를 고른다.
 */
export async function navigateToMyWishBoard(
  router: RouterLike,
  options?: { replace?: boolean },
): Promise<NavigateToMyWishBoardResult> {
  try {
    const resolved = await resolveWishBoardSlugForEditor();
    const slug = resolved.slug?.trim();
    if (!slug) return { ok: false, reason: "no_slug" };
    const path = `/wishlist/${encodeURIComponent(slug)}`;
    if (options?.replace) router.replace(path);
    else router.push(path);
    return { ok: true, slug };
  } catch {
    return { ok: false, reason: "fetch_failed" };
  }
}
