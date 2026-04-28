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
  felt: "펠트",
  food: "푸드",
  lego: "레고",
  /** 구단 야구 스티커(`TeamDataInitializer` team_tag와 동일한 폴더명일 수 있음) */
  giants: "야구(롯데)",
  dinos: "야구(NC)",
  lions: "야구(삼성)",
  eagles: "야구(한화)",
  heroes: "야구(키움)",
  twins: "야구(LG)",
  bears: "야구(두산)",
  tigers: "야구(KIA)",
  landers: "야구(SSG)",
  wiz: "야구(KT)",
};

export function getStickerFolderLabel(folderId: string): string {
  return STICKER_FOLDER_LABELS[folderId] ?? folderId;
}
