"use client";

import { Export } from "@phosphor-icons/react";
import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";

import { WishlistCenterDialog } from "@/components/wishlist/WishlistCenterDialog";

/** 모달 안 — 링크 미리보기 · 복사 · Web Share (복사 피드백 상태 내장) */
export function ShareLinkModalPanel({
  dialogOpen,
  absoluteUrl,
  linkHref,
  navigatorShareTitle = "공유",
}: {
  dialogOpen: boolean;
  /** 클립보드·Web Share용 전체 URL — 없으면 로딩 문구 */
  absoluteUrl: string | null;
  /** `<a href>` 상대 경로 */
  linkHref: string | null;
  /** `navigator.share` 의 `title` */
  navigatorShareTitle?: string;
}) {
  const [copyFeedback, setCopyFeedback] = useState(false);

  useEffect(() => {
    if (!dialogOpen) {
      setCopyFeedback(false);
    }
  }, [dialogOpen]);

  useEffect(() => {
    if (!copyFeedback) {
      return;
    }
    const t = window.setTimeout(() => setCopyFeedback(false), 2500);
    return () => window.clearTimeout(t);
  }, [copyFeedback]);

  const displayText = absoluteUrl || linkHref;

  return (
    <>
      <div className="relative mt-5 w-full min-w-0 max-w-full overflow-hidden rounded-[14px] border border-[var(--color-border)]">
        <div className="min-w-0 break-words break-all bg-[var(--color-bg-subtle)] px-4 py-3 text-sm text-[var(--color-text-primary)]">
          {linkHref && displayText ? (
            <a
              href={linkHref}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full text-[var(--color-text-primary)] underline-offset-2 hover:underline focus-visible:rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7B61FF]"
            >
              {displayText}
            </a>
          ) : (
            "링크를 불러오는 중..."
          )}
        </div>
        {copyFeedback ? (
          <div className="pointer-events-auto absolute inset-0 z-10 flex items-center justify-center overflow-hidden rounded-[14px] bg-white/95 [backface-visibility:hidden] backdrop-blur-xl">
            <p
              className="min-w-0 max-w-full px-2 text-center text-sm font-semibold text-slate-700"
              role="status"
              aria-live="polite"
            >
              클립보드에 복사되었습니다.
            </p>
          </div>
        ) : null}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <button
          type="button"
          disabled={!absoluteUrl}
          onClick={async () => {
            if (!absoluteUrl) return;
            try {
              await navigator.clipboard.writeText(absoluteUrl);
              setCopyFeedback(true);
            } catch {
              /* 클립보드 거부/비지원 */
            }
          }}
          className="rounded-[14px] bg-[#7B61FF] px-4 py-3 text-sm font-semibold text-white transition-[transform,filter] active:scale-[0.98] active:brightness-95 disabled:opacity-50 disabled:active:scale-100"
        >
          링크 복사
        </button>
        <button
          type="button"
          disabled={!absoluteUrl}
          onClick={() => {
            if (!absoluteUrl || !navigator.share) return;
            void navigator.share({
              title: navigatorShareTitle,
              url: absoluteUrl,
            });
          }}
          className="rounded-[14px] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm font-semibold text-[var(--color-text-primary)] transition-[transform,filter] active:scale-[0.98] active:brightness-95 disabled:opacity-40 disabled:active:scale-100"
        >
          공유하기
        </button>
      </div>
    </>
  );
}

export type BoardShareDialogPresentation = "page" | "carousel-portal";

type BoardShareDialogProps = {
  open: boolean;
  onClose: () => void;
  absoluteUrl: string | null;
  linkHref: string | null;
  /** `carousel-portal`: 위시 캐러셀 임베드용 — static + `document.body` 포털 */
  presentation: BoardShareDialogPresentation;
  /** `presentation === "carousel-portal"` 일 때만 사용 */
  portalReady?: boolean;
  title?: string;
  /** 접근성용 고정 id가 필요하면 전달 (미전달 시 내부 `useId`) */
  titleId?: string;
  closeLabel?: string;
  description?: string;
  navigatorShareTitle?: string;
};

/**
 * 위시 보드 / 롤링페이퍼 공통 — `WishlistCenterDialog` + `ShareLinkModalPanel`
 */
export function BoardShareDialog({
  open,
  onClose,
  absoluteUrl,
  linkHref,
  presentation,
  portalReady = false,
  title = "공유하기",
  titleId: titleIdProp,
  closeLabel = "공유 창 닫기",
  description,
  navigatorShareTitle,
}: BoardShareDialogProps) {
  const genId = useId();
  const titleId = titleIdProp ?? genId;
  const variant = presentation === "carousel-portal" ? "static" : "animated";

  const inner = (
    <WishlistCenterDialog
      variant={variant}
      open={open}
      onClose={onClose}
      title={title}
      titleId={titleId}
      closeLabel={closeLabel}
      description={description}
    >
      <ShareLinkModalPanel
        dialogOpen={open}
        absoluteUrl={absoluteUrl}
        linkHref={linkHref}
        navigatorShareTitle={navigatorShareTitle}
      />
    </WishlistCenterDialog>
  );

  if (presentation === "carousel-portal") {
    if (!portalReady || typeof document === "undefined") {
      return null;
    }
    return createPortal(inner, document.body);
  }

  return inner;
}

const BOARD_SHARE_FAB_BUTTON_CLASS =
  "pointer-events-auto flex size-[42px] items-center justify-center rounded-full bg-[#7B61FF] text-body text-white shadow-lg";

export function BoardShareFabButton({
  onClick,
  ariaLabel,
  className = "",
}: {
  onClick: () => void;
  ariaLabel: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        className
          ? `${BOARD_SHARE_FAB_BUTTON_CLASS} ${className}`
          : BOARD_SHARE_FAB_BUTTON_CLASS
      }
      aria-label={ariaLabel}
    >
      <Export size={23} weight="bold" />
    </button>
  );
}
