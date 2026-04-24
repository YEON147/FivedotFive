"use client";

import confetti from "canvas-confetti";
import Image from "next/image";
import type { AnimationEvent, CSSProperties } from "react";
import { useCallback, useEffect, useRef, useState } from "react";

import "@/components/main-intro/intro-gift-motion.css";
import { IntroDesignSparkles } from "@/components/main-intro/IntroDesignSparkles";

/**
 * 전체 흔들림 길이(ms). 늘리면 좌우·몸통 모두 느려짐.
 * `intro-gift-motion.css` 의 `--intro-gift-shake-duration` / `.intro-gift-burst-layer` 기본값과 동기.
 */
export const INTRO_GIFT_SHAKE_MS = 1500;

/** 흔들림 대비 버스트 길이(기존 2.25s 대 0.44s 비율 유지) */
export const INTRO_GIFT_BURST_MS = Math.round((440 / 2250) * INTRO_GIFT_SHAKE_MS);

const INTRO_GIFT_SHAKE_DURATION_CSS = `${INTRO_GIFT_SHAKE_MS / 1000}s` as const;
const INTRO_GIFT_BURST_DURATION_CSS = `${INTRO_GIFT_BURST_MS / 1000}s` as const;

const introGiftMotionImgClassName =
  "mx-auto block h-auto max-h-[min(42vh,340px)] w-full max-w-[340px] object-contain drop-shadow-[0_28px_56px_rgba(70,45,140,0.3)]";

function fireGiftExplosionConfetti() {
  confetti({
    particleCount: 155,
    spread: 92,
    startVelocity: 48,
    origin: { x: 0.5, y: 0.4 },
    ticks: 320,
    gravity: 0.92,
    decay: 0.91,
    colors: ["#7B61FF", "#E9E5FF", "#FFA6C9", "#DAF073", "#FF8C6E", "#ffffff"],
    scalar: 1.12,
    disableForReducedMotion: true,
  });
  confetti({
    particleCount: 110,
    spread: 360,
    startVelocity: 28,
    origin: { x: 0.5, y: 0.4 },
    ticks: 280,
    gravity: 1.05,
    shapes: ["circle"],
    scalar: 0.75,
    colors: ["#AEE9E1", "#7B61FF", "#FFA6C9"],
    disableForReducedMotion: true,
  });
}

function fireRibbonSideConfetti() {
  confetti({
    particleCount: 48,
    angle: 125,
    spread: 58,
    origin: { x: 0.18, y: 0.48 },
    colors: ["#7B61FF", "#E9E5FF"],
    disableForReducedMotion: true,
  });
  confetti({
    particleCount: 48,
    angle: 55,
    spread: 58,
    origin: { x: 0.82, y: 0.48 },
    colors: ["#FFA6C9", "#DAF073"],
    disableForReducedMotion: true,
  });
}

type GiftPhase = "shake" | "burst" | "gone";

/** `/` 진입 전용 — 스파클 + 선물 흔들림·터짐 + 컨페티 */
export function MainIntroExperience() {
  const [reducedMotion, setReducedMotion] = useState(false);
  const [giftPhase, setGiftPhase] = useState<GiftPhase>("shake");

  /** `/` 이탈·언마운트 후에도 타이머가 울리면 컨페티가 다른 라우트에 남지 않도록 */
  const introAliveRef = useRef(true);

  useEffect(() => {
    introAliveRef.current = true;
    return () => {
      introAliveRef.current = false;
      confetti.reset();
    };
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const onChange = () => setReducedMotion(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const onBurstAnimationEnd = useCallback((e: AnimationEvent<HTMLDivElement>) => {
    if (!e.animationName.includes("intro-gift-burst")) return;
    setGiftPhase("gone");
  }, []);

  useEffect(() => {
    if (reducedMotion) return;

    let ribbonId: number | undefined;

    const id = window.setTimeout(() => {
      if (!introAliveRef.current) return;
      setGiftPhase("burst");
      fireGiftExplosionConfetti();
      ribbonId = window.setTimeout(() => {
        if (!introAliveRef.current) return;
        fireRibbonSideConfetti();
      }, 160);
    }, INTRO_GIFT_SHAKE_MS);

    return () => {
      window.clearTimeout(id);
      if (ribbonId !== undefined) window.clearTimeout(ribbonId);
      confetti.reset();
    };
  }, [reducedMotion]);

  useEffect(() => {
    if (!reducedMotion) return;
    const id = window.setTimeout(() => {
      if (!introAliveRef.current) return;
      fireGiftExplosionConfetti();
    }, 520);
    return () => {
      window.clearTimeout(id);
      confetti.reset();
    };
  }, [reducedMotion]);

  const giftMotionImg = (
    <img
      src="/main/main1.png"
      alt=""
      width={340}
      height={340}
      decoding="async"
      fetchPriority="high"
      draggable={false}
      className={introGiftMotionImgClassName}
    />
  );

  if (reducedMotion) {
    return (
      <main
        className="wishlist-page-root fixed inset-0 z-[100] flex flex-col items-center justify-center gap-10 px-6"
        role="status"
        aria-busy="true"
        aria-live="polite"
      >
        <Image
          src="/main/main1.png"
          alt=""
          width={320}
          height={320}
          priority
          className="h-auto max-h-[42vh] w-auto max-w-[min(82vw,300px)] object-contain opacity-95 duration-700 ease-out animate-in fade-in"
        />
        <div className="flex flex-col items-center gap-2 text-center">
          <p className="text-h3 text-[var(--color-primary-main)] drop-shadow-[0_1px_3px_rgba(123,97,255,0.12)]">
            오쩜오
          </p>
          <p className="text-body-sm text-[var(--color-text-secondary)]">
            불러오는 중…
          </p>
        </div>
      </main>
    );
  }

  return (
    <main
      className="wishlist-page-root fixed inset-0 z-[100]"
      role="status"
      aria-busy="true"
      aria-live="polite"
    >
      <IntroDesignSparkles />

      <div
        className="pointer-events-none absolute inset-x-0 top-[min(36dvh,14rem)] z-[3] flex justify-center px-4"
        style={
          {
            "--intro-gift-shake-duration": INTRO_GIFT_SHAKE_DURATION_CSS,
            "--intro-gift-burst-duration": INTRO_GIFT_BURST_DURATION_CSS,
          } as CSSProperties
        }
      >
        {giftPhase !== "gone" ? (
          <div className="w-[min(88vw,340px)]">
            <div
              className={
                giftPhase === "shake" ? "intro-gift-shake-x-layer" : "intro-gift-burst-layer"
              }
              onAnimationEnd={onBurstAnimationEnd}
            >
              {giftPhase === "shake" ? (
                <div className="intro-gift-shake-body-layer">{giftMotionImg}</div>
              ) : (
                giftMotionImg
              )}
            </div>
          </div>
        ) : null}
      </div>

      {giftPhase === "shake" ? (
        <p className="pointer-events-none absolute inset-x-0 bottom-[max(5dvh,calc(var(--safe-area-bottom)+1.5rem))] z-[3] px-6 text-center text-caption text-white drop-shadow-[0_2px_8px_rgba(45,25,90,0.35)]">
          날 위한 선물이 오는 중…
        </p>
      ) : null}
    </main>
  );
}
