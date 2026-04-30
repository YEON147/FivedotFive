"use client";

import Link from "next/link";
import type { ReactNode } from "react";

/** 뉴모피즘(소프트 UI): 거의 흰색 베이스 + 이중 box-shadow(어두운 쪽은 은은하게) */
const SIDE_MENU_ICON_WRAP_NEU =
  "flex size-9 shrink-0 items-center justify-center rounded-full bg-[#fafafa] shadow-[1px_1px_2px_rgba(0,0,0,0.12),-1px_-1px_2px_rgba(255,255,255,0.95)]";

export const SIDE_MENU_ICON_WRAP_PRIMARY = `${SIDE_MENU_ICON_WRAP_NEU} text-[#7B61FF]`;

export const SIDE_MENU_ICON_WRAP_ROSE = `${SIDE_MENU_ICON_WRAP_NEU} text-rose-600`;

/** 사이드 메뉴 링크·버튼 행 — 공개 위시 방문자 메뉴 등에서도 동일하게 사용 */
export const SIDE_MENU_ROW_CLASS =
  "flex items-center gap-4 rounded-[12px] px-3.5 py-2 text-[15px] leading-snug font-medium text-[var(--color-text-primary)] transition hover:bg-[var(--color-bg-subtle)]";

export const SIDE_MENU_LOGOUT_ROW_CLASS =
  "flex w-full items-center gap-4 rounded-[12px] px-3.5 py-2 text-left text-[15px] leading-snug font-medium text-rose-600 transition hover:bg-rose-50";

export function SideMenuSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="mt-2 border-b border-[var(--color-border)] py-2 last:border-b-0">
      <h2 className="mb-2 px-3.5 text-[10px] font-semibold tracking-wide text-[var(--color-text-secondary)]">
        {title}
      </h2>
      <div className="flex flex-col gap-0">{children}</div>
    </section>
  );
}

type SideMenuLinkRowProps = {
  href: string;
  onNavigate: () => void;
  /** `SIDE_MENU_ICON_WRAP_PRIMARY` 안에 들어갈 아이콘(보통 Phosphor, size 20 · bold) */
  icon: ReactNode;
  children: ReactNode;
};

export function SideMenuLinkRow({ href, onNavigate, icon, children }: SideMenuLinkRowProps) {
  return (
    <Link href={href} onClick={onNavigate} className={SIDE_MENU_ROW_CLASS}>
      <span className={SIDE_MENU_ICON_WRAP_PRIMARY} aria-hidden>
        {icon}
      </span>
      {children}
    </Link>
  );
}

type SideMenuLogoutRowProps = {
  onLogout: () => void;
  icon: ReactNode;
  children: ReactNode;
};

export function SideMenuLogoutRow({ onLogout, icon, children }: SideMenuLogoutRowProps) {
  return (
    <button type="button" onClick={onLogout} className={SIDE_MENU_LOGOUT_ROW_CLASS}>
      <span className={SIDE_MENU_ICON_WRAP_ROSE} aria-hidden>
        {icon}
      </span>
      {children}
    </button>
  );
}
