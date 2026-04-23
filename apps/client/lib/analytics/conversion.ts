/**
 * GA4 전환 이벤트 — GTM(dataLayer) 및 gtag 모두 지원.
 * GTM만 쓸 때는 컨테이너에서 Custom Event 이름 `sign_up`(또는 dataLayer 변수)으로 GA4 태그를 연결하세요.
 *
 * 로그인 화면의「회원가입」링크 전송은 `signup_intent_click` — 완료 전환 `sign_up`과 퍼널 비교용.
 */

import type { WishlistCtaTrafficContext } from "@/lib/analytics/wishlistCta";
import { getWishlistCtaTrafficContext } from "@/lib/analytics/wishlistCta";

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
    gtag?: (...args: unknown[]) => void;
  }
}

/** GA4 권장 파라미터 method: email | google | kakao 등 */
export const trackSignUp = (method: string = "email"): void => {
  if (typeof window !== "undefined" && window.dataLayer) {
    window.dataLayer.push({
      event: "sign_up",
      method,
    });
  }

  if (typeof window !== "undefined" && typeof window.gtag === "function") {
    window.gtag("event", "sign_up", { method });
  }
};

/** 로그인 페이지에서 회원가입 페이지로 이동 클릭 — 의도만 측정 (실제 가입 완료는 `sign_up`) */
export function trackSignupIntentClick(
  context: WishlistCtaTrafficContext = getWishlistCtaTrafficContext(),
): void {
  const payload = {
    event: "signup_intent_click",
    ...context,
  };

  if (typeof window !== "undefined" && window.dataLayer) {
    window.dataLayer.push(payload);
  }

  if (typeof window !== "undefined" && typeof window.gtag === "function") {
    window.gtag("event", "signup_intent_click", {
      traffic_source: context.traffic_source,
      utm_source: context.utm_source,
      utm_medium: context.utm_medium,
      utm_campaign: context.utm_campaign,
      referrer_host: context.referrer_host,
    });
  }
}
