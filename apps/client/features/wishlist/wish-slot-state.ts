import type { GiftLayoutCount } from "@/components/wishlist/WishlistSlots";
import type { WishItemData } from "@/features/wishlist/types";
import { STORED_PUBLIC_DEFAULT_GIFT_ICON_KEY } from "@/lib/constants/gift-default-icon";

/** 서버 `WishItemService` 기본 GIFT_ICON 키 — 빈 슬롯 판별용 */
const SERVER_DEFAULT_GIFT_ICON_KEY = "default/gift_icon.png";

/** 예전 클라에서 하드코딩하던 프리셋 경로 — DB에 남아 있을 수 있음 */
const LEGACY_PRESET_ICON_KEYS = [
  "icon/present.png",
  "assets/icons/icon-100.png",
  /** DB에 `assets/` 접두어 없이 저장된 예전 키 */
  "icons/icon-100.png",
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
  if (s === STORED_PUBLIC_DEFAULT_GIFT_ICON_KEY) {
    return true;
  }
  const first = catalogFirstAssetKey?.trim();
  if (first && s === first) {
    return true;
  }
  const lower = s.toLowerCase();
  return LEGACY_PRESET_ICON_KEYS.some((k) => k.toLowerCase() === lower);
}

/**
 * 모달 **첫 칸「기본 선물」** 으로 저장된 키인지.
 * API 목록의 `giftIcons[0]`(두 번째 칸)과 구분하기 위해, 카탈로그 첫 행과의 동치 비교는 하지 않습니다.
 */
export function isStoredKeyGiftModalStaticPreset(storedKey: string): boolean {
  const s = storedKey.trim();
  if (!s) {
    return true;
  }
  if (matchesGiftPresetIcon(s, undefined)) {
    return true;
  }
  if (s.toLowerCase() === SERVER_DEFAULT_GIFT_ICON_KEY.toLowerCase()) {
    return true;
  }
  return false;
}

/**
 * 선물 이름이 없고, 아이콘도 없거나 서버·클라 ‘기본’ 아이콘만 있으면 빈 슬롯.
 * (`deriveWishSlotState` 배열과 동일 규칙 — 레이아웃 압축 시에도 이걸 써야 빈 칸이 안 생김)
 */
function isWishSlotSemanticallyEmptyFields(
  itemName: string | undefined | null,
  iconKey: string | undefined | null,
): boolean {
  if (itemName?.trim()) {
    return false;
  }
  const icon = iconKey?.trim() ?? "";
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

function isWishSlotSemanticallyEmpty(row: WishItemData): boolean {
  return isWishSlotSemanticallyEmptyFields(row.itemName, row.iconKey);
}

function areAllWishSlotsEmpty(items: WishItemData[]): boolean {
  if (items.length === 0) {
    return true;
  }
  return items.every(isWishSlotSemanticallyEmpty);
}

/**
 * API 선물 슬롯(1~3 → 배열 인덱스 0~2) 중 **의미상 비어 있지 않은** 칸만 앞에서부터
 * `GiftSlots` 레이아웃 슬롯 id 1…N에 붙입니다. (`isWishSlotSemanticallyEmptyFields` 와 동일 기준)
 * - 이전에는 `iconKey`만 있을 때만 압축해, **이름만 있고 아이콘이 비어 있는** 칸이 건너뛰어져
 *   `bigCircleCount`와 맞지 않아 빈 선물 원이 생길 수 있었음.
 */
export function compactGiftAssetKeysToLayoutSlots(
  wishTexts: readonly string[],
  wishGiftIconKeys: readonly string[],
): Partial<Record<number, string>> {
  const out: Partial<Record<number, string>> = {};
  let layoutSlot = 1;
  for (let apiIdx = 0; apiIdx < 3; apiIdx++) {
    const name = wishTexts[apiIdx] ?? "";
    const key = wishGiftIconKeys[apiIdx] ?? "";
    if (!isWishSlotSemanticallyEmptyFields(name, key)) {
      out[layoutSlot] = key.trim();
      layoutSlot += 1;
    }
  }
  return out;
}

/**
 * `compactGiftAssetKeysToLayoutSlots` 과 동일한 순서로, 같은 API 슬롯의 `itemName`을
 * 레이아웃 슬롯 id(1…N)에 붙입니다.
 */
export function compactGiftTextsToLayoutSlots(
  wishTexts: readonly string[],
  wishGiftIconKeys: readonly string[],
): Partial<Record<number, string>> {
  const out: Partial<Record<number, string>> = {};
  let layoutSlot = 1;
  for (let apiIdx = 0; apiIdx < 3; apiIdx++) {
    const name = wishTexts[apiIdx] ?? "";
    const key = wishGiftIconKeys[apiIdx] ?? "";
    if (!isWishSlotSemanticallyEmptyFields(name, key)) {
      out[layoutSlot] = name.trim() ?? "";
      layoutSlot += 1;
    }
  }
  return out;
}

/**
 * `GiftSlots`가 넘기는 레이아웃 슬롯 id(1…N, N=`bigCircleCount`) → API 배열 인덱스(0…2).
 * 중간 슬롯이 비면 2번째 원이 실제로는 `slotIndex` 3번 데이터이므로, `slotId - 1`로는 맞지 않음.
 */
export function layoutGiftSlotIdToApiIndex(
  layoutSlotId: number,
  wishTexts: readonly string[],
  wishGiftIconKeys: readonly string[],
): number | null {
  if (layoutSlotId < 1) {
    return null;
  }
  let seen = 0;
  for (let apiIdx = 0; apiIdx < 3; apiIdx++) {
    const name = wishTexts[apiIdx] ?? "";
    const key = wishGiftIconKeys[apiIdx] ?? "";
    if (!isWishSlotSemanticallyEmptyFields(name, key)) {
      seen += 1;
      if (seen === layoutSlotId) {
        return apiIdx;
      }
    }
  }
  return null;
}

/** API 1~3 중 의미상 비어 있는 가장 앞 `slotIndex`(배열 인덱스 0…2) — 선물 추가 시 PATCH 대상 */
export function firstSemanticallyEmptyApiIndex(
  wishTexts: readonly string[],
  wishGiftIconKeys: readonly string[],
): number | undefined {
  for (let apiIdx = 0; apiIdx < 3; apiIdx++) {
    const name = wishTexts[apiIdx] ?? "";
    const key = wishGiftIconKeys[apiIdx] ?? "";
    if (isWishSlotSemanticallyEmptyFields(name, key)) {
      return apiIdx;
    }
  }
  return undefined;
}

/**
 * 꾸미기에서 선물 원을 눌렀을 때 편집할 API 인덱스(0~2).
 * 전부 비어 있으면 `layoutGiftSlotIdToApiIndex`가 항상 null이므로 첫 빈 API 슬롯으로 대체합니다.
 */
export function resolveLayoutGiftClickToApiIndex(
  layoutSlotId: number,
  bigCircleCount: GiftLayoutCount,
  wishTexts: readonly string[],
  wishGiftIconKeys: readonly string[],
): number | null {
  const mapped = layoutGiftSlotIdToApiIndex(
    layoutSlotId,
    wishTexts,
    wishGiftIconKeys,
  );
  if (mapped != null) {
    return mapped;
  }
  const firstEmpty = firstSemanticallyEmptyApiIndex(wishTexts, wishGiftIconKeys);
  if (firstEmpty === undefined || layoutSlotId < 1 || layoutSlotId > bigCircleCount) {
    return null;
  }
  return firstEmpty;
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
