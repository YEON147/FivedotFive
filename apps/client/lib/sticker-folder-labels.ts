/** `assets/stickers/{folder}/` id → UI 라벨 (API 폴더명과 동일) */
const STICKER_FOLDER_LABELS: Record<string, string> = {
  balloon: "풍선",
  universe: "우주",
  message: "메시지",
  dinosaur: "공룡",
  bubble: "버블",
  cute: "귀여운",
  dessert: "디저트",
  toy: "토이",
};

export function getStickerFolderLabel(folderId: string): string {
  return STICKER_FOLDER_LABELS[folderId] ?? folderId;
}

/**
 * 스티커 폴더 목록을 탭 표시 순서로 정렬.
 * - 야구 관련 폴더(`baseball`, `baseball/common`, `baseball/...`)가 맨 앞
 * - 그 외 폴더는 알파벳 순
 * 백엔드의 `sortStickerFoldersTeamBoardFirst` 와 동일한 정렬 규칙.
 */
export function orderStickerFoldersForTabs(folders: string[]): string[] {
  if (!folders || folders.length === 0) return [];
  return [...folders].sort((a, b) => {
    const aB = isBaseballFolderId(a);
    const bB = isBaseballFolderId(b);
    if (aB !== bB) return aB ? -1 : 1;
    if (aB) return compareBaseballFolders(a, b);
    return a.localeCompare(b, "ko");
  });
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
