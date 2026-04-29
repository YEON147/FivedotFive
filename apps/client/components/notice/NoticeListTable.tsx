"use client";

import { CaretRight, PushPin } from "@phosphor-icons/react";

import type { NoticeItem } from "@/features/notice/api";
import { formatNoticeListDate } from "@/features/notice/format-notice-datetime";

type Props = {
  notices: NoticeItem[];
  onRowActivate: (id: number) => void;
};

const CARD_CLASS =
  "group w-full rounded-[18px] border border-[var(--color-border)]/90 bg-[var(--color-surface)]/95 px-4 py-4 text-left shadow-none backdrop-blur-[2px] transition duration-200 " +
  "hover:border-[#7B61FF]/35 hover:bg-white hover:shadow-[0_6px_20px_rgba(123,97,255,0.09)] " +
  "active:scale-[0.995] dark:border-zinc-700/80 dark:bg-zinc-900/35 dark:hover:border-[#7B61FF]/40 dark:hover:bg-zinc-900/55";

/**
 * 공지 목록 — 카드형 리스트 (제목 / 등록일). 탭·Enter 로 상세.
 */
export function NoticeListTable({ notices, onRowActivate }: Props) {
  return (
    <ul className="mt-3 flex list-none flex-col gap-2 p-0 sm:gap-2.5">
      {notices.map((n) => (
        <li key={n.id}>
          <button type="button" onClick={() => onRowActivate(n.id)} className={CARD_CLASS}>
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-start gap-2.5">
                  {n.isPinned ? (
                    <span
                      className="mt-0.5 inline-flex shrink-0 text-[#7B61FF]"
                      aria-label="고정 공지"
                      title="고정"
                    >
                      <PushPin size={18} weight="fill" />
                    </span>
                  ) : null}
                  <span className="min-w-0 text-[15px] font-semibold leading-[1.45] tracking-[-0.01em] text-[var(--color-text-primary)] group-hover:text-[#5B4FC9] sm:text-base">
                    {n.title}
                  </span>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-1.5 pt-0.5">
                <time
                  dateTime={n.createdAt}
                  className="tabular-nums text-[12px] text-[var(--color-text-secondary)] sm:text-[13px]"
                >
                  {formatNoticeListDate(n.createdAt)}
                </time>
                <CaretRight
                  className="size-4 shrink-0 text-slate-300 opacity-60 transition group-hover:translate-x-0.5 group-hover:text-[#7B61FF] group-hover:opacity-100"
                  weight="bold"
                  aria-hidden
                />
              </div>
            </div>
          </button>
        </li>
      ))}
    </ul>
  );
}
