/**
 * iPhone / iPad / iPod, 또는 터치가 있는 Mac(WebKit이 데스크톱 UA를 쓰는 iPad 호환 모드).
 * filter·transform 합성 시 drop-shadow가 사각으로 잘리는 경우가 있어,
 * 레이어 기반 그림자로 바꿀 때 사용합니다.
 */
export function isAppleTouchDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  return (
    /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}
