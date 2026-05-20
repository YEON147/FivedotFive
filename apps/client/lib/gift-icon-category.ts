/**
 * S3 `icons/{카테고리}/…` 구조 — `assetKey`에서 카테고리 id 추출 (API·DB 키는 보통 `icons/…` 로 시작).
 */
export const GIFT_ICON_CATEGORY_IDS = [
  "food",
  "kpop",
  "hobby",
  "life",
  "travel",
  "exam",
  "baseball",
] as const;

export type GiftIconCategoryId = (typeof GIFT_ICON_CATEGORY_IDS)[number];

const CATEGORY_SET = new Set<string>(GIFT_ICON_CATEGORY_IDS);

/** UI 탭 라벨 — 폴더명(영문 id)과 대응 */
export const GIFT_ICON_CATEGORY_LABELS: Record<GiftIconCategoryId, string> = {
  food: "푸드",
  kpop: "케이팝",
  hobby: "취미",
  life: "라이프",
  travel: "여행",
  exam: "시험",
  baseball: "야구",
};

/**
 * `icons/food/food-001.png` → `food`
 * `icons/exam/exam-01.png` → `exam`
 * `icons/baseball/…` → `baseball` (구단 보드 등에서만 API가 내려줌)
 * `assets/icons/kpop/…` → `kpop`
 * 구버전 `icons/icon-100.png` 등은 `null` (「전체」에만 노출)
 */
export function giftIconCategoryFromAssetKey(assetKey: string): GiftIconCategoryId | null {
  const norm = String(assetKey ?? "")
    .replace(/\\/g, "/")
    .replace(/^\/+/, "")
    .toLowerCase();
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

/** S3 `icons/travel/{도시}/…` — 여행 탭 내 서브탭용 */
export const GIFT_ICON_TRAVEL_REGION_IDS = [
  "busan",
  "gangneung",
  "gyeongju",
  "jeju",
  "pohang",
  "suncheon",
  "yeosu",
] as const;

export type GiftIconTravelRegionId = (typeof GIFT_ICON_TRAVEL_REGION_IDS)[number];

const TRAVEL_REGION_SET = new Set<string>(GIFT_ICON_TRAVEL_REGION_IDS);

export const GIFT_ICON_TRAVEL_REGION_LABELS: Record<GiftIconTravelRegionId, string> = {
  busan: "부산",
  gangneung: "강릉",
  gyeongju: "경주",
  jeju: "제주",
  pohang: "포항",
  suncheon: "순천",
  yeosu: "여수",
};

/** `icons/travel/` 바로 아래 파일 등 — 서브폴더 없는 여행 아이콘 → 「기타」탭 */
export const GIFT_ICON_TRAVEL_LEGACY_TAB_ID = "legacy" as const;

export type GiftIconTravelSubTabId =
  | GiftIconTravelRegionId
  | typeof GIFT_ICON_TRAVEL_LEGACY_TAB_ID;

/**
 * `icons/travel/busan/busan-01.png` → `busan`
 * `icons/travel/travel-01.png`(폴더 없음)·알 수 없는 하위 폴더 → `null` (「기타」에서 표시)
 */
export function giftIconTravelRegionFromAssetKey(assetKey: string): GiftIconTravelRegionId | null {
  const norm = String(assetKey ?? "")
    .replace(/\\/g, "/")
    .replace(/^\/+/, "")
    .toLowerCase();
  const trimmed = norm.startsWith("assets/") ? norm.slice("assets/".length) : norm;
  if (!trimmed.startsWith("icons/")) {
    return null;
  }
  const parts = trimmed.split("/").filter(Boolean);
  if (parts.length < 4 || parts[1] !== "travel") {
    return null;
  }
  const region = parts[2];
  return TRAVEL_REGION_SET.has(region) ? (region as GiftIconTravelRegionId) : null;
}
