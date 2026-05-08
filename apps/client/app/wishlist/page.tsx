"use client";

import { loginUrlWithCurrentPageAsNext } from "@/features/login/post-login-destination";
import { getMyBoard } from "@/features/wishlist/api";
import { clearAccessToken, getAccessToken } from "@/lib/api/token-store";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

/**
 * 로그인 + 보드 있음 → `/wishlist/[slug]` 로 이동 (편집·댓글 통합 화면).
 * 보드 없음 → 온보딩은 메인(`/`)과 통합되어 있음 — 메인으로 보냄.
 */
export default function WishlistEntryRedirectPage() {
  const router = useRouter();
  const [hint, setHint] = useState("위시리스트로 이동 중…");

  useEffect(() => {
    if (!getAccessToken()) {
      router.replace(loginUrlWithCurrentPageAsNext());
      return;
    }

    let cancelled = false;

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
          router.replace("/");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <main className="wishlist-page-root app-shell-viewport-floor flex min-h-[min(680px,85dvh)] flex-col items-center justify-center px-6 pt-[env(safe-area-inset-top,0px)] pb-[env(safe-area-inset-bottom,0px)]">
      <p className="text-body-sm text-[var(--color-text-secondary)]">{hint}</p>
    </main>
  );
}
