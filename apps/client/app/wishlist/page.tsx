"use client";

import { useState } from "react";

import {
  DESIGN_HEIGHT,
  DESIGN_WIDTH,
  GiftSlots,
  StickerSlots,
  toXPercent,
  toYPercent,
  type GiftLayoutCount,
} from "@/components/wishlist/WishlistSlots";

type DecorTab = "background" | "sticker" | "wishlist";

export default function WishlistPage() {
  const [bigCircleCount, setBigCircleCount] = useState<GiftLayoutCount>(2);
  const [giftImages, setGiftImages] = useState<Partial<Record<number, string | null>>>({});
  const [stickerImages, setStickerImages] = useState<Partial<Record<number, string | null>>>({});
  const [isDecorOpen, setIsDecorOpen] = useState(false);
  const [activeDecorTab, setActiveDecorTab] = useState<DecorTab>("background");

  const createPreviewImage = (slotId: number, color: string) => {
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
        <rect width="200" height="200" rx="40" fill="${color}" />
        <circle cx="100" cy="76" r="34" fill="rgba(255,255,255,0.35)" />
        <rect x="42" y="124" width="116" height="24" rx="12" fill="rgba(255,255,255,0.45)" />
        <text x="100" y="182" text-anchor="middle" fill="white" font-size="28" font-family="Arial, sans-serif">${slotId}</text>
      </svg>
    `;

    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  };

  const toggleGiftImage = (slotId: number) => {
    setGiftImages((current) => ({
      ...current,
      [slotId]: current[slotId] ? null : createPreviewImage(slotId, "#d17c6b"),
    }));
  };

  const toggleStickerImage = (slotId: number) => {
    setStickerImages((current) => ({
      ...current,
      [slotId]: current[slotId] ? null : createPreviewImage(slotId, "#7a9d96"),
    }));
  };

  const decorOptions = {
    background: [
      { id: "mint", label: "Mint Pop" },
      { id: "cream", label: "Cream Dot" },
      { id: "sky", label: "Sky Blur" },
      { id: "berry", label: "Berry Jam" },
    ],
    sticker: [
      { id: "heart", label: "Heart Pack" },
      { id: "ribbon", label: "Ribbon Pack" },
      { id: "star", label: "Star Pack" },
      { id: "minimal", label: "Minimal" },
    ],
    wishlist: [
      { id: "single", label: "Single Focus" },
      { id: "basic", label: "Basic 2" },
      { id: "party", label: "Party 3" },
      { id: "full", label: "Full Set" },
    ],
  } satisfies Record<DecorTab, { id: string; label: string }[]>;

  return (
    <main className="relative min-h-[100dvh] overflow-hidden bg-[#e6e6e6] p-3">
      <div
        className={`absolute inset-0 bg-black/20 transition-opacity duration-300 ${
          isDecorOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={() => setIsDecorOpen(false)}
      />

      <div
        className={`grid min-h-[calc(100dvh-1.5rem)] place-items-center transition-transform duration-300 ease-out ${
          isDecorOpen ? "-translate-y-20" : "translate-y-0"
        }`}
      >
        <section
          className="relative w-full max-w-[390px] overflow-hidden rounded-sm"
          style={{ aspectRatio: `${DESIGN_WIDTH} / ${DESIGN_HEIGHT}` }}
        >
          <div className="relative h-full w-full overflow-hidden rounded-sm bg-[#efefef]">
            <header className="flex items-center justify-between px-[8%] pt-[8%]">
              <h1 className="text-wish-title">WishList</h1>
              <button type="button" className="text-h2 leading-none" aria-label="Open menu">
                Menu
              </button>
            </header>

            <GiftSlots
              count={bigCircleCount}
              images={giftImages}
              onSlotClick={toggleGiftImage}
            />
            <StickerSlots images={stickerImages} onSlotClick={toggleStickerImage} />

            <button
              type="button"
              onClick={() =>
                setBigCircleCount((prev) => (prev === 3 ? 1 : ((prev + 1) as GiftLayoutCount)))
              }
              className="absolute -translate-y-1/2 text-h2 text-[#8a8a8a]"
              style={{ right: toXPercent(10), top: toYPercent(360) }}
              aria-label="Show next layout"
            >
              Next
            </button>

            <div
              className="absolute flex flex-col gap-3"
              style={{ right: toXPercent(10), bottom: toYPercent(52) }}
            >
              <button
                type="button"
                onClick={() => setIsDecorOpen(true)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-[#d9d9d9] text-body"
                aria-label="Open decorate bottom sheet"
              >
                Edit
              </button>
              <button
                type="button"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-[#d9d9d9] text-body"
                aria-label="Share wishlist"
              >
                Share
              </button>
            </div>

            <footer className="absolute bottom-0 left-0 flex h-[6%] min-h-10 w-full items-center bg-[#d2d2d2] px-6">
              <span className="text-body-sm">Ad Banner</span>
            </footer>
          </div>
        </section>
      </div>

      <section
        className={`absolute inset-x-0 bottom-0 z-10 rounded-t-[28px] bg-white px-5 pb-8 pt-3 shadow-[0_-12px_32px_rgba(0,0,0,0.14)] transition-transform duration-300 ease-out ${
          isDecorOpen ? "translate-y-0" : "translate-y-full"
        }`}
        aria-hidden={!isDecorOpen}
      >
        <div className="mx-auto mb-4 h-1.5 w-14 rounded-full bg-[#d9d9d9]" />

        <div className="mx-auto flex w-full max-w-[390px] items-start justify-between gap-4">
          <div>
            <h2 className="text-h3 text-slate-900">꾸미기</h2>
            <p className="mt-1 text-body-sm text-slate-600">
              내 마음대로 위시리스트를 꾸며보아요 
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsDecorOpen(false)}
            className="rounded-full bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700"
            aria-label="Close decorate bottom sheet"
          >
            닫기
          </button>
        </div>

        <div className="mx-auto mt-5 flex w-full max-w-[390px] gap-2 overflow-x-auto pb-1">
          {(["background", "sticker", "wishlist"] as DecorTab[]).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveDecorTab(tab)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                activeDecorTab === tab
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              {tab === "background"
                ? "배경"
                : tab === "sticker"
                  ? "스티커"
                  : "선물"}
            </button>
          ))}
        </div>

        <div className="mx-auto mt-4 grid w-full max-w-[390px] grid-cols-2 gap-3">
          {decorOptions[activeDecorTab].map((option) => (
            <button
              key={option.id}
              type="button"
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-left transition hover:border-slate-400 hover:bg-white"
            >
              <div className="mb-3 h-20 rounded-xl bg-gradient-to-br from-slate-200 to-slate-100" />
              <p className="text-sm font-semibold text-slate-900">{option.label}</p>
              <p className="mt-1 text-xs text-slate-500">
                {activeDecorTab === "background"
                  ? "배경 스타일을 바꿉니다."
                  : activeDecorTab === "sticker"
                    ? "스티커 스타일을 바꿉니다."
                    : "선물 구성을 바꿉니다."}
              </p>
            </button>
          ))}
        </div>
      </section>
    </main>
  );
}
