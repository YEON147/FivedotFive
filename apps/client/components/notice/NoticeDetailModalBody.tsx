"use client";

import Link from "next/link";

import { NoticeReadOnlyDetail } from "@/components/notice/NoticeReadOnlyDetail";
import type { NoticeDetail } from "@/features/notice/api";

type Props = {
  loading: boolean;
  error: string | null;
  detail: NoticeDetail | null;
  summaryOnly: boolean;
  /** 관리자일 때만 전달 — 수정 페이지로 이동하는 링크 표시 */
  editHref?: string;
  onEditNavigate?: () => void;
};

/**
 * 공지 목록에서 열리는 상세 모달 본문(로딩·에러·읽기 전용 상세·수정 링크).
 */
export function NoticeDetailModalBody({
  loading,
  error,
  detail,
  summaryOnly,
  editHref,
  onEditNavigate,
}: Props) {
  return (
    <div className="mt-1 flex h-[min(72vh,400px)] max-h-[85vh] flex-col overflow-hidden">
      {loading ? (
        <p className="py-6 text-center text-sm text-[var(--color-text-secondary)]">불러오는 중…</p>
      ) : error ? (
        <p className="flex-1 overflow-y-auto py-4 text-center text-sm text-rose-600">{error}</p>
      ) : detail ? (
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-y-contain pr-0.5 [-webkit-overflow-scrolling:touch]">
          <NoticeReadOnlyDetail
            detail={detail}
            asModal
            summaryOnly={summaryOnly}
            suppressTitleRow
          />
          {editHref ? (
            <Link
              href={editHref}
              onClick={onEditNavigate}
              className="mt-4 flex w-full shrink-0 items-center justify-center rounded-xl bg-[#7B61FF] px-4 py-3 text-sm font-semibold text-white transition hover:opacity-95"
            >
              수정하기
            </Link>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
