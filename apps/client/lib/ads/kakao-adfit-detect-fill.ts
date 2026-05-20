/** 애드핏 `ins` 안에 실제 광고가 채워졌는지 대략 판별 */
export function isKakaoAdFitInsFilled(ins: HTMLModElement | null): boolean {
  if (!ins) return false;
  if (ins.childElementCount > 0) return true;
  const rect = ins.getBoundingClientRect();
  return rect.height > 24 && rect.width > 24;
}
