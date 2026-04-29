"use client";

import { ChatCircleDots, SignOut, Trophy, User, X } from "@phosphor-icons/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

type AppSideMenuProps = {
  open: boolean;
  onClose: () => void;
  onLogout: () => void;
  /** 공개 위시 댓글 뷰 (`/wishlist/{slug}`) — 있을 때만 메뉴에 노출 */
  publicWishlistHref?: string | null;
};

/** 메뉴 행 아이콘 — 원형 배지 (랭킹·내정보) */
const SIDE_MENU_ICON_WRAP_PRIMARY =
  "flex size-10 shrink-0 items-center justify-center rounded-full bg-[#7B61FF]/12 text-[#7B61FF]";

const SIDE_MENU_ICON_WRAP_ROSE =
  "flex size-10 shrink-0 items-center justify-center rounded-full bg-rose-500/10 text-rose-600";

/**
 * 위시리스트 헤더 햄버거와 동일한 우측 슬라이드 메뉴 (랭킹 / 내정보 / 로그아웃).
 */
export function AppSideMenu({
  open,
  onClose,
  onLogout,
  publicWishlistHref,
}: AppSideMenuProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!mounted || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <>
      <div
        className={`fixed inset-0 z-[100] bg-black/35 transition-opacity duration-300 ${
          open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
        aria-hidden={!open}
      />

      <aside
        className={`fixed inset-y-0 right-0 z-[101] flex w-[min(300px,88vw)] flex-col rounded-l-[18px] border-l border-[var(--color-border)] bg-[var(--color-surface)] shadow-[-12px_0_40px_rgba(0,0,0,0.1)] transition-transform duration-300 ease-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        aria-hidden={!open}
      >
        <div className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-4">
          <span className="text-h3 text-[var(--color-text-primary)]">메뉴</span>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex size-10 shrink-0 items-center justify-center rounded-full text-slate-800 transition hover:opacity-70 active:opacity-50"
            aria-label="메뉴 닫기"
          >
            <X size={22} weight="bold" aria-hidden />
          </button>
        </div>

        <nav className="flex flex-1 flex-col gap-1 p-3">
          {publicWishlistHref ? (
            <Link
              href={publicWishlistHref}
              onClick={onClose}
              className="flex items-center gap-3 rounded-[14px] px-4 py-3.5 text-body font-medium text-[var(--color-text-primary)] transition hover:bg-[var(--color-bg-subtle)]"
            >
              <span className={SIDE_MENU_ICON_WRAP_PRIMARY} aria-hidden>
                <ChatCircleDots size={22} weight="bold" />
              </span>
              댓글 확인하러 가기
            </Link>
          ) : null}

          <Link
            href="/ranking"
            onClick={onClose}
            className="flex items-center gap-3 rounded-[14px] px-4 py-3.5 text-body font-medium text-[var(--color-text-primary)] transition hover:bg-[var(--color-bg-subtle)]"
          >
            <span className={SIDE_MENU_ICON_WRAP_PRIMARY} aria-hidden>
              <Trophy size={22} weight="bold" />
            </span>
            오쩜오 랭킹
          </Link>

          <Link
            href="/mypage"
            onClick={onClose}
            className="flex items-center gap-3 rounded-[14px] px-4 py-3.5 text-body font-medium text-[var(--color-text-primary)] transition hover:bg-[var(--color-bg-subtle)]"
          >
            <span className={SIDE_MENU_ICON_WRAP_PRIMARY} aria-hidden>
              <User size={22} weight="bold" />
            </span>
            내정보
          </Link>

          <button
            type="button"
            onClick={onLogout}
            className="flex w-full items-center gap-3 rounded-[14px] px-4 py-3.5 text-left text-body font-medium text-rose-600 transition hover:bg-rose-50"
          >
            <span className={SIDE_MENU_ICON_WRAP_ROSE} aria-hidden>
              <SignOut size={22} weight="bold" />
            </span>
            로그아웃
          </button>
        </nav>
      </aside>
    </>,
    document.body,
  );
}
