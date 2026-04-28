/**
 * 댓글 전체 공개 시각 — 서버 `comment.reveal-at`(KST)와 동일해야 합니다.
 * 배포 환경에서 서버만 바꿀 때는 `NEXT_PUBLIC_COMMENT_REVEAL_AT` 로 프론트도 맞춥니다.
 * 값은 ISO 8601 권장: `2026-05-05T08:00:00+09:00`
 */
export function getWishCommentRevealAtMs(): number {
  const raw =
    (typeof process !== "undefined" &&
      process.env.NEXT_PUBLIC_COMMENT_REVEAL_AT?.trim()) ||
    "2026-05-05T08:00:00+09:00";
  const ms = Date.parse(raw);
  if (!Number.isFinite(ms)) {
    return Date.parse("2026-05-05T08:00:00+09:00");
  }
  return ms;
}

/** 남은 시간을 `6일 12시간 30분 55초` 형식으로 (항상 일·시·분·초 표기) */
export function formatRevealRemainingKo(msRemaining: number): string {
  if (msRemaining <= 0) {
    return "공개 시각 도달";
  }
  const sec = Math.floor(msRemaining / 1000);
  const days = Math.floor(sec / 86400);
  const hours = Math.floor((sec % 86400) / 3600);
  const minutes = Math.floor((sec % 3600) / 60);
  const seconds = sec % 60;
  return `${days}일 ${hours}시간 ${minutes}분 ${seconds}초`;
}
