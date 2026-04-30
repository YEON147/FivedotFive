"use client";

import { CaretRight, MegaphoneSimple, PushPin } from "@phosphor-icons/react";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

import { NoticeDetailModalBody } from "@/components/notice/NoticeDetailModalBody";
import { WishlistCenterDialog } from "@/components/wishlist/WishlistCenterDialog";
import {
  fetchNoticeBanners,
  fetchNoticeDetail,
  type NoticeDetail,
} from "@/features/notice/api";
import { getMyProfile } from "@/features/user/api";
import { getAccessToken } from "@/lib/api/token-store";

/** `app-shell-viewport-floor` 의 `top` / `height` 와 맞춤 — 배너가 위시 화면을 덮지 않게 함 */
const APP_TOP_BANNER_H = "--app-top-banner-h";
const DATA_BANNER_VISIBLE = "data-notice-banner-visible";

function clearAppTopInset() {
  document.documentElement.removeAttribute(DATA_BANNER_VISIBLE);
  document.documentElement.style.setProperty(APP_TOP_BANNER_H, "0px");
}

/** 메인·로그인·회원가입에서는 배너·관련 API 호출 생략 */
function isAppTopBannerSuppressedPath(pathname: string | null): boolean {
  if (pathname == null || pathname === "") return true;
  const p = pathname.endsWith("/") && pathname.length > 1 ? pathname.slice(0, -1) : pathname;
  return p === "/" || p === "/login" || p === "/signup";
}

/** 배너 문구가 여러 개일 때 순환 간격(ms) */
const BANNER_ROTATE_MS = 6000;
/** 페이드 아웃 후 문구 교체까지(ms) — 트랜지션 duration 과 맞춤 */
const BANNER_FADE_MS = 220;

/**
 * 전역 상단 배너 — 관리자가 공지에 넣은 `bannerText`가 있고 노출 기간이면 표시.
 * API 배너 배열을 순서대로 돌리며, 전환 시 페이드 아웃 → 페이드 인.
 * 탭 시 현재 보이는 공지 상세 모달 표시.
 * 문서 플로우 상단에 두고 높이를 `--app-top-banner-h` 로 반영해 고정 위시 셸과 겹치지 않게 함.
 */
export function AppTopNoticeBanner() {
  const pathname = usePathname();
  const suppressBanner = isAppTopBannerSuppressedPath(pathname);

  const [bannerItems, setBannerItems] = useState<{ id: number; text: string }[]>([]);
  const [carouselIndex, setCarouselIndex] = useState(0);
  /** 실제로 보이는 배너 슬롯(페이드 중에는 직전 문구 유지 후 교체) */
  const [visibleIndex, setVisibleIndex] = useState(0);
  const [bannerTextOpaque, setBannerTextOpaque] = useState(true);
  const [reduceMotion, setReduceMotion] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  /** 배너 목록이 바뀐 직후 첫 동기화에서는 페이드 없음 */
  const skipBannerFadeOnceRef = useRef(false);

  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [detailData, setDetailData] = useState<NoticeDetail | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduceMotion(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (suppressBanner) {
      setBannerItems([]);
      setCarouselIndex(0);
      setVisibleIndex(0);
      setBannerTextOpaque(true);
      return;
    }
    let cancelled = false;
    void fetchNoticeBanners()
      .then((res) => {
        if (cancelled || !res.success || !Array.isArray(res.data?.banners)) {
          return;
        }
        const list = res.data.banners
          .filter(
            (b) => typeof b.bannerText === "string" && b.bannerText.trim().length > 0,
          )
          .map((b) => ({ id: b.id, text: b.bannerText.trim() }));
        setBannerItems(list);
        setCarouselIndex(0);
        skipBannerFadeOnceRef.current = true;
      })
      .catch(() => {
        /* 네트워크 오류 시 배너 생략 */
      });
    return () => {
      cancelled = true;
    };
  }, [suppressBanner]);

  useEffect(() => {
    if (suppressBanner || bannerItems.length <= 1) {
      return;
    }
    const n = bannerItems.length;
    const id = window.setInterval(() => {
      setCarouselIndex((i) => (i + 1) % n);
    }, BANNER_ROTATE_MS);
    return () => window.clearInterval(id);
  }, [suppressBanner, bannerItems]);

  useEffect(() => {
    if (bannerItems.length === 0) return;
    setCarouselIndex((i) => (i >= bannerItems.length ? 0 : i));
  }, [bannerItems]);

  useEffect(() => {
    if (bannerItems.length <= 1) {
      setVisibleIndex(0);
      setBannerTextOpaque(true);
      return;
    }
    if (reduceMotion) {
      setVisibleIndex(Math.min(carouselIndex, bannerItems.length - 1));
      setBannerTextOpaque(true);
      return;
    }

    if (skipBannerFadeOnceRef.current) {
      skipBannerFadeOnceRef.current = false;
      setVisibleIndex(Math.min(carouselIndex, bannerItems.length - 1));
      setBannerTextOpaque(true);
      return;
    }

    setBannerTextOpaque(false);
    const t = window.setTimeout(() => {
      setVisibleIndex(Math.min(carouselIndex, bannerItems.length - 1));
      requestAnimationFrame(() => setBannerTextOpaque(true));
    }, BANNER_FADE_MS);
    return () => window.clearTimeout(t);
  }, [carouselIndex, bannerItems.length, reduceMotion]);

  const target =
    bannerItems.length > 0
      ? bannerItems[Math.min(visibleIndex, bannerItems.length - 1)] ?? null
      : null;

  useEffect(() => {
    if (suppressBanner) {
      queueMicrotask(() => setIsAdmin(false));
      return;
    }
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
  }, [suppressBanner]);

  const closeDetailModal = useCallback(() => {
    setDetailModalOpen(false);
    setDetailError(null);
    setDetailData(null);
  }, []);

  const openNoticeDetailModal = useCallback(() => {
    if (!target) return;
    setDetailModalOpen(true);
    setDetailLoading(true);
    setDetailError(null);
    setDetailData(null);
    void (async () => {
      try {
        const res = await fetchNoticeDetail(target.id);
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
  }, [target]);

  useLayoutEffect(() => {
    if (suppressBanner || !target || bannerItems.length === 0) {
      clearAppTopInset();
      return;
    }

    const apply = () => {
      const el = rootRef.current;
      if (!el) return;
      document.documentElement.setAttribute(DATA_BANNER_VISIBLE, "");
      document.documentElement.style.setProperty(APP_TOP_BANNER_H, `${el.offsetHeight}px`);
    };

    apply();

    const el = rootRef.current;
    if (!el || typeof ResizeObserver === "undefined") {
      const onResize = () => apply();
      window.addEventListener("resize", onResize);
      return () => {
        window.removeEventListener("resize", onResize);
      };
    }

    const ro = new ResizeObserver(() => apply());
    ro.observe(el);
    return () => {
      ro.disconnect();
    };
  }, [target, suppressBanner, bannerItems.length, visibleIndex, bannerTextOpaque]);

  useEffect(
    () => () => {
      clearAppTopInset();
    },
    [],
  );

  if (suppressBanner || !target) {
    return null;
  }

  return (
    <>
      <div
        ref={rootRef}
        className="shrink-0 border-b border-[var(--color-border)] bg-[var(--color-primary-light)] pt-[env(safe-area-inset-top,0px)]"
        role="region"
        aria-label="공지 배너"
      >
        <button
          type="button"
          onClick={openNoticeDetailModal}
          className="flex w-full justify-center px-4 py-2 transition hover:bg-[#E0D9FF]/80 active:bg-[#E0D9FF]"
          aria-label={
            bannerItems.length > 1
              ? `공지 배너 (${visibleIndex + 1}/${bannerItems.length})`
              : "공지 배너"
          }
        >
          {/** 위시 보드보다 살짝 넓은 틀 — (확성기 + 제목) 왼쪽 묶음 / `>` 는 오른쪽 끝 */}
          <span className="flex w-full max-w-[400px] items-start justify-between gap-2 sm:max-w-[404px]">
            <span className="flex min-w-0 flex-1 items-start gap-2">
              <span
                className="mt-0.5 mr-1 inline-flex shrink-0 -scale-x-100 text-[var(--color-primary-main)]"
                aria-hidden
              >
                <MegaphoneSimple size={16} weight="bold" />
              </span>
              <p
                className="min-w-0 flex-1 text-left text-[12px] leading-snug text-[var(--color-text-primary)] sm:text-[13px] sm:leading-snug"
                aria-live={bannerItems.length > 1 ? "polite" : undefined}
              >
                <span
                  className={`line-clamp-2 block [overflow-wrap:anywhere] transition-opacity duration-200 ease-out ${
                    bannerTextOpaque ? "opacity-100" : "opacity-0"
                  }`}
                >
                  {target.text}
                </span>
              </p>
            </span>
            <span
              className="mt-0.5 inline-flex shrink-0 self-start text-[var(--color-text-secondary)]"
              aria-hidden
            >
              <CaretRight size={16} weight="bold" />
            </span>
          </span>
        </button>
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
        titleId="app-top-notice-detail-modal-title"
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
    </>
  );
}
