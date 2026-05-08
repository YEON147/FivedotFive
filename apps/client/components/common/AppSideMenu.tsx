"use client";

import { Bell, Gift, SignOut, Trophy, User, X } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useEffect, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

import { KboTeamWishlistNavSection } from "@/components/common/KboTeamWishlistNavSection";
import {
  SIDE_MENU_ICON_WRAP_PRIMARY,
  SIDE_MENU_ROW_CLASS,
  SideMenuLinkRow,
  SideMenuLogoutRow,
  SideMenuSection,
} from "@/components/common/SideMenuPrimitives";
import { navigateToMyWishBoard } from "@/features/wishlist/navigate-to-my-board";

type AppSideMenuProps = {
  open: boolean;
  onClose: () => void;
  onLogout: () => void;
  /** 내 위시 꾸미기(`/wishlist`) 또는 내 공개 보드(`/wishlist/{내슬러그}`)처럼 단축 링크가 중복일 때 */
  hideMyWishlistShortcut?: boolean;
};

const ICON_20 = { size: 20 as const, weight: "bold" as const };

function useClientMounted() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

/**
 * 위시리스트·랭킹·마이페이지 등 로그인 사용자 햄버거 메뉴.
 * 순서: (1)「내 위시리스트 보러가기」(해당 없으면 생략)→ (2) 랭킹 → …
 */
export function AppSideMenu({
  open,
  onClose,
  onLogout,
  hideMyWishlistShortcut = false,
}: AppSideMenuProps) {
  const router = useRouter();
  const mounted = useClientMounted();

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
          <SideMenuSection title="나의 활동">
            {!hideMyWishlistShortcut ? (
              <button
                type="button"
                className={`${SIDE_MENU_ROW_CLASS} w-full text-left`}
                onClick={() => {
                  onClose();
                  void navigateToMyWishBoard(router).then((nav) => {
                    if (!nav.ok) router.push("/wishlist");
                  });
                }}
              >
                <span className={SIDE_MENU_ICON_WRAP_PRIMARY} aria-hidden>
                  <Gift {...ICON_20} />
                </span>
                내 위시리스트 보러가기
              </button>
            ) : null}
            <SideMenuLinkRow href="/ranking" onNavigate={onClose} icon={<Trophy {...ICON_20} />}>
              오쩜오 랭킹
            </SideMenuLinkRow>
          </SideMenuSection>

          <SideMenuSection title="콘텐츠">
            <KboTeamWishlistNavSection sideMenuOpen={open} onNavigate={onClose} />
            <SideMenuLinkRow href="/notice" onNavigate={onClose} icon={<Bell {...ICON_20} />}>
              공지사항
            </SideMenuLinkRow>
          </SideMenuSection>

          <SideMenuSection title="계정">
            <SideMenuLinkRow href="/mypage" onNavigate={onClose} icon={<User {...ICON_20} />}>
              내 정보
            </SideMenuLinkRow>
            <SideMenuLogoutRow onLogout={onLogout} icon={<SignOut {...ICON_20} />}>
              로그아웃
            </SideMenuLogoutRow>
          </SideMenuSection>
        </nav>
      </aside>
    </>,
    document.body,
  );
}
