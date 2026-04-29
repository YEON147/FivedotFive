"use client";

import {
  ChatCircleDots,
  Gift,
  MegaphoneSimple,
  SignOut,
  Trophy,
  User,
  X,
} from "@phosphor-icons/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { KboTeamWishlistNavSection } from "@/components/common/KboTeamWishlistNavSection";

type AppSideMenuProps = {
  open: boolean;
  onClose: () => void;
  onLogout: () => void;
  /** 내 보드 공개 댓글 페이지 URL (`/wishlist/{slug}`) — 꾸미기 화면에서만 1번「댓글 보러 가기」에 사용 */
  publicWishlistHref?: string | null;
  /** 내 위시 꾸미기(`/wishlist`) 라우트면 true. 이때만 1번이「댓글 보러 가기」로 바뀜(그 외 화면은「내 위시리스트 보러가기」) */
  isOnMyWishlistEditorPage?: boolean;
};

const SIDE_MENU_ICON_WRAP_PRIMARY =
  "flex size-10 shrink-0 items-center justify-center rounded-full bg-[#7B61FF]/12 text-[#7B61FF]";

const SIDE_MENU_ICON_WRAP_ROSE =
  "flex size-10 shrink-0 items-center justify-center rounded-full bg-rose-500/10 text-rose-600";

const ROW =
  "flex items-center gap-3 rounded-[14px] px-4 py-3.5 text-body font-medium text-[var(--color-text-primary)] transition hover:bg-[var(--color-bg-subtle)]";

/**
 * 위시리스트·랭킹·마이페이지 등 로그인 사용자 햄버거 메뉴.
 * 순서: (1) 내 위시 꾸미기 중이면「댓글 보러 가기」, 아니면「내 위시리스트 보러가기」→ (2) 랭킹 → …
 */
export function AppSideMenu({
  open,
  onClose,
  onLogout,
  publicWishlistHref,
  isOnMyWishlistEditorPage = false,
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

  const publicHref = publicWishlistHref?.trim() ?? "";
  const firstPrimaryRow =
    isOnMyWishlistEditorPage && publicHref !== "" ? (
      <Link href={publicHref} onClick={onClose} className={ROW}>
        <span className={SIDE_MENU_ICON_WRAP_PRIMARY} aria-hidden>
          <ChatCircleDots size={22} weight="bold" />
        </span>
        댓글 보러 가기
      </Link>
    ) : !isOnMyWishlistEditorPage ? (
      <Link href="/wishlist" onClick={onClose} className={ROW}>
        <span className={SIDE_MENU_ICON_WRAP_PRIMARY} aria-hidden>
          <Gift size={22} weight="bold" />
        </span>
        내 위시리스트 보러가기
      </Link>
    ) : null;

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
          {firstPrimaryRow}

          <Link href="/ranking" onClick={onClose} className={ROW}>
            <span className={SIDE_MENU_ICON_WRAP_PRIMARY} aria-hidden>
              <Trophy size={22} weight="bold" />
            </span>
            오쩜오 랭킹
          </Link>

          <KboTeamWishlistNavSection sideMenuOpen={open} onNavigate={onClose} />

          {/* 4 — 공지 */}
          <Link href="/notice" onClick={onClose} className={ROW}>
            <span className={SIDE_MENU_ICON_WRAP_PRIMARY} aria-hidden>
              <MegaphoneSimple size={22} weight="bold" />
            </span>
            공지사항
          </Link>

          {/* 5 — 내 정보 */}
          <Link href="/mypage" onClick={onClose} className={ROW}>
            <span className={SIDE_MENU_ICON_WRAP_PRIMARY} aria-hidden>
              <User size={22} weight="bold" />
            </span>
            내 정보
          </Link>

          {/* 6 — 로그아웃 */}
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
