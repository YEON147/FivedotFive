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
  if (rows.length === 0) {
    return (
      <section className="mx-auto flex w-full max-w-[372px] flex-col gap-2.5 pb-4">
        <div
          className="flex min-h-[52px] items-center gap-3 rounded-[14px] bg-[var(--color-surface)] px-4 py-3.5 shadow-[0_4px_16px_rgba(0,0,0,0.06)] ring-1 ring-black/[0.04]"
          role="status"
          aria-live="polite"
        >
          <span className="w-7 shrink-0" aria-hidden />
          <span className="min-w-0 flex-1 text-center text-[14px] text-[var(--color-text-muted)]">
            표시할 순위가 없어요
          </span>
          <span className="w-10 shrink-0" aria-hidden />
        </div>
      </section>
    );
  }

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
