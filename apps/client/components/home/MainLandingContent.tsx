"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import "@/components/home/main-landing-hero.css";
import "@/components/home/main-landing-wordmark-float.css";
import { IntroDesignSparkles } from "@/components/main-intro/IntroDesignSparkles";
import { loginUrlForPath } from "@/features/login/post-login-destination";
import { createMyBoard } from "@/features/wishlist/api";
import { SESSION_OPEN_DECORATE_AFTER_CREATE_KEY } from "@/features/wishlist/wishlist-session-cache";
import { trackSignupButtonClick } from "@/lib/analytics/conversion";
import { touchTrafficAttribution, trackWishlistCtaClick } from "@/lib/analytics/wishlistCta";

const landingPrimaryBtn =
  "inline-flex min-h-[3.25rem] w-full cursor-pointer items-center justify-center rounded-[18px] bg-[var(--color-primary-main)] px-7 text-[16px] font-extrabold leading-none text-white transition-[transform,background-color] duration-200 hover:bg-[var(--color-primary-pressed)] active:scale-[0.99] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary-main)]";

const landingMutedLink =
  "text-body-sm font-medium text-[#6e6e6e] underline-offset-4 transition-opacity hover:underline";

type MainLandingContentProps = {
  loggedIn: boolean;
  /** 로그인 시 프로필 조회 완료 전에는 `false` — CTA 깜빡임 방지용 로딩 */
  loggedInCtaReady: boolean;
  adminPublicBoardSlug: string;
  hasWishBoard: boolean;
};

/**
 * 비로그인: 관리자 공개 위시(댓글 페이지) + 로그인·회원가입.
 * 로그인: 위시 보드 유무에 따라 꾸미기/만들기 + 구경가기(관리자 공개 위시·댓글 페이지).
 */
export function MainLandingContent({
  loggedIn,
  loggedInCtaReady,
  adminPublicBoardSlug,
  hasWishBoard,
}: MainLandingContentProps) {
  const router = useRouter();
  const [wishlistPrimaryLoading, setWishlistPrimaryLoading] = useState(false);
  const [wishlistPrimaryError, setWishlistPrimaryError] = useState<string | null>(null);

  useEffect(() => {
    touchTrafficAttribution();
  }, []);

  const handleLoggedInWishlistPrimary = async () => {
    trackWishlistCtaClick({
      cta_id: "landing_logged_wishlist_hub",
      wishlist_entry: hasWishBoard ? "decorate" : "create",
    });

    if (hasWishBoard) {
      router.push("/wishlist");
      return;
    }

    setWishlistPrimaryError(null);
    setWishlistPrimaryLoading(true);
    try {
      try {
        await createMyBoard();
      } catch (e) {
        const msg = e instanceof Error ? e.message : "";
        if (!msg.includes("이미 위시보드가 존재합니다")) {
          throw e;
        }
      }
      if (typeof window !== "undefined") {
        sessionStorage.setItem(SESSION_OPEN_DECORATE_AFTER_CREATE_KEY, "1");
      }
      router.push("/wishlist");
    } catch (e) {
      setWishlistPrimaryError(
        e instanceof Error ? e.message : "위시보드를 만들지 못했습니다.",
      );
    } finally {
      setWishlistPrimaryLoading(false);
    }
  };

  const goBrowseLoggedIn = () => {
    trackWishlistCtaClick({ cta_id: "landing_logged_public_browse" });
    router.push(`/wishlist/${encodeURIComponent(adminPublicBoardSlug)}`);
  };

  return (
    <main className="wishlist-page-root relative flex min-h-[100dvh] flex-col overflow-y-auto">
      <IntroDesignSparkles />

      <div className="relative z-[3] flex min-h-[100dvh] flex-1 flex-col items-center justify-center px-6 pt-[max(0.75rem,calc(0.5rem+env(safe-area-inset-top,0px)))] pb-[max(1.25rem,env(safe-area-inset-bottom,0px))] sm:py-[clamp(1rem,3vmin,2.25rem)]">
        <div className="main-landing-wordmark-float mb-4 flex w-full justify-center">
          <Image
            src="/main/main3.png"
            alt=""
            width={360}
            height={140}
            priority
            sizes="(max-width: 768px) 72vw, 300px"
            className="h-auto w-[min(72vw,300px)] max-w-full object-contain drop-shadow-[0_10px_28px_rgba(123,97,255,0.2)]"
          />
        </div>

        <p className="mb-3 max-w-[min(22rem,92vw)] text-center text-[16px] font-light leading-relaxed tracking-tight text-[var(--color-text-secondary)] drop-shadow-[0_1px_0_rgba(255,255,255,0.9)]">
          취향과 설렘이 담긴 작은 이야기
        </p>

        <div
          className="relative z-0 inline-block max-w-full"
          style={{
            filter:
              "drop-shadow(0 20px 36px rgba(255, 255, 255, 0.55)) drop-shadow(0 8px 22px rgba(255, 255, 255, 0.85))",
          }}
        >
          <Image
            src="/main/main2.png"
            alt="오쩜오"
            width={900}
            height={900}
            priority
            sizes="(max-width: 768px) 92vw, 62vw"
            className="main-landing-hero-img"
          />
        </div>

        <section
          className="relative z-10 mt-3 w-full max-w-sm shrink-0"
          aria-label="이용 방법"
        >
          <ol className="grid grid-cols-3 gap-2 sm:gap-3">
            <li className="flex min-w-0 flex-col items-center rounded-2xl bg-white/90 px-2 py-3.5 text-center shadow-[0_4px_16px_rgba(60,40,120,0.08)] ring-1 ring-[rgba(0,0,0,0.04)] sm:px-3 sm:py-4">
              <span
                className="mb-2 text-[2rem] font-extrabold leading-none text-[color-mix(in_srgb,var(--color-brand-blue)_72%,white)] sm:text-[2.25rem]"
                aria-hidden
              >
                1
              </span>
              <p className="text-[12px] font-normal leading-snug break-keep text-[var(--color-text-secondary)] sm:text-[14px] sm:leading-relaxed">
                내가 원하는 것{" "}
                <strong className="font-bold text-[var(--color-text-primary)]">위시리스트</strong>로
                만들기
              </p>
            </li>
            <li className="flex min-w-0 flex-col items-center rounded-2xl bg-white/90 px-2 py-3.5 text-center shadow-[0_4px_16px_rgba(60,40,120,0.08)] ring-1 ring-[rgba(0,0,0,0.04)] sm:px-3 sm:py-4">
              <span
                className="mb-2 text-[2rem] font-extrabold leading-none text-[color-mix(in_srgb,var(--color-brand-coral)_70%,white)] sm:text-[2.25rem]"
                aria-hidden
              >
                2
              </span>
              <p className="text-[12px] font-normal leading-snug break-keep text-[var(--color-text-secondary)] sm:text-[14px] sm:leading-relaxed">
                친구·가족과{" "}
                <strong className="font-bold text-[var(--color-text-primary)]">링크 공유</strong>하기
              </p>
            </li>
            <li className="flex min-w-0 flex-col items-center rounded-2xl bg-white/90 px-2 py-3.5 text-center shadow-[0_4px_16px_rgba(60,40,120,0.08)] ring-1 ring-[rgba(0,0,0,0.04)] sm:px-3 sm:py-4">
              <span
                className="mb-2 text-[2rem] font-extrabold leading-none text-[color-mix(in_srgb,var(--color-brand-green)_58%,white)] sm:text-[2.25rem]"
                aria-hidden
              >
                3
              </span>
              <p className="text-[12px] font-normal leading-snug break-keep text-[var(--color-text-secondary)] sm:text-[14px] sm:leading-relaxed">
                스티커·댓글 주고 받으며{" "}
                <strong className="font-bold text-[var(--color-text-primary)]">소통하기</strong>
              </p>
            </li>
          </ol>
        </section>

        <div className="relative z-10 mt-[clamp(1rem,4vmin,2rem)] flex w-full max-w-sm flex-col gap-3">
          {loggedIn && !loggedInCtaReady ? (
            <div
              className="inline-flex min-h-[3.25rem] w-full items-center justify-center rounded-[18px] bg-slate-100 px-7 text-[15px] font-medium text-[#8b8b8b]"
              aria-busy
            >
              불러오는 중…
            </div>
          ) : loggedIn ? (
            <>
              {wishlistPrimaryError ? (
                <p className="text-center text-xs text-rose-600">{wishlistPrimaryError}</p>
              ) : null}
              <button
                type="button"
                className={`${landingPrimaryBtn} disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-60`}
                disabled={wishlistPrimaryLoading}
                onClick={() => void handleLoggedInWishlistPrimary()}
              >
                {wishlistPrimaryLoading
                  ? "준비 중…"
                  : hasWishBoard
                    ? "내 위시리스트 꾸미러 가기"
                    : "위시리스트 만들러 가기"}
              </button>
              <button
                type="button"
                onClick={goBrowseLoggedIn}
                className="text-center text-body-sm font-medium text-[#8b8b8b] underline-offset-4 transition-colors hover:text-[#6e6e6e] hover:underline"
              >
                구경가기
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className={landingPrimaryBtn}
                onClick={() => {
                  trackWishlistCtaClick({ cta_id: "landing_guest_public_browse" });
                  router.push(`/wishlist/${encodeURIComponent(adminPublicBoardSlug)}`);
                }}
              >
                오쩜오 둘러보기
              </button>
              <div className="text-center">
                <Link href={loginUrlForPath("/")} className={landingMutedLink}>
                  로그인
                </Link>
                <span className="mx-2 text-body-sm text-[#c4c4c4]" aria-hidden>
                  ·
                </span>
                <Link
                  href="/signup"
                  className={landingMutedLink}
                  onClick={() => trackSignupButtonClick({ signup_entry: "landing" })}
                >
                  회원가입
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
