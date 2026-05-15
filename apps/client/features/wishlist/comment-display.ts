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
 * 공개 전 타인 댓글 — API가 `content`·`stickerKey`를 `null`로 내려 마스킹한 경우.
 * (클라이언트 시각이 아니라 응답 필드로 판별.)
 */
export function isMaskedOthersWishComment(
  c: Pick<CommentData, "content" | "senderName" | "isUser">,
  options?: { revealBypass?: boolean },
): boolean {
  if (options?.revealBypass) {
    return false;
  }
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
  options?: { revealBypass?: boolean },
): string {
  if (isSoftDeletedWishComment(c)) {
    return c.senderName;
  }
  if (c.isUser) {
    return c.senderName;
  }
  if (isMaskedOthersWishComment(c, options)) {
    return "누굴까요?";
  }
  return c.senderName;
}
