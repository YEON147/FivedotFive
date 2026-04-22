"use client";

import {
  CaretLeft,
  CaretRight,
  Export,
  PencilSimple,
  SignOut,
  TextAlignJustify,
  UserCircle,
} from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { clearAccessToken, getAccessToken } from "@/lib/api/token-store";

import {
  DESIGN_HEIGHT,
  DESIGN_WIDTH,
  GiftSlots,
  StickerSlots,
  type GiftLayoutCount,
} from "@/components/wishlist/WishlistSlots";
import { getMyBoard, patchMyWishItem } from "@/features/wishlist/api";
import type { BoardAssetData, WishItemData } from "@/features/wishlist/types";
import { getMyProfile } from "@/features/user/api";
import {
  fetchBackgroundAssets,
  fetchGiftIcons,
  type BackgroundAssetDto,
  type GiftIconDto,
} from "@/lib/api/assets";
import { getAssetImageUrl } from "@/lib/asset-url";

/** 선물 아이콘 선택 모달: 한 페이지에 표시할 개수 (4열 × 2행) */
const GIFT_ICON_PAGE_SIZE = 8;
/** 고정 슬롯 2개(삭제 · 기본 선물) 제외 후 첫 페이지에 넣을 API 아이콘 수 */
const GIFT_MODAL_FIRST_PAGE_API_COUNT = GIFT_ICON_PAGE_SIZE - 2;
/** PATCH·로컬 상태와 동일하게 쓰는 선물 프리셋 아이콘 키 (`public/icon/present.png`) */
const GIFT_MODAL_PRESET_PRESENT_KEY = "icon/present.png";

type GiftModalSpecial = "clear" | "present" | null;

/** 스티커 모달 카테고리 탭 자리표시자 — 백엔드 연동 시 교체 */
const STICKER_MODAL_TABS = [
  { id: "all", label: "전체" },
  { id: "c1", label: "카테고리1" },
  { id: "c2", label: "카테고리2" },
  { id: "c3", label: "카테고리3" },
] as const;

type StickerModalTabId = (typeof STICKER_MODAL_TABS)[number]["id"];

const STICKER_MODAL_GRID_COLS = 6;
/** 6열 × 3행 */
const STICKER_MODAL_SLOT_COUNT = STICKER_MODAL_GRID_COLS * 3;

function areAllWishSlotsEmpty(items: WishItemData[]): boolean {
  if (items.length === 0) {
    return true;
  }
  return items.every((row) => !row.itemName?.trim() && !row.iconKey?.trim());
}

function DefaultOptionButton({
  className = "",
  label = "Default",
  onClick,
}: {
  className?: string;
  label?: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center justify-center overflow-hidden rounded-2xl border border-slate-300 bg-white text-slate-500 transition hover:border-slate-400 ${className}`}
      aria-label={`${label} option`}
    >
      <span className="text-xl font-semibold leading-none">×</span>
    </button>
  );
}

export default function WishlistPage() {
  const router = useRouter();
  const [bigCircleCount, setBigCircleCount] = useState<GiftLayoutCount>(1);
  const [wishTexts, setWishTexts] = useState(["", "", ""]);
  const [wishGiftIconKeys, setWishGiftIconKeys] = useState(["", "", ""]);
  const [isGiftModalOpen, setIsGiftModalOpen] = useState(false);
  const [giftModalMode, setGiftModalMode] = useState<"add" | "edit">("add");
  const [giftModalSlotIndex, setGiftModalSlotIndex] = useState(0);
  const [modalGiftName, setModalGiftName] = useState("");
  const [modalSelectedIconId, setModalSelectedIconId] = useState<number | null>(null);
  const [giftIcons, setGiftIcons] = useState<GiftIconDto[]>([]);
  const [giftIconsLoading, setGiftIconsLoading] = useState(false);
  const [giftIconsError, setGiftIconsError] = useState<string | null>(null);
  const [giftModalSaving, setGiftModalSaving] = useState(false);
  const [giftModalSaveError, setGiftModalSaveError] = useState<string | null>(null);
  const [giftModalSpecial, setGiftModalSpecial] = useState<GiftModalSpecial>(null);
  const [giftIconPage, setGiftIconPage] = useState(0);
  const [isDecorateMode, setIsDecorateMode] = useState(false);
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);
  const [stickerTargetSlotId, setStickerTargetSlotId] = useState<number | null>(null);
  const [pendingStickerBySlot, setPendingStickerBySlot] = useState<
    Partial<Record<number, string | null>>
  >({});
  /** `null` = 서버 값 사용, `""` = 기본(배경만), 그 외 = 선택한 에셋 키 */
  const [draftBackgroundAssetKey, setDraftBackgroundAssetKey] = useState<string | null>(null);
  const [isCompactBackgroundOpen, setIsCompactBackgroundOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [sidebarPortalReady, setSidebarPortalReady] = useState(false);
  const [boardSlug, setBoardSlug] = useState<string | null>(null);
  const [boardAssets, setBoardAssets] = useState<BoardAssetData[]>([]);
  const [wishSlotsLoaded, setWishSlotsLoaded] = useState(false);
  const [allWishSlotsEmpty, setAllWishSlotsEmpty] = useState(false);
  const [bypassEmptyState, setBypassEmptyState] = useState(false);
  const [viewerName, setViewerName] = useState("회원");
  const [backgroundAssets, setBackgroundAssets] = useState<BackgroundAssetDto[]>([]);
  const [backgroundsLoading, setBackgroundsLoading] = useState(false);
  const [backgroundsError, setBackgroundsError] = useState<string | null>(null);
  const [stickerModalTab, setStickerModalTab] = useState<StickerModalTabId>("all");
  const backgroundHoldTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!getAccessToken()) {
      router.replace("/login");
      return;
    }

    let cancelled = false;

    const load = async () => {
      setWishSlotsLoaded(false);
      setGiftIconsLoading(true);
      try {
        const settled = await Promise.allSettled([
          getMyBoard(),
          getMyProfile(),
          fetchGiftIcons(),
        ]);

        if (cancelled) {
          return;
        }

        const profileResult = settled[1];
        if (profileResult.status === "fulfilled") {
          const profile = profileResult.value;
          setViewerName(
            profile.nickname?.trim() || profile.username?.trim() || "회원",
          );
        }

        const giftIconsResult = settled[2];
        if (giftIconsResult.status === "fulfilled") {
          setGiftIcons(giftIconsResult.value);
          setGiftIconsError(null);
        } else {
          setGiftIcons([]);
          setGiftIconsError(
            giftIconsResult.reason instanceof Error
              ? giftIconsResult.reason.message
              : "선물 아이콘을 불러오지 못했습니다.",
          );
        }

        const boardResult = settled[0];
        if (boardResult.status !== "fulfilled") {
          setAllWishSlotsEmpty(true);
          setBoardAssets([]);
          return;
        }

        const { items, assets, boardSlug } = boardResult.value.data;
        setBoardSlug(boardSlug);
        setBoardAssets(assets);

        const empty = areAllWishSlotsEmpty(items);
        setAllWishSlotsEmpty(empty);

        if (!empty) {
          const texts = ["", "", ""];
          const keys = ["", "", ""];
          for (const item of items) {
            const idx = item.slotIndex - 1;
            if (idx >= 0 && idx < 3) {
              texts[idx] = item.itemName ?? "";
              keys[idx] = item.iconKey ?? "";
            }
          }
          const filled = items.filter(
            (i) => Boolean(i.itemName?.trim()) || Boolean(i.iconKey?.trim()),
          ).length;
          setWishTexts(texts);
          setWishGiftIconKeys(keys);
          setBigCircleCount(Math.max(1, Math.min(3, filled)) as GiftLayoutCount);
        }
      } catch {
        if (!cancelled) {
          setAllWishSlotsEmpty(true);
          setBoardAssets([]);
        }
      } finally {
        setGiftIconsLoading(false);
        if (!cancelled) {
          setWishSlotsLoaded(true);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [router]);

  useEffect(() => {
    if (!isCompactBackgroundOpen) {
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
  }, [isCompactBackgroundOpen]);

  useEffect(() => {
    if (isBottomSheetOpen) {
      setStickerModalTab("all");
    }
  }, [isBottomSheetOpen]);

  const closeEditUi = () => {
    setIsBottomSheetOpen(false);
    setIsCompactBackgroundOpen(false);
    setStickerTargetSlotId(null);
    setIsShareModalOpen(false);
    setIsSidebarOpen(false);
    setIsGiftModalOpen(false);
    setGiftModalSaving(false);
    setGiftModalSaveError(null);
    setGiftModalSpecial(null);
  };

  const toggleSidebar = () => {
    setIsBottomSheetOpen(false);
    setIsCompactBackgroundOpen(false);
    setStickerTargetSlotId(null);
    setIsShareModalOpen(false);
    setIsGiftModalOpen(false);
    setGiftModalSaving(false);
    setGiftModalSaveError(null);
    setGiftModalSpecial(null);
    setIsSidebarOpen((prev) => !prev);
  };

  const closeGiftModal = () => {
    setIsGiftModalOpen(false);
    setGiftModalSaving(false);
    setGiftModalSaveError(null);
    setGiftModalSpecial(null);
  };

  const closeStickerPicker = () => {
    setIsBottomSheetOpen(false);
    setStickerTargetSlotId(null);
  };

  const openGiftModalAdd = () => {
    setGiftModalMode("add");
    setModalGiftName("");
    setModalSelectedIconId(null);
    setGiftModalSpecial(null);
    setGiftIconPage(0);
    setGiftModalSaveError(null);
    setIsGiftModalOpen(true);
  };

  const openGiftModalEdit = (slotIndex: number) => {
    setGiftModalMode("edit");
    setGiftModalSlotIndex(slotIndex);
    setModalGiftName(wishTexts[slotIndex] ?? "");
    setModalSelectedIconId(null);
    const key = wishGiftIconKeys[slotIndex]?.trim() ?? "";
    if (!key) {
      setGiftModalSpecial("clear");
    } else if (key === GIFT_MODAL_PRESET_PRESENT_KEY) {
      setGiftModalSpecial("present");
    } else {
      setGiftModalSpecial(null);
    }
    setGiftModalSaveError(null);
    setIsGiftModalOpen(true);
  };

  const handleSaveGiftModal = async () => {
    const name = modalGiftName.trim();
    if (!name || giftModalSaving) {
      return;
    }

    let idx0: number;
    if (giftModalMode === "add") {
      if (bigCircleCount >= 3) {
        return;
      }
      const firstEmptyInVisible = Array.from({ length: bigCircleCount }, (_, i) => i).find(
        (i) => !wishTexts[i]?.trim() && !wishGiftIconKeys[i]?.trim(),
      );
      idx0 =
        firstEmptyInVisible !== undefined ? firstEmptyInVisible : bigCircleCount;
    } else {
      idx0 = giftModalSlotIndex;
    }

    const slotIndexApi = idx0 + 1;

    let patchBody: Parameters<typeof patchMyWishItem>[1];
    let nextIconKeyForLocal: string;

    if (giftModalSpecial === "clear") {
      patchBody = { itemName: name, clearIcon: true };
      nextIconKeyForLocal = "";
    } else if (giftModalSpecial === "present") {
      patchBody = { itemName: name, iconKey: GIFT_MODAL_PRESET_PRESENT_KEY };
      nextIconKeyForLocal = GIFT_MODAL_PRESET_PRESENT_KEY;
    } else {
      const resolvedIconId =
        modalSelectedIconId ??
        (giftModalMode === "add" && giftIcons.length > 0 ? giftIcons[0]?.id ?? null : null);
      const selected =
        resolvedIconId != null ? giftIcons.find((g) => g.id === resolvedIconId) : undefined;
      const iconKeyPayload = selected?.assetKey?.trim();
      patchBody = {
        itemName: name,
        ...(iconKeyPayload ? { iconKey: iconKeyPayload } : {}),
      };
      nextIconKeyForLocal = iconKeyPayload ?? "";
    }

    setGiftModalSaving(true);
    setGiftModalSaveError(null);

    try {
      await patchMyWishItem(slotIndexApi, patchBody);

      setWishTexts((prev) => {
        const next = [...prev];
        next[idx0] = name;
        return next;
      });
      setWishGiftIconKeys((prev) => {
        const next = [...prev];
        next[idx0] = nextIconKeyForLocal;
        return next;
      });

      if (
        giftModalMode === "add" &&
        idx0 === bigCircleCount &&
        bigCircleCount < 3
      ) {
        setBigCircleCount((c) => ((c + 1) as GiftLayoutCount));
      }

      closeGiftModal();
    } catch (error) {
      setGiftModalSaveError(
        error instanceof Error ? error.message : "저장에 실패했습니다.",
      );
    } finally {
      setGiftModalSaving(false);
    }
  };

  useEffect(() => {
    if (!isGiftModalOpen || giftIcons.length === 0 || giftModalSpecial !== null) {
      return;
    }

    setModalSelectedIconId((prev) => {
      if (giftModalMode === "edit") {
        const key = wishGiftIconKeys[giftModalSlotIndex];
        const found = giftIcons.find((g) => g.assetKey === key);
        return found?.id ?? giftIcons[0].id;
      }
      return prev ?? giftIcons[0]?.id ?? null;
    });
  }, [
    isGiftModalOpen,
    giftIcons,
    giftModalMode,
    giftModalSlotIndex,
    wishGiftIconKeys,
    giftModalSpecial,
  ]);

  useEffect(() => {
    if (!isGiftModalOpen) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsGiftModalOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isGiftModalOpen]);

  useEffect(() => {
    if (!isBottomSheetOpen) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsBottomSheetOpen(false);
        setStickerTargetSlotId(null);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isBottomSheetOpen]);

  const giftSlotImages = useMemo(() => {
    const out: Partial<Record<number, string>> = {};
    for (let i = 0; i < bigCircleCount; i++) {
      const key = wishGiftIconKeys[i];
      if (key) {
        out[i + 1] = getAssetImageUrl(key);
      }
    }
    return out;
  }, [bigCircleCount, wishGiftIconKeys]);

  const stickerSlotImages = useMemo(() => {
    const acc: Partial<Record<number, string>> = {};
    for (const a of boardAssets) {
      if (a.assetType === "STICKER" && a.slotIndex !== null) {
        acc[a.slotIndex] = getAssetImageUrl(a.assetKey);
      }
    }
    for (let slotId = 1; slotId <= 6; slotId++) {
      const pending = pendingStickerBySlot[slotId];
      if (pending !== undefined) {
        if (pending === null || pending === "") {
          delete acc[slotId];
        } else {
          acc[slotId] = getAssetImageUrl(pending);
        }
      }
    }
    return acc;
  }, [boardAssets, pendingStickerBySlot]);

  const serverBackgroundUrl = useMemo(() => {
    const bg = boardAssets.find((a) => a.assetType === "BACKGROUND");
    return bg ? getAssetImageUrl(bg.assetKey) : null;
  }, [boardAssets]);

  const boardBackgroundDisplayUrl = useMemo(() => {
    if (draftBackgroundAssetKey === null) {
      return serverBackgroundUrl;
    }
    if (draftBackgroundAssetKey === "") {
      return null;
    }
    return getAssetImageUrl(draftBackgroundAssetKey);
  }, [draftBackgroundAssetKey, serverBackgroundUrl]);

  const showEmptyWishlistHero =
    wishSlotsLoaded && allWishSlotsEmpty && !bypassEmptyState;

  const giftIconTotalPages = useMemo(() => {
    const n = giftIcons.length;
    if (n <= GIFT_MODAL_FIRST_PAGE_API_COUNT) {
      return 1;
    }
    return 1 + Math.ceil((n - GIFT_MODAL_FIRST_PAGE_API_COUNT) / GIFT_ICON_PAGE_SIZE);
  }, [giftIcons.length]);

  const pagedGiftIcons = useMemo(() => {
    if (giftIconPage === 0) {
      return giftIcons.slice(0, GIFT_MODAL_FIRST_PAGE_API_COUNT);
    }
    const start = GIFT_MODAL_FIRST_PAGE_API_COUNT + (giftIconPage - 1) * GIFT_ICON_PAGE_SIZE;
    return giftIcons.slice(start, start + GIFT_ICON_PAGE_SIZE);
  }, [giftIcons, giftIconPage]);

  const giftModalResolvedIconId = useMemo(() => {
    if (giftModalSpecial !== null) {
      return null;
    }
    return (
      modalSelectedIconId ??
      (giftModalMode === "add" && giftIcons.length > 0 ? giftIcons[0]?.id ?? null : null)
    );
  }, [giftModalSpecial, modalSelectedIconId, giftModalMode, giftIcons]);

  const canSaveGiftModal = useMemo(() => {
    return Boolean(modalGiftName.trim()) && !giftModalSaving;
  }, [modalGiftName, giftModalSaving]);

  useEffect(() => {
    if (!isGiftModalOpen || giftIcons.length === 0 || giftModalResolvedIconId == null) {
      return;
    }

    const idx = giftIcons.findIndex((g) => g.id === giftModalResolvedIconId);
    if (idx < 0) {
      return;
    }
    if (idx < GIFT_MODAL_FIRST_PAGE_API_COUNT) {
      setGiftIconPage(0);
    } else {
      const rest = idx - GIFT_MODAL_FIRST_PAGE_API_COUNT;
      setGiftIconPage(1 + Math.floor(rest / GIFT_ICON_PAGE_SIZE));
    }
  }, [isGiftModalOpen, giftIcons, giftModalResolvedIconId]);

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

  const openStickerPickerForSlot = (slotId: number) => {
    setStickerTargetSlotId(slotId);
    setIsBottomSheetOpen(true);
  };

  const startBackgroundHold = () => {
    if (!isDecorateMode) {
      return;
    }
    if (backgroundHoldTimerRef.current) {
      clearTimeout(backgroundHoldTimerRef.current);
    }

    backgroundHoldTimerRef.current = setTimeout(() => {
      setIsCompactBackgroundOpen(true);
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

  const showSlotPlaceholders = isDecorateMode;

  return (
    <main className="fixed inset-0 h-[100dvh] overflow-hidden bg-[#e6e6e6] p-3">
      <div
        className={`fixed inset-0 z-20 bg-black/20 transition-opacity duration-300 ${
          isCompactBackgroundOpen || isShareModalOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        }`}
        onClick={closeEditUi}
      />

      <div className="relative grid h-[calc(100dvh-1.5rem)] place-items-center transition-all duration-300 ease-out">
        {!wishSlotsLoaded ? (
          <div className="flex min-h-[400px] w-full max-w-[390px] items-center justify-center rounded-lg bg-white px-8 shadow-sm">
            <p className="text-body-sm text-slate-600">위시 슬롯을 불러오는 중…</p>
          </div>
        ) : showEmptyWishlistHero ? (
          <section className="relative flex min-h-[min(680px,85dvh)] w-full max-w-[390px] flex-col overflow-hidden rounded-lg bg-white shadow-[0_8px_40px_rgba(0,0,0,0.08)]">
            <header className="relative z-40 flex items-start justify-between gap-3 px-5 pt-6">
              <div className="min-w-0 flex-1 text-left text-[16px] leading-snug">
                <p className="leading-tight">
                  <span className="block">
                    <span className="inline-flex items-baseline gap-0.5">
                      <span className="font-bold text-[#7B61FF]">{viewerName}</span>
                      <span className="text-[16px] font-light leading-none text-slate-900">
                        님의
                      </span>
                    </span>
                  </span>
                  <span className="mt-0.5 block text-[16px] font-light leading-snug text-slate-900">
                    위시리스트
                  </span>
                </p>
              </div>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  toggleSidebar();
                }}
                className="relative z-40 flex size-[38.4px] shrink-0 items-center justify-center rounded-full bg-slate-100 text-[#7B61FF] shadow-sm transition hover:bg-slate-200"
                aria-label="메뉴 열기"
                aria-expanded={isSidebarOpen}
              >
                <TextAlignJustify size={18} weight="bold" />
              </button>
            </header>

            <div className="flex flex-1 flex-col items-center justify-center px-6 pb-28 pt-2">
              <img
                src="/logo.png"
                alt="오쩜오 로고"
                className="mx-auto h-auto max-h-[7rem] w-auto max-w-[52.5%] object-contain"
              />
              <div className="mt-8 w-full max-w-[320px] rounded-2xl border border-dashed border-[#7B61FF] bg-transparent px-4 py-5 text-center">
                <p className="text-sm text-slate-500">아직 위시리스트가 없어요!</p>
                <p className="mt-3 text-[15px] font-bold leading-snug text-[#7B61FF]">
                  <span className="block">오쩜오와 함께</span>
                  <span className="mt-1 block">
                    받고싶은 선물들을 모아볼까요? <span aria-hidden>&gt;</span>
                  </span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setBypassEmptyState(true);
                  setIsDecorateMode(true);
                }}
                className="mt-8 w-full max-w-[320px] rounded-2xl bg-[#7B61FF] py-4 text-base font-bold text-white shadow-md transition hover:opacity-95"
              >
                위시리스트 꾸미기 시작하기
              </button>
            </div>

            <footer className="absolute bottom-0 left-0 flex h-[6%] min-h-10 w-full items-center justify-center border-t border-slate-100 bg-white px-6 text-slate-500">
              <span className="text-body-sm">광고 중...</span>
            </footer>

            <div
              className={`absolute z-30 flex flex-col items-end gap-3 transition-opacity duration-200 ${
                isBottomSheetOpen || isCompactBackgroundOpen
                  ? "pointer-events-none opacity-0"
                  : "pointer-events-none opacity-100"
              }`}
              style={{ right: "4%", bottom: "12%" }}
            >
              <button
                type="button"
                onClick={() => {
                  setBypassEmptyState(true);
                  setIsDecorateMode((prev) => !prev);
                }}
                className={`pointer-events-auto flex size-[38.4px] items-center justify-center rounded-full text-body shadow-lg transition ${
                  isDecorateMode
                    ? "bg-[#7B61FF] text-white ring-2 ring-[#7B61FF]/40"
                    : "bg-white text-[#7B61FF]"
                }`}
                aria-label={isDecorateMode ? "꾸미기 종료" : "꾸미기 시작"}
                aria-pressed={isDecorateMode}
              >
                <PencilSimple size={18} weight="bold" />
              </button>
              <button
                type="button"
                onClick={() => setIsShareModalOpen(true)}
                className="pointer-events-auto flex size-[38.4px] items-center justify-center rounded-full bg-[#7B61FF] text-body text-white shadow-lg"
                aria-label="Share wishlist"
              >
                <Export size={18} weight="bold" />
              </button>
            </div>
          </section>
        ) : (
          <section
            className="relative h-full w-auto max-w-[390px] overflow-hidden rounded-sm"
            style={{ aspectRatio: `${DESIGN_WIDTH} / ${DESIGN_HEIGHT}` }}
          >
            <div className="relative h-full w-full overflow-hidden rounded-sm bg-[#efefef]">
              {boardBackgroundDisplayUrl ? (
                <img
                  src={boardBackgroundDisplayUrl}
                  alt=""
                  className="pointer-events-none absolute inset-0 z-0 h-full w-full object-cover"
                />
              ) : null}

              <button
                type="button"
                onMouseDown={startBackgroundHold}
                onMouseUp={cancelBackgroundHold}
                onMouseLeave={cancelBackgroundHold}
                onTouchStart={startBackgroundHold}
                onTouchEnd={cancelBackgroundHold}
                onTouchCancel={cancelBackgroundHold}
                className={`absolute inset-0 z-[5] ${isDecorateMode ? "cursor-pointer" : "pointer-events-none"}`}
                aria-label={
                  isDecorateMode
                    ? "배경을 길게 눌러 배경 이미지를 선택하세요"
                    : "보기 모드입니다. 꾸미기를 켠 뒤 배경을 길게 누르세요"
                }
              />

              <header className="relative z-40 flex items-center justify-between pl-[8%] pr-[4%] pt-[8%]">
                <h1 className="text-wish-title leading-tight">
                  <span className="block">
                    <span className="inline-flex items-baseline gap-0.5 text-slate-900">
                      <span className="font-bold text-[#7B61FF]">{viewerName}</span>
                      <span className="text-[16px] font-light leading-none text-slate-900">
                        님의
                      </span>
                    </span>
                  </span>
                  <span className="mt-0.5 block text-[16px] font-light leading-snug text-slate-900">
                    위시리스트
                  </span>
                </h1>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    toggleSidebar();
                  }}
                  className="relative z-40 flex size-[38.4px] items-center justify-center rounded-full bg-white text-[#7B61FF] shadow-lg transition hover:bg-slate-50"
                  aria-label="메뉴 열기"
                  aria-expanded={isSidebarOpen}
                >
                  <TextAlignJustify size={18} weight="bold" />
                </button>
              </header>

              <GiftSlots
                count={bigCircleCount}
                images={giftSlotImages}
                onSlotClick={(slotId) => {
                  if (!isDecorateMode) {
                    return;
                  }
                  openGiftModalEdit(slotId - 1);
                }}
                showPlaceholder={showSlotPlaceholders}
              />
              <StickerSlots
                images={stickerSlotImages}
                onSlotClick={(slotId) => {
                  if (!isDecorateMode) {
                    return;
                  }
                  openStickerPickerForSlot(slotId);
                }}
                showPlaceholder={showSlotPlaceholders}
              />

              {isDecorateMode && bigCircleCount < 3 ? (
                <div className="absolute bottom-[10%] left-0 right-0 z-[25] flex justify-center px-[8%]">
                  <button
                    type="button"
                    onClick={() => openGiftModalAdd()}
                    className="rounded-full border border-dashed border-[#7B61FF]/60 bg-white/90 px-4 py-2 text-xs font-semibold text-[#7B61FF] shadow-sm backdrop-blur-sm transition hover:bg-white"
                  >
                    + 선물 추가 ({bigCircleCount}/3)
                  </button>
                </div>
              ) : null}

              <footer className="absolute bottom-0 left-0 flex h-[6%] min-h-10 w-full items-center bg-[#d2d2d2] px-6">
                <span className="text-body-sm">Ad Banner</span>
              </footer>

              <div
                className={`absolute z-30 flex flex-col items-end gap-3 transition-opacity duration-200 ${
                  isBottomSheetOpen || isCompactBackgroundOpen
                    ? "pointer-events-none opacity-0"
                    : "pointer-events-none opacity-100"
                }`}
                style={{ right: "4%", bottom: "12%" }}
              >
                <button
                  type="button"
                  onClick={() => {
                    if (isDecorateMode) {
                      setIsDecorateMode(false);
                      setIsBottomSheetOpen(false);
                      setIsCompactBackgroundOpen(false);
                      setStickerTargetSlotId(null);
                      return;
                    }
                    setIsDecorateMode(true);
                  }}
                  className={`pointer-events-auto flex size-[38.4px] items-center justify-center rounded-full text-body shadow-lg transition ${
                    isDecorateMode
                      ? "bg-[#7B61FF] text-white ring-2 ring-[#7B61FF]/40"
                      : "bg-white text-[#7B61FF]"
                  }`}
                  aria-label={isDecorateMode ? "보기 모드로 전환" : "꾸미기 모드로 전환"}
                  aria-pressed={isDecorateMode}
                >
                  <PencilSimple size={18} weight="bold" />
                </button>

                <button
                  type="button"
                  onClick={() => setIsShareModalOpen(true)}
                  className="pointer-events-auto flex size-[38.4px] items-center justify-center rounded-full bg-[#7B61FF] text-body text-white shadow-lg"
                  aria-label="Share wishlist"
                >
                  <Export size={18} weight="bold" />
                </button>
              </div>
            </div>
          </section>
        )}
      </div>

      <section
        className={`fixed inset-x-0 bottom-0 z-[31] max-h-[36vh] rounded-t-[20px] border border-slate-100 bg-white px-4 pb-5 pt-3 shadow-[0_-8px_28px_rgba(0,0,0,0.12)] transition-transform duration-300 ease-out ${
          isCompactBackgroundOpen ? "translate-y-0" : "translate-y-full"
        }`}
        aria-hidden={!isCompactBackgroundOpen}
      >
        <div className="mx-auto w-full max-w-[390px]">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-slate-900">배경 선택</p>
              <p className="text-[11px] text-slate-500">길게 눌러 이 패널을 열었어요</p>
            </div>
            <button
              type="button"
              onClick={() => setIsCompactBackgroundOpen(false)}
              className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700"
            >
              닫기
            </button>
          </div>

          {backgroundsLoading ? (
            <p className="text-body-sm text-slate-500">배경 불러오는 중…</p>
          ) : null}
          {backgroundsError ? (
            <p className="text-body-sm text-red-600" role="alert">
              {backgroundsError}
            </p>
          ) : null}

          <div className="mt-2 flex max-h-[min(22vh,200px)] gap-2.5 overflow-x-auto overflow-y-hidden pb-1">
            <div className="w-24 shrink-0 text-left">
              <DefaultOptionButton
                className="aspect-[3/4] w-full rounded-xl"
                label="기본 배경"
                onClick={() => {
                  setDraftBackgroundAssetKey("");
                  setIsCompactBackgroundOpen(false);
                }}
              />
              <p className="mt-1 text-[10px] leading-tight text-slate-600">기본</p>
            </div>

            {backgroundAssets.map((bg) => {
              const src = getAssetImageUrl(bg.assetKey);
              const label =
                bg.assetKey.split("/").pop()?.replace(/\.[^.]+$/, "") ?? `배경 ${bg.id}`;

              return (
                <button
                  key={bg.id}
                  type="button"
                  onClick={() => {
                    setDraftBackgroundAssetKey(bg.assetKey);
                    setIsCompactBackgroundOpen(false);
                  }}
                  className="w-24 shrink-0 text-left transition hover:opacity-90"
                >
                  <div className="relative aspect-[3/4] overflow-hidden rounded-xl bg-slate-100">
                    <img
                      src={src}
                      alt={label}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <p className="mt-1 line-clamp-2 text-[10px] leading-tight text-slate-600">
                    {label}
                  </p>
                </button>
              );
            })}
          </div>
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

        <div className="mt-5 break-all rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
          {boardSlug
            ? `${typeof window !== "undefined" ? window.location.origin : ""}/wishlist/${boardSlug}`
            : "링크를 불러오는 중..."}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <button
            type="button"
            disabled={!boardSlug}
            onClick={() => {
              if (!boardSlug) return;
              void navigator.clipboard.writeText(
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
              void navigator.share({
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

      {sidebarPortalReady && isGiftModalOpen
        ? createPortal(
            <div className="fixed inset-0 z-[110] flex items-center justify-center px-4 py-8">
              <button
                type="button"
                className="absolute inset-0 bg-black/45"
                aria-label="모달 닫기"
                onClick={closeGiftModal}
              />
              <div
                className="relative z-10 flex max-h-[min(90dvh,640px)] w-full max-w-[380px] flex-col overflow-hidden rounded-3xl bg-white shadow-[0_24px_80px_rgba(0,0,0,0.22)]"
                role="dialog"
                aria-modal="true"
                aria-labelledby="gift-modal-title"
              >
                <div className="border-b border-slate-100 px-5 py-4">
                  <h2 id="gift-modal-title" className="text-h3 text-slate-900">
                    {giftModalMode === "add" ? "받고싶은 선물 추가" : "선물 수정"}
                  </h2>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
                  {giftModalSaveError ? (
                    <p className="mb-3 text-body-sm text-red-600" role="alert">
                      {giftModalSaveError}
                    </p>
                  ) : null}
                  {giftIconsError ? (
                    <p className="mb-3 text-body-sm text-red-600" role="alert">
                      {giftIconsError}
                    </p>
                  ) : null}

                  <label className="block">
                    <span className="text-sm font-medium text-slate-800">선물 이름</span>
                    <input
                      type="text"
                      value={modalGiftName}
                      onChange={(event) => setModalGiftName(event.target.value)}
                      placeholder="예: 터보 RC카"
                      className="mt-2 h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm text-slate-900 outline-none transition focus:border-[#7B61FF]"
                    />
                  </label>

                  <p className="mt-5 text-sm font-medium text-slate-800">선물 아이콘</p>

                  <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-inner">
                    {giftIconsLoading ? (
                      <div className="flex min-h-[200px] items-center justify-center">
                        <p className="text-body-sm text-slate-500">선물 아이콘 불러오는 중…</p>
                      </div>
                    ) : giftIconsError ? null : (
                      <>
                        <div className="grid min-h-[200px] grid-cols-4 gap-2 content-start">
                          <button
                            type="button"
                            onClick={() => {
                              setGiftModalSpecial("clear");
                              setModalSelectedIconId(null);
                            }}
                            className={`flex aspect-square items-center justify-center overflow-hidden rounded-xl border-2 bg-white text-xl font-semibold text-slate-500 transition ${
                              giftModalSpecial === "clear"
                                ? "border-[#7B61FF] ring-2 ring-[#7B61FF]/35"
                                : "border-slate-300 hover:border-slate-400"
                            }`}
                            aria-label="아이콘 없음"
                            aria-pressed={giftModalSpecial === "clear"}
                          >
                            ×
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setGiftModalSpecial("present");
                              setModalSelectedIconId(null);
                            }}
                            className={`aspect-square overflow-hidden rounded-xl border-2 bg-slate-50 transition ${
                              giftModalSpecial === "present"
                                ? "border-[#7B61FF] ring-2 ring-[#7B61FF]/35"
                                : "border-slate-200 hover:border-slate-400"
                            }`}
                            aria-label="기본 선물 아이콘"
                            aria-pressed={giftModalSpecial === "present"}
                          >
                            <img
                              src={getAssetImageUrl(GIFT_MODAL_PRESET_PRESENT_KEY)}
                              alt=""
                              className="h-full w-full object-contain p-1"
                              loading="lazy"
                            />
                          </button>
                          {pagedGiftIcons.map((icon) => {
                            const src = getAssetImageUrl(icon.assetKey);
                            const selected = giftModalResolvedIconId === icon.id;

                            return (
                              <button
                                key={icon.id}
                                type="button"
                                onClick={() => {
                                  setGiftModalSpecial(null);
                                  setModalSelectedIconId(icon.id);
                                }}
                                className={`aspect-square overflow-hidden rounded-xl border-2 bg-slate-50 transition ${
                                  selected
                                    ? "border-[#7B61FF] ring-2 ring-[#7B61FF]/35"
                                    : "border-slate-200 hover:border-slate-400"
                                }`}
                                aria-label={`선물 아이콘 ${icon.id}`}
                                aria-pressed={selected}
                              >
                                <img
                                  src={src}
                                  alt=""
                                  className="h-full w-full object-contain p-1"
                                  loading="lazy"
                                />
                              </button>
                            );
                          })}
                        </div>

                        {giftIcons.length === 0 ? (
                          <p className="mt-2 text-center text-body-sm text-slate-500">
                            추가 아이콘 목록이 없습니다. 위 칸에서 삭제 또는 기본 선물을 선택할 수
                            있어요.
                          </p>
                        ) : null}

                        {giftIconTotalPages > 1 ? (
                          <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
                            <button
                              type="button"
                              disabled={giftIconPage <= 0}
                              onClick={() => setGiftIconPage((p) => Math.max(0, p - 1))}
                              className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                              aria-label="이전 페이지"
                            >
                              <CaretLeft size={18} weight="bold" />
                              이전
                            </button>
                            <span className="text-xs tabular-nums text-slate-600">
                              {giftIconPage + 1} / {giftIconTotalPages}
                            </span>
                            <button
                              type="button"
                              disabled={giftIconPage >= giftIconTotalPages - 1}
                              onClick={() =>
                                setGiftIconPage((p) => Math.min(giftIconTotalPages - 1, p + 1))
                              }
                              className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                              aria-label="다음 페이지"
                            >
                              다음
                              <CaretRight size={18} weight="bold" />
                            </button>
                          </div>
                        ) : null}
                      </>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 border-t border-slate-100 px-5 py-4">
                  <button
                    type="button"
                    onClick={closeGiftModal}
                    className="rounded-2xl border border-slate-200 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    취소
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleSaveGiftModal()}
                    disabled={!canSaveGiftModal}
                    className="rounded-2xl bg-[#7B61FF] py-3 text-sm font-semibold text-white transition hover:opacity-95 disabled:opacity-40"
                  >
                    {giftModalSaving ? "저장 중…" : "저장"}
                  </button>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}

      {sidebarPortalReady && isBottomSheetOpen
        ? createPortal(
            <div className="fixed inset-0 z-[113] flex items-center justify-center px-3 py-5 sm:px-4">
              <button
                type="button"
                className="absolute inset-0 bg-black/25"
                aria-label="스티커 선택 닫기"
                onClick={closeStickerPicker}
              />
              <div
                className="relative z-10 flex w-full max-w-[min(360px,calc(100vw-1.25rem))] flex-col overflow-hidden rounded-2xl bg-white shadow-[0_24px_60px_rgba(0,0,0,0.2)]"
                role="dialog"
                aria-modal="true"
                aria-label="스티커 선택"
              >
                <div className="flex gap-1 overflow-x-auto border-b border-slate-100 px-2 pb-2 pt-2">
                  {STICKER_MODAL_TABS.map((tab) => {
                    const active = stickerModalTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setStickerModalTab(tab.id)}
                        className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                          active
                            ? "bg-[#7B61FF] text-white"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        {tab.label}
                      </button>
                    );
                  })}
                </div>

                <div className="px-2 pb-3 pt-2">
                  <div className="grid grid-cols-6 gap-1">
                    {Array.from({ length: STICKER_MODAL_SLOT_COUNT }, (_, i) => (
                      <button
                        key={`sticker-slot-${i}`}
                        type="button"
                        disabled
                        className="aspect-square rounded-md border border-dashed border-slate-200 bg-slate-50"
                        aria-label={`스티커 칸 ${i + 1}`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}

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
