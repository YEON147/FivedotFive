"use client";

import Script from "next/script";
import { type ReactElement, useEffect, useRef } from "react";

import { reportAdsensePushFailure } from "@/lib/adsense-errors";

/** `public/ads.txt` 게시자 ID와 동일 */
export const ADSENSE_PUBLISHER_ID = "ca-pub-3821021138447390";

/** 반응형 단위 로드 전 레이아웃 공간 확보용 (CLS 완화) — 전형적인 모바일 배너 높이 근사 */
const AD_SLOT_MIN_HEIGHT_CLASS =
  "min-h-[90px] sm:min-h-[100px] w-full [contain:layout]";

function pushAdSlot(): void {
  try {
    const w = window as Window & { adsbygoogle?: unknown[] };
    w.adsbygoogle = w.adsbygoogle || [];
    w.adsbygoogle.push({});
  } catch (e) {
    reportAdsensePushFailure(e, "adsbygoogle.push");
  }
}

/** 애드센스 공식 로더 — 페이지당 1회면 충분(next/script 동일 src 중복 로드 완화). */
export function AdSenseLoader(): ReactElement {
  return (
    <Script
      id="adsbygoogle-js"
      async
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_PUBLISHER_ID}`}
      crossOrigin="anonymous"
      strategy="afterInteractive"
    />
  );
}

type AdSenseResponsiveUnitProps = {
  /** 애드센스 콘솔에서 발급한 광고 단위 슬롯 숫자 문자열 */
  adSlot: string;
  className?: string;
};

/**
 * 반응형 디스플레이 단위. 슬롯이 비어 있으면 렌더하지 않음.
 * 슬롯은 `NEXT_PUBLIC_ADSENSE_SLOT_*` 로 주입하는 것을 권장.
 */
export function AdSenseResponsiveUnit({
  adSlot,
  className,
}: AdSenseResponsiveUnitProps): ReactElement | null {
  const pushed = useRef(false);

  useEffect(() => {
    if (!adSlot.trim()) return;
    if (pushed.current) return;
    pushed.current = true;
    pushAdSlot();
  }, [adSlot]);

  if (!adSlot.trim()) return null;

  const mergedClass = [AD_SLOT_MIN_HEIGHT_CLASS, className].filter(Boolean).join(" ");

  return (
    <div className={mergedClass}>
      <ins
        className="adsbygoogle block min-h-0 w-full overflow-hidden"
        style={{ display: "block" }}
        data-ad-client={ADSENSE_PUBLISHER_ID}
        data-ad-slot={adSlot.trim()}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}
