"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useLayoutEffect, useState } from "react";

import "@/components/home/main-landing-hero.css";
import "@/components/home/main-landing-service-steps.css";
import "@/components/home/main-landing-wordmark-float.css";
import {
  easeTowardCap,
  nextFrame,
  runDecorateFillRamp,
  WISH_CTA_DECORATE_RAMP,
  WISH_CTA_FILL,
  WISH_CTA_PROGRESS_TICK_MS,
} from "@/components/home/landing-wish-cta-helpers";
import { IntroDesignSparkles } from "@/components/main-intro/IntroDesignSparkles";
import { loginUrlForPath } from "@/features/login/post-login-destination";
import { createMyBoard } from "@/features/wishlist/api";
import { SESSION_OPEN_DECORATE_AFTER_CREATE_KEY } from "@/features/wishlist/wishlist-session-cache";
import { trackSignupButtonClick } from "@/lib/analytics/conversion";
import { touchTrafficAttribution, trackWishlistCtaClick } from "@/lib/analytics/wishlistCta";

const landingPrimaryBtn =
  "relative inline-flex min-h-[3.25rem] w-full cursor-pointer items-center justify-center overflow-hidden rounded-[18px] bg-[var(--color-primary-main)] px-7 text-[16px] font-extrabold leading-none text-white transition-[transform,background-color,opacity] duration-200 hover:bg-[var(--color-primary-pressed)] active:scale-[0.99] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary-main)] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-[0.72] disabled:hover:bg-[var(--color-primary-main)]";

const landingPrimaryBtnLoadingExtra =
  "cursor-wait opacity-[0.92] hover:bg-[var(--color-primary-main)] active:scale-100";

const landingMutedLink =
  "text-body-sm font-medium text-[#6e6e6e] underline-offset-4 transition-opacity hover:underline";

const BOARD_EXISTS_MSG = "이미 위시보드가 존재합니다";

type MainLandingContentProps = {
  loggedIn: boolean;
  loggedInCtaReady: boolean;
  adminPublicBoardSlug: string;
  hasWishBoard: boolean;
};

export function MainLandingContent({
  loggedIn,
  loggedInCtaReady,
  adminPublicBoardSlug,
  hasWishBoard,
}: MainLandingContentProps) {
  const router = useRouter();
  /** iOS WebKit: 히어로 로고에 filter drop-shadow 시 사각 clipping → 레이어 그림자 사용 */
  const [iosStyleHeroShadow, setIosStyleHeroShadow] = useState(false);
  const [wishlistPrimaryLoading, setWishlistPrimaryLoading] = useState(false);
  const [wishlistPrimaryFill, setWishlistPrimaryFill] = useState(0);
  const [wishlistPrimaryError, setWishlistPrimaryError] = useState<string | null>(null);

  useEffect(() => {
    touchTrafficAttribution();
  }, []);

  useLayoutEffect(() => {
    const ua = navigator.userAgent;
    const appleTouch =
      /iPad|iPhone|iPod/.test(ua) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    setIosStyleHeroShadow(appleTouch);
  }, []);

  const handleLoggedInWishlistPrimary = async () => {
    if (wishlistPrimaryLoading) return;

    trackWishlistCtaClick({
      cta_id: "landing_logged_wishlist_hub",
      wishlist_entry: hasWishBoard ? "decorate" : "create",
    });

    if (hasWishBoard) {
      setWishlistPrimaryLoading(true);
      await runDecorateFillRamp(setWishlistPrimaryFill, WISH_CTA_DECORATE_RAMP);
      router.push("/wishlist");
      return;
    }

    setWishlistPrimaryError(null);
    setWishlistPrimaryLoading(true);
    setWishlistPrimaryFill(WISH_CTA_FILL.start);

    let progressId: number | null = null;

    try {
      await nextFrame();
      setWishlistPrimaryFill(WISH_CTA_FILL.afterFirstFrame);

      progressId = window.setInterval(() => {
        setWishlistPrimaryFill((p) => easeTowardCap(p, WISH_CTA_FILL.capWhileApi));
      }, WISH_CTA_PROGRESS_TICK_MS);

      try {
        await createMyBoard();
      } catch (e) {
        if (!(e instanceof Error) || !e.message.includes(BOARD_EXISTS_MSG)) throw e;
      }

      if (progressId !== null) {
        window.clearInterval(progressId);
        progressId = null;
      }

      setWishlistPrimaryFill(WISH_CTA_FILL.beforeNavigate);
      await nextFrame();
      setWishlistPrimaryFill(WISH_CTA_FILL.full);
      await nextFrame();

      sessionStorage.setItem(SESSION_OPEN_DECORATE_AFTER_CREATE_KEY, "1");
      router.push("/wishlist");
    } catch (e) {
      if (progressId !== null) window.clearInterval(progressId);
      setWishlistPrimaryError(
        e instanceof Error ? e.message : "위시보드를 만들지 못했습니다.",
      );
      setWishlistPrimaryLoading(false);
      setWishlistPrimaryFill(0);
    }
  };

  const goBrowseLoggedIn = () => {
    trackWishlistCtaClick({ cta_id: "landing_logged_public_browse" });
    router.push(`/wishlist/${encodeURIComponent(adminPublicBoardSlug)}`);
  };

  return (
    <main className="wishlist-page-root relative flex min-h-[100dvh] flex-col overflow-y-auto">
      <IntroDesignSparkles />

      <div className="main-landing-inner relative z-[3] box-border flex min-h-[100dvh] flex-1 flex-col items-center justify-center px-6 pt-[calc(env(safe-area-inset-top,0px)+clamp(0.875rem,5vmin,1.75rem))] pb-[calc(env(safe-area-inset-bottom,0px)+clamp(1.125rem,4vmin,2rem))] sm:pt-[calc(env(safe-area-inset-top,0px)+clamp(1rem,3vmin,2.25rem))] sm:pb-[calc(env(safe-area-inset-bottom,0px)+clamp(1rem,3vmin,2.25rem))]">
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
          className={`relative z-0 inline-block max-w-full ${iosStyleHeroShadow ? "main-landing-hero-stack--paint" : ""}`}
          style={
            iosStyleHeroShadow
              ? undefined
              : {
                  filter:
                    "drop-shadow(0 20px 36px rgba(255, 255, 255, 0.55)) drop-shadow(0 8px 22px rgba(255, 255, 255, 0.85))",
                }
          }
        >
          {iosStyleHeroShadow ? (
            <>
              <span
                className="main-landing-hero-shadow-layer main-landing-hero-shadow-layer--diffuse"
                aria-hidden
              />
              <span
                className="main-landing-hero-shadow-layer main-landing-hero-shadow-layer--mid"
                aria-hidden
              />
              <span
                className="main-landing-hero-shadow-layer main-landing-hero-shadow-layer--core"
                aria-hidden
              />
            </>
          ) : null}
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
          className="main-landing-steps relative z-10 mt-3 w-full max-w-sm shrink-0"
          aria-label="이용 방법"
        >
          <ol className="grid grid-cols-3 gap-2 sm:gap-3">
            <li className="flex min-w-0 flex-col items-center rounded-2xl bg-white/90 px-2 py-3.5 text-center shadow-[0_4px_16px_rgba(60,40,120,0.08)] ring-1 ring-[rgba(0,0,0,0.04)] sm:px-3 sm:py-4">
              <span
                className="main-landing-step-num--blue mb-2 text-[2rem] font-extrabold leading-none sm:text-[2.25rem]"
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
                className="main-landing-step-num--coral mb-2 text-[2rem] font-extrabold leading-none sm:text-[2.25rem]"
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
                className="main-landing-step-num--green mb-2 text-[2rem] font-extrabold leading-none sm:text-[2.25rem]"
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

        <div className="main-landing-cta relative z-10 mt-[clamp(1rem,4vmin,2rem)] flex w-full max-w-sm flex-col gap-3">
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
                className={`${landingPrimaryBtn} ${wishlistPrimaryLoading ? landingPrimaryBtnLoadingExtra : ""}`}
                disabled={wishlistPrimaryLoading}
                aria-busy={wishlistPrimaryLoading}
                onClick={() => void handleLoggedInWishlistPrimary()}
              >
                {wishlistPrimaryLoading ? (
                  <span
                    className="main-landing-wish-cta-fill"
                    style={{ transform: `scaleX(${wishlistPrimaryFill})` }}
                    aria-hidden
                  />
                ) : null}
                <span className="relative z-[1] flex items-center justify-center">
                  {wishlistPrimaryLoading
                    ? hasWishBoard
                      ? "이동 중…"
                      : "보드 생성 중…"
                    : hasWishBoard
                      ? "내 위시리스트 꾸미러 가기"
                      : "위시리스트 만들러 가기"}
                </span>
              </button>
              <button
                type="button"
                onClick={goBrowseLoggedIn}
                disabled={wishlistPrimaryLoading}
                className="text-center text-body-sm font-medium text-[#8b8b8b] underline-offset-4 transition-colors hover:text-[#6e6e6e] hover:underline disabled:pointer-events-none disabled:opacity-45"
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
