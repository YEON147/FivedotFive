"use client";

import { useCallback, useRef, useState, type ReactNode } from "react";

/**
 * 4위 이하 목록만 스크롤 + 하단 페이드 + 맨 위 도달 시 짧은 바운스.
 * `loading` 은 이 영역만 덮어 탭·포디움 레이아웃은 유지한다.
 */
export function RankingListScrollArea({
  children,
  loading = false,
}: {
  children: ReactNode;
  loading?: boolean;
}) {
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
    <div className="relative mt-3 min-h-0 flex-1 bg-transparent">
      {loading ? (
        <div
          className="absolute inset-0 z-[15] flex flex-col items-center justify-center gap-2 bg-white/55 backdrop-blur-[2px]"
          aria-busy="true"
          aria-live="polite"
        >
          <p className="text-sm text-[var(--color-text-muted)]">랭킹 불러오는 중…</p>
        </div>
      ) : null}
      <div
        ref={scrollRef}
        onScroll={onScroll}
        className="relative z-0 h-full min-h-0 overflow-y-auto bg-transparent scroll-smooth [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      >
        <div className={bounce ? "ranking-list-scroll-bounce" : undefined}>
          {children}
        </div>
      </div>
    </div>
  );
}
