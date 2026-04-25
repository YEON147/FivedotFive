import type { CommentData } from "@/features/wishlist/types";

/**
 * 소프트 삭제된 댓글의 표시 문구 — 서버 `CommentConstants`와 동일해야 합니다.
 * (서버 변경 시 이 파일만 맞춰 주세요.)
 */
export const WISH_COMMENT_DELETED_SENDER_NAME = "(삭제된사용자)";
export const WISH_COMMENT_DELETED_CONTENT = "삭제된 댓글입니다.";

/** 소프트 삭제 후 응답 형태 기준(닉·본문 치환 + 본인 플래그 해제) */
export function isSoftDeletedWishComment(
  c: Pick<CommentData, "content" | "senderName" | "isUser">,
): boolean {
  return (
    !c.isUser &&
    c.senderName === WISH_COMMENT_DELETED_SENDER_NAME &&
    c.content === WISH_COMMENT_DELETED_CONTENT
  );
}
