"use client";

import { Gift, SignIn, SignOut, Trophy, User, UserPlus, X } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { KboTeamWishlistNavSection } from "@/components/common/KboTeamWishlistNavSection";
import {
  SideMenuLinkRow,
  SideMenuLogoutRow,
  SideMenuSection,
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
 * 타인 공개 위시리스트(`/wishlist/[slug]`) 등 — 비로그인·로그인 방문자 햄버거 메뉴.
 * `AppSideMenu`와 동일한 `SideMenuPrimitives` 행·아이콘 래퍼를 사용합니다.
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
        <div className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-3">
          <span className="text-h3 text-[var(--color-text-primary)]">메뉴</span>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-full text-slate-800 transition hover:opacity-70 active:opacity-50"
            aria-label="메뉴 닫기"
          >
            <X size={20} weight="bold" aria-hidden />
          </button>
        </div>

        <nav className="flex flex-1 flex-col overflow-y-auto overscroll-y-contain px-0 pb-2 pt-0">
          {loggedIn ? (
            <>
              <SideMenuSection title="나의 활동">
                <SideMenuLinkRow
                  href="/wishlist"
                  onNavigate={onClose}
                  icon={<Gift {...ICON_20} />}
                >
                  내 위시리스트 보러가기
                </SideMenuLinkRow>
                <SideMenuLinkRow
                  href="/ranking"
                  onNavigate={onClose}
                  icon={<Trophy {...ICON_20} />}
                >
                  오쩜오 랭킹
                </SideMenuLinkRow>
              </SideMenuSection>
              <SideMenuSection title="계정">
                <SideMenuLinkRow
                  href="/mypage"
                  onNavigate={onClose}
                  icon={<User {...ICON_20} />}
                >
                  내 정보
                </SideMenuLinkRow>
                <SideMenuLogoutRow
                  onLogout={() => {
                    onLogout();
                    onClose();
                  }}
                  icon={<SignOut {...ICON_20} />}
                >
                  로그아웃
                </SideMenuLogoutRow>
              </SideMenuSection>
            </>
          ) : (
            <>
              <SideMenuSection title="계정">
                <SideMenuLinkRow
                  href={loginHref}
                  onNavigate={onClose}
                  icon={<SignIn {...ICON_20} />}
                >
                  로그인
                </SideMenuLinkRow>
                <SideMenuLinkRow
                  href="/signup"
                  onNavigate={onClose}
                  icon={<UserPlus {...ICON_20} />}
                >
                  회원가입
                </SideMenuLinkRow>
              </SideMenuSection>
              <SideMenuSection title="콘텐츠">
                <KboTeamWishlistNavSection sideMenuOpen={open} onNavigate={onClose} />
                <SideMenuLinkRow
                  href="/ranking"
                  onNavigate={onClose}
                  icon={<Trophy {...ICON_20} />}
                >
                  오쩜오 랭킹
                </SideMenuLinkRow>
              </SideMenuSection>
            </>
          )}
        </nav>
      </aside>
    </>,
    document.body,
  );
}
