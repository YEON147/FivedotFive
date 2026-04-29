"use client";

import { Baseball, CaretDown } from "@phosphor-icons/react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { KBO_TEAM_WISHLIST_BOARDS } from "@/lib/constants/kbo-team-wishlist-boards";

const ICON_WRAP =
  "flex size-10 shrink-0 items-center justify-center rounded-full bg-[#7B61FF]/12 text-[#7B61FF]";

type KboTeamWishlistNavSectionProps = {
  /** 사이드 메뉴가 닫힐 때 접힘 상태로 초기화 */
  sideMenuOpen: boolean;
  onNavigate: () => void;
};

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
        className="flex w-full items-center gap-3 rounded-[14px] px-4 py-3.5 text-left text-body font-medium text-[var(--color-text-primary)] transition hover:bg-[var(--color-bg-subtle)]"
        aria-expanded={expanded}
        aria-controls="kbo-team-wishlist-list"
        id="kbo-team-wishlist-toggle"
      >
        <span className={ICON_WRAP} aria-hidden>
          <Baseball size={22} weight="bold" />
        </span>
        <span className="min-w-0 flex-1">야구 응원가기</span>
        <CaretDown
          size={18}
          weight="bold"
          className={`shrink-0 text-[var(--color-text-secondary)] transition-transform duration-200 ${
            expanded ? "rotate-180" : ""
          }`}
          aria-hidden
        />
      </button>

      {expanded ? (
        <ul
          id="kbo-team-wishlist-list"
          role="region"
          aria-labelledby="kbo-team-wishlist-toggle"
          className="ml-2 flex flex-col gap-0.5 border-l border-[var(--color-border)] pl-3 pr-1 pb-1"
        >
          {KBO_TEAM_WISHLIST_BOARDS.map(({ slug, label }) => (
            <li key={slug}>
              <Link
                href={`/wishlist/${slug}`}
                onClick={onNavigate}
                className="block rounded-[10px] px-3 py-2.5 text-[13px] font-medium leading-snug text-[var(--color-text-primary)] transition hover:bg-[var(--color-bg-subtle)]"
              >
                {label}
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
