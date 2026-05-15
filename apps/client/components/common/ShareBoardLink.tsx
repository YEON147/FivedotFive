"use client";

import { Export } from "@phosphor-icons/react";
import { useEffect, useId, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

import { WishlistCenterDialog } from "@/components/wishlist/WishlistCenterDialog";

/** 롤링페이퍼 소유자 공유 모달 — 댓글 작성용 / 선물·저장용 탭 */
export type RollingPaperOwnerShareTabId = "comment" | "view";

export type RollingPaperOwnerShareTabsConfig = {
  activeTab: RollingPaperOwnerShareTabId;
  onTabChange: (tab: RollingPaperOwnerShareTabId) => void;
  comment: {
    absoluteUrl: string | null;
    linkHref: string | null;
    error?: string | null;
  };
  view: {
    absoluteUrl: string | null;
    linkHref: string | null;
    error: string | null;
  };
};

/** 모달 안 — 링크 미리보기 · 복사 · Web Share (복사 피드백 상태 내장) */
export function ShareLinkModalPanel({
  dialogOpen,
  absoluteUrl,
  linkHref,
  navigatorShareTitle = "공유",
  errorMessage,
  hint,
  secondaryAbsoluteUrl = null,
  secondaryLinkHref = null,
  primaryLinkCaption,
  secondaryLinkCaption,
  secondaryErrorMessage = null,
}: {
  dialogOpen: boolean;
  /** 클립보드·Web Share용 전체 URL — 없으면 로딩 문구 */
  absoluteUrl: string | null;
  /** `<a href>` 상대 경로 */
  linkHref: string | null;
  /** `navigator.share` 의 `title` */
  navigatorShareTitle?: string;
  /** 링크 대신 표시할 오류 문구 */
  errorMessage?: string | null;
  /** 링크 아래 보조 설명(예: 만료 시각) */
  hint?: ReactNode;
  /** 롤링페이퍼 등 — 보조 링크(예: 보기 전용). 없으면 한 줄만 표시 */
  secondaryAbsoluteUrl?: string | null;
  secondaryLinkHref?: string | null;
  /** 주 링크 위 짧은 설명 */
  primaryLinkCaption?: string;
  /** 보조 링크 위 짧은 설명 */
  secondaryLinkCaption?: string;
  /** 보조 링크 발급 실패 등 */
  secondaryErrorMessage?: string | null;
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
  const err = errorMessage?.trim();
  const secondaryErr = secondaryErrorMessage?.trim();
  const secondaryDisplay = secondaryAbsoluteUrl || secondaryLinkHref;
  const hasSecondaryLink =
    Boolean(secondaryAbsoluteUrl?.trim()) && Boolean(secondaryLinkHref?.trim());
  const hasSecondaryBlock =
    hasSecondaryLink ||
    Boolean(secondaryErr) ||
    Boolean(secondaryLinkCaption?.trim());

  return (
    <>
      {primaryLinkCaption ? (
        <p className="mt-4 text-left text-[12px] font-medium leading-snug text-slate-600">
          {primaryLinkCaption}
        </p>
      ) : null}
      <div
        className={`relative w-full min-w-0 max-w-full overflow-hidden rounded-[14px] border border-[var(--color-border)] ${
          primaryLinkCaption ? "mt-2" : "mt-5"
        }`}
      >
        <div className="min-w-0 break-words break-all bg-[var(--color-bg-subtle)] px-4 py-3 text-sm text-[var(--color-text-primary)]">
          {err ? (
            <span className="text-[#c02626]">{err}</span>
          ) : linkHref && displayText ? (
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
      {hint != null && hint !== false ? (
        <p className="mt-2 text-xs leading-snug text-slate-500">{hint}</p>
      ) : null}

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

      {hasSecondaryBlock ? (
        <div className="mt-6 w-full min-w-0 border-t border-[var(--color-border)] pt-5">
          {secondaryLinkCaption ? (
            <p className="text-left text-[12px] font-medium leading-snug text-slate-600">
              {secondaryLinkCaption}
            </p>
          ) : null}
          <div className="relative mt-2 w-full min-w-0 max-w-full overflow-hidden rounded-[14px] border border-[var(--color-border)]">
            <div className="min-w-0 break-words break-all bg-[var(--color-bg-subtle)] px-4 py-3 text-sm text-[var(--color-text-primary)]">
              {secondaryErr ? (
                <span className="text-[#c02626]">{secondaryErr}</span>
              ) : hasSecondaryLink ? (
                <a
                  href={secondaryLinkHref!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full text-[var(--color-text-primary)] underline-offset-2 hover:underline focus-visible:rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7B61FF]"
                >
                  {secondaryDisplay}
                </a>
              ) : secondaryLinkCaption?.trim() ? (
                "링크를 불러오는 중..."
              ) : null}
            </div>
          </div>
          <button
            type="button"
            disabled={!secondaryAbsoluteUrl?.trim()}
            className="mt-3 w-full rounded-[14px] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-[13px] font-semibold text-[var(--color-text-primary)] transition-[transform,filter] active:scale-[0.99] active:brightness-95 disabled:opacity-50"
            onClick={async () => {
              if (!secondaryAbsoluteUrl) return;
              try {
                await navigator.clipboard.writeText(secondaryAbsoluteUrl);
                setCopyFeedback(true);
              } catch {
                /* noop */
              }
            }}
          >
            위 링크 복사
          </button>
        </div>
      ) : null}
    </>
  );
}

export type BoardShareDialogPresentation = "page" | "carousel-portal";

type BoardShareDialogProps = {
  open: boolean;
  onClose: () => void;
  absoluteUrl: string | null;
  linkHref: string | null;
  /** 롤링페이퍼 소유자 — 댓글 / 선물·저장 링크 탭 (전달 시 absoluteUrl·linkHref 대신 탭별 값 사용) */
  rollingPaperOwnerTabs?: RollingPaperOwnerShareTabsConfig;
  secondaryAbsoluteUrl?: string | null;
  secondaryLinkHref?: string | null;
  primaryLinkCaption?: string;
  secondaryLinkCaption?: string;
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
  /** 탭 없음(방문자 공유 등) — 링크 패널 오류 문구 */
  sharePanelError?: string | null;
  /** 보조 링크 영역만의 오류(예: 저장용 단축 URL 발급 실패) */
  secondaryPanelError?: string | null;
};

export function BoardShareDialog({
  open,
  onClose,
  absoluteUrl,
  linkHref,
  rollingPaperOwnerTabs,
  secondaryAbsoluteUrl,
  secondaryLinkHref,
  primaryLinkCaption,
  secondaryLinkCaption,
  presentation,
  portalReady = false,
  title = "공유하기",
  titleId: titleIdProp,
  closeLabel = "공유 창 닫기",
  description,
  navigatorShareTitle,
  sharePanelError = null,
  secondaryPanelError = null,
}: BoardShareDialogProps) {
  const genId = useId();
  const titleId = titleIdProp ?? genId;
  const variant = presentation === "carousel-portal" ? "static" : "animated";

  const tabs = rollingPaperOwnerTabs;
  const activeTab = tabs?.activeTab ?? "comment";

  const panelAbsolute =
    tabs == null
      ? absoluteUrl
      : activeTab === "comment"
        ? tabs.comment.absoluteUrl
        : tabs.view.absoluteUrl;
  const panelLinkHref =
    tabs == null
      ? linkHref
      : activeTab === "comment"
        ? tabs.comment.linkHref
        : tabs.view.linkHref;
  const panelError =
    tabs != null
      ? activeTab === "comment"
        ? tabs.comment.error ?? null
        : tabs.view.error ?? null
      : sharePanelError ?? null;
  const panelHint = null;

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
      {tabs ? (
        <div
          className="mt-4 flex w-full gap-1 rounded-[14px] bg-[var(--color-bg-subtle)] p-1"
          role="tablist"
          aria-label="공유 링크 종류"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "comment"}
            id={`${titleId}-tab-comment`}
            className={`min-h-[44px] min-w-0 flex-1 rounded-[12px] px-3 py-2.5 text-center text-body-sm font-semibold transition-[background,box-shadow,color] ${
              activeTab === "comment"
                ? "bg-[var(--color-surface)] text-slate-900 shadow-sm ring-1 ring-black/[0.06]"
                : "text-slate-600 hover:text-slate-900"
            }`}
            onClick={() => tabs.onTabChange("comment")}
          >
            댓글 작성 링크
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "view"}
            id={`${titleId}-tab-view`}
            className={`min-h-[44px] min-w-0 flex-1 rounded-[12px] px-3 py-2.5 text-center text-body-sm font-semibold transition-[background,box-shadow,color] ${
              activeTab === "view"
                ? "bg-[var(--color-surface)] text-slate-900 shadow-sm ring-1 ring-black/[0.06]"
                : "text-slate-600 hover:text-slate-900"
            }`}
            onClick={() => tabs.onTabChange("view")}
          >
            선물·저장용 링크
          </button>
        </div>
      ) : null}
      <ShareLinkModalPanel
        dialogOpen={open}
        absoluteUrl={panelAbsolute}
        linkHref={panelLinkHref}
        navigatorShareTitle={navigatorShareTitle}
        errorMessage={panelError}
        hint={panelHint}
        secondaryAbsoluteUrl={secondaryAbsoluteUrl}
        secondaryLinkHref={secondaryLinkHref}
        secondaryErrorMessage={secondaryPanelError}
        primaryLinkCaption={primaryLinkCaption}
        secondaryLinkCaption={secondaryLinkCaption}
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
