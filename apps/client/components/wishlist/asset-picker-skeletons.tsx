"use client";

import type { ReactNode } from "react";

import { ModalLazyScrollRoot } from "@/components/wishlist/modal-lazy-scroll-root";
import { STICKER_GRID_6COL_3ROW_SCROLL_HEIGHT } from "@/components/wishlist/sticker-sheet-layout";

/**
 * 실제 스티커 칸(× / 썸네일 버튼)과 동일한 틀 — 로딩 후 이미지가 같은 자리에만 채워지도록 함.
 */
export function StickerGridSkeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`grid grid-cols-6 gap-1 ${className}`.trim()}
      aria-busy="true"
      aria-label="스티커 불러오는 중"
      role="status"
    >
      {Array.from({ length: 18 }).map((_, i) => {
        const isDeleteSlot = i === 0;
        return (
          <div
            key={i}
            className={
              isDeleteSlot
                ? "relative flex aspect-square items-center justify-center overflow-hidden rounded-md border-2 border-slate-300 bg-white"
                : "relative aspect-square overflow-hidden rounded-md border border-slate-200 bg-slate-50"
            }
            aria-hidden
          >
            <span
              className={`absolute inset-[3px] animate-pulse rounded-sm ${
                isDeleteSlot ? "bg-slate-200/90" : "bg-slate-200/80"
              }`}
            />
          </div>
        );
      })}
    </div>
  );
}

/** 6×3 행 분량 고정 높이 — 스티커가 적어도 모달 높이가 줄지 않음. `scrollable`이면 내부 스크롤 */
const STICKER_SCROLL_INNER_CLASS =
  "h-full overflow-y-auto overflow-x-hidden overscroll-contain [-webkit-overflow-scrolling:touch] touch-pan-y";

export function StickerSheetFixedViewport({
  children,
  className = "",
  scrollable = false,
  /** true면 스크롤 루트에 단일 IntersectionObserver — `ScrollLazyModalImage`와 함께 사용 */
  lazyScrollImages = false,
}: {
  children: ReactNode;
  className?: string;
  scrollable?: boolean;
  lazyScrollImages?: boolean;
}) {
  return (
    <div
      className={`w-full min-h-0 ${className}`.trim()}
      style={{
        height: STICKER_GRID_6COL_3ROW_SCROLL_HEIGHT,
        maxHeight: STICKER_GRID_6COL_3ROW_SCROLL_HEIGHT,
      }}
    >
      {scrollable ? (
        lazyScrollImages ? (
          <ModalLazyScrollRoot className={STICKER_SCROLL_INNER_CLASS}>
            {children}
          </ModalLazyScrollRoot>
        ) : (
          <div className={STICKER_SCROLL_INNER_CLASS}>{children}</div>
        )
      ) : (
        children
      )}
    </div>
  );
}

/** 선물 아이콘 칸과 동일: `grid-cols-3 gap-2` + `rounded-xl border-2` 셸 */
export function GiftIconGridSkeleton() {
  return (
    <div
      className="grid grid-cols-3 gap-2 content-start"
      aria-busy="true"
      aria-label="선물 아이콘 불러오는 중"
      role="status"
    >
      {Array.from({ length: 12 }).map((_, i) => (
        <div
          key={i}
          className="relative aspect-square overflow-hidden rounded-xl border-2 border-slate-200 bg-slate-50"
          aria-hidden
        >
          <span className="absolute inset-1 animate-pulse rounded-lg bg-slate-200/90" />
        </div>
      ))}
    </div>
  );
}

/**
 * 로드 완료 후와 동일 레이아웃: 탭 줄(h-11) + 스크롤 그리드 영역(최소 높이로 모달 찌그러짐 방지).
 */
export function GiftIconModalChromeSkeleton() {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="scrollbar-x-none flex h-11 shrink-0 cursor-default gap-1 overflow-hidden border-b border-slate-100 px-2 pb-2 pt-2 select-none">
        <div className="h-7 w-16 shrink-0 animate-pulse rounded-full bg-slate-100" aria-hidden />
        <div className="h-7 w-14 shrink-0 animate-pulse rounded-full bg-slate-100" aria-hidden />
        <div className="h-7 w-20 shrink-0 animate-pulse rounded-full bg-slate-100" aria-hidden />
      </div>
      <div className="min-h-[min(28dvh,200px)] flex-1 overflow-y-auto overscroll-y-contain p-3 [-webkit-overflow-scrolling:touch]">
        <GiftIconGridSkeleton />
      </div>
    </div>
  );
}
