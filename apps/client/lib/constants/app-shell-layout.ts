/**
 * 위시 메인(보드 `max-w-[372px]`)과 동일한 폭·패딩으로 앱 셸 페이지를 통일할 때 사용.
 * 수정 시 한 파일만 보면 됨.
 */

/** `main` — 오로라 배경 + 고정 뷰포트 셸 + 페이지 좌우 패딩 */
export const APP_SHELL_VIEWPORT_MAIN =
  "wishlist-page-root app-shell-viewport-floor flex flex-col px-3 pb-[env(safe-area-inset-bottom,0px)] pt-[env(safe-area-inset-top,0px)] sm:px-4";

/** `main` 직계 자식 — 컬럼을 감싸는 스테이지 */
export const APP_SHELL_STAGE =
  "relative z-10 flex min-h-0 w-full flex-1 flex-col items-center justify-start";

/** 로그인·OAuth 등 — 세로까지 가운데 맞출 때 */
export const APP_SHELL_STAGE_CENTERED =
  "relative z-10 flex min-h-0 w-full flex-1 flex-col items-center justify-center";

/** 최대 너비 372px — 위시 보드와 동일한 메인 컬럼 */
export const APP_MAIN_COLUMN =
  "mx-auto flex w-full min-h-0 max-w-[372px] flex-1 flex-col";

/** 로그인·OAuth — `flex-1` 없이 콘텐츠 높이만 쓰고 세로 가운데 정렬 */
export const APP_MAIN_COLUMN_AUTH =
  "mx-auto flex w-full min-w-0 max-w-[372px] shrink-0 flex-col";

/**
 * 컬럼 안 스크롤 영역 — 랭킹·공지·내정보 등에서 동일한 좌우 여백.
 * (보드 카드 내부 패딩과 시각적으로 맞도록 `px-2` / `sm:px-3`)
 */
export const APP_MAIN_SCROLL_BODY =
  "scrollbar-hidden flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-y-contain [-webkit-overflow-scrolling:touch] px-2 pb-4 pt-0 sm:px-3";

/** 회원가입 등 폼이 길 때 하단만 살짝 여유 */
export const APP_MAIN_SCROLL_BODY_FORM =
  "scrollbar-hidden flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-y-contain [-webkit-overflow-scrolling:touch] px-2 pb-5 pt-0 sm:px-3";
