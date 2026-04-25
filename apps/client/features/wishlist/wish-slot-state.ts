import type { GiftLayoutCount } from "@/components/wishlist/WishlistSlots";
import type { WishItemData } from "@/features/wishlist/types";

/** 서버 `WishItemService` 기본 GIFT_ICON 키 — 빈 슬롯 판별용 */
export const SERVER_DEFAULT_GIFT_ICON_KEY = "default/gift_icon.png";

/** 예전 클라에서 하드코딩하던 프리셋 경로 — DB에 남아 있을 수 있음 */
const LEGACY_PRESET_ICON_KEYS = [
  "icon/present.png",
  "assets/icons/icon-100.png",
] as const;

/**
 * 모달「기본 선물」과 동일한 아이콘인지.
 * - 전체 조회 목록의 첫 `assetKey`와 같으면 프리셋으로 간주
 * - 또는 레거시 하드코딩 키
 */
export function matchesGiftPresetIcon(
  storedKey: string,
  catalogFirstAssetKey?: string | null,
): boolean {
  const s = storedKey.trim();
  if (!s) {
    return false;
  }
  const first = catalogFirstAssetKey?.trim();
  if (first && s === first) {
    return true;
  }
  const lower = s.toLowerCase();
  return LEGACY_PRESET_ICON_KEYS.some((k) => k.toLowerCase() === lower);
}

/**
 * 선물 이름이 없고, 아이콘도 없거나 서버·클라 ‘기본’ 아이콘만 있으면 빈 슬롯.
 */
export function isWishSlotSemanticallyEmpty(row: WishItemData): boolean {
  if (row.itemName?.trim()) {
    return false;
  }
  const icon = row.iconKey?.trim() ?? "";
  if (!icon) {
    return true;
  }
  const lower = icon.toLowerCase();
  if (lower === SERVER_DEFAULT_GIFT_ICON_KEY.toLowerCase()) {
    return true;
  }
  if (matchesGiftPresetIcon(icon, undefined)) {
    return true;
  }
  if (lower.includes("default/gift") || lower.endsWith("gift_icon.png")) {
    return true;
  }
  if (lower.endsWith("/present.png")) {
    return true;
  }
  return false;
}

function areAllWishSlotsEmpty(items: WishItemData[]): boolean {
  if (items.length === 0) {
    return true;
  }
  return items.every(isWishSlotSemanticallyEmpty);
}

/**
 * API 선물 슬롯(1~3 → 배열 인덱스 0~2) 중 내용 있는 칸만 앞에서부터 `GiftSlots` 레이아웃 슬롯 id 1…N에 붙입니다.
 * (예: 1·3번만 채워져 있어도 N=2 레이아웃에 좌=1번, 우=3번 선물이 올바르게 배치됨)
 */
export function compactGiftAssetKeysToLayoutSlots(
  wishGiftIconKeys: readonly string[],
): Partial<Record<number, string>> {
  const out: Partial<Record<number, string>> = {};
  let layoutSlot = 1;
  for (let apiIdx = 0; apiIdx < 3; apiIdx++) {
    const key = wishGiftIconKeys[apiIdx]?.trim();
    if (key) {
      out[layoutSlot] = key;
      layoutSlot += 1;
    }
  }
  return out;
}

export function deriveWishSlotState(items: WishItemData[]) {
  const allWishSlotsEmpty = areAllWishSlotsEmpty(items);
  if (allWishSlotsEmpty) {
    return {
      wishTexts: ["", "", ""],
      wishGiftIconKeys: ["", "", ""],
      bigCircleCount: 1 as GiftLayoutCount,
      allWishSlotsEmpty,
    };
  }

  const texts = ["", "", ""];
  const keys = ["", "", ""];
  for (const item of items) {
    const idx = item.slotIndex - 1;
    if (idx >= 0 && idx < 3) {
      texts[idx] = item.itemName ?? "";
      keys[idx] = item.iconKey ?? "";
    }
  }

  const filled = items.filter((i) => !isWishSlotSemanticallyEmpty(i)).length;

  return {
    wishTexts: texts,
    wishGiftIconKeys: keys,
    bigCircleCount: Math.max(1, Math.min(3, filled)) as GiftLayoutCount,
    allWishSlotsEmpty,
  };
}
