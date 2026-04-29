/**
 * S3 `icons/{카테고리}/…` 구조 — `assetKey`에서 카테고리 id 추출 (API·DB 키는 보통 `icons/…` 로 시작).
 */
export const GIFT_ICON_CATEGORY_IDS = ["food", "kpop", "hobby", "life"] as const;

export type GiftIconCategoryId = (typeof GIFT_ICON_CATEGORY_IDS)[number];

const CATEGORY_SET = new Set<string>(GIFT_ICON_CATEGORY_IDS);

/** UI 탭 라벨 — 폴더명(영문 id)과 대응 */
export const GIFT_ICON_CATEGORY_LABELS: Record<GiftIconCategoryId, string> = {
  food: "푸드",
  kpop: "케이팝",
  hobby: "취미",
  life: "라이프",
};

/**
 * `icons/food/food-001.png` → `food`
 * `assets/icons/kpop/…` → `kpop`
 * 구버전 `icons/icon-100.png` 등은 `null` (「전체」에만 노출)
 */
export function giftIconCategoryFromAssetKey(assetKey: string): GiftIconCategoryId | null {
  const norm = assetKey.replace(/\\/g, "/").replace(/^\/+/, "").toLowerCase();
  const trimmed = norm.startsWith("assets/") ? norm.slice("assets/".length) : norm;
  if (!trimmed.startsWith("icons/")) {
    return null;
  }
  const parts = trimmed.split("/").filter(Boolean);
  if (parts.length < 3) {
    return null;
  }
  const folder = parts[1];
  return CATEGORY_SET.has(folder) ? (folder as GiftIconCategoryId) : null;
}
