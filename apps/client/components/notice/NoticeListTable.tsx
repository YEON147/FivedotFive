"use client";

import { PushPin } from "@phosphor-icons/react";

import type { NoticeItem } from "@/features/notice/api";
import { formatNoticeListDate } from "@/features/notice/format-notice-datetime";

type Props = {
  notices: NoticeItem[];
  onRowActivate: (id: number) => void;
};

const TABLE_CARD =
  "w-full overflow-hidden rounded-[18px] border border-[var(--color-border)]/90 bg-[var(--color-surface)] shadow-[0_6px_28px_rgba(15,23,42,0.06)] dark:border-zinc-700/80 dark:bg-zinc-900/40";

const ROW_BUTTON =
  "flex w-full items-start justify-between gap-3 px-4 py-3 text-left transition hover:bg-[#7B61FF]/[0.06] active:bg-[#7B61FF]/[0.1] dark:hover:bg-white/[0.04]";

/**
 * 공지 목록 — 단일 카드 안 테이블형 (헤더 행 + 제목/등록일 열). 탭·Enter 로 상세.
 */
export function NoticeListTable({ notices, onRowActivate }: Props) {
  return (
    <div className={`mt-3 ${TABLE_CARD}`}>
      <div className="flex items-center justify-between px-4 pb-2.5 pt-3.5">
        <span className="text-[12px] font-medium text-[var(--color-text-secondary)] sm:text-[13px]">
          제목
        </span>
        <span className="text-[12px] font-medium text-[var(--color-text-secondary)] sm:text-[13px]">
          등록일
        </span>
      </div>
      <div className="h-px w-full bg-[var(--color-border)]" aria-hidden />
      <ul className="m-0 list-none divide-y divide-[var(--color-border)] p-0">
        {notices.map((n) => (
          <li key={n.id}>
            <button type="button" onClick={() => onRowActivate(n.id)} className={ROW_BUTTON}>
              <div className="flex min-w-0 flex-1 items-start gap-2">
                {n.isPinned ? (
                  <span
                    className="mt-0.5 inline-flex shrink-0 text-[#7B61FF]"
                    aria-label="고정 공지"
                    title="고정"
                  >
                    <PushPin size={16} weight="fill" />
                  </span>
                ) : null}
                <span
                  className={
                    n.isPinned
                      ? "min-w-0 flex-1 text-[14px] leading-snug text-[#7B61FF] sm:text-[15px]"
                      : "min-w-0 flex-1 text-[14px] leading-snug text-[var(--color-text-primary)] sm:text-[15px]"
                  }
                >
                  {n.title}
                </span>
              </div>
              <time
                dateTime={n.createdAt}
                className="shrink-0 tabular-nums text-[12px] text-[var(--color-text-secondary)] sm:text-[13px]"
              >
                {formatNoticeListDate(n.createdAt)}
              </time>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
