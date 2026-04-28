"use client";

import { useEffect, useState } from "react";

import {
  formatRevealRemainingKo,
  getWishCommentRevealAtMs,
} from "@/features/wishlist/comment-reveal-at";

export function CommentRevealCountdown() {
  const [text, setText] = useState<string>(() =>
    formatRevealRemainingKo(getWishCommentRevealAtMs() - Date.now()),
  );

  useEffect(() => {
    const tick = () => {
      const rem = getWishCommentRevealAtMs() - Date.now();
      setText(formatRevealRemainingKo(rem));
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);

  return <span className="tabular-nums">{text}</span>;
}
