import type { RankEntry } from "./types";
import { RankingRowCard } from "./RankingRowCard";

export function RankingRankList({
  rows,
  rowKeyPrefix,
  valueLabel,
}: {
  rows: RankEntry[];
  /** 탭 전환 시 React key 충돌 방지 */
  rowKeyPrefix: string;
  valueLabel: (row: RankEntry) => string;
}) {
  return (
    <section className="mx-auto flex w-full max-w-[372px] flex-col gap-2.5 pb-4">
      {rows.map((row) => (
        <RankingRowCard
          key={`${rowKeyPrefix}-${row.rank}`}
          rank={row.rank}
          title={row.title}
          valueLabel={valueLabel(row)}
        />
      ))}
    </section>
  );
}
