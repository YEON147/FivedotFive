import type { GiftLayoutCount } from "@/components/wishlist/WishlistSlots";
import type { BoardAssetData } from "@/features/wishlist/types";

/**
 * 위시리스트 페이지를 떠났다가 다시 들어올 때(예: 랭킹 → 뒤로가기) 로딩 플레이스홀더 없이
 * 직전 화면을 즉시 보여 주기 위한 메모리 캐시(탭 세션 동안만 유지).
 */
export type WishlistPageSessionCache = {
  viewerName: string;
  boardSlug: string | null;
  boardAssets: BoardAssetData[];
  wishTexts: string[];
  wishGiftIconKeys: string[];
  bigCircleCount: GiftLayoutCount;
  allWishSlotsEmpty: boolean;
  hasMyBoard: boolean;
};

/** 메인에서 보드 생성 직후 `/wishlist` 진입 시 한 번만 꾸미기 모드로 연다 */
export const SESSION_OPEN_DECORATE_AFTER_CREATE_KEY =
  "oh_jjeom_oh_wishlist_open_decorate_after_create";

let cache: WishlistPageSessionCache | null = null;

export function getWishlistPageSessionCache(): WishlistPageSessionCache | null {
  return cache;
}

export function setWishlistPageSessionCache(
  next: WishlistPageSessionCache | null,
): void {
  cache = next;
}

export function clearWishlistPageSessionCache(): void {
  cache = null;
}
