"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

/** `app/rolling-paper/[slug]/page.tsx` 와 동일 버전 — `src`는 `/rollingpaper/...` 고정, 캐시 무효화는 `key`로만 */
const ROLLING_BUBBLE_ASSET_VERSION =
  process.env.NEXT_PUBLIC_ROLLING_ASSET_VERSION?.trim() || "1";

const ROLLING_BUBBLE_IMAGE_SRC = "/rollingpaper/bubble2.png";

const bubbleImageDevProps =
  process.env.NODE_ENV === "development"
    ? ({ unoptimized: true } as const)
    : ({} as const);

type BubbleKind = "intro" | "visitor";

type BubbleState = {
  id: string;
  kind: BubbleKind;
  xPercent: number;
  popping: boolean;
  /** CSS 애니메이션 길이(초) */
  durationSec: number;
};

const INTRO_SESSION_KEY = "rp-bubble-intro-v2";

function createId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * 롤링페이퍼 보드 위 물방울 — 첫 방문 시 메시지 개수만큼 올라오고,
 * 이후 주기적으로 "+1" 방문 물방울이 생깁니다. 탭하면 터집니다.
 */
export function RollingPaperBubbleLayer({
  slug,
  messageCount,
  paused,
}: {
  slug: string;
  messageCount: number;
  paused: boolean;
}) {
  const [bubbles, setBubbles] = useState<BubbleState[]>([]);
  const introDoneRef = useRef(false);
  /** 브라우저 `window.setTimeout` 은 `number` — `@types/node` 의 `setTimeout`(`Timeout`) 과 구분 */
  const visitorTimeoutRef = useRef<number | null>(null);

  /** 첫 세션 방문: 작성된 메시지 수만큼 물방울 연속 생성 */
  useEffect(() => {
    if (paused || !slug.trim() || messageCount <= 0) return;
    if (introDoneRef.current) return;
    let skip = false;
    try {
      skip =
        typeof sessionStorage !== "undefined" &&
        sessionStorage.getItem(`${INTRO_SESSION_KEY}:${slug}`) === "1";
    } catch {
      skip = false;
    }
    if (skip) {
      introDoneRef.current = true;
      return;
    }
    introDoneRef.current = true;
    try {
      sessionStorage.setItem(`${INTRO_SESSION_KEY}:${slug}`, "1");
    } catch {
      /* noop */
    }

    const staggerMs = 160;
    const timers: number[] = [];
    for (let i = 0; i < messageCount; i++) {
      timers.push(
        window.setTimeout(() => {
          setBubbles((prev) => [
            ...prev,
            {
              id: createId("intro"),
              kind: "intro",
              xPercent: 6 + ((i * 15 + Math.random() * 28) % 88),
              popping: false,
              durationSec: 4.8 + Math.random() * 0.8,
            },
          ]);
        }, i * staggerMs),
      );
    }
    return () => {
      for (const t of timers) window.clearTimeout(t);
    };
  }, [paused, slug, messageCount]);

  /** 방문자 "+1" 물방울 — 일정 간격으로 생성 (다른 탭에서 온 것처럼 보이게 랜덤 지연) */
  useEffect(() => {
    if (paused) return;

    const schedule = () => {
      const delay = 10_000 + Math.random() * 12_000;
      visitorTimeoutRef.current = window.setTimeout(() => {
        visitorTimeoutRef.current = null;
        if (document.visibilityState !== "visible") {
          schedule();
          return;
        }
        setBubbles((prev) => {
          const visitors = prev.filter((b) => b.kind === "visitor").length;
          if (visitors >= 8) return prev;
          return [
            ...prev,
            {
              id: createId("visit"),
              kind: "visitor",
              xPercent: 5 + Math.random() * 90,
              popping: false,
              durationSec: 11 + Math.random() * 6,
            },
          ];
        });
        schedule();
      }, delay);
    };

    schedule();
    return () => {
      if (visitorTimeoutRef.current !== null) {
        window.clearTimeout(visitorTimeoutRef.current);
        visitorTimeoutRef.current = null;
      }
    };
  }, [paused]);

  /** 창 포커스 시 가끔 추가 물방울 */
  useEffect(() => {
    if (paused) return;
    let lastSpawn = 0;
    const onFocus = () => {
      const now = Date.now();
      if (now - lastSpawn < 25_000) return;
      if (Math.random() > 0.35) return;
      lastSpawn = now;
      setBubbles((prev) => [
        ...prev,
        {
          id: createId("focus"),
          kind: "visitor",
          xPercent: 5 + Math.random() * 90,
          popping: false,
          durationSec: 10 + Math.random() * 5,
        },
      ]);
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [paused]);

  const popBubble = useCallback((id: string) => {
    setBubbles((prev) =>
      prev.map((b) => (b.id === id ? { ...b, popping: true } : b)),
    );
    window.setTimeout(() => {
      setBubbles((prev) => prev.filter((b) => b.id !== id));
    }, 320);
  }, []);

  const removeAfterAnim = useCallback((id: string) => {
    setBubbles((prev) => prev.filter((b) => b.id !== id));
  }, []);

  return (
    <>
      <style>{`
        @keyframes rpBubbleRise {
          0% {
            transform: translate(-50%, 0) translateY(110%);
            opacity: 0;
          }
          7% {
            opacity: 1;
          }
          92% {
            opacity: 1;
          }
          100% {
            transform: translate(-50%, 0) translateY(-360%);
            opacity: 0;
          }
        }
        .rp-bubble-rise {
          animation: rpBubbleRise var(--rp-dur, 13s) linear forwards;
        }
      `}</style>
      <div className="pointer-events-none absolute inset-0 z-[21] overflow-hidden rounded-[18px]">
        {bubbles.map((b) => (
          <BubbleItem
            key={b.id}
            bubble={b}
            onPop={() => popBubble(b.id)}
            onAnimationEnd={() => removeAfterAnim(b.id)}
          />
        ))}
      </div>
    </>
  );
}

function BubbleItem({
  bubble,
  onPop,
  onAnimationEnd,
}: {
  bubble: BubbleState;
  onPop: () => void;
  onAnimationEnd: () => void;
}) {
  return (
    <button
      type="button"
      className={`rp-bubble-rise pointer-events-auto absolute bottom-0 z-[22] flex h-12 w-12 -translate-x-1/2 touch-manipulation items-center justify-center overflow-hidden rounded-full bg-transparent p-0 shadow-none outline-none ring-0 transition-[transform,opacity] ${
        bubble.popping
          ? "scale-150 opacity-0 duration-300 ease-out"
          : "hover:scale-[1.06] active:scale-95"
      }`}
      style={{
        left: `${bubble.xPercent}%`,
        bottom: "1%",
        ["--rp-dur" as string]: `${bubble.durationSec}s`,
      }}
      onAnimationEnd={(e) => {
        if (bubble.popping) return;
        if (e.animationName !== "rpBubbleRise") return;
        onAnimationEnd();
      }}
      onClick={(e) => {
        e.stopPropagation();
        onPop();
      }}
      aria-label="물방울 터뜨리기"
    >
      <span className="relative block h-full w-full shrink-0 overflow-hidden rounded-full">
        <Image
          key={`${bubble.id}-bubble-${ROLLING_BUBBLE_ASSET_VERSION}`}
          src={ROLLING_BUBBLE_IMAGE_SRC}
          alt=""
          fill
          className="pointer-events-none origin-center scale-[1.14] object-contain"
          sizes="48px"
          {...bubbleImageDevProps}
        />
        <span
          className="pointer-events-none absolute inset-0 z-[1] flex items-center justify-center text-[11px] font-extrabold tracking-tight text-slate-900 drop-shadow-[0_0.5px_0.5px_rgba(255,255,255,0.55)] sm:text-[12px]"
          aria-hidden
        >
          +1
        </span>
      </span>
    </button>
  );
}
