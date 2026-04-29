"use client";

import { CaretLeft, PushPin, TextAlignJustify } from "@phosphor-icons/react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { AppSideMenu } from "@/components/common/AppSideMenu";
import { NoticeDetailModalBody } from "@/components/notice/NoticeDetailModalBody";
import {
  NoticeListEmptyPlaceholder,
  NoticeListErrorBanner,
  NoticeListLoadingPlaceholder,
} from "@/components/notice/NoticeListPlaceholders";
import { NoticeListTable } from "@/components/notice/NoticeListTable";
import { WishlistCenterDialog } from "@/components/wishlist/WishlistCenterDialog";
import {
  fetchNoticeDetail,
  fetchNotices,
  type NoticeDetail,
  type NoticeItem,
} from "@/features/notice/api";
import { getMyProfile } from "@/features/user/api";
import { clearAccessToken, getAccessToken } from "@/lib/api/token-store";
import {
  APP_MAIN_COLUMN,
  APP_MAIN_SCROLL_BODY,
  APP_SHELL_STAGE,
  APP_SHELL_VIEWPORT_MAIN,
} from "@/lib/constants/app-shell-layout";
import {
  PAGE_HEADER_BACK_BUTTON,
  PAGE_HEADER_LEADING_CLUSTER,
  PAGE_HEADER_MENU_BUTTON,
  PAGE_HEADER_ROW,
  PAGE_HEADER_TITLE_INLINE,
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
    let cancelled = false;
    void Promise.resolve().then(() => {
      if (!cancelled) void loadNotices();
    });
    return () => {
      cancelled = true;
    };
  }, [loadNotices]);

  useEffect(() => {
    if (!getAccessToken()) {
      queueMicrotask(() => setIsAdmin(false));
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
    <main className={APP_SHELL_VIEWPORT_MAIN}>
      <AppSideMenu
        open={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onLogout={handleLogout}
      />

      <div className={APP_SHELL_STAGE}>
        <div className={APP_MAIN_COLUMN}>
          <header className={PAGE_HEADER_ROW}>
            <div className={PAGE_HEADER_LEADING_CLUSTER}>
              <button
                type="button"
                onClick={handleHeaderBack}
                className={PAGE_HEADER_BACK_BUTTON}
                aria-label="이전 페이지로"
              >
                <CaretLeft size={22} weight="bold" />
              </button>

              <h1 className={PAGE_HEADER_TITLE_INLINE}>공지사항</h1>
            </div>

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

          <div className={APP_MAIN_SCROLL_BODY}>
            {isAdmin ? (
              <div className="mb-4 flex justify-end">
                <Link
                  href="/notice/write"
                  className="rounded-full bg-[#7B61FF] px-3.5 py-2 text-sm font-semibold text-white shadow-[0_2px_8px_rgba(123,97,255,0.35)] transition hover:bg-[#6B51EF] hover:shadow-[0_4px_12px_rgba(123,97,255,0.4)] active:scale-[0.98]"
                >
                  작성
                </Link>
              </div>
            ) : null}

            {loadError ? (
              <NoticeListErrorBanner message={loadError} onRetry={() => void loadNotices()} />
            ) : null}

            {isLoading ? (
              <NoticeListLoadingPlaceholder />
            ) : !loadError && notices.length === 0 ? (
              <NoticeListEmptyPlaceholder />
            ) : !loadError ? (
              <NoticeListTable notices={notices} onRowActivate={openNoticeDetail} />
            ) : null}
          </div>
        </div>
      </div>

      <WishlistCenterDialog
        variant="static"
        panelTone="aurora"
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
        <NoticeDetailModalBody
          loading={detailLoading}
          error={detailError}
          detail={detailData}
          summaryOnly={!isAdmin}
          editHref={isAdmin && detailData ? `/notice/${detailData.id}` : undefined}
          onEditNavigate={closeDetailModal}
        />
      </WishlistCenterDialog>
    </main>
  );
}
