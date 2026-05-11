import type { RollingPaperCommentRow } from "@/features/rolling-paper/api";

/** GET `/comments` 응답의 `lastPageFull` / `isLastPageFull` 만 사용 (서버와 동일 계약) */
export function rollingPaperLastPageFullFromPayload(payload: {
  lastPageFull?: boolean;
  isLastPageFull?: boolean;
}): boolean {
  return (
    payload.lastPageFull === true || payload.isLastPageFull === true
  );
}

/**
 * 네비게이션에 표시할 보드(면) 수 — 서버 `totalPages`·`lastPageFull`·`totalCount` 기준.
 * 마지막 API 페이지가 가득 차면 빈 한 장(새 슬롯)을 위해 +1.
 */
export function rollingPaperBoardSheetCount(args: {
  totalPages: number;
  lastPageFull: boolean;
  totalCount: number;
}): number {
  const tp = Math.max(0, args.totalPages);
  const tc = args.totalCount;
  if (tc === 0) return 1;
  return args.lastPageFull ? tp + 1 : Math.max(1, tp);
}

/** API `slotIndex` — 전역 칸 번호. 문자열·실수 대비 */
export function parseRollingGlobalSlotIndex(raw: unknown): number | null {
  let n: number | null = null;
  if (typeof raw === "number" && Number.isFinite(raw)) {
    n = Math.trunc(raw);
  } else if (typeof raw === "string") {
    const t = raw.trim();
    if (!t) return null;
    const parsed = Number.parseInt(t, 10);
    if (Number.isFinite(parsed)) n = Math.trunc(parsed);
  }
  if (n === null || n < 0) return null;
  return n;
}

/** 현재 보드 페이지의 댓글을 로컬 슬롯 0…slotsPerSheet-1 에 매핑 */
export function mapRollingCommentsToLocalSlots(
  pageIdx: number,
  comments: RollingPaperCommentRow[] | undefined,
  slotsPerSheet: number,
): Partial<Record<number, RollingPaperCommentRow>> {
  const base = pageIdx * slotsPerSheet;
  const nextSlots: Partial<Record<number, RollingPaperCommentRow>> = {};
  for (const c of comments ?? []) {
    const g = parseRollingGlobalSlotIndex(c.slotIndex);
    if (g === null) continue;
    const local = g - base;
    if (local >= 0 && local < slotsPerSheet) {
      nextSlots[local] = c;
    }
  }
  return nextSlots;
}
