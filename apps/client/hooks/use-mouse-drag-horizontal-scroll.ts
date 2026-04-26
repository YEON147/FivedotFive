"use client";

import { useCallback, useMemo, useRef } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";

const DRAG_THRESHOLD_PX = 6;

type MouseDragState = {
  pointerId: number;
  startClientX: number;
  startScrollLeft: number;
  dragged: boolean;
};

const initialDrag: MouseDragState = {
  pointerId: -1,
  startClientX: 0,
  startScrollLeft: 0,
  dragged: false,
};

/**
 * 가로 스크롤 영역을 마우스로 끌어 스크롤합니다. 터치·펜은 브라우저 기본 가로 스크롤을 유지합니다.
 * 탭·버튼 클릭과 드래그를 구분하려면 `mouseDragRef.current.dragged`를 클릭 핸들러에서 확인하세요.
 */
export function useMouseDragHorizontalScroll() {
  const stripRef = useRef<HTMLDivElement | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);
  const mouseDragRef = useRef<MouseDragState>({ ...initialDrag });

  const detach = useCallback(() => {
    cleanupRef.current?.();
    cleanupRef.current = null;
  }, []);

  const onPointerDown = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if (typeof window === "undefined") return;
    if (event.pointerType !== "mouse" || event.button !== 0) return;
    const strip = stripRef.current;
    if (!strip) return;

    cleanupRef.current?.();
    cleanupRef.current = null;

    const drag = mouseDragRef.current;
    drag.pointerId = event.pointerId;
    drag.startClientX = event.clientX;
    drag.startScrollLeft = strip.scrollLeft;
    drag.dragged = false;

    const win = window;
    const opts = { capture: true } as const;

    const onMove = (ev: PointerEvent) => {
      if (ev.pointerId !== drag.pointerId) return;
      const dx = ev.clientX - drag.startClientX;
      if (Math.abs(dx) > DRAG_THRESHOLD_PX) {
        drag.dragged = true;
      }
      if (drag.dragged) {
        ev.preventDefault();
        strip.scrollLeft = drag.startScrollLeft - dx;
      }
    };

    function onUpOrCancel(ev: PointerEvent) {
      if (ev.pointerId !== drag.pointerId) return;
      detachListeners();
      if (drag.dragged) {
        window.setTimeout(() => {
          drag.dragged = false;
        }, 0);
      }
    }

    const detachListeners = () => {
      win.removeEventListener("pointermove", onMove, opts);
      win.removeEventListener("pointerup", onUpOrCancel, opts);
      win.removeEventListener("pointercancel", onUpOrCancel, opts);
      cleanupRef.current = null;
    };

    win.addEventListener("pointermove", onMove, opts);
    win.addEventListener("pointerup", onUpOrCancel, opts);
    win.addEventListener("pointercancel", onUpOrCancel, opts);
    cleanupRef.current = detachListeners;
  }, []);

  return useMemo(
    () => ({ stripRef, onPointerDown, mouseDragRef, detach }),
    [detach, onPointerDown],
  );
}
