import { formatRankingValue } from "./formatRankingValue";
import type { PodiumEntry } from "./RankingPodium";
import type { RankEntry, RankingTabId } from "./types";

/** 탭별 포맷된 수치 라벨을 붙여 포디움용 튜플을 만든다. */
export function buildPodiumTuple(
  tab: RankingTabId,
  top3: RankEntry[],
): [PodiumEntry?, PodiumEntry?, PodiumEntry?] {
  const label = (i: 0 | 1 | 2): PodiumEntry | undefined => {
    const e = top3[i];
    if (!e) return undefined;
    return { ...e, valueLabel: formatRankingValue(tab, e.value) };
  };
  return [label(0), label(1), label(2)];
}
