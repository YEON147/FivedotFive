"use client";

import {
  Export,
  PencilSimple,
  SignOut,
  TextAlignJustify,
  UserCircle,
} from "@phosphor-icons/react";
import Image from "next/image";
<<<<<<< HEAD
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
=======
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { clearAccessToken } from "@/lib/api/token-store";
>>>>>>> ce13dd9b9fa06bfd0132210f293e32c6836398b8

import {
  DESIGN_HEIGHT,
  DESIGN_WIDTH,
  GiftSlots,
  StickerSlots,
  type GiftLayoutCount,
} from "@/components/wishlist/WishlistSlots";
<<<<<<< HEAD
import { getMyBoard } from "@/features/wishlist/api";
import { getAccessToken } from "@/lib/api/token-store";
=======
import { fetchBackgroundAssets, type BackgroundAssetDto } from "@/lib/api/assets";
import { getAssetImageUrl } from "@/lib/asset-url";
>>>>>>> ce13dd9b9fa06bfd0132210f293e32c6836398b8

type DecorTab = "background" | "sticker" | "wishlist";

function DefaultOptionButton({
  className = "",
  label = "Default",
}: {
  className?: string;
  label?: string;
}) {
  return (
    <button
      type="button"
      className={`flex items-center justify-center overflow-hidden rounded-2xl border border-slate-300 bg-white text-slate-500 transition hover:border-slate-400 ${className}`}
      aria-label={`${label} option`}
    >
      <span className="text-xl font-semibold leading-none">×</span>
    </button>
  );
}

<<<<<<< HEAD
const decorOptions = {
  background: [
    { id: "wallpaper1", label: "Wallpaper 1", src: "/wallpaper/wallpaper1.png" },
    { id: "wallpaper2", label: "Wallpaper 2", src: "/wallpaper/wallpaper2.png" },
    { id: "wallpaper3", label: "Wallpaper 3", src: "/wallpaper/wallpaper3.png" },
    { id: "wallpaper4", label: "Wallpaper 4", src: "/wallpaper/wallpaper4.png" },
  ],
  sticker: [
=======
const decorStickerOptions = [
>>>>>>> ce13dd9b9fa06bfd0132210f293e32c6836398b8
    { id: "sticker1", label: "Sticker 1", src: "/sticker/sticker1.png" },
    { id: "sticker2", label: "Sticker 2", src: "/sticker/sticker2.png" },
    { id: "sticker3", label: "Sticker 3", src: "/sticker/sticker3.png" },
    { id: "sticker4", label: "Sticker 4", src: "/sticker/sticker4.png" },
    { id: "sticker5", label: "Sticker 5", src: "/sticker/sticker5.png" },
    { id: "sticker6", label: "Sticker 6", src: "/sticker/sticker6.png" },
  ] as const;

const decorTabMeta: Record<DecorTab, { label: string; title: string; description: string }> = {
  background: {
    label: "배경",
    title: "배경",
    description: "Adjust the full board mood and colors.",
  },
  sticker: {
    label: "스티커",
    title: "스티커",
    description: "Change the decorative sticker style.",
  },
  wishlist: {
    label: "위시",
    title: "위시리스트",
    description: "Add wishes and change the visible item count.",
  },
};

export default function WishlistPage() {
  const router = useRouter();
  const [bigCircleCount, setBigCircleCount] = useState<GiftLayoutCount>(1);
  const [wishTexts, setWishTexts] = useState(["", "", ""]);
  const [isFabOpen, setIsFabOpen] = useState(false);
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [sidebarPortalReady, setSidebarPortalReady] = useState(false);
  const [activeDecorTab, setActiveDecorTab] = useState<DecorTab>("background");
<<<<<<< HEAD
  const [boardSlug, setBoardSlug] = useState<string | null>(null);
  const backgroundHoldTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!getAccessToken()) {
      router.replace("/login");
      return;
    }
    getMyBoard()
      .then((data) => setBoardSlug(data.data.boardSlug))
      .catch(() => {});
  }, [router]);
=======
  const [backgroundAssets, setBackgroundAssets] = useState<BackgroundAssetDto[]>([]);
  const [backgroundsLoading, setBackgroundsLoading] = useState(false);
  const [backgroundsError, setBackgroundsError] = useState<string | null>(null);
  const backgroundHoldTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isBottomSheetOpen || activeDecorTab !== "background") {
      return;
    }

    let cancelled = false;

    const load = async () => {
      setBackgroundsLoading(true);
      setBackgroundsError(null);
      try {
        const list = await fetchBackgroundAssets();
        if (!cancelled) {
          setBackgroundAssets(list);
        }
      } catch (error) {
        if (!cancelled) {
          setBackgroundAssets([]);
          setBackgroundsError(
            error instanceof Error ? error.message : "배경 목록을 불러오지 못했습니다.",
          );
        }
      } finally {
        if (!cancelled) {
          setBackgroundsLoading(false);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [isBottomSheetOpen, activeDecorTab]);
>>>>>>> ce13dd9b9fa06bfd0132210f293e32c6836398b8

  const closeEditUi = () => {
    setIsFabOpen(false);
    setIsBottomSheetOpen(false);
    setIsShareModalOpen(false);
    setIsSidebarOpen(false);
  };

  const toggleSidebar = () => {
    setIsFabOpen(false);
    setIsBottomSheetOpen(false);
    setIsShareModalOpen(false);
    setIsSidebarOpen((prev) => !prev);
  };

  const handleLogout = () => {
    clearAccessToken();
    setIsSidebarOpen(false);
    router.push("/login");
  };

  useEffect(() => {
    if (!isSidebarOpen) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsSidebarOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isSidebarOpen]);

  useEffect(() => {
    setSidebarPortalReady(true);
  }, []);

  const openDecorSheet = (tab: DecorTab) => {
    setActiveDecorTab(tab);
    setIsBottomSheetOpen(true);
  };

  const startBackgroundHold = () => {
    if (backgroundHoldTimerRef.current) {
      clearTimeout(backgroundHoldTimerRef.current);
    }

    backgroundHoldTimerRef.current = setTimeout(() => {
      openDecorSheet("background");
      backgroundHoldTimerRef.current = null;
    }, 1000);
  };

  const cancelBackgroundHold = () => {
    if (!backgroundHoldTimerRef.current) {
      return;
    }

    clearTimeout(backgroundHoldTimerRef.current);
    backgroundHoldTimerRef.current = null;
  };

  const isDecorating = isFabOpen || isBottomSheetOpen;

  return (
    <main className="fixed inset-0 h-[100dvh] overflow-hidden bg-[#e6e6e6] p-3">
      <div
        className={`fixed inset-0 z-20 bg-black/20 transition-opacity duration-300 ${
          isFabOpen || isBottomSheetOpen || isShareModalOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        }`}
        onClick={closeEditUi}
      />

      <div
        className={`relative grid place-items-center transition-all duration-300 ease-out ${
          isBottomSheetOpen ? "h-[calc(52dvh-1.5rem)]" : "h-[calc(100dvh-1.5rem)]"
        }`}
      >
        <section
          className="relative h-full w-auto max-w-[390px] overflow-hidden rounded-sm"
          style={{ aspectRatio: `${DESIGN_WIDTH} / ${DESIGN_HEIGHT}` }}
        >
          <div className="relative h-full w-full overflow-hidden rounded-sm bg-[#efefef]">
            <button
              type="button"
              onMouseDown={startBackgroundHold}
              onMouseUp={cancelBackgroundHold}
              onMouseLeave={cancelBackgroundHold}
              onTouchStart={startBackgroundHold}
              onTouchEnd={cancelBackgroundHold}
              onTouchCancel={cancelBackgroundHold}
              className="absolute inset-0"
              aria-label="Hold background for 1 second to edit"
            />

            <header className="relative z-40 flex items-center justify-between pl-[8%] pr-[4%] pt-[8%]">
              <h1 className="text-wish-title">WishList</h1>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  toggleSidebar();
                }}
                className="relative z-40 flex h-12 w-12 items-center justify-center rounded-full bg-white text-[#7B61FF] shadow-lg transition hover:bg-slate-50"
                aria-label="메뉴 열기"
                aria-expanded={isSidebarOpen}
              >
                <TextAlignJustify size={22} weight="bold" />
              </button>
            </header>

            <GiftSlots
              count={bigCircleCount}
              images={{}}
              onSlotClick={() => openDecorSheet("wishlist")}
              showPlaceholder={isDecorating}
            />
            <StickerSlots
              images={{}}
              onSlotClick={() => openDecorSheet("sticker")}
              showPlaceholder={isDecorating}
            />

            <footer className="absolute bottom-0 left-0 flex h-[6%] min-h-10 w-full items-center bg-[#d2d2d2] px-6">
              <span className="text-body-sm">Ad Banner</span>
            </footer>

            <div
              className={`absolute z-30 flex flex-col items-end gap-3 transition-opacity duration-200 ${
                isBottomSheetOpen ? "pointer-events-none opacity-0" : "pointer-events-none opacity-100"
              }`}
              style={{ right: "4%", bottom: "12%" }}
            >
              <div
                className={`flex flex-col items-end gap-2 transition-all duration-200 ${
                  isFabOpen
                    ? "pointer-events-auto translate-y-0 opacity-100"
                    : "pointer-events-none translate-y-4 opacity-0"
                }`}
              >
                {(["background", "sticker", "wishlist"] as DecorTab[]).map((tab, index) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => openDecorSheet(tab)}
                    className={`flex h-12 w-12 items-center justify-center rounded-full text-[11px] font-semibold leading-tight shadow-lg transition-all duration-200 ${
                      activeDecorTab === tab && isBottomSheetOpen
                        ? "bg-[#2f3a35] text-white"
                        : "bg-white text-slate-700"
                    }`}
                    style={{ transitionDelay: isFabOpen ? `${index * 40}ms` : "0ms" }}
                    aria-label={`${decorTabMeta[tab].label} options`}
                  >
                    {decorTabMeta[tab].label}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => {
                  if (isFabOpen) {
                    closeEditUi();
                    return;
                  }

                  setIsFabOpen(true);
                }}
                className="pointer-events-auto flex h-12 w-12 items-center justify-center rounded-full bg-white text-body text-[#7B61FF] shadow-lg"
                aria-label="Open edit actions"
              >
                <PencilSimple size={22} weight="bold" />
              </button>

              <button
                type="button"
                onClick={() => setIsShareModalOpen(true)}
                className="pointer-events-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#7B61FF] text-body text-white shadow-lg"
                aria-label="Share wishlist"
              >
                <Export size={22} weight="bold" />
              </button>
            </div>
          </div>
        </section>
      </div>

      <section
<<<<<<< HEAD
        className={`absolute inset-x-0 bottom-0 z-30 max-h-[46dvh] rounded-t-[28px] bg-white px-5 pb-6 pt-4 shadow-[0_-12px_32px_rgba(0,0,0,0.14)] transition-transform duration-300 ease-out ${
=======
        className={`absolute inset-x-0 bottom-0 z-30 max-h-[48dvh] rounded-t-[28px] bg-white px-5 pb-6 pt-4 shadow-[0_-12px_32px_rgba(0,0,0,0.14)] transition-transform duration-300 ease-out ${
>>>>>>> ce13dd9b9fa06bfd0132210f293e32c6836398b8
          isBottomSheetOpen ? "translate-y-0" : "translate-y-full"
        }`}
        aria-hidden={!isBottomSheetOpen}
      >
        <div className="mx-auto flex h-full w-full max-w-[390px] flex-col">
          <div className="mb-4 h-1.5 w-14 self-center rounded-full bg-[#d9d9d9]" />

          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-h3 text-slate-900">{decorTabMeta[activeDecorTab].title}</h2>
              <p className="mt-1 text-body-sm text-slate-600">
                {decorTabMeta[activeDecorTab].description}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsBottomSheetOpen(false)}
              className="rounded-full bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700"
              aria-label="Close edit bottom sheet"
            >
              닫기
            </button>
          </div>

          {activeDecorTab === "background" ? (
            <div className="mt-5 overflow-x-auto overflow-y-hidden pb-3">
              {backgroundsLoading ? (
                <p className="text-body-sm text-slate-500">배경 불러오는 중…</p>
              ) : null}
              {backgroundsError ? (
                <p className="text-body-sm text-red-600" role="alert">
                  {backgroundsError}
                </p>
              ) : null}
              <div className="flex w-max gap-3 pr-1">
                <div className="w-40 shrink-0 text-left">
                  <DefaultOptionButton className="aspect-[3/4] w-full rounded-xl" />
                  <p className="mt-2 text-[11px] leading-tight text-slate-700">Default</p>
                </div>

<<<<<<< HEAD
                {decorOptions.background.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    className="w-40 shrink-0 text-left transition hover:opacity-90"
                  >
                    <div className="relative aspect-[3/4] overflow-hidden rounded-xl">
                      <Image
                        src={option.src}
                        alt={option.label}
                        fill
                        sizes="160px"
                        className="object-contain"
                      />
                    </div>
                    <p className="mt-2 text-[11px] leading-tight text-slate-700">{option.label}</p>
                  </button>
                ))}
=======
                {backgroundAssets.map((bg) => {
                  const src = getAssetImageUrl(bg.assetKey);
                  const label =
                    bg.assetKey.split("/").pop()?.replace(/\.[^.]+$/, "") ?? `배경 ${bg.id}`;

                  return (
                    <button
                      key={bg.id}
                      type="button"
                      className="w-40 shrink-0 text-left transition hover:opacity-90"
                    >
                      <div className="relative aspect-[3/4] overflow-hidden rounded-xl bg-slate-100">
                        <img
                          src={src}
                          alt={label}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      </div>
                      <p className="mt-2 text-[11px] leading-tight text-slate-700">{label}</p>
                    </button>
                  );
                })}
>>>>>>> ce13dd9b9fa06bfd0132210f293e32c6836398b8
              </div>
            </div>
          ) : null}

          {activeDecorTab === "sticker" ? (
            <div className="mt-5 grid grid-cols-4 gap-3 overflow-y-auto pr-1">
              <DefaultOptionButton className="aspect-square w-full" />

<<<<<<< HEAD
              {decorOptions.sticker.map((option) => (
=======
              {decorStickerOptions.map((option) => (
>>>>>>> ce13dd9b9fa06bfd0132210f293e32c6836398b8
                <button
                  key={option.id}
                  type="button"
                  className="aspect-square overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 transition hover:border-slate-400 hover:bg-white"
                >
                  <div className="relative h-full w-full overflow-hidden rounded-2xl bg-gradient-to-br from-slate-200 to-slate-100">
                    <Image
                      src={option.src}
                      alt={option.label}
                      fill
                      sizes="(max-width: 390px) 22vw, 84px"
                      className="object-cover"
                    />
                  </div>
                </button>
              ))}
            </div>
          ) : null}

          {activeDecorTab === "wishlist" ? (
            <div className="mt-5 space-y-4 overflow-y-auto pr-1 pb-2">
              {Array.from({ length: bigCircleCount }, (_, index) => (
                <div key={`wish-input-${index + 1}`} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={wishTexts[index]}
                      onChange={(event) => {
                        const nextTexts = [...wishTexts];
                        nextTexts[index] = event.target.value;
                        setWishTexts(nextTexts);
                      }}
                      placeholder={`Wish ${index + 1}`}
                      className="h-12 flex-1 rounded-full border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (bigCircleCount === 1) {
                          return;
                        }

                        const nextTexts = [...wishTexts];
                        nextTexts.splice(index, 1);
                        nextTexts.push("");
                        setWishTexts(nextTexts);
                        setBigCircleCount((prev) =>
                          prev > 1 ? ((prev - 1) as GiftLayoutCount) : prev,
                        );
                      }}
                      disabled={bigCircleCount === 1}
                      className={`shrink-0 rounded-full px-3 py-2 text-xs font-semibold transition ${
                        bigCircleCount === 1
                          ? "cursor-not-allowed bg-slate-100 text-slate-400"
                          : "bg-slate-200 text-slate-800"
                      }`}
                      aria-label={`Delete wish ${index + 1}`}
                    >
                      삭제
                    </button>
                  </div>

                  {index === bigCircleCount - 1 && bigCircleCount < 3 ? (
                    <div className="flex justify-center">
                      <button
                        type="button"
                        onClick={() => {
                          const nextTexts = [...wishTexts];
                          nextTexts.splice(index + 1, 0, "");
                          setWishTexts(nextTexts.slice(0, 3));
                          setBigCircleCount((prev) =>
                            prev < 3 ? ((prev + 1) as GiftLayoutCount) : prev,
                          );
                        }}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-[#2f3a35] text-base font-semibold text-white transition"
                        aria-label={`Add wish after ${index + 1}`}
                      >
                        +
                      </button>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </section>

      <section
        className={`fixed left-1/2 top-1/2 z-30 w-[min(320px,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-3xl bg-white px-5 py-6 shadow-[0_24px_60px_rgba(0,0,0,0.18)] transition-all duration-300 ${
          isShareModalOpen
            ? "pointer-events-auto scale-100 opacity-100"
            : "pointer-events-none scale-95 opacity-0"
        }`}
        aria-hidden={!isShareModalOpen}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-h3 text-slate-900">공유하기</h2>
            <p className="mt-1 text-body-sm text-slate-600">
              위시리스트 링크를 복사하거나 공유할 수 있어요.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsShareModalOpen(false)}
            className="rounded-full bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700"
            aria-label="Close share modal"
          >
            닫기
          </button>
        </div>

        <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 break-all">
          {boardSlug
            ? `${window.location.origin}/wishlist/${boardSlug}`
            : "링크를 불러오는 중..."}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <button
            type="button"
            disabled={!boardSlug}
            onClick={() => {
              if (!boardSlug) return;
              navigator.clipboard.writeText(
                `${window.location.origin}/wishlist/${boardSlug}`,
              );
            }}
            className="rounded-2xl bg-[#7B61FF] px-4 py-3 text-sm font-semibold text-white disabled:opacity-40"
          >
            링크 복사
          </button>
          <button
            type="button"
            disabled={!boardSlug}
            onClick={() => {
              if (!boardSlug || !navigator.share) return;
              navigator.share({
                title: "내 위시리스트",
                url: `${window.location.origin}/wishlist/${boardSlug}`,
              });
            }}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 disabled:opacity-40"
          >
            공유하기
          </button>
        </div>
      </section>

      {sidebarPortalReady
        ? createPortal(
            <>
              <div
                className={`fixed inset-0 z-[100] bg-black/35 transition-opacity duration-300 ${
                  isSidebarOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
                }`}
                onClick={() => setIsSidebarOpen(false)}
                aria-hidden={!isSidebarOpen}
              />

              <aside
                className={`fixed inset-y-0 right-0 z-[101] flex w-[min(300px,88vw)] flex-col bg-white shadow-[-12px_0_40px_rgba(0,0,0,0.12)] transition-transform duration-300 ease-out ${
                  isSidebarOpen ? "translate-x-0" : "translate-x-full"
                }`}
                aria-hidden={!isSidebarOpen}
              >
                <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                  <span className="text-h3 text-slate-900">메뉴</span>
                  <button
                    type="button"
                    onClick={() => setIsSidebarOpen(false)}
                    className="rounded-full bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
                    aria-label="메뉴 닫기"
                  >
                    닫기
                  </button>
                </div>

                <nav className="flex flex-1 flex-col gap-1 p-3">
                  <Link
                    href="/mypage"
                    onClick={() => setIsSidebarOpen(false)}
                    className="flex items-center gap-3 rounded-2xl px-4 py-3.5 text-body font-medium text-slate-800 transition hover:bg-slate-50"
                  >
                    <UserCircle size={22} weight="regular" className="shrink-0 text-[#7B61FF]" />
                    내정보 조회
                  </Link>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 rounded-2xl px-4 py-3.5 text-left text-body font-medium text-rose-600 transition hover:bg-rose-50"
                  >
                    <SignOut size={22} weight="bold" className="shrink-0" />
                    로그아웃
                  </button>
                </nav>
              </aside>
            </>,
            document.body,
          )
        : null}
    </main>
  );
}
