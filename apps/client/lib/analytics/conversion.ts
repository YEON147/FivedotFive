/**
 * GA4 전환 이벤트 — GTM(dataLayer) 및 gtag 모두 지원.
 *
 * 퍼널(매체별):
 * - `signup_intent_click` + `signup_entry`(landing | login) + 유입 매개변수
 * - `sign_up` + 동일 유입 매개변수 + `method`(email | kakao)
 *
 * GA4 관리 → 맞춤 정의 → 맞춤 차원: 이벤트 범위로
 * `traffic_source`, `utm_source`, `utm_medium`, `utm_campaign`, `referrer_host`, `signup_entry` 등록 권장.
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

/** GA4 권장 이벤트 `sign_up` + 유입 매개변수(세션 attribution과 동일 키) */
export const trackSignUp = (method: string = "email"): void => {
  const ctx = getWishlistCtaTrafficContext();
  const base = { method, ...trafficParams(ctx) };

  if (typeof window !== "undefined" && window.dataLayer) {
    window.dataLayer.push({
      event: "sign_up",
      ...base,
    });
  }

  if (typeof window !== "undefined" && typeof window.gtag === "function") {
    window.gtag("event", "sign_up", base);
  }
};

export type SignupIntentClickOptions = Partial<WishlistCtaTrafficContext> & {
  signup_entry?: SignupEntrySurface;
};

/**
 * 회원가입 화면으로 가는 클릭(의도). 완료는 `sign_up`.
 * @param overrides `signup_entry`: 랜딩 링크는 `landing`, 로그인 폼은 `login`(기본).
 */
export function trackSignupIntentClick(overrides?: SignupIntentClickOptions): void {
  const { signup_entry: signupEntryOverride, ...trafficOverride } = overrides ?? {};
  const merged: WishlistCtaTrafficContext = {
    ...getWishlistCtaTrafficContext(),
    ...trafficOverride,
  };
  const signup_entry: SignupEntrySurface = signupEntryOverride ?? "login";
  const payload = {
    event: "signup_intent_click",
    ...trafficParams(merged),
    signup_entry,
  };

  if (typeof window !== "undefined" && window.dataLayer) {
    window.dataLayer.push(payload);
  }

  if (typeof window !== "undefined" && typeof window.gtag === "function") {
    window.gtag("event", "signup_intent_click", {
      ...trafficParams(merged),
      signup_entry,
    });
  }
}
