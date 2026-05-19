"use client";

import { useCallback, type RefObject } from "react";

import { ROLLING_PAPER_QUICK_EMOJIS } from "@/lib/constants/rolling-paper-quick-emojis";

const CONTENT_MAX = 200;

type RollingPaperEmojiQuickPickProps = {
  value: string;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  onValueChange: (next: string) => void;
};

/** 모달 스크롤 영역 상단 고정 — 포스트잇 본문 높이는 차지하지 않음 */
export function RollingPaperEmojiQuickPick({
  value,
  textareaRef,
  onValueChange,
}: RollingPaperEmojiQuickPickProps) {
  const insertEmoji = useCallback(
    (emoji: string) => {
      const el = textareaRef.current;
      const start = el?.selectionStart ?? value.length;
      const end = el?.selectionEnd ?? value.length;
      const next = value.slice(0, start) + emoji + value.slice(end);
      if (next.length > CONTENT_MAX) return;
      onValueChange(next);
      requestAnimationFrame(() => {
        const ta = textareaRef.current;
        if (!ta) return;
        ta.focus();
        const pos = start + emoji.length;
        ta.setSelectionRange(pos, pos);
      });
    },
    [onValueChange, textareaRef, value],
  );

  return (
    <div className="sticky top-0 z-20 w-full shrink-0 pb-2">
      <div className="w-full rounded-xl bg-white/95 px-2 py-1.5 shadow-md ring-1 ring-white/50 backdrop-blur-sm">
        <div
          className="flex max-h-[64px] w-full flex-wrap justify-center gap-0.5 overflow-y-auto overscroll-contain"
          role="toolbar"
          aria-label="이모지 빠른 입력"
        >
          {ROLLING_PAPER_QUICK_EMOJIS.map((emoji) => {
            const wouldExceed = value.length + emoji.length > CONTENT_MAX;
            return (
              <button
                key={emoji}
                type="button"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[18px] leading-none transition hover:bg-violet-50 active:scale-95 disabled:cursor-not-allowed disabled:opacity-35"
                onClick={() => insertEmoji(emoji)}
                disabled={wouldExceed}
                aria-label={`${emoji} 넣기`}
              >
                {emoji}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
