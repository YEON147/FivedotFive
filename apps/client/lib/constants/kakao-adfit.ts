/** 캐러셀 전용 면 — 320×480 배너 */
export const KAKAO_ADFIT_UNIT_CAROUSEL =
  typeof process.env.NEXT_PUBLIC_KAKAO_ADFIT_UNIT_CAROUSEL === "string"
    ? process.env.NEXT_PUBLIC_KAKAO_ADFIT_UNIT_CAROUSEL.trim()
    : "DAN-oWpGLVHgaO4kQB1I";

export const KAKAO_ADFIT_CAROUSEL_WIDTH = 320;
export const KAKAO_ADFIT_CAROUSEL_HEIGHT = 480;

export const KAKAO_ADFIT_SDK_URL = "https://t1.kakaocdn.net/kas/static/ba.min.js";

/** ins 채움·onfail 확인 주기 */
export const KAKAO_ADFIT_NO_AD_POLL_INTERVAL_MS = 80;
/** 이 시간 안에 광고가 안 채워지면 야구 폴백 */
export const KAKAO_ADFIT_NO_AD_FALLBACK_MAX_WAIT_MS = 420;

export function isKakaoAdFitCarouselEnabled(): boolean {
  return KAKAO_ADFIT_UNIT_CAROUSEL.length > 0;
}
