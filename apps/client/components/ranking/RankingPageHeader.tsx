"use client";

import { CaretLeft, TextAlignJustify } from "@phosphor-icons/react";
import Image from "next/image";
import Link from "next/link";

/** `app/wishlist/page.tsx` WishlistProfileTitleHeader · `wishlist/[slug]` 공개 헤더와 동일 패딩 */
const RANKING_HEADER_ROW =
  "relative z-40 mb-4 flex w-full shrink-0 items-center justify-between gap-2.5 pl-[7%] pr-[4%] pt-[7%]";

/** `WISHLIST_MENU_BUTTON` 과 동일 — 우측 메뉴 */
const RANKING_MENU_BUTTON =
  "relative z-40 flex size-[42px] shrink-0 items-center justify-center rounded-full bg-slate-100 text-[#7B61FF] shadow-sm transition hover:bg-slate-200 active:bg-slate-300/90 touch-manipulation";

/** 동일 크기·형태의 뒤로가기(좌측) */
const RANKING_BACK_BUTTON =
  "relative z-40 flex size-[42px] shrink-0 items-center justify-center rounded-full text-slate-800 transition hover:opacity-70 active:opacity-50 touch-manipulation";

const RANKING_HEADER_SPACER = "relative z-40 size-[42px] shrink-0";

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
    <header className={RANKING_HEADER_ROW}>
      <Link
        href={backHref}
        scroll={false}
        prefetch
        className={RANKING_BACK_BUTTON}
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
          className={RANKING_MENU_BUTTON}
          aria-label="메뉴 열기"
          aria-expanded={menuOpen}
        >
          <TextAlignJustify size={23} weight="bold" />
        </button>
      ) : (
        <div className={RANKING_HEADER_SPACER} aria-hidden />
      )}
    </header>
  );
}
