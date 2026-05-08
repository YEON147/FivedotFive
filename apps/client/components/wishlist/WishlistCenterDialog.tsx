"use client";

import { X } from "@phosphor-icons/react";
import type { ReactNode } from "react";

const PANEL_SHELL =
  "w-[min(340px,calc(100vw-2rem))] min-w-0 max-w-[min(340px,calc(100vw-2rem))] overflow-hidden rounded-[18px] border border-[var(--color-border)] px-5 pb-6 pt-4 shadow-[0_24px_60px_rgba(0,0,0,0.14)]";

const PANEL_BG_DEFAULT = "bg-[var(--color-surface)]";
/** `globals.css` — 페이지 오로라와 동일 */
const PANEL_BG_AURORA = "app-dialog-panel-aurora";

type WishlistCenterDialogProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  /** 제목(h2) 앞에 붙는 영역(예: 고정 핀 아이콘) */
  titleLeading?: ReactNode;
  titleId: string;
  description?: ReactNode;
  children: ReactNode;
  /** 닫기 버튼(스크린리더) */
  closeLabel?: string;
  /**
   * `animated` — 내 위시 공유: 상위의 통합 딤(z-20)과 함께, 패널만 scale/opacity.
   * `static` — 슬러그 등: 전용 `bg-black/45` 딤(z-40) + 패널(z-41), `open`이면 mount.
   */
  variant: "animated" | "static";
  /** `aurora` — 흰 패널 대신 서비스 페이지와 같은 연보라 오로라 배경 */
  panelTone?: "default" | "aurora";
  /**
   * `static` 전용 — 햄버거 메뉴(z-101)보다 위에 띄울 때.
   * 기본은 딤 z-40 · 패널 z-41.
   * `aboveDialogs` — 다른 중앙 모달(예: 목록) 위에 편집 모달을 겹칠 때.
   */
  staticStack?: "default" | "aboveMenu" | "aboveDialogs";
};

function DialogChrome({
  title,
  titleLeading,
  titleId,
  description,
  onClose,
  closeLabel,
}: {
  title: string;
  titleLeading?: ReactNode;
  titleId: string;
  description?: ReactNode;
  onClose: () => void;
  closeLabel: string;
}) {
  return (
    <>
      <div className="flex min-w-0 items-start justify-between gap-2">
        <div className="flex min-w-0 flex-1 items-start gap-1.5">
          {titleLeading != null && titleLeading !== false ? (
            <span className="mt-0.5 inline-flex shrink-0">{titleLeading}</span>
          ) : null}
          <h2 id={titleId} className="min-w-0 flex-1 text-h3 text-slate-900">
            {title}
          </h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex size-8 shrink-0 -translate-y-0.5 items-center justify-center rounded-full text-slate-800 transition hover:opacity-70 active:opacity-50 sm:size-9"
          aria-label={closeLabel}
        >
          <X size={22} weight="bold" aria-hidden />
        </button>
      </div>
      {description != null && description !== false ? (
        <div className="mt-1.5 min-w-0 break-words text-body-sm leading-snug text-slate-600">
          {description}
        </div>
      ) : null}
    </>
  );
}

/**
 * 위시 흐름에서 쓰는 가운데 정렬 다이얼로그(공유·댓글용 로그인 유도 등).
 * `variant`에 따라 뒷배경 주체가 달라짐 — 내 `wishlist` 페이지는 상위 `fixed` 딤을 유지.
 */
export function WishlistCenterDialog({
  open,
  onClose,
  title,
  titleLeading,
  titleId,
  description,
  children,
  closeLabel = "닫기",
  variant,
  panelTone = "default",
  staticStack = "default",
}: WishlistCenterDialogProps) {
  const panelBg = panelTone === "aurora" ? PANEL_BG_AURORA : PANEL_BG_DEFAULT;
  const panelClassName = `${PANEL_SHELL} ${panelBg}`;
  const staticBackdropZ =
    staticStack === "aboveDialogs" ? "z-[120]" : staticStack === "aboveMenu" ? "z-[110]" : "z-[40]";
  const staticPanelZ =
    staticStack === "aboveDialogs" ? "z-[121]" : staticStack === "aboveMenu" ? "z-[111]" : "z-[41]";

  if (variant === "static") {
    if (!open) {
      return null;
    }
    return (
      <>
        <button
          type="button"
          className={`fixed inset-0 ${staticBackdropZ} cursor-default bg-black/45`}
          aria-label="닫기"
          onClick={onClose}
        />
        <div
          className={`fixed left-1/2 top-1/2 ${staticPanelZ} -translate-x-1/2 -translate-y-1/2 ${panelClassName}`}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
        >
          <DialogChrome
            title={title}
            titleLeading={titleLeading}
            titleId={titleId}
            description={description}
            onClose={onClose}
            closeLabel={closeLabel}
          />
          {children}
        </div>
      </>
    );
  }

  return (
    <section
      className={`fixed left-1/2 top-1/2 z-30 -translate-x-1/2 -translate-y-1/2 ${panelClassName} transition-all duration-300 ${
        open
          ? "pointer-events-auto scale-100 opacity-100"
          : "pointer-events-none scale-95 opacity-0"
      }`}
      aria-hidden={!open}
      role="dialog"
      aria-modal={open}
      aria-labelledby={titleId}
    >
      <DialogChrome
        title={title}
        titleLeading={titleLeading}
        titleId={titleId}
        description={description}
        onClose={onClose}
        closeLabel={closeLabel}
      />
      {children}
    </section>
  );
}
