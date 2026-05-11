"use client";

import { useEffect, useState } from "react";

import {
  formatRevealRemainingKo,
  getWishCommentRevealAtMs,
} from "@/features/wishlist/comment-reveal-at";

type CommentRevealCountdownProps = {
  /**
   * 기념일 공개 시각 — 없으면 레거시 `NEXT_PUBLIC_COMMENT_REVEAL_AT` / 기본값 사용
   * (위시보드·롤링은 보통 `targetDate` 기반 ms 전달)
   */
  revealAtMs?: number;
};

export function CommentRevealCountdown({ revealAtMs }: CommentRevealCountdownProps) {
  const resolveEndMs = () => {
    if (typeof revealAtMs === "number" && Number.isFinite(revealAtMs)) {
      return revealAtMs;
    }
    return getWishCommentRevealAtMs();
  };

  const [text, setText] = useState<string>(() =>
    formatRevealRemainingKo(resolveEndMs() - Date.now()),
  );

  useEffect(() => {
    const tick = () => {
      const end = resolveEndMs();
      setText(formatRevealRemainingKo(end - Date.now()));
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [revealAtMs]);

  return <span className="tabular-nums">{text}</span>;
}
