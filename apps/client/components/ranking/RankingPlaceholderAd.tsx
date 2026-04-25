type RankingPlaceholderAdProps = {
  message?: string;
};

export function RankingPlaceholderAd({ message = "광고 중..." }: RankingPlaceholderAdProps) {
  return (
    <div className="mt-auto flex shrink-0 items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-[13px] text-[var(--color-text-secondary)] shadow-sm">
      <span className="text-[var(--color-text-disabled)]" aria-hidden>
        ↓
      </span>
      <span>{message}</span>
    </div>
  );
}
