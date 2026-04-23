"use client";

import { CaretLeft, TextAlignJustify } from "@phosphor-icons/react";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";

type RankingTabId = "schoolStudents" | "schoolComments" | "personalComments";

type RankEntry = {
  rank: number;
  title: string;
  value: number;
};

const TABS: { id: RankingTabId; label: string }[] = [
  { id: "schoolStudents", label: "학교 학생 수" },
  { id: "schoolComments", label: "학교 댓글 수" },
  { id: "personalComments", label: "개인 댓글 수" },
];

/** 목업 데이터 — API 연동 시 교체 */
const MOCK_RANKINGS: Record<RankingTabId, RankEntry[]> = {
  schoolStudents: [
    { rank: 1, title: "도농초등학교", value: 2112 },
    { rank: 2, title: "대전초등학교", value: 2112 },
    { rank: 3, title: "싸피초등학교", value: 2112 },
    { rank: 4, title: "사등초등학교", value: 1600 },
    { rank: 5, title: "오등초등학교", value: 1600 },
    { rank: 6, title: "육등초등학교", value: 1600 },
    { rank: 7, title: "칠등초등학교", value: 1600 },
    { rank: 8, title: "팔등초등학교", value: 1600 },
  ],
  schoolComments: [
    { rank: 1, title: "도농초등학교", value: 842 },
    { rank: 2, title: "싸피초등학교", value: 791 },
    { rank: 3, title: "대전초등학교", value: 654 },
    { rank: 4, title: "사등초등학교", value: 521 },
    { rank: 5, title: "오등초등학교", value: 498 },
    { rank: 6, title: "육등초등학교", value: 412 },
    { rank: 7, title: "칠등초등학교", value: 305 },
    { rank: 8, title: "팔등초등학교", value: 288 },
  ],
  personalComments: [
    { rank: 1, title: "김싸피", value: 128 },
    { rank: 2, title: "이오점오", value: 96 },
    { rank: 3, title: "박코딩", value: 84 },
    { rank: 4, title: "최위시", value: 72 },
    { rank: 5, title: "정스티커", value: 61 },
    { rank: 6, title: "한댓글", value: 55 },
    { rank: 7, title: "조학교", value: 48 },
    { rank: 8, title: "윤개발", value: 40 },
  ],
};

function formatValue(tab: RankingTabId, value: number): string {
  const n = value.toLocaleString("ko-KR");
  if (tab === "schoolStudents") return `${n}명`;
  return `${n}개`;
}

export default function RankingPage() {
  const [tab, setTab] = useState<RankingTabId>("schoolStudents");

  const rows = MOCK_RANKINGS[tab];
  const top3 = useMemo(() => rows.slice(0, 3), [rows]);
  const rest = useMemo(() => rows.slice(3), [rows]);

  const second = top3[1];
  const first = top3[0];
  const third = top3[2];

  return (
    <main className="wishlist-page-root app-shell-viewport-floor flex min-h-[100dvh] flex-col bg-[var(--color-bg-base)] px-4 pb-[calc(env(safe-area-inset-bottom,0px)+12px)] pt-[env(safe-area-inset-top,0px)]">
      {/* 헤더 */}
      <header className="relative mb-5 flex shrink-0 items-center pt-3">
        <Link
          href="/wishlist"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--color-surface)] text-[var(--color-text-primary)] shadow-sm ring-1 ring-black/5 transition hover:bg-[var(--color-bg-subtle)]"
          aria-label="위시리스트로 이동"
        >
          <CaretLeft size={22} weight="bold" />
        </Link>

        <div className="pointer-events-none absolute inset-x-0 flex justify-center px-14">
          <h1 className="text-center font-['MemomentKkukkukk',sans-serif] text-[17px] leading-snug text-[var(--color-text-primary)]">
            <span className="inline-flex items-baseline justify-center gap-0.5">
              <span
                className="bg-gradient-to-br from-[#7B61FF] via-[#FF8C9E] to-[#FFB74D] bg-clip-text text-[1.35rem] font-extrabold tracking-tight text-transparent drop-shadow-sm"
                style={{ WebkitBackgroundClip: "text" }}
              >
                5.5
              </span>
              <span className="font-medium text-[var(--color-text-primary)]">가 선정한 랭킹</span>
            </span>
          </h1>
        </div>

        <Link
          href="/wishlist"
          className="ml-auto flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--color-surface)] text-[#7B61FF] shadow-sm ring-1 ring-black/5 transition hover:bg-[var(--color-bg-subtle)]"
          aria-label="메뉴 · 위시리스트"
        >
          <TextAlignJustify size={23} weight="bold" />
        </Link>
      </header>

      {/* 탭 */}
      <div className="mb-6 flex w-full shrink-0 justify-center gap-1.5 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {TABS.map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`shrink-0 rounded-full px-4 py-2.5 text-[13px] font-semibold transition ${
                active
                  ? "bg-[#7B61FF] text-white shadow-md shadow-[#7B61FF]/25"
                  : "bg-transparent text-[var(--color-text-secondary)] hover:bg-white/80"
              }`}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {/* TOP 3 포디움 — 2·3위는 측면 단이 낮으므로 1위 대비 아래로 */}
        <section className="mx-auto w-full max-w-[372px] shrink-0">
          <div className="flex items-start justify-center gap-2 px-1 pb-1">
            {/* 2위 — 측면 단이 낮아 1위보다 텍스트를 아래로 */}
            <div className="flex w-[30%] min-w-0 flex-col items-center pt-9 text-center">
              {second ? (
                <>
                  <div className="mb-1 min-h-[28px]" aria-hidden />
                  <p className="line-clamp-2 text-[13px] font-semibold leading-tight text-[var(--color-text-primary)]">
                    {second.title}
                  </p>
                  <p className="mt-0.5 text-[13px] font-semibold text-[#7B61FF]">
                    {formatValue(tab, second.value)}
                  </p>
                </>
              ) : null}
            </div>

            {/* 1위 */}
            <div className="flex w-[34%] min-w-0 flex-col items-center text-center">
              {first ? (
                <>
                  <Image
                    src="/ranking/crown.png"
                    alt=""
                    width={150}
                    height={120}
                    sizes="44px"
                    className="mb-0.5 h-10 w-auto max-w-[52px] object-contain drop-shadow-md"
                    unoptimized
                  />
                  <p className="line-clamp-2 text-[13px] font-semibold leading-tight text-[var(--color-text-primary)]">
                    {first.title}
                  </p>
                  <p className="mt-0.5 text-[13px] font-semibold text-[#7B61FF]">
                    {formatValue(tab, first.value)}
                  </p>
                </>
              ) : null}
            </div>

            {/* 3위 */}
            <div className="flex w-[30%] min-w-0 flex-col items-center pt-9 text-center">
              {third ? (
                <>
                  <div className="mb-1 min-h-[28px]" aria-hidden />
                  <p className="line-clamp-2 text-[13px] font-semibold leading-tight text-[var(--color-text-primary)]">
                    {third.title}
                  </p>
                  <p className="mt-0.5 text-[13px] font-semibold text-[#7B61FF]">
                    {formatValue(tab, third.value)}
                  </p>
                </>
              ) : null}
            </div>
          </div>

          <div className="relative mx-auto mt-2 w-full max-w-[340px]">
            {/* 실제 파일 비율 304×195 — width/height 불일치 시 Next/Image 영역 비율이 틀어져 이미지가 찌그러짐 */}
            <Image
              src="/ranking/podium.png"
              alt=""
              width={304}
              height={195}
              sizes="(max-width: 380px) 90vw, 340px"
              className="h-auto w-full object-contain select-none"
              priority
              unoptimized
            />
          </div>
        </section>

        {/* 4위~ */}
        <section className="mx-auto flex w-full max-w-[372px] flex-col gap-2.5 pb-4">
          {rest.map((row) => (
            <div
              key={`${tab}-${row.rank}`}
              className="flex items-center gap-3 rounded-[14px] bg-[var(--color-surface)] px-4 py-3.5 shadow-[0_4px_16px_rgba(0,0,0,0.06)] ring-1 ring-black/[0.04]"
            >
              <span className="w-7 shrink-0 text-center text-lg font-bold tabular-nums text-[var(--color-text-primary)]">
                {row.rank}
              </span>
              <span className="min-w-0 flex-1 truncate text-[15px] font-medium text-[var(--color-text-primary)]">
                {row.title}
              </span>
              <span className="shrink-0 text-[14px] font-semibold text-[#7B61FF]">
                {formatValue(tab, row.value)}
              </span>
            </div>
          ))}
        </section>
      </div>

      {/* 하단 광고 자리 */}
      <div className="mt-auto flex shrink-0 items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-[13px] text-[var(--color-text-secondary)] shadow-sm">
        <span className="text-[var(--color-text-disabled)]" aria-hidden>
          ↓
        </span>
        <span>광고 중...</span>
      </div>
    </main>
  );
}
