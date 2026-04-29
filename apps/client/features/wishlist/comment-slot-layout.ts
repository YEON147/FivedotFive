import type { CommentData } from "./types";

/** GET JSON이 `isUser` 또는 `user`(Jackson boolean)로 올 수 있음 */
function withNormalizedIsUser(c: CommentData): CommentData {
  const fromJackson = (c as { user?: boolean }).user === true;
  const isUser = c.isUser === true || fromJackson;
  return { ...c, isUser };
}

/** API가 숫자 문자열로 줄 때 대비 */
function coerceSlotIndex(v: unknown): number | null {
  if (typeof v === "number" && Number.isInteger(v)) {
    return v;
  }
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v.trim());
    if (Number.isInteger(n)) {
      return n;
    }
  }
  return null;
}

/**
 * 댓글 목록 → 한 면(6칸) 그리드. `slotIndex`는 전역: `페이지 * 6 + (0~5)`.
 * - `slotIndex`가 이 페이지 범위에 있으면 **항상 그 칸**에만 둠(수정 후에도 위치 고정).
 * - 범위 밖·누락만 API 배열 순으로 빈 칸에 채움 — 전부 실패 시에만 순서 배치.
 * @param pageIndex API `page`(0부터)와 동일 — 해당 페이지의 슬롯은 `[pageIndex*6, pageIndex*6+5]`
 */
export function normalizeCommentsToSlotGrid(
  comments: CommentData[],
  pageIndex = 0,
): (CommentData | null)[] {
  const rows = comments.map(withNormalizedIsUser);

  if (rows.length === 0) {
    return Array.from({ length: 6 }, () => null);
  }

  const base = pageIndex * 6;
  const grid: (CommentData | null)[] = Array.from({ length: 6 }, () => null);
  const unplaced: CommentData[] = [];

  for (const c of rows) {
    const si = coerceSlotIndex(c.slotIndex);
    if (si !== null && si >= base && si <= base + 5) {
      grid[si - base] = c;
    } else {
      unplaced.push(c);
    }
  }

  for (const c of unplaced) {
    const idx = grid.findIndex((cell) => cell === null);
    if (idx === -1) {
      break;
    }
    grid[idx] = c;
  }

  return grid;
}

export type CommentSheetCountOptions = {
  /** 이번 GET 응답의 `comments` 배열 길이 — `size=6`일 때 6이면 한 페이지가 꽉 참 */
  commentsLength?: number;
  /** 다음 API 페이지 존재 여부 — 둘 다 알 때만 클라이언트 추론에 사용 */
  hasNext?: boolean;
  /**
   * Spring `Page.totalElements` — 서버 `CommentListResponse`와 동일하게
   * `totalCount > 0 && totalCount % 6 === 0` 이면 마지막 면이 꽉 참(빈 다음 면 +1).
   * Jackson이 `hasNext`/`isLastPageFull`을 생략하거나 `lastPageFull` 등으로 줄 때에도 안전.
   */
  totalCount?: number;
};

/**
 * Spring `totalPages` + `isLastPageFull` → 캐러셀에 쓸 댓글 면 수(최소 1).
 * - 서버 `isLastPageFull === true` → 마지막 API 페이지가 6개로 꽉 참 → 빈 다음 면 `+1`
 * - 서버 필드가 없거나 늦을 때: `size=6`인데 `comments.length === 6` 이고 `hasNext === false`이면
 *   곧 그만큼 쌓였다는 뜻이므로 동일하게 빈 다음 면 `+1`
 */
export function computeCommentSheetCount(
  totalPages: number,
  isLastPageFull?: boolean | null,
  options?: CommentSheetCountOptions,
): number {
  const tp = Math.max(0, totalPages);
  const len = options?.commentsLength;
  const hasNext = options?.hasNext;
  const totalCount = options?.totalCount;
  const inferredLastFull =
    typeof len === "number" &&
    typeof hasNext === "boolean" &&
    len === 6 &&
    !hasNext;
  const lastFullFromTotal =
    typeof totalCount === "number" && totalCount > 0 && totalCount % 6 === 0;
  const lastFull = Boolean(isLastPageFull) || inferredLastFull || lastFullFromTotal;
  const display = lastFull ? tp + 1 : tp;
  return Math.max(1, display);
}
