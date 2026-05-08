// 포커스 링 색 적용
export const UI_FOCUS_RING_TINT = "focus:ring-[#7B61FF]/25";

// 아웃라인 디자인 및 색 적용
export const UI_FOCUS_RING = `outline-none focus:outline-none focus:ring-2 ${UI_FOCUS_RING_TINT}`;

/** 키보드 포커스만 — 썸네일·그리드 등 클릭 위주 UI (`:focus-visible`) */
export const UI_FOCUS_RING_VISIBLE =
  "outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7B61FF]/25";

/**
 * 키보드 포커스 — `ring`(box-shadow)은 자식 배경보다 뒤에 깔릴 수 있어,
 * 배경 썸네일·바텀시트 등에서는 `outline` 사용 권장.
 * `outline-offset-0` — 조상 `overflow-auto`·라운드 코너에 덜 잘림.
 */
export const UI_FOCUS_OUTLINE_VISIBLE =
  "outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#7B61FF]/45 focus-visible:outline-offset-0";

/** 썸네일 카드 안쪽 — 바깥으로 안 튀어나와 시트에 안 잘림 */
export const UI_FOCUS_RING_INSET_VISIBLE =
  "outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#7B61FF]/55";
