/**
 * 메인 CTA「위시리스트 만들러 가기」클릭 시 유입 채널 추정 후 GA/GTM 전송.
 * 소셜 별 반응은 GA4에서 이벤트 `wishlist_create_click` + 매개변수 `traffic_source` 로 분석.
 */

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
    gtag?: (...args: unknown[]) => void;
  }
}

export type WishlistCtaTrafficContext = {
  /** 정규화된 채널 식별자 */
  traffic_source: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  referrer_host?: string;
};

function normalizeChannel(raw: string): string {
  const s = raw.trim().toLowerCase();
  if (!s) return "direct";

  const aliases: Record<string, string> = {
    ig: "instagram",
    insta: "instagram",
    fb: "facebook",
    meta: "facebook",
    tt: "tiktok",
    tw: "twitter",
    x: "twitter",
  };

  if (aliases[s]) return aliases[s];

  if (
    s.includes("instagram") ||
    s.includes("facebook") ||
    s.includes("tiktok") ||
    s.includes("twitter") ||
    s.includes("naver") ||
    s.includes("kakao") ||
    s.includes("youtube") ||
    s.includes("linkedin") ||
    s.includes("threads")
  ) {
    return s.split(/[./]/)[0] ?? s;
  }

  return s;
}

function hostToChannel(host: string): string {
  const h = host.toLowerCase();
  if (h.includes("instagram")) return "instagram";
  if (h.includes("facebook") || h === "fb.com" || h.includes("fb.watch"))
    return "facebook";
  if (h.includes("tiktok")) return "tiktok";
  if (h.includes("twitter") || h.includes("x.com") || h === "t.co") return "twitter";
  if (h.includes("threads")) return "threads";
  if (h.includes("linkedin")) return "linkedin";
  if (h.includes("youtube") || h === "youtu.be") return "youtube";
  if (h.includes("naver")) return "naver";
  if (h.includes("daum")) return "daum";
  if (h.includes("kakao")) return "kakao";
  return normalizeChannel(host.split(".")[0] ?? "referral");
}

/** 클릭 시점 기준 유입 정보 (utm 우선, 없으면 referrer) */
export function getWishlistCtaTrafficContext(): WishlistCtaTrafficContext {
  if (typeof window === "undefined") {
    return { traffic_source: "unknown" };
  }

  const params = new URLSearchParams(window.location.search);
  const utm_source = params.get("utm_source")?.trim() || undefined;
  const utm_medium = params.get("utm_medium")?.trim() || undefined;
  const utm_campaign = params.get("utm_campaign")?.trim() || undefined;

  let referrer_host: string | undefined;
  try {
    if (document.referrer) {
      referrer_host = new URL(document.referrer).hostname.replace(/^www\./, "");
    }
  } catch {
    referrer_host = undefined;
  }

  if (utm_source) {
    return {
      traffic_source: normalizeChannel(utm_source),
      utm_source,
      utm_medium,
      utm_campaign,
      referrer_host,
    };
  }

  if (referrer_host) {
    return {
      traffic_source: hostToChannel(referrer_host),
      utm_medium,
      utm_campaign,
      referrer_host,
    };
  }

  return {
    traffic_source: "direct",
    utm_medium,
    utm_campaign,
  };
}

/** 버튼 클릭 직후 호출 — 로그인 이동·API 성공 여부와 무관하게 의도만 측정 */
export function trackWishlistCreateClick(
  context: WishlistCtaTrafficContext = getWishlistCtaTrafficContext(),
): void {
  const payload = {
    event: "wishlist_create_click",
    ...context,
  };

  if (typeof window !== "undefined" && window.dataLayer) {
    window.dataLayer.push(payload);
  }

  if (typeof window !== "undefined" && typeof window.gtag === "function") {
    window.gtag("event", "wishlist_create_click", {
      traffic_source: context.traffic_source,
      utm_source: context.utm_source,
      utm_medium: context.utm_medium,
      utm_campaign: context.utm_campaign,
      referrer_host: context.referrer_host,
    });
  }
}
