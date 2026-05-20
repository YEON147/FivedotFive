"use client";

import { useCallback, useRef } from "react";
import type { PointerEvent } from "react";

import {
  isCarouselSwipeInteractiveTarget,
  readCarouselSwipeDelta,
  type CarouselSwipeStart,
} from "@/lib/carousel-swipe";

export function useCarouselPointerSwipe(
  onNavigateByDelta: (delta: number) => void,
  disabled = false,
) {
  const startRef = useRef<CarouselSwipeStart | null>(null);

  const onPointerDown = useCallback(
    (e: PointerEvent<HTMLDivElement>) => {
      if (disabled) return;
      if (!e.isPrimary) return;
      if (e.pointerType === "mouse" && e.button !== 0) return;
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
      if (delta !== 0) onNavigateByDelta(delta);
    },
    [disabled, onNavigateByDelta],
  );

  const onPointerCancel = useCallback(() => {
    startRef.current = null;
  }, []);

  return { onPointerDown, onPointerUp, onPointerCancel };
}
