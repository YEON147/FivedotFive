/** 비회원이 이 브라우저에서 작성한 위시보드 댓글 ID — 수정·삭제 시 본인 확인용 */

const STORAGE_PREFIX = "wishlist_guest_comment_ids:";

function keyForSlug(slug: string): string {
  return STORAGE_PREFIX + slug.trim();
}

export function rememberGuestWishComment(slug: string, commentId: number): void {
  if (typeof window === "undefined") return;
  const key = keyForSlug(slug);
  try {
    const raw = sessionStorage.getItem(key);
    const ids: number[] = raw ? (JSON.parse(raw) as number[]) : [];
    if (!ids.includes(commentId)) {
      ids.push(commentId);
      sessionStorage.setItem(key, JSON.stringify(ids));
    }
  } catch {
    /* ignore */
  }
}

export function canEditGuestWishComment(slug: string, commentId: number): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = sessionStorage.getItem(keyForSlug(slug));
    const ids: number[] = raw ? (JSON.parse(raw) as number[]) : [];
    return ids.includes(commentId);
  } catch {
    return false;
  }
}
