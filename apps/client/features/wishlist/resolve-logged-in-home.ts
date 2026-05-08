import { getMyBoardsAll, getMyLatestBoardSummary } from "@/features/wishlist/api";
import { listEntryHref } from "@/lib/board-entry-path";

/** 현재 URL 슬러그가 로그인 사용자 소유인지(목록 API 우선, 실패 시 최신 1건 메타로 폴백). */
export async function isLoggedInOwnerOfBoardSlug(slug: string): Promise<boolean> {
  const trimmed = slug.trim();
  if (!trimmed) return false;
  try {
    const listRes = await getMyBoardsAll();
    const rows = Array.isArray(listRes.data) ? listRes.data : [];
    if (rows.some((r) => r.slug?.trim() === trimmed)) {
      return true;
    }
  } catch {
    /* ignore */
  }
  const summary = await getMyLatestBoardSummary();
  return summary?.slug?.trim() === trimmed;
}

/**
 * 로그인 사용자의 "홈"으로 쓸 경로.
 * 1) `GET /api/me/boards-all` 첫 항목(최신 생성순, 최대 5)
 * 2) 없으면 `GET /api/boards/me` 최신 1건 메타(또는 구 엔드포인트 풀 응답에서 합성)
 */
export async function resolveLoggedInHomeHref(): Promise<string | null> {
  try {
    const listRes = await getMyBoardsAll();
    const rows = Array.isArray(listRes.data) ? listRes.data : [];
    /** 서버는 생성일 내림차순·최대 5건 — 빈 slug 행은 건너뜀 */
    for (const row of rows) {
      const slug = row.slug?.trim();
      if (slug) {
        return listEntryHref(row.type, slug);
      }
    }
  } catch {
    /* 목록 API 미배포·오류 */
  }

  const summary = await getMyLatestBoardSummary();
  if (summary) {
    const slug = summary.slug?.trim();
    if (slug) {
      return listEntryHref(summary.type, slug);
    }
  }

  return null;
}
