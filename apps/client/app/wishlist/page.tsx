"use client";

import { CreateBoardOrRollingPaperModal } from "@/components/common/CreateBoardOrRollingPaperModal";
import { logoutSession } from "@/features/login/api";
import { loginUrlWithCurrentPageAsNext } from "@/features/login/post-login-destination";
import { resolveLoggedInHomeHref } from "@/features/wishlist/resolve-logged-in-home";
import { getAccessToken } from "@/lib/api/token-store";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

/**
 * 로그인 후 `/wishlist` 진입:
 * `resolveLoggedInHomeHref`로 이동할 경로가 있으면 리다이렉트, 없으면 안내·생성 모달.
 */
export default function WishlistEntryPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<"loading" | "empty" | "done">("loading");
  const [createOpen, setCreateOpen] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [retryTick, setRetryTick] = useState(0);

  useEffect(() => {
    if (!getAccessToken()) {
      router.replace(loginUrlWithCurrentPageAsNext());
      return;
    }

    let cancelled = false;
    setPhase("loading");
    setLoadError(null);

    const run = async () => {
      try {
        const href = await resolveLoggedInHomeHref();
        if (cancelled) return;
        if (href) {
          router.replace(href);
          setPhase("done");
          return;
        }
        setPhase("empty");
        setCreateOpen(true);
      } catch {
        if (!cancelled) {
          setLoadError("위시리스트 정보를 불러오지 못했습니다.");
          setPhase("empty");
          setCreateOpen(true);
        }
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [router, retryTick]);

  return (
    <main className="wishlist-page-root app-shell-viewport-floor flex min-h-[min(680px,85dvh)] flex-col items-center justify-center gap-4 px-6 pt-[env(safe-area-inset-top,0px)] pb-[env(safe-area-inset-bottom,0px)]">
      {loadError ? (
        <div className="flex w-full max-w-sm flex-col items-center gap-4">
          <p className="text-center text-body-sm text-[var(--color-text-secondary)]">{loadError}</p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              className="rounded-[12px] bg-[var(--color-primary-main)] px-5 py-2.5 text-[15px] font-semibold text-white transition hover:bg-[var(--color-primary-pressed)] active:scale-[0.99]"
              onClick={() => setRetryTick((t) => t + 1)}
            >
              다시 시도
            </button>
            <button
              type="button"
              className="rounded-[12px] border border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-2.5 text-[15px] font-medium text-[var(--color-text-primary)] transition hover:bg-[var(--color-bg-subtle)]"
              onClick={() => {
                void (async () => {
                  await logoutSession();
                  router.replace(loginUrlWithCurrentPageAsNext());
                })();
              }}
            >
              다시 로그인
            </button>
          </div>
        </div>
      ) : phase === "loading" ? (
        <p className="text-body-sm text-[var(--color-text-secondary)]">위시리스트로 이동 중…</p>
      ) : (
        <>
          <p className="text-center text-[15px] leading-relaxed text-[var(--color-text-primary)]">
            아직 생성된 위시보드나 롤링페이퍼가 없어요.
            <br />
            아래에서 새로 만들 수 있어요.
          </p>
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="inline-flex min-h-[3rem] w-full max-w-xs items-center justify-center rounded-[16px] bg-[var(--color-primary-main)] px-6 text-[15px] font-semibold text-white transition hover:bg-[var(--color-primary-pressed)]"
          >
            생성하기
          </button>
        </>
      )}

      <CreateBoardOrRollingPaperModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </main>
  );
}
