/**
 * TextField `fieldSurfaceState` 정상·채움 상태와 동일한 포커스 링 색 (#7B61FF / 25%).
 * `FIELD_SURFACE_FRAME` 등에 이미 `focus:ring-2`가 있을 때는 이 클래스만 덧붙이면 됩니다.
 */
export const UI_FOCUS_RING_TINT = "focus:ring-[#7B61FF]/25";

/**
 * 버튼·링크 등 — 기본 검은 outline 제거 + ring 2 + 서비스 보라 링
 */
export const UI_FOCUS_RING = `outline-none focus:outline-none focus:ring-2 ${UI_FOCUS_RING_TINT}`;
