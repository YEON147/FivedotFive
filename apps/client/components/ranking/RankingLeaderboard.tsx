"use client";

import type { PodiumEntry } from "./RankingPodium";
import { RankingListScrollArea } from "./RankingListScrollArea";
import { RankingPodium } from "./RankingPodium";
import { RankingRankList } from "./RankingRankList";
import { RankingTabs } from "./RankingTabs";
import type { RankEntry, RankingTabId, RankingTabItem } from "./types";

type RankingLeaderboardProps = {
  tabs: readonly RankingTabItem[];
  tab: RankingTabId;
  onTabChange: (id: RankingTabId) => void;
  orderedTop3: [PodiumEntry?, PodiumEntry?, PodiumEntry?];
  restRows: RankEntry[];
  valueLabel: (row: RankEntry) => string;
};

export function RankingLeaderboard({
  tabs,
  tab,
  onTabChange,
  orderedTop3,
  restRows,
  valueLabel,
}: RankingLeaderboardProps) {
  return (
    <div
      id="ranking-tabpanel"
      role="tabpanel"
      aria-labelledby={`ranking-tab-${tab}`}
      className="flex min-h-0 min-w-0 flex-1 flex-col"
    >
      <RankingTabs tabs={tabs} activeId={tab} onChange={onTabChange} />

      <div className="shrink-0">
        <RankingPodium orderedTop3={orderedTop3} enterKey={tab} />
      </div>

      <div key={tab} className="ranking-tab-panel-crossfade flex min-h-0 min-w-0 flex-1 flex-col">
        <RankingListScrollArea>
          <RankingRankList rows={restRows} rowKeyPrefix={tab} valueLabel={valueLabel} />
        </RankingListScrollArea>
      </div>
    </div>
  );
}
