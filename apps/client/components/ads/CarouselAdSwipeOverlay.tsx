"use client";

import { useCallback, useRef, type PointerEvent, type ReactElement } from "react";

import {
  forwardTapThroughSwipeOverlay,
  isCarouselSwipeInteractiveTarget,
  readCarouselSwipeDelta,
  type CarouselSwipeStart,
} from "@/lib/carousel-swipe";

type CarouselAdSwipeOverlayProps = {
  onNavigateByDelta: (delta: number) => void;
  disabled?: boolean;
};

/** 카카오 광고 iframe이 포인터를 가로채도 좌우 스와이프·탭(폴백)이 동작하도록 투명 레이어 */
export function CarouselAdSwipeOverlay({
  onNavigateByDelta,
  disabled = false,
}: CarouselAdSwipeOverlayProps): ReactElement {
  const startRef = useRef<CarouselSwipeStart | null>(null);

  const onPointerDown = useCallback(
    (e: PointerEvent<HTMLDivElement>) => {
      if (disabled) return;
      if (!e.isPrimary) return;
      if (e.pointerType === "mouse" && e.button !== 0) return;
      e.stopPropagation();
      const swipeAllowed = !isCarouselSwipeInteractiveTarget(e.target);
      startRef.current = { x: e.clientX, y: e.clientY, swipeAllowed };
      if (swipeAllowed) {
        try {
          e.currentTarget.setPointerCapture(e.pointerId);
        } catch {
          /* ignore */
        }
      }
    },
    [disabled],
  );

  const onPointerUp = useCallback(
    (e: PointerEvent<HTMLDivElement>) => {
      e.stopPropagation();
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
      const start = startRef.current;
      startRef.current = null;
      if (disabled || !start) return;
      if (!e.isPrimary) return;

      const delta = readCarouselSwipeDelta(start, e.clientX, e.clientY);
      if (delta !== 0) {
        onNavigateByDelta(delta);
        return;
      }
      forwardTapThroughSwipeOverlay(e, start);
    },
    [disabled, onNavigateByDelta],
  );

  const onPointerCancel = useCallback(() => {
    startRef.current = null;
  }, []);

  return (
    <div
      className="absolute inset-x-0 bottom-[4.5rem] top-[14%] z-[45] touch-none"
      aria-hidden
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
    />
  );
}
