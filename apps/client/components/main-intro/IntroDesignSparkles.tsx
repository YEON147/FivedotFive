"use client";

import type { CSSProperties } from "react";

import "@/components/main-intro/intro-design-sparkles.css";

type Star = {
  top: string;
  left: string;
  size: number;
  drift: string;
  twinkle: string;
  delay: string;
};

const STARS: Star[] = [
  { top: "16%", left: "24%", size: 26, drift: "7.5s", twinkle: "3.4s", delay: "0s" },
  { top: "22%", left: "58%", size: 22, drift: "8.2s", twinkle: "2.8s", delay: "-0.6s" },
  { top: "34%", left: "38%", size: 30, drift: "7s", twinkle: "3.8s", delay: "-1.2s" },
  { top: "28%", left: "82%", size: 20, drift: "9s", twinkle: "2.6s", delay: "-2s" },
  { top: "48%", left: "22%", size: 24, drift: "8s", twinkle: "3.2s", delay: "-0.3s" },
  { top: "44%", left: "68%", size: 28, drift: "7.2s", twinkle: "3.6s", delay: "-1.5s" },
  { top: "62%", left: "14%", size: 22, drift: "8.8s", twinkle: "2.9s", delay: "-2.2s" },
  { top: "58%", left: "48%", size: 25, drift: "7.8s", twinkle: "3.1s", delay: "-0.8s" },
  { top: "68%", left: "88%", size: 20, drift: "9.2s", twinkle: "2.7s", delay: "-1s" },
  { top: "18%", left: "44%", size: 18, drift: "8.5s", twinkle: "2.5s", delay: "-2.5s" },
];

function SparkleStar({
  size,
  gradientId,
  twinkleDur,
  delay,
}: {
  size: number;
  gradientId: string;
  twinkleDur: string;
  delay: string;
}) {
  return (
    <span
      className="intro-sparkle-star-twinkle inline-block"
      style={
        {
          ["--intro-sparkle-twinkle" as string]: twinkleDur,
          animationDelay: delay,
        } as CSSProperties
      }
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="block"
        aria-hidden
      >
        <defs>
          <linearGradient id={gradientId} x1="4" y1="4" x2="20" y2="20" gradientUnits="userSpaceOnUse">
            <stop stopColor="#ffffff" />
            <stop offset="0.5" stopColor="#E9E5FF" />
            <stop offset="1" stopColor="#7B61FF" />
          </linearGradient>
        </defs>
        <path
          d="M12 2l1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8L12 2z"
          fill={`url(#${gradientId})`}
        />
      </svg>
    </span>
  );
}

/**
 * CSS 별 장식만 (보케 없음).
 */
export function IntroDesignSparkles() {
  return (
    <div className="pointer-events-none absolute inset-0 z-[2] overflow-hidden" aria-hidden>
      {STARS.map((st, i) => (
        <div
          key={`star-${i}`}
          className="intro-sparkle-star-wrap absolute -translate-x-1/2 -translate-y-1/2"
          style={
            {
              top: st.top,
              left: st.left,
              ["--intro-sparkle-drift" as string]: st.drift,
              animationDelay: st.delay,
            } as CSSProperties
          }
        >
          <SparkleStar
            size={st.size}
            gradientId={`intro-sparkle-star-grad-${i}`}
            twinkleDur={st.twinkle}
            delay={st.delay}
          />
        </div>
      ))}
    </div>
  );
}
