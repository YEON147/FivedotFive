"use client";

type ErrorBannerProps = {
  message: string;
  onRetry: () => void;
};

export function NoticeListErrorBanner({ message, onRetry }: ErrorBannerProps) {
  return (
    <div className="mb-3 shrink-0 rounded-xl bg-[var(--color-surface)] px-4 py-3 text-center shadow-sm ring-1 ring-black/5">
      <p className="text-sm text-[var(--color-text-primary)]">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-2 text-sm font-semibold text-[#7B61FF] underline-offset-2 hover:underline"
      >
        다시 시도
      </button>
    </div>
  );
}

export function NoticeListLoadingPlaceholder() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-[18px] border border-dashed border-[var(--color-border)] bg-white/50 py-16 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
      <span
        className="size-9 animate-pulse rounded-full bg-[#7B61FF]/20"
        aria-hidden
      />
      <p className="text-sm text-[var(--color-text-secondary)]">불러오는 중…</p>
    </div>
  );
}

export function NoticeListEmptyPlaceholder() {
  return (
    <div className="rounded-[18px] border border-dashed border-[var(--color-border)] bg-white/60 px-6 py-14 text-center shadow-[0_6px_24px_rgba(15,23,42,0.04)]">
      <p className="text-sm font-medium text-[var(--color-text-primary)]">등록된 공지가 없습니다</p>
      <p className="mt-1.5 text-xs text-[var(--color-text-secondary)]">
        새 소식이 올라오면 이곳에서 알려드릴게요
      </p>
    </div>
  );
}
