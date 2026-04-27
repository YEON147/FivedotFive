/** 4위 이하 목록 행 · 동일 카드 패턴 재사용 */
export function RankingRowCard({
  rank,
  title,
  valueLabel,
}: {
  rank: number;
  title: string;
  valueLabel: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-[14px] bg-[var(--color-surface)] px-4 py-3.5">
      <span className="w-7 shrink-0 text-center text-lg font-bold tabular-nums text-[var(--color-text-primary)]">
        {rank}
      </span>
      <span className="min-w-0 flex-1 truncate text-[15px] font-medium text-[var(--color-text-primary)]">
        {title}
      </span>
      <span className="shrink-0 text-[14px] font-semibold text-[#7B61FF]">{valueLabel}</span>
    </div>
  );
}
