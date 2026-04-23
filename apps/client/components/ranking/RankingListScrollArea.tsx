"use client";

import { useCallback, useRef, useState, type ReactNode } from "react";

/**
 * 4위 이하 목록만 스크롤 + 하단 페이드 + 맨 위 도달 시 짧은 바운스
 */
export function RankingListScrollArea({ children }: { children: ReactNode }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const prevScrollTop = useRef(0);
  const bounceClearRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [bounce, setBounce] = useState(false);

  const onScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;

    const st = el.scrollTop;
    const previous = prevScrollTop.current;
    prevScrollTop.current = st;

    if (st <= 2 && previous > 56) {
      clearTimeout(bounceClearRef.current);
      setBounce(true);
      bounceClearRef.current = setTimeout(() => setBounce(false), 520);
    }
  }, []);

  return (
    <div className="relative mt-3 min-h-0 flex-1">
      <div
        ref={scrollRef}
        onScroll={onScroll}
        className="relative z-0 h-full min-h-0 overflow-y-auto scroll-smooth [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      >
        <div className={bounce ? "ranking-list-scroll-bounce" : undefined}>
          {children}
        </div>
      </div>

      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-40 bg-[linear-gradient(to_top,var(--color-bg-base)_0%,color-mix(in_srgb,var(--color-bg-base)_42%,transparent)_46%,color-mix(in_srgb,var(--color-bg-base)_14%,transparent)_76%,transparent_100%)] sm:h-44"
        aria-hidden
      />
    </div>
  );
}
