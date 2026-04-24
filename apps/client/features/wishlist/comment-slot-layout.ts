import type { CommentData } from "./types";

/**
 * 서버는 `createdAt` 최신순으로 최대 6개를 한 페이지에 내려줍니다(슬롯 좌표 없음).
 * UI 6칸(슬롯 1~6)에 맞춰 인덱스 0 = 최신 → 시각적 슬롯 1에 대응하도록 길이 6 배열로 맞춤.
 */
export function alignTimeOrderCommentsToSixSlots(
  comments: CommentData[],
): (CommentData | null)[] {
  return Array.from({ length: 6 }, (_, i) => comments[i] ?? null);
}
