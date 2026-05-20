/** `assets/stickers/{folder}/` id → UI 라벨 (API 폴더명과 동일) */
const STICKER_FOLDER_LABELS: Record<string, string> = {
  balloon: "풍선",
  universe: "우주",
  message: "메시지",
  dinosaur: "공룡",
  bubble: "버블",
  cute: "귀여운",
  dessert: "디저트",
  redpanda: "랫서판다",
  capybara: "카피바라",
  cheerup: "응원",
};

/** 탭에서 숨길 스티커 폴더 id */
const STICKER_FOLDER_IDS_EXCLUDED_FROM_TABS = new Set(["toy"]);

/** `baseball/{tail}` — API 세그먼트·레거시 팀 태그 → 탭 한글 (공통·롯데·두산 …) */
const BASEBALL_STICKER_TAIL_KO: Record<string, string> = {
  common: "공통",
  lotte: "롯데",
  nc: "NC",
  samsung: "삼성",
  hanwha: "한화",
  kiwoom: "키움",
  lg: "LG",
  doosan: "두산",
  kia: "KIA",
  ssg: "SSG",
  kt: "KT",
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
  lottegiants: "롯데",
  ncdinos: "NC",
  baseball: "야구",
};

export function getStickerFolderLabel(folderId: string): string {
  const f = folderId.trim();
  const lower = f.toLowerCase();
  if (lower === "baseball") {
    return BASEBALL_STICKER_TAIL_KO.baseball ?? "야구";
  }
  if (lower.startsWith("baseball/")) {
    const tail = f.slice("baseball/".length).split("/").filter(Boolean)[0] ?? "";
    const ko = BASEBALL_STICKER_TAIL_KO[tail.toLowerCase()];
    if (ko) return ko;
  }
  return STICKER_FOLDER_LABELS[f.toLowerCase()] ?? folderId;
}

/**
 * 스티커 폴더 목록을 탭 표시 순서로 정렬.
 * - `toy` 는 탭에서 제외
 * - 야구 관련 폴더(`baseball`, `baseball/common`, `baseball/...`)가 맨 앞
 * - 그 외: 알파벳 순, 단 `redpanda`·`capybara` 는 맨 끝(랫서판다 → 카피바라 순)
 * 백엔드의 `sortStickerFoldersTeamBoardFirst` 와 동일한 야구 정렬 규칙.
 */
export function orderStickerFoldersForTabs(folders: string[]): string[] {
  if (!folders || folders.length === 0) return [];
  const filtered = folders.filter(
    (f) => !STICKER_FOLDER_IDS_EXCLUDED_FROM_TABS.has(f.trim().toLowerCase()),
  );
  return [...filtered].sort((a, b) => {
    const aB = isBaseballFolderId(a);
    const bB = isBaseballFolderId(b);
    if (aB !== bB) return aB ? -1 : 1;
    if (aB) return compareBaseballFolders(a, b);
    const ra = genericStickerFolderTrailingRank(a);
    const rb = genericStickerFolderTrailingRank(b);
    if (ra !== rb) return ra - rb;
    return a.localeCompare(b, "ko");
  });
}

/** 낮을수록 앞 — redpanda·capybara 만 큰 값으로 맨 끝 */
function genericStickerFolderTrailingRank(folder: string): number {
  const f = folder.trim().toLowerCase();
  if (f === "redpanda") return 1000;
  if (f === "capybara") return 1001;
  return 0;
}

function isBaseballFolderId(folder: string): boolean {
  const f = folder.trim().toLowerCase();
  return f === "baseball" || f.startsWith("baseball/");
}

function compareBaseballFolders(a: string, b: string): number {
  const ra = baseballFolderRank(a);
  const rb = baseballFolderRank(b);
  if (ra !== rb) return ra - rb;
  return a.localeCompare(b);
}

/** 낮을수록 탭에서 더 앞 */
function baseballFolderRank(folder: string): number {
  const f = folder.trim().toLowerCase();
  if (f === "baseball") return 0;
  if (f === "baseball/common") return 1;
  return 2;
}
