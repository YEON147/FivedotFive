import {
  getRollingPaperComments,
  type RollingPaperCommentRow,
} from "@/features/rolling-paper/api";

const PAGE_SIZE = 20;

/**
 * 롤링페이퍼 댓글을 페이지 순회로 모으되 최대 `max`개까지만.
 * `slotIndex` 오름차순으로 정렬해 한 장 레이아웃에 안정적으로 배치합니다.
 */
export async function fetchRollingPaperCommentsUpTo(
  slug: string,
  rollingToken: string | null | undefined,
  max: number,
): Promise<RollingPaperCommentRow[]> {
  const trimmed = slug.trim();
  if (!trimmed || max <= 0) return [];

  const collected: RollingPaperCommentRow[] = [];
  let page = 0;
  let totalPages = 1;

  while (collected.length < max && page < totalPages) {
    const res = await getRollingPaperComments(trimmed, {
      rollingToken,
      page,
      size: PAGE_SIZE,
    });
    const payload = res.data;
    const chunk = Array.isArray(payload?.comments) ? payload.comments : [];
    totalPages = Math.max(1, payload?.totalPages ?? 1);
    for (const row of chunk) {
      if (collected.length >= max) break;
      collected.push(row);
    }
    if (chunk.length === 0) break;
    page += 1;
  }

  collected.sort((a, b) => {
    const sa = a.slotIndex ?? 0;
    const sb = b.slotIndex ?? 0;
    if (sa !== sb) return sa - sb;
    return (a.id ?? 0) - (b.id ?? 0);
  });

  return collected.slice(0, max);
}
