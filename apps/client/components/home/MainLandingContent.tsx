"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useLayoutEffect, useState } from "react";

import { CreateBoardOrRollingPaperModal } from "@/components/common/CreateBoardOrRollingPaperModal";
import { MainLandingSpotlightRotator } from "@/components/home/MainLandingSpotlightRotator";
import { IntroDesignSparkles } from "@/components/main-intro/IntroDesignSparkles";
import { resolveLoggedInHomeHref } from "@/features/wishlist/resolve-logged-in-home";
import { trackSignupButtonClick } from "@/lib/analytics/conversion";
import { touchTrafficAttribution, trackWishlistCtaClick } from "@/lib/analytics/wishlistCta";
import { adminPublicWishlistHref } from "@/lib/admin-landing";
import { isAppleTouchDevice } from "@/lib/device/is-apple-touch";

const landingPrimaryBtn =
  "inline-flex min-h-[3.25rem] w-full cursor-pointer items-center justify-center rounded-[18px] bg-[var(--color-primary-main)] px-7 text-[16px] font-extrabold leading-none text-white transition-[transform,background-color] duration-200 hover:bg-[var(--color-primary-pressed)] active:scale-[0.99] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary-main)] disabled:pointer-events-none disabled:opacity-60";

const landingMutedLink =
  "text-body-sm font-medium text-[#6e6e6e] underline-offset-4 transition-opacity hover:underline";

type MainLandingContentProps = {
  loggedIn: boolean;
};

/**
 * 비로그인·로그인 동일 랜딩(워드마크~3단계~CTA).
 * 로그인 시 「내 위시리스트 보러가기」에서 boards 목록 확인 후 이동하거나, 없으면 생성 모달을 띄웁니다.
 */
export function MainLandingContent({ loggedIn }: MainLandingContentProps) {
  const router = useRouter();
  const [entryNavPending, setEntryNavPending] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  /** Apple 터치 WebKit: filter drop-shadow가 사각으로 잘림 → 레이어 그림자(워드마크·중앙 히어로) */
  const [appleTouchPaintShadow, setAppleTouchPaintShadow] = useState(false);

  useEffect(() => {
    touchTrafficAttribution();
  }, []);

  useLayoutEffect(() => {
    setAppleTouchPaintShadow(isAppleTouchDevice());
  }, []);

  const handleGoToMyBoards = async () => {
    trackWishlistCtaClick({
      cta_id: "landing_logged_wishlist_hub",
      wishlist_entry: "decorate",
    });

    setEntryNavPending(true);
    try {
      const href = await resolveLoggedInHomeHref();
      if (href) {
        router.push(href);
        return;
      }
      setCreateOpen(true);
    } catch {
      setCreateOpen(true);
    } finally {
      setEntryNavPending(false);
    }
  };

  return (
    <main className="wishlist-page-root main-landing-page-main relative box-border flex min-h-[100dvh] w-full min-w-0 max-w-[100vw] flex-col overflow-x-hidden overflow-y-auto lg:h-full lg:min-h-0 lg:max-h-full">
      <IntroDesignSparkles />

      <div className="main-landing-inner relative z-[3] box-border flex w-full min-w-0 max-w-full min-h-[100dvh] flex-1 flex-col items-center justify-center pl-[max(1rem,env(safe-area-inset-left,0px))] pr-[max(1rem,env(safe-area-inset-right,0px))] pt-[calc(env(safe-area-inset-top,0px)+clamp(1.25rem,6vmin,2.25rem))] pb-[calc(env(safe-area-inset-bottom,0px)+clamp(1.125rem,4vmin,2rem))] sm:px-6 sm:pt-[calc(env(safe-area-inset-top,0px)+clamp(1.125rem,5vmin,2.25rem))] sm:pb-[calc(env(safe-area-inset-bottom,0px)+clamp(1rem,3vmin,2.25rem))] lg:min-h-0 lg:h-full lg:max-h-full lg:flex-1 lg:justify-center lg:py-3 lg:pt-[calc(env(safe-area-inset-top,0px)+0.75rem)]">
        <div className="main-landing-wordmark-float mb-3 flex w-full justify-center sm:mb-4 lg:mb-2">
          <Image
            src="/main/main3.png"
            alt=""
            width={360}
            height={140}
            priority
            sizes="(max-width: 768px) 72vw, 300px"
            className={`main-landing-wordmark-img h-auto w-[min(72vw,300px)] max-w-full object-contain lg:w-[min(36vw,300px)] ${
              appleTouchPaintShadow
                ? "shadow-[0_10px_28px_rgba(123,97,255,0.2)]"
                : "drop-shadow-[0_10px_28px_rgba(123,97,255,0.2)]"
            }`}
          />
        </div>

        <p className="mb-2 max-w-[min(22rem,92vw)] text-center text-[16px] font-light leading-relaxed tracking-tight text-[#6e6e6e] drop-shadow-[0_1px_0_rgba(255,255,255,0.9)] sm:mb-3 lg:mb-2 lg:text-[15px]">
          취향과 설렘이 담긴 작은 이야기
        </p>

        <MainLandingSpotlightRotator appleTouchPaintShadow={appleTouchPaintShadow} />

        <div className="main-landing-cta relative z-10 mt-[clamp(0.75rem,3vmin,1.5rem)] flex w-full max-w-sm flex-col gap-2 sm:gap-3 lg:mt-3 lg:gap-2">
          {loggedIn ? (
            <>
              <button
                type="button"
                className={landingPrimaryBtn}
                disabled={entryNavPending}
                onClick={() => void handleGoToMyBoards()}
              >
                {entryNavPending ? "불러오는 중…" : "내 위시리스트 보러가기"}
              </button>
              <button
                type="button"
                onClick={() => router.push(adminPublicWishlistHref())}
                className="text-center text-body-sm font-medium text-[#8b8b8b] underline-offset-4 transition-colors hover:text-[#6e6e6e] hover:underline"
              >
                구경가기
              </button>
              <CreateBoardOrRollingPaperModal
                open={createOpen}
                onClose={() => setCreateOpen(false)}
              />
            </>
          ) : (
            <>
              <button
                type="button"
                className={landingPrimaryBtn}
                onClick={() => router.push(adminPublicWishlistHref())}
              >
                오쩜오 둘러보기
              </button>
              <div className="text-center">
                <Link href="/login" className={landingMutedLink}>
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
