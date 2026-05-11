import type { CSSProperties } from "react";

import { DESIGN_HEIGHT, DESIGN_WIDTH } from "@/components/wishlist/WishlistSlots";

/**
 * 공개 위시 보드(`app/wishlist/[slug]`) · 롤링페이퍼 등 방문자 보드 페이지 공통 셸.
 * 문자열을 여기서만 정의해 레이아웃이 어긋나지 않게 함.
 */
export const PUBLIC_BOARD_PAGE_MAIN_CLASS =
  "wishlist-page-root app-shell-viewport-floor flex min-h-0 flex-col overflow-visible px-3 pb-[env(safe-area-inset-bottom,0px)] pt-[env(safe-area-inset-top,0px)] sm:px-4";

export const PUBLIC_BOARD_PAGE_Z10_CLASS =
  "relative z-10 flex min-h-0 w-full min-w-0 flex-1 flex-col items-stretch justify-start overflow-visible transition-all duration-300 ease-out";

/** `WISHLIST_BOARD_PAGE_WRAP` — 폭 상한·세로 채움 */
export const PUBLIC_WISHLIST_BOARD_WRAP =
  "relative flex h-full min-h-0 max-h-full w-full max-w-[min(420px,calc(100vw-1.5rem))] flex-1 flex-col overflow-visible bg-transparent";

export const PUBLIC_BOARD_PAGE_COLUMN_CLASS =
  "relative flex min-h-0 min-w-0 flex-1 flex-col overflow-visible p-0";

/** 꾸미기 보드 래퍼와 동일 패딩 — 세로 가운데 + 가로 중앙 */
export const PUBLIC_BOARD_PAGE_CENTER_CLASS =
  "relative flex min-h-0 min-w-0 flex-1 items-center justify-center overflow-visible px-1 pb-1 pt-2 sm:px-2 sm:pb-2 sm:pt-3";

/**
 * 공개 보드 카드 프레임 — `app/wishlist/page.tsx` 꾸미기 보드(`WISHLIST_BOARD_FRAME_BASE` + decorate)와 동일.
 */
export const PUBLIC_WISHLIST_BOARD_FRAME =
  "relative isolate overflow-visible rounded-[18px] shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] ring-1 wishlist-board-frame--decorate mx-auto w-full max-w-[372px] max-h-[min(680px,100%)] shrink-0 ring-violet-200/55";

export const PUBLIC_BOARD_INNER =
  "relative h-full w-full min-h-0 min-w-0 overflow-visible bg-transparent";

export function publicBoardAspectRatioStyle(): CSSProperties {
  return {
    aspectRatio: `${DESIGN_WIDTH} / ${DESIGN_HEIGHT}`,
  };
}
