import type { PointerEvent as ReactPointerEvent } from "react";

export const CAROUSEL_SWIPE_MIN_PX = 56;
export const CAROUSEL_SWIPE_HORIZONTAL_RATIO = 1.15;

/** 캐러셀 스와이프: 버튼·링크 등에서는 페이지 넘김 무시 (광고 면은 예외) */
export function isCarouselSwipeInteractiveTarget(
  target: EventTarget | null,
): boolean {
  if (!(target instanceof Element)) return false;
  if (target.closest("[data-carousel-ad-slide]")) return false;
  return Boolean(
    target.closest(
      "button, a, [role='button'], input, textarea, select, label, [data-carousel-no-swipe]",
    ),
  );
}

export type CarouselSwipeStart = {
  x: number;
  y: number;
  swipeAllowed: boolean;
};

export function readCarouselSwipeDelta(
  start: CarouselSwipeStart,
  endX: number,
  endY: number,
): -1 | 0 | 1 {
  if (!start.swipeAllowed) return 0;
  const dx = endX - start.x;
  const dy = endY - start.y;
  if (Math.abs(dx) < CAROUSEL_SWIPE_MIN_PX) return 0;
  if (Math.abs(dx) < Math.abs(dy) * CAROUSEL_SWIPE_HORIZONTAL_RATIO) return 0;
  return dx < 0 ? 1 : -1;
}

/** 광고 iframe 위 터치 — 스와이프 시 페이지 전환, 탭은 하위 요소로 전달 */
export function forwardTapThroughSwipeOverlay(
  e: ReactPointerEvent<HTMLDivElement>,
  start: CarouselSwipeStart | null,
): void {
  if (!start?.swipeAllowed) return;
  const delta = readCarouselSwipeDelta(start, e.clientX, e.clientY);
  if (delta !== 0) return;

  const overlay = e.currentTarget;
  overlay.style.pointerEvents = "none";
  const under = document.elementFromPoint(e.clientX, e.clientY);
  overlay.style.pointerEvents = "auto";
  if (under instanceof HTMLElement && under !== overlay) {
    under.click();
  }
}
