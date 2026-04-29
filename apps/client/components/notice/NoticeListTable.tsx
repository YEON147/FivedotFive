"use client";

import { PushPin } from "@phosphor-icons/react";

import type { NoticeItem } from "@/features/notice/api";
import { formatNoticeListDate } from "@/features/notice/format-notice-datetime";

type Props = {
  notices: NoticeItem[];
  onRowActivate: (id: number) => void;
};

/**
 * 공지 목록 테이블 (제목 / 등록일). 행 클릭·Enter·Space 로 상세로 연결.
 */
export function NoticeListTable({ notices, onRowActivate }: Props) {
  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200/90 bg-[var(--color-surface)] shadow-[0_2px_16px_rgba(15,23,42,0.04)] dark:border-zinc-700/90 dark:bg-zinc-900/30 dark:shadow-[0_2px_20px_rgba(0,0,0,0.25)]">
      <table className="w-full table-fixed border-collapse text-left">
        <colgroup>
          <col className="min-w-0" />
          <col className="w-[5.25rem] sm:w-[6rem]" />
        </colgroup>
        <thead>
          <tr className="border-b border-zinc-200/90 dark:border-zinc-700">
            <th
              scope="col"
              className="min-w-0 py-3 pl-5 pr-3 text-left text-[11px] font-semibold tracking-wide text-zinc-500 dark:text-zinc-400 sm:pl-6 sm:pr-4"
            >
              제목
            </th>
            <th
              scope="col"
              className="py-3 pl-5 pr-3 text-left text-[11px] font-semibold tracking-wide text-zinc-500 dark:text-zinc-400 sm:pl-6 sm:pr-4"
            >
              등록일
            </th>
          </tr>
        </thead>
        <tbody>
          {notices.map((n) => (
            <tr
              key={n.id}
              role="button"
              tabIndex={0}
              className="group cursor-pointer border-b border-zinc-200/90 transition-colors duration-200 last:border-b-0 hover:bg-[#7B61FF]/[0.05] active:bg-[#7B61FF]/[0.08] dark:border-zinc-700 dark:hover:bg-white/[0.06] dark:active:bg-white/[0.08]"
              onClick={() => onRowActivate(n.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onRowActivate(n.id);
                }
              }}
            >
              <td className="min-w-0 px-3 py-3.5 align-middle sm:px-4">
                <div className="flex min-w-0 items-center gap-2">
                  {n.isPinned ? (
                    <span
                      className="inline-flex shrink-0 text-[#7B61FF]"
                      aria-label="고정 공지"
                      title="고정"
                    >
                      <PushPin size={16} weight="fill" />
                    </span>
                  ) : null}
                  <span className="min-w-0 text-[13px] font-medium leading-snug text-[#5B4FC9] decoration-[#7B61FF]/40 underline-offset-2 group-hover:text-[#7B61FF] group-hover:underline dark:text-[#A78BFA] dark:group-hover:text-[#C4B5FD]">
                    {n.title}
                  </span>
                </div>
              </td>
              <td className="whitespace-nowrap px-3 py-3.5 text-right align-middle tabular-nums text-[11px] text-zinc-500 dark:text-zinc-400 sm:px-4">
                {formatNoticeListDate(n.createdAt)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
