"use client";

import Image from "next/image";
import type { RankingTabId, RankingTabItem } from "./types";

const TAB_ICON_SLOT_CLASS = "flex h-5 w-6 shrink-0 items-center justify-center sm:w-7";

/** 헤더 아래·포디움 위 — 목록과 동일 `max-w-[372px]` */
export function RankingTabs({
  tabs,
  activeId,
  onChange,
  indicatorSrc = "/ranking/indicator.png",
}: {
  tabs: readonly RankingTabItem[];
  activeId: RankingTabId;
  onChange: (id: RankingTabId) => void;
  /** 선택된 탭 타이틀 앞 인디케이터 (`public/ranking/` 기준) */
  indicatorSrc?: string;
}) {
  return (
    <nav className="w-full shrink-0" aria-label="랭킹 구분 탭">
      <div className="mx-auto w-full max-w-[372px]">
        <div
          role="tablist"
          className="grid w-full grid-cols-3 border-b border-[var(--color-border)]"
        >
          {tabs.map((t) => {
            const selected = activeId === t.id;
            return (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={selected}
                tabIndex={selected ? 0 : -1}
                id={`ranking-tab-${t.id}`}
                aria-controls="ranking-tabpanel"
                onClick={() => onChange(t.id)}
                className={`relative z-0 flex min-h-[52px] min-w-0 flex-col items-center justify-center border-b-0 px-1 py-2.5 text-center text-[12px] font-semibold leading-snug sm:text-[13px] ${
                  selected
                    ? "text-[#7B61FF] active:text-[#6348d8]"
                    : "text-[var(--color-text-secondary)] active:text-[#7B61FF]/80"
                } touch-manipulation transition-colors duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)]`}
              >
                <span className="inline-flex max-w-full min-w-0 flex-nowrap items-center justify-center gap-1.5">
                  <span className={TAB_ICON_SLOT_CLASS} aria-hidden>
                    {selected ? (
                      <Image
                        src={indicatorSrc}
                        alt=""
                        width={64}
                        height={26}
                        className="ranking-tab-icon-indicator pointer-events-none h-5 w-auto max-h-5 max-w-[1.75rem] shrink-0 object-contain object-center sm:max-w-[1.875rem]"
                        unoptimized
                        aria-hidden
                      />
                    ) : (
                      <span className="inline-block h-5 w-[1.75rem] shrink-0 sm:w-[1.875rem]" />
                    )}
                  </span>
                  <span className="min-w-0 shrink overflow-hidden text-ellipsis whitespace-nowrap text-center">
                    {t.label}
                  </span>
                </span>
                {selected ? (
                  <span
                    className="ranking-tab-strip-accent pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-[3px] rounded-full sm:h-1"
                    aria-hidden
                  />
                ) : null}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
