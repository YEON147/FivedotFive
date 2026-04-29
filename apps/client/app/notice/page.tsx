"use client";

import { CaretLeft, PushPin, TextAlignJustify } from "@phosphor-icons/react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { AppSideMenu } from "@/components/common/AppSideMenu";
import { NoticeReadOnlyDetail } from "@/components/notice/NoticeReadOnlyDetail";
import { WishlistCenterDialog } from "@/components/wishlist/WishlistCenterDialog";
import {
  fetchNoticeDetail,
  fetchNotices,
  type NoticeDetail,
  type NoticeItem,
} from "@/features/notice/api";
import { formatNoticeListDate } from "@/features/notice/format-notice-datetime";
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

  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [detailData, setDetailData] = useState<NoticeDetail | null>(null);

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

  const closeDetailModal = useCallback(() => {
    setDetailModalOpen(false);
    setDetailError(null);
    setDetailData(null);
  }, []);

  const openNoticeDetail = useCallback((id: number) => {
    setDetailModalOpen(true);
    setDetailLoading(true);
    setDetailError(null);
    setDetailData(null);
    void (async () => {
      try {
        const res = await fetchNoticeDetail(id);
        if (!res.success || !res.data) {
          throw new Error(res.message ?? "공지를 불러오지 못했습니다.");
        }
        setDetailData(res.data);
      } catch (e) {
        setDetailError(
          e instanceof Error ? e.message : "공지를 불러오는 중 오류가 발생했습니다.",
        );
      } finally {
        setDetailLoading(false);
      }
    })();
  }, []);

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
            <div className="mb-5 flex min-h-[2.25rem] items-end justify-between gap-3">
              <div className="min-w-0">
                <h1 className="text-h2 text-[var(--color-text-primary)]">공지사항</h1>
                <p className="mt-1 text-xs leading-relaxed text-[var(--color-text-secondary)]">
                  서비스 안내와 업데이트를 확인하세요
                </p>
              </div>
              {isAdmin ? (
                <Link
                  href="/notice/write"
                  className="shrink-0 rounded-full bg-[#7B61FF] px-3.5 py-2 text-sm font-semibold text-white shadow-[0_2px_8px_rgba(123,97,255,0.35)] transition hover:bg-[#6B51EF] hover:shadow-[0_4px_12px_rgba(123,97,255,0.4)] active:scale-[0.98]"
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
              <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-zinc-200/90 bg-[#7B61FF]/[0.03] py-14 dark:border-zinc-600 dark:bg-[#7B61FF]/[0.06]">
                <span
                  className="size-9 animate-pulse rounded-full bg-[#7B61FF]/20 dark:bg-[#7B61FF]/30"
                  aria-hidden
                />
                <p className="text-sm text-[var(--color-text-secondary)]">불러오는 중…</p>
              </div>
            ) : !loadError && notices.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50/80 px-6 py-12 text-center dark:border-zinc-600 dark:bg-zinc-900/40">
                <p className="text-sm font-medium text-[var(--color-text-primary)]">
                  등록된 공지가 없습니다
                </p>
                <p className="mt-1.5 text-xs text-[var(--color-text-secondary)]">
                  새 소식이 올라오면 이곳에서 알려드릴게요
                </p>
              </div>
            ) : !loadError ? (
              <div className="overflow-hidden rounded-2xl border border-zinc-200/90 bg-[var(--color-surface)] shadow-[0_2px_16px_rgba(15,23,42,0.04)] dark:border-zinc-700/90 dark:bg-zinc-900/30 dark:shadow-[0_2px_20px_rgba(0,0,0,0.25)]">
                <table className="w-full table-fixed border-collapse text-left">
                  <colgroup>
                    <col className="min-w-0" />
                    <col className="w-[5.25rem] sm:w-[6rem]" />
                  </colgroup>
                  <thead>
                    <tr className="border-b border-zinc-200/90 dark:border-zinc-700">
                      <th
                        scope="col"
                        className="min-w-0 py-3 pl-5 pr-3 text-left text-[11px] font-semibold tracking-wide text-zinc-500 dark:text-zinc-400 sm:pl-6 sm:pr-4"
                      >
                        제목
                      </th>
                      <th
                        scope="col"
                        className="py-3 pl-5 pr-3 text-left text-[11px] font-semibold tracking-wide text-zinc-500 dark:text-zinc-400 sm:pl-6 sm:pr-4"
                      >
                        등록일
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {notices.map((n) => (
                      <tr
                        key={n.id}
                        role="button"
                        tabIndex={0}
                        className="group cursor-pointer border-b border-zinc-200/90 transition-colors duration-200 last:border-b-0 hover:bg-[#7B61FF]/[0.05] active:bg-[#7B61FF]/[0.08] dark:border-zinc-700 dark:hover:bg-white/[0.06] dark:active:bg-white/[0.08]"
                        onClick={() => openNoticeDetail(n.id)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            openNoticeDetail(n.id);
                          }
                        }}
                      >
                        <td className="min-w-0 px-3 py-3.5 align-middle sm:px-4">
                          <div className="flex min-w-0 items-center gap-2">
                            {n.isPinned ? (
                              <span
                                className="inline-flex shrink-0 text-[#7B61FF]"
                                aria-label="고정 공지"
                                title="고정"
                              >
                                <PushPin size={16} weight="fill" />
                              </span>
                            ) : null}
                            <span className="min-w-0 text-[13px] font-medium leading-snug text-[#5B4FC9] decoration-[#7B61FF]/40 underline-offset-2 group-hover:text-[#7B61FF] group-hover:underline dark:text-[#A78BFA] dark:group-hover:text-[#C4B5FD]">
                              {n.title}
                            </span>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-3 py-3.5 text-right align-middle tabular-nums text-[11px] text-zinc-500 dark:text-zinc-400 sm:px-4">
                          {formatNoticeListDate(n.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <WishlistCenterDialog
        variant="static"
        open={detailModalOpen}
        onClose={closeDetailModal}
        title={detailData?.title?.trim() ? detailData.title : "공지 상세"}
        titleLeading={
          detailData?.isPinned ? (
            <span className="text-[#7B61FF]" aria-label="고정 공지" title="고정">
              <PushPin size={20} weight="fill" />
            </span>
          ) : undefined
        }
        titleId="notice-list-detail-modal-title"
        description={false}
      >
        <div className="mt-1 max-h-[min(72vh,600px)] overflow-y-auto overscroll-y-contain pr-0.5 [-webkit-overflow-scrolling:touch]">
          {detailLoading ? (
            <p className="py-6 text-center text-sm text-[var(--color-text-secondary)]">
              불러오는 중…
            </p>
          ) : detailError ? (
            <p className="py-4 text-center text-sm text-rose-600">{detailError}</p>
          ) : detailData ? (
            <>
              <NoticeReadOnlyDetail
                detail={detailData}
                asModal
                summaryOnly={!isAdmin}
                suppressTitleRow
              />
              {isAdmin ? (
                <Link
                  href={`/notice/${detailData.id}`}
                  onClick={closeDetailModal}
                  className="mt-5 flex w-full items-center justify-center rounded-xl bg-[#7B61FF] px-4 py-3 text-sm font-semibold text-white transition hover:opacity-95"
                >
                  수정하기
                </Link>
              ) : null}
            </>
          ) : null}
        </div>
      </WishlistCenterDialog>
    </main>
  );
}
