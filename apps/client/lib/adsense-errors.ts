/**
 * 애드센스 push 등은 광고 차단·타이밍으로 실패할 수 있음 — UX 위해 삼키되 관측은 선택적으로 남김.
 * Sentry 연동 시 `window.Sentry.captureException` 이 있으면 프로덕션에서도 전송 가능.
 */

type SentryLike = {
  captureException?: (
    error: Error,
    captureContext?: { tags?: Record<string, string> },
  ) => void;
};

function getSentry(): SentryLike | undefined {
  if (typeof window === "undefined") return undefined;
  return (window as Window & { Sentry?: SentryLike }).Sentry;
}

export function reportAdsensePushFailure(error: unknown, reason: string): void {
  if (process.env.NODE_ENV === "development") {
    console.warn(`[AdSense] ${reason}`, error);
  }

  const sentry = getSentry();
  if (sentry?.captureException) {
    const err =
      error instanceof Error ? error : new Error(typeof error === "string" ? error : String(error));
    sentry.captureException(err, { tags: { source: "adsense", reason } });
  }
}
