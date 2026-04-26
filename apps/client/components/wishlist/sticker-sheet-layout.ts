/**
 * 6열 그리드에서 세로 3줄만 보이도록 하는 스크롤 박스 높이.
 * 부모에 `[container-type:inline-size]`가 있어야 `cqw`가 올바릅니다.
 */
export const STICKER_GRID_6COL_3ROW_SCROLL_HEIGHT =
  "calc((100cqw - 1.25rem) / 6 * 3 + 0.5rem)" as const;
