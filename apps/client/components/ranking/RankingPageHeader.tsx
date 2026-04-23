import { CaretLeft, TextAlignJustify } from "@phosphor-icons/react";
import Image from "next/image";
import Link from "next/link";

type RankingPageHeaderProps = {
  backHref?: string;
  /** `public/ranking/` 기준 랭킹 로고 경로 */
  logoSrc?: string;
};

export function RankingPageHeader({
  backHref = "/wishlist",
  logoSrc = "/ranking/ranking_logo.png",
}: RankingPageHeaderProps) {
  return (
    <header className="relative mb-5 flex shrink-0 items-center pt-3">
      <Link
        href={backHref}
        className="relative z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--color-surface)] text-[var(--color-text-primary)] shadow-sm ring-1 ring-black/5 transition hover:bg-[var(--color-bg-subtle)]"
        aria-label="위시리스트로 이동"
      >
        <CaretLeft size={22} weight="bold" />
      </Link>

      <div className="pointer-events-none absolute inset-x-0 flex justify-center px-12 sm:px-14">
        <h1 className="flex max-h-11 w-full max-w-[min(100%,360px)] items-center justify-center">
          <Image
            src={logoSrc}
            alt="랭킹"
            width={400}
            height={100}
            className="h-11 w-full max-w-full object-contain object-center"
            priority
            unoptimized
          />
        </h1>
      </div>

      <Link
        href={backHref}
        className="relative z-10 ml-auto flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--color-surface)] text-[#7B61FF] shadow-sm ring-1 ring-black/5 transition hover:bg-[var(--color-bg-subtle)]"
        aria-label="메뉴 · 위시리스트"
      >
        <TextAlignJustify size={23} weight="bold" />
      </Link>
    </header>
  );
}
