"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, type ReactElement, type ReactNode } from "react";

import {
  KAKAO_ADFIT_CAROUSEL_HEIGHT,
  KAKAO_ADFIT_CAROUSEL_WIDTH,
} from "@/lib/constants/kakao-adfit";
import {
  pickRandomKboTeamWishlistSlug,
  wishlistPathForTeamSlug,
} from "@/lib/ads/random-kbo-team-wishlist";

/** 메인 랜딩 야구 스포트라이트(`MainLandingSpotlightRotator`)와 동일 이미지·안내 문구 */
const MAIN_BASEBALL_HERO_SRC = "/main/main4.png";

const STEP_NUM_CLASS = {
  blue: "main-landing-step-num--blue mb-1 text-[1.4rem] font-extrabold leading-none",
  coral: "main-landing-step-num--coral mb-1 text-[1.4rem] font-extrabold leading-none",
  green: "main-landing-step-num--green mb-1 text-[1.4rem] font-extrabold leading-none",
} as const;

const BASEBALL_STEPS: readonly {
  tone: keyof typeof STEP_NUM_CLASS;
  content: ReactNode;
}[] = [
  {
    tone: "blue",
    content: (
      <>
        응원하는 야구팀의{" "}
        <strong className="font-bold text-[var(--color-text-primary)]">페이지</strong> 접속
      </>
    ),
  },
  {
    tone: "coral",
    content: (
      <>
        팬들에게{" "}
        <strong className="font-bold text-[var(--color-text-primary)]">링크로 공유</strong>
        하기
      </>
    ),
  },
  {
    tone: "green",
    content: (
      <>
        스티커·댓글로{" "}
        <strong className="font-bold text-[var(--color-text-primary)]">함께 응원</strong>하기
      </>
    ),
  },
];

type KakaoAdFitNoAdBaseballFallbackProps = {
  className?: string;
};

/**
 * AdFit NO-AD 시 — 메인 야구 패널과 동일 히어로·3단계 안내, 탭 시 구단 위시 보드로 랜덤 이동.
 */
export function KakaoAdFitNoAdBaseballFallback({
  className = "",
}: KakaoAdFitNoAdBaseballFallbackProps): ReactElement {
  const router = useRouter();

  const goRandomTeam = useCallback(() => {
    const slug = pickRandomKboTeamWishlistSlug();
    router.push(wishlistPathForTeamSlug(slug));
  }, [router]);

  return (
    <button
      type="button"
      onClick={goRandomTeam}
      className={`pointer-events-auto flex w-full max-w-[320px] flex-col items-center justify-center gap-3 overflow-hidden rounded-2xl px-3 py-4 transition active:scale-[0.99] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7B61FF] ${className}`}
      style={{
        width: KAKAO_ADFIT_CAROUSEL_WIDTH,
        height: KAKAO_ADFIT_CAROUSEL_HEIGHT,
        maxWidth: "100%",
      }}
      aria-label="야구 구단 응원 페이지로 이동 (랜덤)"
    >
      <div className="relative mx-auto h-[min(220px,46%)] w-full max-w-[272px] shrink-0">
        <Image
          src={MAIN_BASEBALL_HERO_SRC}
          alt="야구 구단 응원 페이지"
          fill
          sizes="272px"
          className="object-contain object-center"
          priority
        />
      </div>

      <section
        className="main-landing-steps z-10 w-full max-w-[300px] shrink-0"
        aria-label="구단 응원 페이지 이용 방법"
      >
        <ol className="grid grid-cols-3 gap-2">
          {BASEBALL_STEPS.map((step, stepIdx) => (
            <li
              key={stepIdx}
              className="flex min-w-0 flex-col items-center justify-center rounded-xl bg-white/90 px-2 py-3 text-center shadow-[0_4px_16px_rgba(60,40,120,0.08)] ring-1 ring-[rgba(0,0,0,0.04)]"
            >
              <span className={STEP_NUM_CLASS[step.tone]} aria-hidden>
                {stepIdx + 1}
              </span>
              <p className="text-[10px] font-normal leading-snug break-keep text-[var(--color-text-secondary)]">
                {step.content}
              </p>
            </li>
          ))}
        </ol>
      </section>
    </button>
  );
}
