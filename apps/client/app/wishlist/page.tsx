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
  const [phase, setPhase] = useState<"loading" | "empty" | "done">("loading");
  const [createOpen, setCreateOpen] = useState(false);

  useEffect(() => {
    if (!getAccessToken()) {
      router.replace(loginUrlWithCurrentPageAsNext());
      return;
    }

    let cancelled = false;

    const run = async () => {
      const href = await resolveLoggedInHomeHref();
      if (cancelled) return;
      if (href) {
        router.replace(href);
        setPhase("done");
        return;
      }

      setPhase("empty");
      setCreateOpen(true);
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [router]);

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
    <main className="wishlist-page-root app-shell-viewport-floor flex min-h-[min(680px,85dvh)] flex-col items-center justify-center px-6 pt-[env(safe-area-inset-top,0px)] pb-[env(safe-area-inset-bottom,0px)]">
      <div className="flex w-full max-w-sm flex-col items-center gap-5">
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
      </div>

      <CreateBoardOrRollingPaperModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </main>
  );
}
