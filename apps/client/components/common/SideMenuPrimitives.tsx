"use client";

import Link from "next/link";
import type { ReactNode } from "react";

export const SIDE_MENU_ICON_WRAP_PRIMARY =
  "flex size-10 shrink-0 items-center justify-center rounded-full bg-[#7B61FF]/12 text-[#7B61FF]";

export const SIDE_MENU_ICON_WRAP_ROSE =
  "flex size-10 shrink-0 items-center justify-center rounded-full bg-rose-500/10 text-rose-600";

const ROW =
  "flex items-center gap-3 rounded-[14px] px-4 py-2.5 text-body font-medium text-[var(--color-text-primary)] transition hover:bg-[var(--color-bg-subtle)]";

const LOGOUT_ROW =
  "flex w-full items-center gap-3 rounded-[14px] px-4 py-2.5 text-left text-body font-medium text-rose-600 transition hover:bg-rose-50 dark:hover:bg-rose-950/30";

export function SideMenuSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="border-b border-[var(--color-border)] py-2 last:border-b-0">
      <h2 className="mb-1 px-4 text-[11px] font-semibold tracking-wide text-[var(--color-text-secondary)]">
        {title}
      </h2>
      <div className="flex flex-col gap-0">{children}</div>
    </section>
  );
}

type SideMenuLinkRowProps = {
  href: string;
  onNavigate: () => void;
  /** `SIDE_MENU_ICON_WRAP_PRIMARY` 안에 들어갈 아이콘(보통 Phosphor, size 22 · bold) */
  icon: ReactNode;
  children: ReactNode;
};

export function SideMenuLinkRow({ href, onNavigate, icon, children }: SideMenuLinkRowProps) {
  return (
    <Link href={href} onClick={onNavigate} className={ROW}>
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
    <button type="button" onClick={onLogout} className={LOGOUT_ROW}>
      <span className={SIDE_MENU_ICON_WRAP_ROSE} aria-hidden>
        {icon}
      </span>
      {children}
    </button>
  );
}
