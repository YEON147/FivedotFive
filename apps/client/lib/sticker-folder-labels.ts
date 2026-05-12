/** 스티커 선택 탭에서 숨길 폴더 id (API에는 있을 수 있음) */
const STICKER_TAB_EXCLUDED_FOLDER_IDS = new Set(["toy"]);

/**
 * 스티커 바텀시트·댓글 팝업 탭용 — 숨김 폴더 제거.
 */
export function filterStickerFoldersForTabs(folders: readonly string[]): string[] {
  return folders.filter(
    (id) => !STICKER_TAB_EXCLUDED_FOLDER_IDS.has(id.trim().toLowerCase()),
  );
}

/**
 * API 순서는 유지하되, `redpanda`·`capybara`·`copybara`만 맨 끝에 고정
 * (랫서판다 → 카피바라 나란히).
 */
const STICKER_TAB_TAIL_ORDER = ["redpanda", "capybara", "copybara"] as const;

export function orderStickerFoldersForTabs(folders: readonly string[]): string[] {
  const filtered = filterStickerFoldersForTabs(folders);
  const tailNormSet = new Set(
    STICKER_TAB_TAIL_ORDER.map((t) => t.toLowerCase()),
  );
  const byNorm = new Map<string, string>();
  for (const id of filtered) {
    byNorm.set(id.trim().toLowerCase(), id);
  }
  const rest: string[] = [];
  for (const id of filtered) {
    const n = id.trim().toLowerCase();
    if (!tailNormSet.has(n)) {
      rest.push(id);
    }
  }
  const tail: string[] = [];
  for (const t of STICKER_TAB_TAIL_ORDER) {
    const orig = byNorm.get(t);
    if (orig != null) {
      tail.push(orig);
    }
  }
  return [...rest, ...tail];
}

/** `assets/stickers/{folder}/` 또는 `stickers/baseball/{팀}/` → API 폴더 id `baseball/{팀}` */
const STICKER_FOLDER_LABELS: Record<string, string> = {
  balloon: "풍선",
  universe: "우주",
  message: "메시지",
  dinosaur: "공룡",
  bubble: "버블",
  cute: "귀여운",
  dessert: "디저트",
  toy: "토이",
  felt: "펠트",
  food: "푸드",
  lego: "레고",
  capybara: "카피바라",
  /** 일부 에셋/S3 폴더명 오타 */
  copybara: "카피바라",
  redpanda: "랫서판다",
  baseball: "야구",
  /** `stickers/baseball/{팀}/` 하위 팀 태그 */
  giants: "롯데",
  dinos: "NC",
  lions: "삼성",
  eagles: "한화",
  heroes: "키움",
  twins: "LG",
  bears: "두산",
  tigers: "KIA",
  landers: "SSG",
  wiz: "KT",
  common: "야구",
};

export function getStickerFolderLabel(folderId: string): string {
  const trimmed = folderId.trim();
  if (!trimmed) {
    return folderId;
  }

  const direct = STICKER_FOLDER_LABELS[trimmed];
  if (direct) {
    return direct;
  }

  const lower = trimmed.toLowerCase();
  const fromLower = STICKER_FOLDER_LABELS[lower];
  if (fromLower) {
    return fromLower;
  }

  const parts = trimmed.split("/").filter(Boolean);
  if (parts.length === 2 && parts[0].toLowerCase() === "baseball") {
    const team = parts[1].toLowerCase();
    const teamLabel = STICKER_FOLDER_LABELS[team];
    if (teamLabel) return teamLabel;
    return `야구(${parts[1]})`;
  }

  return trimmed;
}
