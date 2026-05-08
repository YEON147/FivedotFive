"use client";

import { CaretLeftIcon, CaretRightIcon, NotePencil, Plus, TextAlignJustify } from "@phosphor-icons/react";
import Image from "next/image";
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

const ROLLING_PAPER_BOARD_WRAP =
  "relative flex h-full min-h-0 max-h-full w-full max-w-[min(420px,calc(100vw-1.5rem))] flex-1 flex-col overflow-visible bg-transparent";

const ROLLING_PAPER_BOARD_FRAME =
  "relative isolate overflow-visible rounded-[18px] shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] ring-1 wishlist-board-frame--decorate mx-auto w-full max-w-[372px] max-h-[min(680px,100%)] shrink-0 ring-violet-200/55";

const ROLLING_PAPER_BOARD_INNER =
  "relative h-full w-full min-h-0 min-w-0 overflow-visible bg-transparent";

const COLLAGE_BG = "bg-[#f4f2ec]";

/**
 * `public/rollingpaper` 콜라주 에셋 매칭
 * - `rollingpaper-01.png` — 폴라로이드(기존)
 * - `postit_01.png` … `postit_04.png` — 예전 `rollingpaper-02`~`05` 자리·동일 해상도
 */
const COLLAGE_PIECES: {
  src: string;
  className: string;
  /** 원본 PNG 비율 */
  aspect: [number, number];
  alt: string;
}[] = [
  {
    src: "/rollingpaper/rollingpaper-01.png",
    className: "left-[5%] top-[1%] z-10 w-[46%] -rotate-[7deg]",
    aspect: [376, 489],
    alt: "폴라로이드 포토 프레임",
  },
  {
    src: "/rollingpaper/postit_01.png",
    className: "right-2 top-[16%] z-[30] w-[42%] rotate-[4deg]",
    aspect: [435, 466],
    alt: "포스트잇1",
  },
  {
    src: "/rollingpaper/postit_02.png",
    className: "left-[6%] top-[38%] z-[14] w-[56%] -rotate-[6deg]",
    aspect: [642, 571],
    alt: "포스트잇2",
  },
  {
    src: "/rollingpaper/postit_03.png",
    className: "right-[4%] bottom-[18%] z-[18] w-[44%] rotate-[5deg]",
    aspect: [458, 542],
    alt: "포스트잇3",
  },
  {
    src: "/rollingpaper/postit_04.png",
    className: "left-[7%] bottom-[4%] z-[22] w-[42%] -rotate-[10deg]",
    aspect: [399, 436],
    alt: "포스트잇4",
  },
];

const ROLLING_PAPER_PAGE_COUNT = 5;

export default function RollingPaperSlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const displayName = useMemo(() => {
    const raw = slug?.trim() || "";
    if (!raw) return "회원";
    try {
      return decodeURIComponent(raw).replace(/-/g, " ");
    } catch {
      return raw.replace(/-/g, " ");
    }
  }, [slug]);

  const loginHrefWithReturn = useMemo(() => {
    const qs = searchParams.toString();
    return loginUrlForPath(`${pathname}${qs ? `?${qs}` : ""}`);
  }, [pathname, searchParams]);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [visitorMenuLoggedIn, setVisitorMenuLoggedIn] = useState(false);
  const [sheetPage, setSheetPage] = useState(0);

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
    let cancelled = false;
    void Promise.resolve().then(() => {
      if (!cancelled) void syncVisitorSession();
    });
    return () => {
      cancelled = true;
    };
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
                <div
                  className={`pointer-events-none absolute inset-0 z-0 rounded-[18px] ${COLLAGE_BG}`}
                  aria-hidden
                />

                <div
                  className={`${ROLLING_PAPER_BOARD_INNER} relative z-10 flex h-full min-h-0 flex-col`}
                >
                  <header className={PAGE_HEADER_ROW_COMPACT}>
                    <div className={`${PAGE_HEADER_LEADING_CLUSTER} items-start`}>
                      <h1 className="min-w-0 flex-1 text-left leading-snug text-slate-900">
                        <span className="block text-[clamp(15px,4.2vw,18px)]">
                          <span className="font-bold text-[#7B61FF]">{displayName}</span>
                          <span className="font-light text-slate-900">님을 위한 롤링페이퍼</span>
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

                  <div
                    className={`relative mx-2 mb-1 mt-0 min-h-0 flex-1 overflow-visible rounded-[14px] ${COLLAGE_BG} shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]`}
                  >
                    {COLLAGE_PIECES.map((piece) => {
                      const [aw, ah] = piece.aspect;
                      return (
                        <div
                          key={piece.src}
                          className={`pointer-events-none absolute ${piece.className}`}
                          style={{ aspectRatio: `${aw} / ${ah}` }}
                        >
                          <div className="relative h-full w-full">
                            <Image
                              src={piece.src}
                              alt={piece.alt}
                              fill
                              className="object-contain drop-shadow-[0_8px_20px_rgba(0,0,0,0.1)]"
                              sizes="(max-width: 420px) 50vw, 220px"
                              priority={piece.src.endsWith("01.png")}
                            />
                          </div>
                        </div>
                      );
                    })}

                    <div className="pointer-events-none absolute inset-x-0 bottom-3 z-40 flex justify-center px-2">
                      <div className="pointer-events-auto flex items-center gap-1.5 rounded-full bg-white/90 px-1 py-1 shadow-md backdrop-blur-[2px]">
                        <button
                          type="button"
                          className="flex size-[42px] shrink-0 items-center justify-center rounded-full bg-white text-[#7B61FF] shadow-sm transition hover:bg-white/95 disabled:pointer-events-none disabled:opacity-30"
                          aria-label="이전 페이지"
                          disabled={sheetPage <= 0}
                          onClick={() => setSheetPage((p) => Math.max(0, p - 1))}
                        >
                          <CaretLeftIcon size={23} weight="bold" />
                        </button>
                        <span className="min-w-[52px] text-center text-[12px] font-bold tabular-nums text-[#7B61FF]">
                          {sheetPage + 1} / {ROLLING_PAPER_PAGE_COUNT}
                        </span>
                        <button
                          type="button"
                          className="flex size-[42px] shrink-0 items-center justify-center rounded-full bg-white text-[#7B61FF] shadow-sm transition hover:bg-white/95 disabled:pointer-events-none disabled:opacity-30"
                          aria-label="다음 페이지"
                          disabled={sheetPage >= ROLLING_PAPER_PAGE_COUNT - 1}
                          onClick={() =>
                            setSheetPage((p) =>
                              Math.min(ROLLING_PAPER_PAGE_COUNT - 1, p + 1),
                            )
                          }
                        >
                          <CaretRightIcon size={23} weight="bold" />
                        </button>
                      </div>
                    </div>

                    <div className="pointer-events-auto absolute bottom-16 right-3 z-40 flex flex-col gap-2.5">
                      <button
                        type="button"
                        className="flex size-[46px] items-center justify-center rounded-full bg-white text-[#7B61FF] shadow-lg transition hover:bg-white/95 active:scale-[0.98]"
                        aria-label="메모"
                      >
                        <NotePencil size={24} weight="bold" />
                      </button>
                      <button
                        type="button"
                        className="flex size-[46px] items-center justify-center rounded-full bg-[#7B61FF] text-white shadow-lg transition hover:bg-[#6b52e0] active:scale-[0.98]"
                        aria-label="추가"
                      >
                        <Plus size={24} weight="bold" className="opacity-95" />
                      </button>
                    </div>
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
