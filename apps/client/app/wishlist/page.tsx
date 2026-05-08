"use client";

import { CreateBoardOrRollingPaperModal } from "@/components/common/CreateBoardOrRollingPaperModal";
import { loginUrlWithCurrentPageAsNext } from "@/features/login/post-login-destination";
import { resolveLoggedInHomeHref } from "@/features/wishlist/resolve-logged-in-home";
import { getAccessToken } from "@/lib/api/token-store";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

/**
 * 로그인 후 `/wishlist` 진입:
 * `resolveLoggedInHomeHref` — boards-all → 없으면 `GET /api/boards/me` 최신 메타(또는 구 풀 응답 합성)
 * 없으면 생성 모달
 */
export default function WishlistEntryPage() {
  const router = useRouter();
  const [hint, setHint] = useState("위시리스트로 이동 중…");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [retryTick, setRetryTick] = useState(0);

  useEffect(() => {
    if (!getAccessToken()) {
      router.replace(loginUrlWithCurrentPageAsNext());
      return;
    }

    let cancelled = false;

    queueMicrotask(() => {
      if (cancelled) return;
      setHint("위시리스트로 이동 중…");
      setLoadError(null);
    });

    void getMyBoard()
      .then((board) => {
        if (cancelled) return;
        const slug = board.data.boardSlug?.trim();
        if (slug) {
          router.replace(`/wishlist/${encodeURIComponent(slug)}`);
          return;
        }
        setHint("메인으로 이동 중…");
        router.replace("/");
      })
      .catch(() => {
        if (!cancelled) {
          setLoadError("내 위시보드를 불러오지 못했습니다.");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [router, retryTick]);

  if (phase === "loading") {
    return (
      <main className="wishlist-page-root app-shell-viewport-floor flex min-h-[min(680px,85dvh)] flex-col items-center justify-center px-6 pt-[env(safe-area-inset-top,0px)] pb-[env(safe-area-inset-bottom,0px)]">
        <p className="text-body-sm text-[var(--color-text-secondary)]">불러오는 중…</p>
      </main>
    );
  }

  if (phase === "done") {
    return (
      <main className="wishlist-page-root app-shell-viewport-floor flex min-h-[min(680px,85dvh)] flex-col items-center justify-center px-6 pt-[env(safe-area-inset-top,0px)] pb-[env(safe-area-inset-bottom,0px)]">
        <p className="text-body-sm text-[var(--color-text-secondary)]">이동 중…</p>
      </main>
    );
  }

  return (
    <main className="wishlist-page-root app-shell-viewport-floor flex min-h-[min(680px,85dvh)] flex-col items-center justify-center gap-4 px-6 pt-[env(safe-area-inset-top,0px)] pb-[env(safe-area-inset-bottom,0px)]">
      {loadError ? (
        <>
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
                clearAccessToken();
                router.replace(loginUrlWithCurrentPageAsNext());
              }}
            >
              다시 로그인
            </button>
          </div>
        </>
      ) : (
        <p className="text-body-sm text-[var(--color-text-secondary)]">{hint}</p>
      )}
    </main>
  );
}
