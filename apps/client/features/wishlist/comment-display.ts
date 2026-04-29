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

/**
 * 공개 전 타인 댓글 — GET 댓글 목록에서 `content`가 `null`인 경우(서버 `WishCommentService` 마스킹).
 * 어드민 보드 등 서버가 전부 공개하면 필드가 채워져 여기서는 마스킹으로 취급하지 않음.
 */
export function isMaskedOthersWishComment(
  c: Pick<CommentData, "content" | "senderName" | "isUser">,
): boolean {
  return !c.isUser && !isSoftDeletedWishComment(c) && c.content === null;
}

/**
 * 댓글 표시용 닉네임.
 * - 본인 댓글(isUser) — 항상 실제 닉네임(수정·삭제 가능).
 * - 공개 전·타인(API 마스킹, `content === null`) — "누굴까요?"
 * - 그 외 타인 — 실제 닉네임
 * - 소프트 삭제 — 서버가 내려준 문구 유지
 */
export function getCommentDisplaySenderName(
  c: Pick<CommentData, "senderName" | "isUser" | "content">,
): string {
  if (isSoftDeletedWishComment(c)) {
    return c.senderName;
  }
  if (c.isUser) {
    return c.senderName;
  }
  if (isMaskedOthersWishComment(c)) {
    return "누굴까요?";
  }
  return c.senderName;
}
