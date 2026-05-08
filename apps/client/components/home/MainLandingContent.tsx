"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import "@/components/home/main-landing-wordmark-float.css";
import { CreateBoardOrRollingPaperModal } from "@/components/common/CreateBoardOrRollingPaperModal";
import { IntroDesignSparkles } from "@/components/main-intro/IntroDesignSparkles";
import { resolveLoggedInHomeHref } from "@/features/wishlist/resolve-logged-in-home";
import { adminPublicWishlistHref } from "@/lib/admin-landing";

const landingPrimaryBtn =
  "inline-flex min-h-[3.25rem] w-full cursor-pointer items-center justify-center rounded-[18px] bg-[var(--color-primary-main)] px-7 text-[16px] font-extrabold leading-none text-white transition-[transform,background-color] duration-200 hover:bg-[var(--color-primary-pressed)] active:scale-[0.99] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary-main)] disabled:pointer-events-none disabled:opacity-60";

const landingMutedLink =
  "text-body-sm font-medium text-[#6e6e6e] underline-offset-4 transition-opacity hover:underline";

type MainLandingContentProps = {
  loggedIn: boolean;
};

/**
 * 비로그인·로그인 동일 랜딩(워드마크~3단계~CTA).
 * 로그인 시 「내 위시리스트 보러가기」에서만 boards 목록 확인 후 이동 또는 생성 모달.
 */
export function MainLandingContent({ loggedIn }: MainLandingContentProps) {
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);
  const [entryNavPending, setEntryNavPending] = useState(false);

  const handleGoToMyBoards = async () => {
    setEntryNavPending(true);
    try {
      const href = await resolveLoggedInHomeHref();
      if (href && href !== "/wishlist") {
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
            className="main-landing-wordmark-img h-auto w-[min(72vw,300px)] max-w-full object-contain drop-shadow-[0_10px_28px_rgba(123,97,255,0.2)]"
          />
        </div>

        <p className="mb-3 max-w-[min(22rem,92vw)] text-center text-[16px] font-light leading-relaxed tracking-tight text-[var(--color-text-primary)] drop-shadow-[0_1px_0_rgba(255,255,255,0.9)]">
          취향과 설렘이 담긴 작은 이야기
        </p>

        <div
          className="inline-block max-w-full"
          style={{
            filter:
              "drop-shadow(0 22px 40px rgba(123, 97, 255, 0.22)) drop-shadow(0 10px 24px rgba(60, 45, 110, 0.1))",
          }}
        >
          <Image
            src="/main/main2.png"
            alt="오쩜오"
            width={900}
            height={900}
            priority
            sizes="(max-width: 768px) 92vw, 720px"
            className="h-auto max-h-[min(58dvh,92vw)] w-full max-w-[min(92vw,720px)] object-contain"
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
                위시리스트 구경가기
              </button>
              <div className="text-center">
                <Link href="/login" className={landingMutedLink}>
                  로그인
                </Link>
                <span className="mx-2 text-body-sm text-[#c4c4c4]" aria-hidden>
                  ·
                </span>
                <Link href="/signup" className={landingMutedLink}>
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
