/**
 * 랜딩·위시 CTA용 유입 채널 + GA4/GTM 이벤트.
 *
 * GA4 관리: 이벤트 범위 사용자 정의 차원 등록 권장
 * - `traffic_source`, `utm_source`, `utm_medium`, `utm_campaign`, `referrer_host`
 * - `cta_id`, `wishlist_entry`(위시 CTA), `signup_entry`(회원가입 의도)
 *
 * `sessionStorage`에 첫 유입(UTM 또는 외부 referrer)을 보관해, 내부 이동(`/signup` 등) 후에도
 * 같은 세션에서 매체·소스 기준 퍼널(가입 클릭 → 가입 완료, 꾸미러 가기 클릭)을 맞출 수 있습니다.
 */

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
    gtag?: (...args: unknown[]) => void;
  }
}

const TRAFFIC_ATTRIBUTION_STORAGE_KEY = "oh_traffic_attribution_v1";

export type WishlistCtaTrafficContext = {
  /** 정규화된 채널 식별자 */
  traffic_source: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  referrer_host?: string;
};

function isSameSiteReferrer(referrerHost: string | undefined): boolean {
  if (typeof window === "undefined" || !referrerHost) {
    return false;
  }
  const current = window.location.hostname.replace(/^www\./, "");
  const ref = referrerHost.replace(/^www\./, "");
  return ref === current;
}

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

function readStoredTrafficContext(): WishlistCtaTrafficContext | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const raw = sessionStorage.getItem(TRAFFIC_ATTRIBUTION_STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as WishlistCtaTrafficContext;
    if (parsed && typeof parsed.traffic_source === "string") {
      return parsed;
    }
  } catch {
    /* ignore */
  }
  return null;
}

function storeTrafficContext(ctx: WishlistCtaTrafficContext): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    sessionStorage.setItem(TRAFFIC_ATTRIBUTION_STORAGE_KEY, JSON.stringify(ctx));
  } catch {
    /* private mode 등 */
  }
}

/**
 * 클릭·전환 시점 유입 정보.
 * 1) URL에 utm_source 있으면 갱신 후 저장
 * 2) 없으면 세션에 저장된 첫 유입 사용
 * 3) 없고 외부 referrer면 채널 추정 후 저장
 * 4) 그 외 direct
 */
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
    const ctx: WishlistCtaTrafficContext = {
      traffic_source: normalizeChannel(utm_source),
      utm_source,
      utm_medium,
      utm_campaign,
      referrer_host,
    };
    storeTrafficContext(ctx);
    return ctx;
  }

  const stored = readStoredTrafficContext();
  if (stored) {
    return stored;
  }

  if (referrer_host && !isSameSiteReferrer(referrer_host)) {
    const ctx: WishlistCtaTrafficContext = {
      traffic_source: hostToChannel(referrer_host),
      utm_medium,
      utm_campaign,
      referrer_host,
    };
    storeTrafficContext(ctx);
    return ctx;
  }

  return {
    traffic_source: "direct",
    utm_medium,
    utm_campaign,
  };
}

/** 첫 화면 등에서 호출해 유입을 세션에 고정 (이후 내부 링크에서도 동일 attribution 사용) */
export function touchTrafficAttribution(): void {
  getWishlistCtaTrafficContext();
}

const trafficParams = (ctx: WishlistCtaTrafficContext) => ({
  traffic_source: ctx.traffic_source,
  utm_source: ctx.utm_source,
  utm_medium: ctx.utm_medium,
  utm_campaign: ctx.utm_campaign,
  referrer_host: ctx.referrer_host,
});

/** 랜딩 위시 관련 CTA(구경가기, 꾸미러/만들러 가기 등) — 매체별 클릭 비율용 */
export function trackWishlistCtaClick(params: {
  cta_id: string;
  wishlist_entry?: "decorate" | "create";
}): void {
  const base = getWishlistCtaTrafficContext();
  const payload: Record<string, unknown> = {
    event: "wishlist_cta_click",
    ...trafficParams(base),
    cta_id: params.cta_id,
  };
  if (params.wishlist_entry) {
    payload.wishlist_entry = params.wishlist_entry;
  }

  if (typeof window !== "undefined" && window.dataLayer) {
    window.dataLayer.push(payload);
  }

  if (typeof window !== "undefined" && typeof window.gtag === "function") {
    window.gtag("event", "wishlist_cta_click", {
      ...trafficParams(base),
      cta_id: params.cta_id,
      ...(params.wishlist_entry ? { wishlist_entry: params.wishlist_entry } : {}),
    });
  }
}

/** @deprecated `wishlist_cta_click` + cta_id 로 통합. 기존 GTM 연동이 있을 때만 사용. */
export function trackWishlistCreateClick(
  context: WishlistCtaTrafficContext = getWishlistCtaTrafficContext(),
): void {
  const payload = {
    event: "wishlist_create_click",
    ...trafficParams(context),
  };

  if (typeof window !== "undefined" && window.dataLayer) {
    window.dataLayer.push(payload);
  }

  if (typeof window !== "undefined" && typeof window.gtag === "function") {
    window.gtag("event", "wishlist_create_click", trafficParams(context));
  }
}
