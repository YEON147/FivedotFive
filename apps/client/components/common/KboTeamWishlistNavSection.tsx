"use client";

import { Baseball, CaretDown } from "@phosphor-icons/react";
import Link from "next/link";
import { useEffect, useState } from "react";

import {
  SIDE_MENU_ICON_WRAP_PRIMARY,
  SIDE_MENU_ROW_CLASS,
} from "@/components/common/SideMenuPrimitives";
import { KBO_TEAM_WISHLIST_BOARDS } from "@/lib/constants/kbo-team-wishlist-boards";

type KboTeamWishlistNavSectionProps = {
  /** 사이드 메뉴가 닫힐 때 접힘 상태로 초기화 */
  sideMenuOpen: boolean;
  onNavigate: () => void;
};

const TEAM_LIST_PANEL_CLASS =
  "grid transition-[grid-template-rows] duration-[420ms] ease-[cubic-bezier(0.22,1,0.36,1)]";

const TEAM_LIST_INNER_CLASS =
  "ml-2 flex min-h-0 flex-col gap-0.5 overflow-hidden border-l border-[var(--color-border)] pl-3 pr-1 pb-1 transition-opacity duration-[380ms] ease-out";

/**
 * 햄버거 메뉴 — 야구 구단별 공개 위시(`/wishlist/{slug}`) 링크 목록.
 */
export function KboTeamWishlistNavSection({
  sideMenuOpen,
  onNavigate,
}: KboTeamWishlistNavSectionProps) {
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!sideMenuOpen) {
      setExpanded(false);
    }
  }, [sideMenuOpen]);

  return (
    <div className="flex flex-col">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className={`${SIDE_MENU_ROW_CLASS} w-full text-left`}
        aria-expanded={expanded}
        aria-controls="kbo-team-wishlist-list"
        id="kbo-team-wishlist-toggle"
      >
        <span className={SIDE_MENU_ICON_WRAP_PRIMARY} aria-hidden>
          <Baseball size={20} weight="bold" />
        </span>
        <span className="min-w-0 flex-1">야구 응원가기</span>
        <CaretDown
          size={16}
          weight="bold"
          className={`shrink-0 text-[var(--color-text-secondary)] transition-transform duration-[420ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
            expanded ? "rotate-180" : ""
          }`}
          aria-hidden
        />
      </button>

      <div
        className={`${TEAM_LIST_PANEL_CLASS} ${
          expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <ul
          id="kbo-team-wishlist-list"
          role="region"
          aria-labelledby="kbo-team-wishlist-toggle"
          aria-hidden={!expanded}
          className={`${TEAM_LIST_INNER_CLASS} ${
            expanded ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
        >
          {KBO_TEAM_WISHLIST_BOARDS.map(({ slug, label }) => (
            <li key={slug}>
              <Link
                href={`/wishlist/${slug}`}
                onClick={onNavigate}
                tabIndex={expanded ? undefined : -1}
                className="block rounded-[10px] px-3 py-1.5 text-[12.5px] font-medium leading-snug text-[var(--color-text-primary)] transition hover:bg-[var(--color-bg-subtle)]"
              >
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
