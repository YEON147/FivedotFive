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
  const direct = STICKER_FOLDER_LABELS[folderId];
  if (direct) return direct;

  const parts = folderId.split("/").filter(Boolean);
  if (parts.length === 2 && parts[0].toLowerCase() === "baseball") {
    const team = parts[1].toLowerCase();
    const teamLabel = STICKER_FOLDER_LABELS[team];
    if (teamLabel) return teamLabel;
    return `야구(${parts[1]})`;
  }

  return folderId;
}
