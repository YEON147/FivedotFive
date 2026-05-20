"use client";

import type { ReactElement } from "react";
import { usePathname } from "next/navigation";

import { AdSenseLoader, AdSenseResponsiveUnit } from "@/components/ads/GoogleAdSense";
import { isKakaoAdFitCarouselEnabled } from "@/lib/constants/kakao-adfit";
import { isTeamBoardSlug } from "@/lib/team-board-slugs";

/** 내 위시 꾸미기(`/wishlist`)·공개 보드(`/wishlist/[slug]`) 공통 */
const SLOT_WISHLIST =
  typeof process.env.NEXT_PUBLIC_ADSENSE_SLOT_WISHLIST === "string"
    ? process.env.NEXT_PUBLIC_ADSENSE_SLOT_WISHLIST.trim()
    : "";

/** 구단 공개 보드 slug 일 때(선택). 미설정 시 `SLOT_WISHLIST` 사용 */
const SLOT_TEAM =
  typeof process.env.NEXT_PUBLIC_ADSENSE_SLOT_TEAM === "string"
    ? process.env.NEXT_PUBLIC_ADSENSE_SLOT_TEAM.trim()
    : "";

/**
 * `/wishlist`, `/wishlist/{slug}` 하단 광고.
 * 캐러셀 애드핏 면이 켜져 있으면 하단 배너는 숨김(중복 방지).
 */
export function WishlistAdPlacement(): ReactElement | null {
  const pathname = usePathname() ?? "";
  const segments = pathname.split("/").filter(Boolean);
  const slug = segments.length >= 2 && segments[0] === "wishlist" ? segments[1] : "";
  const isTeam = slug.length > 0 && isTeamBoardSlug(slug);

  if (isKakaoAdFitCarouselEnabled()) {
    return null;
  }

  const slot =
    isTeam && SLOT_TEAM.length > 0 ? SLOT_TEAM : SLOT_WISHLIST.length > 0 ? SLOT_WISHLIST : "";

  return (
    <>
      <AdSenseLoader />
      {slot ? (
        <aside
          className="wishlist-ad-slot mx-auto w-full max-w-[min(420px,calc(100vw-1.5rem))] shrink-0 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 [contain:layout]"
          aria-label="광고"
        >
          <AdSenseResponsiveUnit key={`${pathname}-${slot}`} adSlot={slot} />
        </aside>
      ) : null}
    </>
  );
}
