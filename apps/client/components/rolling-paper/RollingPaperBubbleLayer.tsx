"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

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
  /** 중심 x 위치 (%) */
  xPercent: number;
  /** 버블 크기 (px) */
  sizePx: number;
  /** 좌우 흔들림 최대 폭 (px) */
  swayPx: number;
  /** 흔들림 주기 (초) */
  swayDur: number;
  /** 상승 애니메이션 길이 (초) */
  durationSec: number;
  /** CSS animation-delay (초) — JS 타이머 대신 CSS로 처리해 race condition 방지 */
  delayBeforeSec: number;
  /** 버블 안에 표시할 텍스트 — intro: 댓글 번호, visitor: "+1" */
  label: string;
  /** 시작 높이 오프셋 — 방울이 하단 같은 선에서 출발하지 않도록 (%) */
  startBottomPct: number;
  popping: boolean;
};

/** intro가 아직 실행 안 된 상태를 의미하는 sentinel */
const INTRO_PENDING = -1;

function rnd(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function createId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/** Fisher-Yates 셔플 — 1~n 배열을 무작위 순서로 반환 */
function shuffledNumbers(n: number): number[] {
  const arr = Array.from({ length: n }, (_, i) => i + 1);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * 롤링페이퍼 보드 위 물방울.
 *
 * - 첫 방문 시 `messageCount`개 물방울이 0~200ms 안에 모두 등장
 * - 레인 분배로 겹침 최소화, 크기·속도·흔들림은 개별 랜덤
 * - 탭하면 터짐
 * - 이후 주기적으로 방문자 "+1" 물방울 추가 생성
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
  /**
   * INTRO_PENDING(-1): 아직 미실행.
   * 양수: 최초 실행 시 사용한 messageCount.
   * unmount 시 자동 초기화됨.
   */
  const introCountRef = useRef<number>(INTRO_PENDING);
  /**
   * intro 이후 마지막으로 확인한 commentCount.
   * 이 값보다 커지면 신규 댓글이 달린 것으로 판단.
   */
  const baselineCountRef = useRef<number>(0);


  /**
   * 인트로 — 최초 1회만 실행.
   * messageCount가 0→N으로 바뀌어도 intro는 단 한 번만 동작하며
   * 이후 증가분은 아래 신규 댓글 effect가 처리.
   */
  useEffect(() => {
    if (paused || !slug.trim() || messageCount <= 0) return;
    // 이미 intro를 실행했으면 skip
    if (introCountRef.current !== INTRO_PENDING) return;
    introCountRef.current = messageCount;
    baselineCountRef.current = messageCount;

    /**
     * 레인(lane) 기반 x 분배:
     *   - 최대 10레인으로 화면 폭 90%를 균등 분할
     *   - 댓글이 10개 초과면 레인을 순환하되 크기·시작 높이를 달리해 겹침 완화
     */
    const laneCount = Math.min(messageCount, 10);
    const laneWidth = 90 / laneCount;
    const labels = shuffledNumbers(messageCount);

    const newBubbles: BubbleState[] = [];
    for (let i = 0; i < messageCount; i++) {
      const lane = i % laneCount;
      const laneCenter = 5 + lane * laneWidth + laneWidth / 2;
      const xPercent = laneCenter + rnd(-laneWidth * 0.22, laneWidth * 0.22);
      newBubbles.push({
        id: createId("intro"),
        kind: "intro",
        xPercent,
        sizePx: rnd(36, 54),
        swayPx: rnd(10, 26),
        swayDur: rnd(1.8, 3.4),
        durationSec: rnd(9.0, 13.0),
        delayBeforeSec: rnd(0, 0.2),
        startBottomPct: rnd(0, 10),
        label: String(labels[i]),
        popping: false,
      });
    }
    setBubbles((prev) => [...prev, ...newBubbles]);
  }, [paused, slug, messageCount]);

  /**
   * 신규 댓글 감지 — intro 완료 이후 messageCount 증가분마다 "+1" 방울 생성.
   * 예) 진입 시 9개 → 새 댓글 1개 작성 → messageCount=10 → "+1" 방울 1개
   */
  useEffect(() => {
    // intro가 아직 실행되지 않았으면 무시
    if (introCountRef.current === INTRO_PENDING) return;
    if (messageCount <= baselineCountRef.current) {
      // 감소(삭제) 또는 동일하면 기준만 갱신
      if (messageCount > 0) baselineCountRef.current = messageCount;
      return;
    }
    const addedCount = messageCount - baselineCountRef.current;
    baselineCountRef.current = messageCount;

    const newBubbles: BubbleState[] = Array.from({ length: addedCount }, () => ({
      id: createId("new"),
      kind: "visitor" as BubbleKind,
      xPercent: 5 + Math.random() * 90,
      sizePx: rnd(38, 54),
      swayPx: rnd(10, 24),
      swayDur: rnd(1.8, 3.2),
      durationSec: rnd(9.0, 12.0),
      delayBeforeSec: rnd(0, 0.4),
      startBottomPct: rnd(0, 6),
      label: "+1",
      popping: false,
    }));
    setBubbles((prev) => [...prev, ...newBubbles]);
  }, [messageCount]);


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
        /*
         * rpBubbleRise: 수직 상승 + 투명도
         * - translateY(-1500%) = 약 sizePx × 15 = 최대 810px 이동 → 화면 전체 커버
         */
        @keyframes rpBubbleRise {
          0%   { transform: translateY(0);        opacity: 0; }
          7%   { opacity: 1; }
          88%  { opacity: 1; }
          100% { transform: translateY(-1500%);   opacity: 0; }
        }
        /*
         * rpBubbleSway: 좌우 흔들림 (비눗방울 특유의 부유 효과)
         * --rp-sway 를 통해 버블마다 폭을 다르게 설정
         */
        @keyframes rpBubbleSway {
          0%   { transform: translateX(0); }
          25%  { transform: translateX(var(--rp-sway, 14px)); }
          75%  { transform: translateX(calc(-1 * var(--rp-sway, 14px))); }
          100% { transform: translateX(0); }
        }
        .rp-bubble-rise {
          animation: rpBubbleRise var(--rp-dur, 6.5s) ease-in-out var(--rp-delay, 0s) forwards;
          /* delay 동안 opacity:0 유지 (animation-fill-mode: backwards) */
          opacity: 0;
        }
        .rp-bubble-sway {
          animation: rpBubbleSway var(--rp-sway-dur, 2.5s) ease-in-out infinite;
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
  /**
   * 구조:
   *   outer div  — rpBubbleRise (수직 이동 + 투명도) + 위치 지정
   *   inner button — rpBubbleSway (좌우 흔들림) + 팝 인터랙션
   *
   * transform 을 두 요소에 분리함으로써 수직 상승과 좌우 흔들림이 자연스럽게 합성됨.
   */
  return (
    <div
      className="rp-bubble-rise pointer-events-none absolute"
      style={{
        /* 중심 정렬: left = center - half-width */
        left: `calc(${bubble.xPercent}% - ${bubble.sizePx / 2}px)`,
        bottom: `${bubble.startBottomPct}%`,
        width: `${bubble.sizePx}px`,
        height: `${bubble.sizePx}px`,
        ["--rp-dur" as string]: `${bubble.durationSec}s`,
        ["--rp-delay" as string]: `${bubble.delayBeforeSec}s`,
      }}
      onAnimationEnd={(e) => {
        if (e.animationName !== "rpBubbleRise") return;
        onAnimationEnd();
      }}
    >
      <button
        type="button"
        className={`rp-bubble-sway pointer-events-auto h-full w-full touch-manipulation rounded-full bg-transparent p-0 shadow-none outline-none ring-0 transition-[transform,opacity] ${
          bubble.popping
            ? "scale-[1.8] opacity-0 duration-200 ease-out"
            : "hover:scale-[1.08] active:scale-90"
        }`}
        style={{
          ["--rp-sway" as string]: `${bubble.swayPx}px`,
          ["--rp-sway-dur" as string]: `${bubble.swayDur}s`,
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
            sizes="56px"
            {...bubbleImageDevProps}
          />
          <span
            className="pointer-events-none absolute inset-0 z-[1] flex items-center justify-center text-[11px] font-extrabold tracking-tight text-slate-900 drop-shadow-[0_0.5px_0.5px_rgba(255,255,255,0.55)] sm:text-[12px]"
            aria-hidden
          >
            {bubble.label}
          </span>
        </span>
      </button>
    </div>
  );
}
