"use client";

import { useCallback, useMemo, useState } from "react";

import {
  buildPodiumTuple,
  formatRankingValue,
  RANKING_TABS,
  RankingLeaderboard,
  RankingPageHeader,
  RankingPlaceholderAd,
  type RankEntry,
  type RankingTabId,
} from "@/components/ranking";

import { MOCK_RANKINGS } from "./mock-rankings";

export default function RankingPage() {
  const [tab, setTab] = useState<RankingTabId>("schoolStudents");

  const rows = MOCK_RANKINGS[tab];
  const top3 = useMemo(() => rows.slice(0, 3), [rows]);
  const rest = useMemo(() => rows.slice(3), [rows]);

  const orderedTop3 = useMemo(() => buildPodiumTuple(tab, top3), [tab, top3]);

  const valueLabel = useCallback((row: RankEntry) => formatRankingValue(tab, row.value), [tab]);

  return (
    <main className="wishlist-page-root app-shell-viewport-floor flex h-full min-h-0 flex-col bg-[var(--color-bg-base)] px-4 pb-[calc(env(safe-area-inset-bottom,0px)+12px)] pt-[env(safe-area-inset-top,0px)]">
      <RankingPageHeader />

      <RankingLeaderboard
        tabs={RANKING_TABS}
        tab={tab}
        onTabChange={setTab}
        orderedTop3={orderedTop3}
        restRows={rest}
        valueLabel={valueLabel}
      />

      <RankingPlaceholderAd />
    </main>
  );
}
