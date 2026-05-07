/**
 * 6열(`grid-cols-6`)·`gap-1`(0.25rem)에서 정사각형 칸 기준 세로 3줄 높이.
 * — 가로: 열 5개 틈 = 1.25rem → 칸 너비 `(W - 1.25rem) / 6`
 * — 세로: 3행 + 행 틈 2개 = 0.5rem
 *
 * `100cqw`는 **조상**에만 `[container-type:inline-size]`를 두고, 높이를 쓰는 자손에서 사용해야
 * 그리드와 동일한 너비 W를 참조합니다(같은 요소에 container-type을 두면 브라우저별로 어긋날 수 있음).
 */
export const STICKER_GRID_6COL_3ROW_SCROLL_HEIGHT =
  "calc((100cqw - 1.25rem) / 6 * 3 + 0.5rem)" as const;

/** 6열×3행 − 삭제 칸 1 — 스크롤 영역 첫 화면에 들어가는 스티커 썸네일 수 */
export const STICKER_GRID_FIRST_SCREEN_STICKER_COUNT = 6 * 3 - 1;

/** 3열 그리드 기본 선물 제외 첫 3행 카탈로그 칸 수 */
export const GIFT_ICON_GRID_FIRST_SCREEN_CATALOG_COUNT = 3 * 3 - 1;
