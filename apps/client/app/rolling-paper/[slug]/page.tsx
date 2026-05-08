"use client";

import { TextAlignJustify } from "@phosphor-icons/react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { use, useCallback, useEffect, useMemo, useState, type MouseEvent } from "react";

import { AppSideMenu } from "@/components/common/AppSideMenu";
import { DESIGN_HEIGHT, DESIGN_WIDTH } from "@/components/wishlist/WishlistSlots";
import { PublicWishlistVisitorMenu } from "@/components/wishlist/PublicWishlistVisitorMenu";
import { loginUrlForPath } from "@/features/login/post-login-destination";
import { getMyProfile } from "@/features/user/api";
import { clearWishlistPageSessionCache } from "@/features/wishlist/wishlist-session-cache";
import {
  ACCESS_TOKEN_STORAGE_KEY,
  clearAccessToken,
  getAccessToken,
} from "@/lib/api/token-store";
import {
  PAGE_HEADER_LEADING_CLUSTER,
  PAGE_HEADER_MENU_BUTTON,
  PAGE_HEADER_ROW_COMPACT,
} from "@/lib/constants/page-header";

/**
 * `app/wishlist/[slug]/page.tsx` 공개 보드 카드와 동일 셸 — max 372×680 비율 프레임.
 * 배경·상단 이미지는 추후 연결; 영역만 잡아 둠.
 */
const ROLLING_PAPER_BOARD_WRAP =
  "relative flex h-full min-h-0 max-h-full w-full max-w-[min(420px,calc(100vw-1.5rem))] flex-1 flex-col overflow-visible bg-transparent";

const ROLLING_PAPER_BOARD_FRAME =
  "relative isolate overflow-visible rounded-[18px] shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] ring-1 wishlist-board-frame--decorate mx-auto w-full max-w-[372px] max-h-[min(680px,100%)] shrink-0 ring-violet-200/55";

const ROLLING_PAPER_BOARD_INNER =
  "relative h-full w-full min-h-0 min-w-0 overflow-visible bg-transparent";

export default function RollingPaperSlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const loginHrefWithReturn = useMemo(() => {
    const qs = searchParams.toString();
    return loginUrlForPath(`${pathname}${qs ? `?${qs}` : ""}`);
  }, [pathname, searchParams]);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [visitorMenuLoggedIn, setVisitorMenuLoggedIn] = useState(false);

  const syncVisitorSession = useCallback(async () => {
    const token = getAccessToken()?.trim();
    if (!token) {
      setVisitorMenuLoggedIn(false);
      return;
    }
    try {
      await getMyProfile();
      setVisitorMenuLoggedIn(true);
    } catch {
      setVisitorMenuLoggedIn(!!getAccessToken()?.trim());
    }
  }, []);

  useEffect(() => {
    void syncVisitorSession();
  }, [syncVisitorSession]);

  useEffect(() => {
    const onFocus = () => void syncVisitorSession();
    const onStorage = (e: StorageEvent) => {
      if (e.key === ACCESS_TOKEN_STORAGE_KEY || e.key === null) {
        void syncVisitorSession();
      }
    };
    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        void syncVisitorSession();
      }
    };
    window.addEventListener("focus", onFocus);
    window.addEventListener("storage", onStorage);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("storage", onStorage);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [syncVisitorSession]);

  const handleVisitorMenuClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    void syncVisitorSession();
    setIsSidebarOpen((open) => !open);
  };

  const handleVisitorLogout = useCallback(() => {
    clearAccessToken();
    clearWishlistPageSessionCache();
    setVisitorMenuLoggedIn(false);
    setIsSidebarOpen(false);
    router.push("/login");
  }, [router]);

  return (
    <main className="wishlist-page-root app-shell-viewport-floor flex min-h-0 flex-col overflow-visible px-3 pb-[env(safe-area-inset-bottom,0px)] pt-[env(safe-area-inset-top,0px)] sm:px-4">
      <div className="relative z-10 flex min-h-0 w-full min-w-0 flex-1 flex-col items-stretch justify-start overflow-visible">
        <section className={`${ROLLING_PAPER_BOARD_WRAP} mx-auto min-h-0 w-full`}>
          <div className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-visible p-0">
            <div className="relative flex min-h-0 min-w-0 flex-1 items-center justify-center overflow-visible px-1 pb-1 pt-2 sm:px-2 sm:pb-2 sm:pt-3">
              <div
                className={ROLLING_PAPER_BOARD_FRAME}
                style={{
                  aspectRatio: `${DESIGN_WIDTH} / ${DESIGN_HEIGHT}`,
                }}
              >
                {/* 배경 이미지 — 추후 absolute inset-0 레이어로 교체 */}
                <div
                  className="pointer-events-none absolute inset-0 z-0 rounded-[18px]"
                  aria-hidden
                />

                <div
                  className={`${ROLLING_PAPER_BOARD_INNER} relative z-10 flex h-full min-h-0 flex-col`}
                >
                  <header className={PAGE_HEADER_ROW_COMPACT}>
                    <div className={`${PAGE_HEADER_LEADING_CLUSTER} items-start`}>
                      <h1 className="min-w-0 flex-1 text-left text-wish-title leading-tight text-slate-900">
                        <span className="block font-bold leading-[0.8] text-[#7B61FF]">롤링페이퍼</span>
                        <span className="mt-1 block text-[18px] font-light leading-snug text-slate-900">
                          준비 중
                        </span>
                      </h1>
                    </div>
                    <button
                      type="button"
                      onClick={handleVisitorMenuClick}
                      className={PAGE_HEADER_MENU_BUTTON}
                      aria-label="메뉴 열기"
                      aria-expanded={isSidebarOpen}
                    >
                      <TextAlignJustify size={23} weight="bold" />
                    </button>
                  </header>

                  {/* 상단 이미지 — 추후 교체 */}
                  <div
                    className="mx-auto mt-1 w-[88%] shrink-0 rounded-xl border-2 border-dashed border-violet-200/70 bg-white/20"
                    style={{ aspectRatio: "320 / 140" }}
                    aria-label="롤링페이퍼 상단 이미지 영역"
                  />

                  <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-2 px-4 pb-6 pt-4 text-center">
                    <p className="font-mono text-[13px] text-slate-500">{slug}</p>
                    <p className="max-w-[240px] text-body-sm text-[var(--color-text-secondary)]">
                      본문·스티커 등은 이후 연결 예정입니다.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {visitorMenuLoggedIn ? (
        <AppSideMenu
          open={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          onLogout={handleVisitorLogout}
        />
      ) : (
        <PublicWishlistVisitorMenu
          open={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          loggedIn={false}
          onLogout={handleVisitorLogout}
          loginHref={loginHrefWithReturn}
        />
      )}
    </main>
  );
}
