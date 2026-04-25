"use client";

import { CaretLeft, TextAlignJustify } from "@phosphor-icons/react";
import Image from "next/image";
import Link from "next/link";

import {
  PAGE_HEADER_BACK_BUTTON,
  PAGE_HEADER_END_SPACER,
  PAGE_HEADER_MENU_BUTTON,
  PAGE_HEADER_ROW,
} from "@/lib/constants/page-header";

type RankingPageHeaderProps = {
  backHref?: string;
  /** `public/ranking/` 기준 랭킹 로고 경로 */
  logoSrc?: string;
  menuOpen?: boolean;
  onMenuToggle?: () => void;
};

export function RankingPageHeader({
  backHref = "/wishlist",
  logoSrc = "/ranking/ranking_logo.png",
  menuOpen = false,
  onMenuToggle,
}: RankingPageHeaderProps) {
  return (
    <header className={PAGE_HEADER_ROW}>
      <Link
        href={backHref}
        scroll={false}
        prefetch
        className={PAGE_HEADER_BACK_BUTTON}
        aria-label="위시리스트로 이동"
      >
        <CaretLeft size={22} weight="bold" />
      </Link>

      <div className="flex min-h-0 min-w-0 flex-1 justify-center px-2">
        <h1 className="flex max-h-10 w-full max-w-[min(100%,280px)] items-center justify-center">
          <Image
            src={logoSrc}
            alt="랭킹"
            width={400}
            height={100}
            className="h-10 w-full max-w-full object-contain object-center"
            priority
            unoptimized
          />
        </h1>
      </div>

      {onMenuToggle ? (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onMenuToggle();
          }}
          className={PAGE_HEADER_MENU_BUTTON}
          aria-label="메뉴 열기"
          aria-expanded={menuOpen}
        >
          <TextAlignJustify size={23} weight="bold" />
        </button>
      ) : (
        <div className={PAGE_HEADER_END_SPACER} aria-hidden />
      )}
    </header>
  );
}
