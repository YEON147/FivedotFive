"use client";

import { PushPin } from "@phosphor-icons/react";

import type { NoticeDetail } from "@/features/notice/api";
import {
  formatNoticeDateOnly,
  formatNoticeDateTime,
} from "@/features/notice/format-notice-datetime";

type Props = {
  detail: NoticeDetail;
  /**
   * true: 다이얼로그 안 — 제목은 `h3`(상단 패널 제목이 `h2`).
   * false: 전용 페이지 — 제목은 `h1`.
   */
  asModal?: boolean;
  /**
   * 일반 사용자: 제목·등록일·이미지만 (고정 핀·배너 문구·노출 기간 숨김).
   */
  summaryOnly?: boolean;
  /** 상위(다이얼로그 헤더 등)에 제목을 표시할 때 본문 제목·핀 행 생략 */
  suppressTitleRow?: boolean;
};

/**
 * 공지 읽기 전용 본문 (목록 모달 · `/notice/[id]` 비관리자 화면 공통).
 */
export function NoticeReadOnlyDetail({
  detail,
  asModal,
  summaryOnly,
  suppressTitleRow,
}: Props) {
  const sortedImages = [...detail.images].sort((a, b) => a.displayOrder - b.displayOrder);
  const titleClass = asModal
    ? "text-h3 min-w-0 flex-1 text-[var(--color-text-primary)]"
    : "text-h2 min-w-0 flex-1 text-[var(--color-text-primary)]";

  const TitleTag = asModal ? "h3" : "h1";

  return (
    <>
      {!suppressTitleRow ? (
        <div className={`flex items-start gap-2 ${summaryOnly ? "mb-2" : "mb-4"}`}>
          {detail.isPinned ? (
            <span
              className="mt-1 inline-flex shrink-0 text-[#7B61FF]"
              aria-label="고정 공지"
              title="고정"
            >
              <PushPin size={asModal ? 20 : 22} weight="fill" />
            </span>
          ) : null}
          <TitleTag className={titleClass}>{detail.title}</TitleTag>
        </div>
      ) : null}

      {!summaryOnly && detail.bannerText ? (
        <p className="mb-3 text-body text-[var(--color-text-secondary)]">{detail.bannerText}</p>
      ) : null}

      <p
        className={`text-xs text-[var(--color-text-secondary)] ${summaryOnly ? "mb-3" : ""}`}
      >
        {formatNoticeDateOnly(detail.createdAt)}
      </p>
      {!summaryOnly ? (
        <p className="mt-0.5 text-xs text-[var(--color-text-secondary)]">
          노출 {formatNoticeDateTime(detail.startAt)} ~ {formatNoticeDateTime(detail.endAt)}
        </p>
      ) : null}

      {sortedImages.length > 0 ? (
        <ul className={`flex flex-col gap-3 ${summaryOnly ? "mt-1" : "mt-4"}`}>
          {sortedImages.map((img) => (
            <li key={`${img.displayOrder}-${img.imageUrl}`}>
              <img
                src={img.imageUrl}
                alt=""
                className="w-full object-contain"
              />
            </li>
          ))}
        </ul>
      ) : null}
    </>
  );
}
