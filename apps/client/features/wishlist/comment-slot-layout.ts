import type { CommentData } from "./types";

/**
 * GET `?size=6` 응답 메타(`totalPages`, `isLastPageFull`)로 댓글 캐러셀 — 위시 옆 — 면 수.
 * 마지막 API 페이지가 6칸 꽉 찼으면, 다음 빈 면(새 댓글 UI)을 위해 +1.
 */
export function computeCommentSheetCount(
  totalPages: number,
  isLastPageFull: boolean,
  _hint: {
    commentsLength: number;
    hasNext: boolean;
    totalCount?: number;
  },
): number {
  const base = Math.max(1, totalPages);
  if (isLastPageFull) {
    return base + 1;
  }
  return base;
}

/**
 * API 한 페이지(최대 6개)를 전역 `slotIndex` 기준 6칸 그리드로 둡니다.
 * `slotIndex`가 없으면(레거시) 빈 칸부터 순서대로 채웁니다.
 */
export function normalizeCommentsToSlotGrid(
  comments: CommentData[],
  commentPageIdx: number,
): (CommentData | null)[] {
  const base = commentPageIdx * 6;
  const grid: (CommentData | null)[] = Array.from({ length: 6 }, () => null);
  const loose: CommentData[] = [];

  for (const c of comments) {
    const s = c.slotIndex;
    if (typeof s === "number" && Number.isFinite(s)) {
      const local = s - base;
      if (local >= 0 && local <= 5) {
        if (grid[local] == null) {
          grid[local] = c;
        } else {
          loose.push(c);
        }
      } else {
        loose.push(c);
      }
    } else {
      loose.push(c);
    }
  }

  let li = 0;
  for (let i = 0; i < 6 && li < loose.length; i++) {
    if (grid[i] == null) {
      grid[i] = loose[li]!;
      li++;
    }
  }

  return grid;
}

/**
 * 서버는 `createdAt` 최신순으로 최대 6개를 한 페이지에 내려줍니다(구 데이터에 슬롯 좌표 없음).
 * UI 6칸에 인덱스 0 = 최신 → 시각적 슬롯 1에 대응하도록 길이 6 배열로 맞춤.
 * @deprecated 신규 데이터는 `normalizeCommentsToSlotGrid` 사용
 */
export function alignTimeOrderCommentsToSixSlots(
  comments: CommentData[],
): (CommentData | null)[] {
  return normalizeCommentsToSlotGrid(comments, 0);
}
