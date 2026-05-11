/**
 * 댓글 전체 공개 시각 — 서버 `comment.reveal-at`(KST)와 동일해야 합니다.
 * 배포 환경에서 서버만 바꿀 때는 `NEXT_PUBLIC_COMMENT_REVEAL_AT` 로 프론트도 맞춥니다.
 * 값은 ISO 8601 권장: `2026-05-05T08:00:00+09:00`
 */
/** `yyyy-MM-dd` 기념일 0시(KST) — 서버 `LocalDate` + KST 기준일 비교와 동일 */
export function getKstStartOfLocalDateMs(isoDateYYYYMMDD: string): number {
  const day = isoDateYYYYMMDD.trim().slice(0, 10);
  const ms = Date.parse(`${day}T00:00:00+09:00`);
  if (!Number.isFinite(ms)) {
    return NaN;
  }
  return ms;
}

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

/** 서버 `commentsRevealed` 없을 때(구 클라이언트) 보조 — KST 날짜만 비교 */
export function inferWishBoardCommentsRevealed(d: {
  targetDate: string;
  isCommentPublic?: boolean;
  commentsRevealed?: boolean;
}): boolean {
  if (typeof d.commentsRevealed === "boolean") {
    return d.commentsRevealed;
  }
  if (d.isCommentPublic === true) {
    return true;
  }
  const td = d.targetDate?.trim().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(td)) {
    return false;
  }
  const todayKst = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  return todayKst >= td;
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
