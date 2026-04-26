/**
 * 핵심 비즈니스 전환 — **GA4 직접 (gtag.js)** 전송.
 *
 * - `G-4N35N8KWG2`는 RootLayout의 gtag `config`로 로드됨. Page View는 그 설정이 담당.
 * - GTM(`GTM-PJ9RR78P`)에는 애드센스·광고 픽셀·UI/스크롤 등을 넣고, GTM 쪽 GA4 연동 시 **페이지 조회 중복**만 끄면 됨(운영).
 * - 동일 전환을 GTM의 GA4 태그로 **한 번 더** 쏘지 않도록, 여기서는 gtag + (비 GA4용) dataLayer 를 쓰며,
 *   GTM에서 Meta 등만 `dataLayer` 이벤트로 묶는 구성을 권장.
 *
 * 신규 전환: 이 파일에 함수 추가 후, 화면에서 import 해 사용. (`전환 추적 추가` 요청 시 이 패턴)
 */

import type { WishlistCtaTrafficContext } from "@/lib/analytics/wishlistCta";
import { getWishlistCtaTrafficContext } from "@/lib/analytics/wishlistCta";

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
    gtag?: (...args: unknown[]) => void;
  }
}

export type SignupEntrySurface = "landing" | "login";

const trafficParams = (ctx: WishlistCtaTrafficContext) => ({
  traffic_source: ctx.traffic_source,
  utm_source: ctx.utm_source,
  utm_medium: ctx.utm_medium,
  utm_campaign: ctx.utm_campaign,
  referrer_host: ctx.referrer_host,
});

/** GA4 권장 이벤트 `sign_up` (이메일·카카오 등 `method` 포함) + 유입 매개변수 */
export function trackSignUpComplete(method: string = "email"): void {
  const ctx = getWishlistCtaTrafficContext();
  const base = { method, ...trafficParams(ctx) };

  if (typeof window !== "undefined" && window.dataLayer) {
    window.dataLayer.push({ event: "sign_up", ...base });
  }
  if (typeof window !== "undefined" && typeof window.gtag === "function") {
    window.gtag("event", "sign_up", base);
  }
}

/** @deprecated `trackSignUpComplete` 사용 */
export const trackSignUp = trackSignUpComplete;

export type SignupButtonClickOptions = Partial<WishlistCtaTrafficContext> & {
  signup_entry?: SignupEntrySurface;
};

/** @deprecated `SignupButtonClickOptions` */
export type SignupIntentClickOptions = SignupButtonClickOptions;

/**
 * 회원가입 버튼(의도) 클릭 — GA4 이벤트명 `signup_button_click`
 * @param overrides `signup_entry`: 랜딩 `landing`, 로그인 폼 `login`(기본)
 */
export function trackSignupButtonClick(overrides?: SignupButtonClickOptions): void {
  const { signup_entry: signupEntryOverride, ...trafficOverride } = overrides ?? {};
  const merged: WishlistCtaTrafficContext = {
    ...getWishlistCtaTrafficContext(),
    ...trafficOverride,
  };
  const signup_entry: SignupEntrySurface = signupEntryOverride ?? "login";
  const gtagParams = { ...trafficParams(merged), signup_entry };

  if (typeof window !== "undefined" && window.dataLayer) {
    window.dataLayer.push({ event: "signup_button_click", ...gtagParams });
  }
  if (typeof window !== "undefined" && typeof window.gtag === "function") {
    window.gtag("event", "signup_button_click", gtagParams);
  }
}

/** @deprecated `trackSignupButtonClick` + 이벤트명이 `signup_intent_click` 이었음 */
export function trackSignupIntentClick(overrides?: SignupButtonClickOptions): void {
  trackSignupButtonClick(overrides);
}
