import type { GiftLayoutCount } from "@/components/wishlist/WishlistSlots";
import type { WishItemData } from "@/features/wishlist/types";

/** PATCH·클라와 동일하게 쓰는 선물 프리셋 아이콘 키 (`public/icon/present.png`) */
export const GIFT_MODAL_PRESET_PRESENT_KEY = "icon/present.png";
/** 서버 `WishItemService` 기본 GIFT_ICON 키 */
export const SERVER_DEFAULT_GIFT_ICON_KEY = "default/gift_icon.png";

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
  if (lower.includes("default/gift") || lower.endsWith("gift_icon.png")) {
    return true;
  }
  if (icon === GIFT_MODAL_PRESET_PRESENT_KEY || lower.endsWith("/present.png")) {
    return true;
  }
  if (lower === SERVER_DEFAULT_GIFT_ICON_KEY.toLowerCase()) {
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
