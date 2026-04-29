"use client";

import {
  Gift,
  MegaphoneSimple,
  SignIn,
  SignOut,
  Trophy,
  User,
  UserPlus,
  X,
} from "@phosphor-icons/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { KboTeamWishlistNavSection } from "@/components/common/KboTeamWishlistNavSection";
import {
  SIDE_MENU_ICON_WRAP_PRIMARY,
  SIDE_MENU_ICON_WRAP_ROSE,
  SIDE_MENU_LOGOUT_ROW_CLASS,
  SIDE_MENU_ROW_CLASS,
} from "@/components/common/SideMenuPrimitives";

type PublicWishlistVisitorMenuProps = {
  open: boolean;
  onClose: () => void;
  loggedIn: boolean;
  onLogout: () => void;
  /** 로그인 후 현재 페이지로 돌아오도록 `next` 포함 (선택) */
  loginHref?: string;
};

const ICON_20 = { size: 20 as const, weight: "bold" as const };

/**
 * 공개 위시리스트(`/wishlist/[slug]`) 햄버거 메뉴.
 * 비로그인: 로그인·회원가입만. 로그인 시: 내 위시·랭킹·야구·공지·내 정보·로그아웃.
 */
export function PublicWishlistVisitorMenu({
  open,
  onClose,
  loggedIn,
  onLogout,
  loginHref = "/login",
}: PublicWishlistVisitorMenuProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
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
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-full text-slate-800 transition hover:opacity-70 active:opacity-50"
            aria-label="메뉴 닫기"
          >
            <X {...ICON_20} aria-hidden />
          </button>
        </div>

        <nav className="flex flex-1 flex-col gap-1 p-3">
          {loggedIn ? (
            <>
              <Link href="/wishlist" onClick={onClose} className={SIDE_MENU_ROW_CLASS}>
                <span className={SIDE_MENU_ICON_WRAP_PRIMARY} aria-hidden>
                  <Gift {...ICON_20} />
                </span>
                내 위시리스트 보러가기
              </Link>

              <Link href="/ranking" onClick={onClose} className={SIDE_MENU_ROW_CLASS}>
                <span className={SIDE_MENU_ICON_WRAP_PRIMARY} aria-hidden>
                  <Trophy {...ICON_20} />
                </span>
                오쩜오 랭킹
              </Link>

              <KboTeamWishlistNavSection sideMenuOpen={open} onNavigate={onClose} />

              <Link href="/notice" onClick={onClose} className={SIDE_MENU_ROW_CLASS}>
                <span className={SIDE_MENU_ICON_WRAP_PRIMARY} aria-hidden>
                  <MegaphoneSimple {...ICON_20} />
                </span>
                공지사항
              </Link>

              <Link href="/mypage" onClick={onClose} className={SIDE_MENU_ROW_CLASS}>
                <span className={SIDE_MENU_ICON_WRAP_PRIMARY} aria-hidden>
                  <User {...ICON_20} />
                </span>
                내 정보
              </Link>

              <button
                type="button"
                onClick={() => {
                  onLogout();
                  onClose();
                }}
                className={SIDE_MENU_LOGOUT_ROW_CLASS}
              >
                <span className={SIDE_MENU_ICON_WRAP_ROSE} aria-hidden>
                  <SignOut {...ICON_20} />
                </span>
                로그아웃
              </button>
            </>
          ) : (
            <>
              <Link href={loginHref} onClick={onClose} className={SIDE_MENU_ROW_CLASS}>
                <span className={SIDE_MENU_ICON_WRAP_PRIMARY} aria-hidden>
                  <SignIn {...ICON_20} />
                </span>
                로그인
              </Link>
              <Link href="/signup" onClick={onClose} className={SIDE_MENU_ROW_CLASS}>
                <span className={SIDE_MENU_ICON_WRAP_PRIMARY} aria-hidden>
                  <UserPlus {...ICON_20} />
                </span>
                회원가입
              </Link>
            </>
          )}
        </nav>
      </aside>
    </>,
    document.body,
  );
}
