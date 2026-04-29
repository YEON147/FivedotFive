"use client";

import {
  Bell,
  ChatCircleDots,
  Gift,
  SignOut,
  Trophy,
  User,
  X,
} from "@phosphor-icons/react";
import { useEffect, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

import { KboTeamWishlistNavSection } from "@/components/common/KboTeamWishlistNavSection";
import {
  SideMenuLinkRow,
  SideMenuLogoutRow,
  SideMenuSection,
} from "@/components/common/SideMenuPrimitives";

type AppSideMenuProps = {
  open: boolean;
  onClose: () => void;
  onLogout: () => void;
  /** 내 보드 공개 댓글 페이지 URL (`/wishlist/{slug}`) — 꾸미기 화면에서만 1번「댓글 보러 가기」에 사용 */
  publicWishlistHref?: string | null;
  /** 내 위시 꾸미기(`/wishlist`) 라우트면 true. 이때만 1번이「댓글 보러 가기」로 바뀜(그 외 화면은「내 위시리스트 보러가기」) */
  isOnMyWishlistEditorPage?: boolean;
};

const ICON_22 = { size: 22 as const, weight: "bold" as const };

function useClientMounted() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

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

  const publicHref = publicWishlistHref?.trim() ?? "";
  const firstPrimaryRow =
    isOnMyWishlistEditorPage && publicHref !== "" ? (
      <SideMenuLinkRow
        href={publicHref}
        onNavigate={onClose}
        icon={<ChatCircleDots {...ICON_22} />}
      >
        댓글 보러 가기
      </SideMenuLinkRow>
    ) : !isOnMyWishlistEditorPage ? (
      <SideMenuLinkRow href="/wishlist" onNavigate={onClose} icon={<Gift {...ICON_22} />}>
        내 위시리스트 보러가기
      </SideMenuLinkRow>
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
        <div className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-3">
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

        <nav className="flex flex-1 flex-col overflow-y-auto overscroll-y-contain px-0 pb-2 pt-0">
          <SideMenuSection title="나의 활동">
            {firstPrimaryRow}
            <SideMenuLinkRow href="/ranking" onNavigate={onClose} icon={<Trophy {...ICON_22} />}>
              오쩜오 랭킹
            </SideMenuLinkRow>
          </SideMenuSection>

          <SideMenuSection title="콘텐츠">
            <KboTeamWishlistNavSection sideMenuOpen={open} onNavigate={onClose} />
            <SideMenuLinkRow href="/notice" onNavigate={onClose} icon={<Bell {...ICON_22} />}>
              공지사항
            </SideMenuLinkRow>
          </SideMenuSection>

          <SideMenuSection title="계정">
            <SideMenuLinkRow href="/mypage" onNavigate={onClose} icon={<User {...ICON_22} />}>
              내 정보
            </SideMenuLinkRow>
            <SideMenuLogoutRow onLogout={onLogout} icon={<SignOut {...ICON_22} />}>
              로그아웃
            </SideMenuLogoutRow>
          </SideMenuSection>
        </nav>
      </aside>
    </>,
    document.body,
  );
}
