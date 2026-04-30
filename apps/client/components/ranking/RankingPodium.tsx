import Image from "next/image";

import type { RankEntry, RankingTabId } from "./types";

export type PodiumEntry = RankEntry & { valueLabel: string };

/** 학교명·숫자만 기울기 — 왕관에는 적용하지 않음 */
const PODIUM_TEXT_SLANT = "origin-bottom -skew-x-[4deg]";

function PodiumCell({
  entry,
  position,
  rank,
}: {
  entry: PodiumEntry | undefined;
  position: "left" | "center" | "right";
  /** 1→3 순으로 fade-in 지연 */
  rank: 1 | 2 | 3;
}) {
  const widthClass = position === "center" ? "w-[34%]" : "w-[30%]";
  /** 1위 최상단 → 2위(조금 아래) → 3위(더 아래) */
  const rankStepClass =
    position === "center" ? "mt-1" : position === "left" ? "mt-14 ml-2" : "mt-22";

  const fadeRankClass = entry
    ? rank === 1
      ? "ranking-podium-cell-enter ranking-podium-cell-enter--r1"
      : rank === 2
        ? "ranking-podium-cell-enter ranking-podium-cell-enter--r2"
        : "ranking-podium-cell-enter ranking-podium-cell-enter--r3"
    : "";

  const title = entry?.title ?? "\u2014";
  const valueLine = entry?.valueLabel ?? "\u2014";
  const muted = !entry;

  return (
    <div className={`flex min-w-0 flex-col items-center ${widthClass} ${rankStepClass} ${fadeRankClass}`}>
      {position === "center" ? (
        <span className="ranking-crown-wrap mt-3 flex min-h-[46px] items-center justify-center">
          {entry ? (
            <span className="ranking-crown-float relative inline-block h-11 shrink-0">
              <span className="ranking-crown-glow" aria-hidden />
              <Image
                src="/ranking/crown.png"
                alt=""
                width={150}
                height={120}
                sizes="48px"
                className="ranking-crown-img relative z-[1] block h-11 w-auto max-w-[58px] object-contain"
              />
            </span>
          ) : (
            <span className="block h-11 w-[58px] shrink-0" aria-hidden />
          )}
        </span>
      ) : null}

      <div className="ranking-podium-copy relative isolate flex max-w-full flex-col items-center px-1 pb-1 pt-1.5 text-center">
        <span className="ranking-podium-text-glow" aria-hidden />
        <div className={`flex max-w-full flex-col items-center ${PODIUM_TEXT_SLANT}`}>
          {position !== "center" ? <div className="mb-1 min-h-[28px]" aria-hidden /> : null}
          <p
            className={`ranking-podium-title relative z-[1] line-clamp-2 min-h-0 text-[14px] font-semibold leading-snug ${
              muted ? "text-[var(--color-text-muted)]" : "text-[var(--color-text-primary)]"
            }`}
          >
            {title}
          </p>
          <p
            className={`ranking-podium-value relative z-[1] mt-0.5 text-[13px] font-semibold ${
              muted ? "text-[var(--color-text-muted)]" : "text-[#7B61FF]"
            }`}
          >
            {valueLine}
          </p>
        </div>
      </div>
    </div>
  );
}

type RankingPodiumProps = {
  orderedTop3: [PodiumEntry?, PodiumEntry?, PodiumEntry?];
  enterKey?: RankingTabId;
};

export function RankingPodium({ orderedTop3, enterKey }: RankingPodiumProps) {
  const [first, second, third] = orderedTop3;

  return (
    <section className="mx-auto w-full max-w-[372px] shrink-0">
      <div
        key={enterKey ?? "podium-top3"}
        className="relative z-10 flex items-start justify-center gap-1 px-1"
      >
        <PodiumCell entry={second} position="left" rank={2} />
        <PodiumCell entry={first} position="center" rank={1} />
        <PodiumCell entry={third} position="right" rank={3} />
      </div>

      {/* 위로 당겨 글자가 포디움 이미지 상단을 살짝 덮도록 */}
      <div className="relative z-0 mx-auto -mt-[3.75rem] w-full max-w-[340px]">
        <Image
          src="/ranking/podium.png"
          alt=""
          width={304}
          height={195}
          sizes="(max-width: 380px) 90vw, 340px"
          className="h-auto w-full object-contain select-none"
          priority
        />
      </div>
    </section>
  );
}
