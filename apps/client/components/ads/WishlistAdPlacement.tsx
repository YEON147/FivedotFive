"use client";

import type { ReactElement } from "react";
import { usePathname } from "next/navigation";

import { AdSenseLoader, AdSenseResponsiveUnit } from "@/components/ads/GoogleAdSense";
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
 * `/wishlist`, `/wishlist/{slug}` 하단 광고 영역 + 애드센스 스크립트.
 * 슬롯 env 가 없으면 스크립트만 로드(애드센스에서 자동 광고 ON 시 노출 가능).
 */
export function WishlistAdPlacement(): ReactElement {
  const pathname = usePathname() ?? "";
  const segments = pathname.split("/").filter(Boolean);
  const slug = segments.length >= 2 && segments[0] === "wishlist" ? segments[1] : "";
  const isTeam = slug.length > 0 && isTeamBoardSlug(slug);

  const slot =
    isTeam && SLOT_TEAM.length > 0 ? SLOT_TEAM : SLOT_WISHLIST.length > 0 ? SLOT_WISHLIST : "";

  return (
    <>
      <AdSenseLoader />
      {slot ? (
        <aside
          className="wishlist-ad-slot mx-auto w-full max-w-[min(420px,calc(100vw-1.5rem))] shrink-0 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2"
          aria-label="광고"
        >
          <AdSenseResponsiveUnit key={`${pathname}-${slot}`} adSlot={slot} />
        </aside>
      ) : null}
    </>
  );
}
