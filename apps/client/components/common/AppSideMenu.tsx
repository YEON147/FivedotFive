"use client";

import { SignOut, Trophy, UserCircle } from "@phosphor-icons/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

type AppSideMenuProps = {
  open: boolean;
  onClose: () => void;
  onLogout: () => void;
};

/**
 * 위시리스트 헤더 햄버거와 동일한 우측 슬라이드 메뉴 (My Page / 랭킹 / 로그아웃).
 */
export function AppSideMenu({ open, onClose, onLogout }: AppSideMenuProps) {
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
            className="rounded-full bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
            aria-label="메뉴 닫기"
          >
            닫기
          </button>
        </div>

        <nav className="flex flex-1 flex-col gap-1 p-3">
          <Link
            href="/mypage"
            onClick={onClose}
            className="flex items-center gap-3 rounded-[14px] px-4 py-3.5 text-body font-medium text-[var(--color-text-primary)] transition hover:bg-[var(--color-bg-subtle)]"
          >
            <UserCircle size={22} weight="regular" className="shrink-0 text-[#7B61FF]" />
            My Page
          </Link>

          <Link
            href="/ranking"
            onClick={onClose}
            className="flex items-center gap-3 rounded-[14px] px-4 py-3.5 text-body font-medium text-[var(--color-text-primary)] transition hover:bg-[var(--color-bg-subtle)]"
          >
            <Trophy size={22} weight="regular" className="shrink-0 text-[#7B61FF]" />
            랭킹
          </Link>

          <button
            type="button"
            onClick={onLogout}
            className="flex w-full items-center gap-3 rounded-[14px] px-4 py-3.5 text-left text-body font-medium text-rose-600 transition hover:bg-rose-50"
          >
            <SignOut size={22} weight="bold" className="shrink-0" />
            로그아웃
          </button>
        </nav>
      </aside>
    </>,
    document.body,
  );
}
