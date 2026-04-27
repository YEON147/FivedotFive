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
