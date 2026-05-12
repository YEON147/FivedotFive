"use client";

import Image from "next/image";
import { useEffect, useState, type ReactNode } from "react";

/** 기본(위시) 화면 노출 후 다음 패널로 넘어가는 간격 — 2.2초 */
export const MAIN_LANDING_SPOTLIGHT_INTERVAL_MS = 2_200;

type StepTone = "blue" | "coral" | "green";

type SpotlightStep = {
  tone: StepTone;
  content: ReactNode;
};

type SpotlightPanel = {
  id: string;
  hero: {
    src: string;
    alt: string;
    width: number;
    height: number;
    sizes: string;
  };
  stepsAriaLabel: string;
  steps: readonly [SpotlightStep, SpotlightStep, SpotlightStep];
};

const STEP_NUM_CLASS: Record<StepTone, string> = {
  blue: "main-landing-step-num--blue mb-2 text-[2rem] font-extrabold leading-none sm:text-[2.25rem]",
  coral: "main-landing-step-num--coral mb-2 text-[2rem] font-extrabold leading-none sm:text-[2.25rem]",
  green: "main-landing-step-num--green mb-2 text-[2rem] font-extrabold leading-none sm:text-[2.25rem]",
};

const PANELS: readonly SpotlightPanel[] = [
  {
    id: "wishlist",
    hero: {
      src: "/main/main2.png",
      alt: "오쩜오 위시리스트",
      width: 900,
      height: 900,
      sizes: "(max-width: 768px) 92vw, 720px",
    },
    stepsAriaLabel: "위시리스트 이용 방법",
    steps: [
      {
        tone: "blue",
        content: (
          <>
            내가 원하는 것{" "}
            <strong className="font-bold text-[var(--color-text-primary)]">위시리스트</strong>로 만들기
          </>
        ),
      },
      {
        tone: "coral",
        content: (
          <>
            친구·가족에게{" "}
            <strong className="font-bold text-[var(--color-text-primary)]">링크 공유</strong>하기
          </>
        ),
      },
      {
        tone: "green",
        content: (
          <>
            스티커·댓글 주고 받으며{" "}
            <strong className="font-bold text-[var(--color-text-primary)]">소통하기</strong>
          </>
        ),
      },
    ],
  },
  {
    id: "baseball",
    hero: {
      src: "/main/main4.png",
      alt: "야구 구단 응원 페이지",
      width: 900,
      height: 900,
      sizes: "(max-width: 768px) 92vw, 720px",
    },
    stepsAriaLabel: "구단 응원 페이지 이용 방법",
    steps: [
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
            <strong className="font-bold text-[var(--color-text-primary)]">링크로 공유</strong>하기
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
    ],
  },
  {
    id: "rolling-paper",
    hero: {
      src: "/main/main5.png",
      alt: "롤링페이퍼",
      width: 900,
      height: 900,
      sizes: "(max-width: 768px) 92vw, 720px",
    },
    stepsAriaLabel: "롤링페이퍼 이용 방법",
    steps: [
      {
        tone: "blue",
        content: (
          <>
            고마운 사람을 위한{" "}
            <strong className="font-bold text-[var(--color-text-primary)]">롤링페이퍼</strong>
          </>
        ),
      },
      {
        tone: "coral",
        content: (
          <>
            지인에게{" "}
            <strong className="font-bold text-[var(--color-text-primary)]">링크로 초대</strong>하기
          </>
        ),
      },
      {
        tone: "green",
        content: (
          <>
            고마움을 담은{" "}
            <strong className="font-bold text-[var(--color-text-primary)]">편지</strong> 남기기
          </>
        ),
      },
    ],
  },
] as const;

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return reduced;
}

type MainLandingSpotlightRotatorProps = {
  appleTouchPaintShadow: boolean;
};

export function MainLandingSpotlightRotator({ appleTouchPaintShadow }: MainLandingSpotlightRotatorProps) {
  const [index, setIndex] = useState(0);
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (reducedMotion || PANELS.length <= 1) return;

    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % PANELS.length);
    }, MAIN_LANDING_SPOTLIGHT_INTERVAL_MS);

    return () => window.clearInterval(id);
  }, [reducedMotion]);

  const heroShellClass =
    appleTouchPaintShadow
      ? "main-landing-hero-stack--paint relative flex h-full min-h-0 w-full max-w-full items-center justify-center"
      : "flex h-full min-h-0 w-full max-w-full items-center justify-center";

  return (
    <div className="relative z-[1] w-full min-w-0 max-w-full">
      {PANELS.map((panel, i) => {
        const active = i === index;
        return (
          <div
            key={panel.id}
            className={`flex w-full min-w-0 max-w-full flex-col items-center transition-opacity duration-500 ease-out motion-reduce:transition-none ${
              active
                ? "relative z-[1] opacity-100"
                : "pointer-events-none absolute left-0 right-0 top-0 z-0 opacity-0"
            }`}
            aria-hidden={!active}
          >
            <div className="main-landing-spotlight-hero-frame">
              <div className={heroShellClass}>
                {appleTouchPaintShadow ? (
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
                  src={panel.hero.src}
                  alt={panel.hero.alt}
                  width={panel.hero.width}
                  height={panel.hero.height}
                  priority={i === 0}
                  sizes={panel.hero.sizes}
                  className="main-landing-hero-img main-landing-spotlight-hero-img"
                  style={{ width: "auto", height: "auto", maxWidth: "100%", maxHeight: "100%" }}
                />
              </div>
            </div>

            <section
              className="main-landing-steps relative z-10 mt-3 w-full max-w-sm shrink-0"
              aria-label={panel.stepsAriaLabel}
            >
              <ol className="grid grid-cols-3 gap-2 sm:gap-3">
                {panel.steps.map((step, stepIdx) => (
                  <li
                    key={`${panel.id}-step-${stepIdx}`}
                    className="flex min-w-0 flex-col items-center rounded-2xl bg-white/90 px-2 py-3.5 text-center shadow-[0_4px_16px_rgba(60,40,120,0.08)] ring-1 ring-[rgba(0,0,0,0.04)] sm:px-3 sm:py-4"
                  >
                    <span className={STEP_NUM_CLASS[step.tone]} aria-hidden>
                      {stepIdx + 1}
                    </span>
                    <p className="text-[12px] font-normal leading-snug break-keep text-[var(--color-text-secondary)] sm:text-[14px] sm:leading-relaxed">
                      {step.content}
                    </p>
                  </li>
                ))}
              </ol>
            </section>

            {!reducedMotion && PANELS.length > 1 ? (
              <div className="mt-3 flex h-4 shrink-0 justify-center gap-1.5" aria-hidden>
                {PANELS.map((p, dotIdx) => (
                  <span
                    key={p.id}
                    className={`h-1.5 rounded-full transition-[width,background-color] duration-300 ${
                      dotIdx === index
                        ? "w-5 bg-[var(--color-primary-main)]"
                        : "w-1.5 bg-[var(--color-border)]"
                    }`}
                  />
                ))}
              </div>
            ) : (
              <div className="mt-3 h-4 shrink-0" aria-hidden />
            )}
          </div>
        );
      })}
    </div>
  );
}
