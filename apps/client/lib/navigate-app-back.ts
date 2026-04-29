type RouterLike = {
  back: () => void;
  push: (href: string) => void;
};

/**
 * 좌상단 뒤로가기 — 브라우저 히스토리가 있으면 `router.back()`, 없으면(직링크 등) `fallbackHref`.
 */
export function navigateAppBack(router: RouterLike, fallbackHref = "/"): void {
  if (typeof window !== "undefined" && window.history.length > 1) {
    router.back();
    return;
  }
  router.push(fallbackHref);
}
