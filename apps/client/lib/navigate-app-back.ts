type RouterLike = {
  back: () => void;
  push: (href: string) => void;
};

/**
 * 좌상단 뒤로가기 — 가능하면 `router.back()`, 스택이 없을 때만 `fallbackHref`.
 *
 * `history.length > 1` 만 보면 App Router·리다이렉트 뒤에 1로 남아 뒤로가기가 막히는 경우가 있어,
 * 같은 탭에서 한 번이라도 내부 이동이 있었는지(`idx`)를 함께 본다.
 */
export function navigateAppBack(router: RouterLike, fallbackHref = "/"): void {
  if (typeof window === "undefined") {
    router.push(fallbackHref);
    return;
  }

  const state = window.history.state as { idx?: number } | null;
  const idx = state?.idx;
  const canBack =
    window.history.length > 1 ||
    (typeof idx === "number" && idx > 0);

  if (canBack) {
    router.back();
    return;
  }
  router.push(fallbackHref);
}
