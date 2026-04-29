/**
 * 메인 랜딩 "위시" CTA — 로딩 막대(0~1)용. 수치는 UI 튜닝용 상수(하드코딩 X, 한곳에서만 조정).
 * @see MainLandingContent
 */
export const WISH_CTA_FILL = {
  start: 0.05,
  afterFirstFrame: 0.12,
  /** createMyBoard 대기 중 interval이 이 값까지만 올라감(끝나면 1.0으로 닫음) */
  capWhileApi: 0.88,
  beforeNavigate: 0.97,
  full: 1,
} as const;

/** 꾸미러 가기(라우트만) — 막대를 몇 프레임에 나눠 채움 */
export const WISH_CTA_DECORATE_RAMP = [0.06, 0.45, 0.82, 1] as const;

export const WISH_CTA_PROGRESS_TICK_MS = 100;

export const nextFrame = () =>
  new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

/** interval 안에서 호출 — 상한까지 완만히 접근 */
export function easeTowardCap(p: number, cap: number): number {
  if (p >= cap - 0.001) return cap;
  return Math.min(cap, p + Math.max(0.012, (cap - p) * 0.06));
}

export async function runDecorateFillRamp(
  setFill: (n: number) => void,
  steps: readonly number[],
): Promise<void> {
  for (const v of steps) {
    setFill(v);
    await nextFrame();
  }
}
