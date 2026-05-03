import type { ReactNode } from "react";

import { WishlistAdPlacement } from "@/components/ads/WishlistAdPlacement";

/**
 * 내 위시(`/wishlist`)·공개 보드(`/wishlist/[slug]`) — 구단 보드 slug 포함.
 * 하단에 애드센스 스크립트 + (환경 변수 슬롯 시) 디스플레이 단위.
 */
export default function WishlistLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      <div className="min-h-0 min-w-0 flex-1">{children}</div>
      <WishlistAdPlacement />
    </div>
  );
}
