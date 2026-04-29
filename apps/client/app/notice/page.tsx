"use client";

import { CaretLeft, PushPin, TextAlignJustify } from "@phosphor-icons/react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { AppSideMenu } from "@/components/common/AppSideMenu";
import { fetchNotices, type NoticeItem } from "@/features/notice/api";
import { formatNoticeDateTime } from "@/features/notice/format-notice-datetime";
import { getMyProfile } from "@/features/user/api";
import { clearAccessToken, getAccessToken } from "@/lib/api/token-store";
import {
  PAGE_HEADER_BACK_BUTTON,
  PAGE_HEADER_MENU_BUTTON,
  PAGE_HEADER_ROW,
} from "@/lib/constants/page-header";
import { navigateAppBack } from "@/lib/navigate-app-back";

export default function NoticePage() {
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [notices, setNotices] = useState<NoticeItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const loadNotices = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const res = await fetchNotices();
      if (!res.success) {
        throw new Error(res.message ?? "공지사항을 불러오지 못했습니다.");
      }
      setNotices(res.data.notices ?? []);
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "공지사항을 불러오는 중 오류가 발생했습니다.";
      setLoadError(message);
      setNotices([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadNotices();
  }, [loadNotices]);

  useEffect(() => {
    if (!getAccessToken()) {
      setIsAdmin(false);
      return;
    }
    let cancelled = false;
    void getMyProfile()
      .then((p) => {
        if (!cancelled) setIsAdmin(p.role === "ADMIN");
      })
      .catch(() => {
        if (!cancelled) setIsAdmin(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleLogout = useCallback(() => {
    clearAccessToken();
    setIsSidebarOpen(false);
    router.push("/login");
  }, [router]);

  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen((prev) => !prev);
  }, []);

  const handleHeaderBack = useCallback(() => {
    navigateAppBack(router, "/");
  }, [router]);

  return (
    <main className="wishlist-page-root app-shell-viewport-floor flex flex-col px-3 pb-[env(safe-area-inset-bottom,0px)] pt-[env(safe-area-inset-top,0px)] sm:px-4">
      <AppSideMenu
        open={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onLogout={handleLogout}
      />

      <div className="relative z-10 flex min-h-0 w-full flex-1 flex-col items-center justify-start">
        <div className="mx-auto flex w-full min-h-0 max-w-[372px] flex-1 flex-col">
          <header className={PAGE_HEADER_ROW}>
            <button
              type="button"
              onClick={handleHeaderBack}
              className={PAGE_HEADER_BACK_BUTTON}
              aria-label="이전 페이지로"
            >
              <CaretLeft size={22} weight="bold" />
            </button>

            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                toggleSidebar();
              }}
              className={PAGE_HEADER_MENU_BUTTON}
              aria-label="메뉴 열기"
              aria-expanded={isSidebarOpen}
            >
              <TextAlignJustify size={23} weight="bold" />
            </button>
          </header>

          <div className="scrollbar-hidden flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-y-contain [-webkit-overflow-scrolling:touch] px-2 pb-4 pt-0 sm:px-3">
            <div className="mb-3 flex min-h-[2.25rem] items-center justify-between gap-2">
              <h1 className="text-h2 text-[var(--color-text-primary)]">공지사항</h1>
              {isAdmin ? (
                <Link
                  href="/notice/write"
                  className="shrink-0 rounded-full bg-[#7B61FF] px-3 py-1.5 text-sm font-semibold text-white transition hover:opacity-95"
                >
                  작성
                </Link>
              ) : null}
            </div>

            {loadError ? (
              <div className="mb-3 shrink-0 rounded-xl bg-[var(--color-surface)] px-4 py-3 text-center shadow-sm ring-1 ring-black/5">
                <p className="text-sm text-[var(--color-text-primary)]">{loadError}</p>
                <button
                  type="button"
                  onClick={() => void loadNotices()}
                  className="mt-2 text-sm font-semibold text-[#7B61FF] underline-offset-2 hover:underline"
                >
                  다시 시도
                </button>
              </div>
            ) : null}

            {isLoading ? (
              <p className="text-body text-[var(--color-text-secondary)]">불러오는 중…</p>
            ) : !loadError && notices.length === 0 ? (
              <p className="text-body text-[var(--color-text-secondary)]">등록된 공지가 없습니다.</p>
            ) : !loadError ? (
              <ul className="flex flex-col gap-2">
                {notices.map((n) => (
                  <li key={n.id}>
                    <Link
                      href={`/notice/${n.id}`}
                      className="block rounded-[14px] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3.5 shadow-sm transition hover:bg-[var(--color-bg-subtle)]"
                    >
                      <div className="flex items-start gap-2">
                        {n.isPinned ? (
                          <span
                            className="mt-0.5 inline-flex shrink-0 text-[#7B61FF]"
                            aria-label="고정 공지"
                            title="고정"
                          >
                            <PushPin size={18} weight="fill" />
                          </span>
                        ) : null}
                        <div className="min-w-0 flex-1">
                          <p className="text-body font-semibold text-[var(--color-text-primary)]">
                            {n.title}
                          </p>
                          <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
                            등록 {formatNoticeDateTime(n.createdAt)}
                          </p>
                          <p className="mt-0.5 text-xs text-[var(--color-text-secondary)]">
                            노출 {formatNoticeDateTime(n.startAt)} ~ {formatNoticeDateTime(n.endAt)}
                          </p>
                        </div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>
      </div>
    </main>
  );
}
