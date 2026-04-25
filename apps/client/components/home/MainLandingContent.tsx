"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

import "@/components/home/main-landing-wordmark-float.css";
import { IntroDesignSparkles } from "@/components/main-intro/IntroDesignSparkles";

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

  const goBrowse = () => {
    router.push(`/wishlist/${encodeURIComponent(adminPublicBoardSlug)}`);
  };

  return (
    <main className="wishlist-page-root relative flex min-h-[100dvh] flex-col overflow-y-auto">
      <IntroDesignSparkles />

      <div className="relative z-[3] flex min-h-0 flex-1 flex-col items-center justify-center px-6 py-10 pb-[max(1.5rem,env(safe-area-bottom))]">
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

        <div className="mt-8 flex w-full max-w-sm flex-col gap-3">
          {loggedIn && !loggedInCtaReady ? (
            <div
              className="inline-flex min-h-[3.25rem] w-full items-center justify-center rounded-[18px] bg-slate-100 px-7 text-[15px] font-medium text-[#8b8b8b]"
              aria-busy
            >
              불러오는 중…
            </div>
          ) : loggedIn ? (
            <>
              <button type="button" className={landingPrimaryBtn} onClick={() => router.push("/wishlist")}>
                {hasWishBoard ? "내 위시리스트 꾸미러 가기" : "위시리스트 만들러 가기"}
              </button>
              <button
                type="button"
                onClick={goBrowse}
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
                onClick={() =>
                  router.push(`/wishlist/${encodeURIComponent(adminPublicBoardSlug)}`)
                }
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
