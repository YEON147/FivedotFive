"use client";

import {
  CaretLeft,
  CaretRight,
  Export,
  PencilSimple,
  SignOut,
  TextAlignJustify,
  TrashSimple,
  UserCircle,
} from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type MouseEvent } from "react";
import { createPortal } from "react-dom";

import { clearAccessToken, getAccessToken } from "@/lib/api/token-store";

import {
  DESIGN_HEIGHT,
  DESIGN_WIDTH,
  GiftSlots,
  StickerSlots,
  type GiftLayoutCount,
} from "@/components/wishlist/WishlistSlots";
import { deleteMyWishItem, getMyBoard, patchMyWishItem } from "@/features/wishlist/api";
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
/** 서버 `WishItemService` 기본 GIFT_ICON 키 — 이름 없을 때는 빈 슬롯으로 간주 */
const SERVER_DEFAULT_GIFT_ICON_KEY = "default/gift_icon.png";

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

/** 빈 안내·로딩용 — 둥근 흰 카드 셸 */
const WISHLIST_APP_SHELL =
  "relative flex w-full max-w-[372px] flex-col overflow-hidden rounded-[18px] bg-[var(--color-surface)] shadow-[0_8px_40px_rgba(0,0,0,0.08)]";
/** 보드(보기·꾸미기) — 바깥 흰 박스 없음, 폭은 디자인 기준 372px로 공개 보드와 동일 */
const WISHLIST_BOARD_PAGE_WRAP =
  "relative flex h-full min-h-0 max-h-full w-full max-w-[372px] flex-1 flex-col overflow-hidden bg-transparent";
/** 로딩 플레이스홀더만 한 번 카드 높이 상한 — 본문은 flex-1으로 뷰포트를 채움 */
const WISHLIST_APP_SHELL_MAX_LOADING =
  "max-h-[min(680px,calc(100svh-var(--safe-area-top)-var(--safe-area-bottom)-0.75rem))]";
const WISHLIST_BOARD_FRAME_BASE =
  "relative isolate overflow-hidden rounded-[18px] shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] ring-1";
const WISHLIST_MENU_BUTTON =
  "relative z-40 flex size-[42px] shrink-0 items-center justify-center rounded-full bg-slate-100 text-[#7B61FF] shadow-sm transition hover:bg-slate-200 active:bg-slate-300/90 touch-manipulation";
const WISHLIST_APP_FOOTER =
  "flex min-h-10 w-full shrink-0 items-center justify-center border-t border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-2.5 text-xs text-[var(--color-text-secondary)]";

/** 꾸미기 보드 헤더와 동일 — 비율 패딩·타이포 */
const WISHLIST_PROFILE_HEADER_ROW =
  "relative z-40 flex items-center justify-between gap-2.5 pl-[7%] pr-[4%] pt-[7%]";

function WishlistProfileTitleHeader({
  viewerName,
  isSidebarOpen,
  onMenuClick,
}: {
  viewerName: string;
  isSidebarOpen: boolean;
  onMenuClick: (event: MouseEvent<HTMLButtonElement>) => void;
}) {
  return (
    <header className={WISHLIST_PROFILE_HEADER_ROW}>
      <h1 className="min-w-0 flex-1 text-left text-wish-title leading-tight text-slate-900">
        <span className="block">
          <span className="inline-flex items-baseline gap-0.5">
            <span className="font-bold text-[#7B61FF]">{viewerName}</span>
            <span className="text-[18px] font-light leading-none text-slate-900">
              님의
            </span>
          </span>
        </span>
        <span className="mt-1 block text-[18px] font-light leading-snug text-slate-900">
          위시리스트
        </span>
      </h1>
      <button
        type="button"
        onClick={onMenuClick}
        className={WISHLIST_MENU_BUTTON}
        aria-label="메뉴 열기"
        aria-expanded={isSidebarOpen}
      >
        <TextAlignJustify size={23} weight="bold" />
      </button>
    </header>
  );
}

/**
 * 선물 이름이 없고, 아이콘도 없거나 서버·클라 ‘기본’ 아이콘만 있으면 빈 슬롯.
 * (백엔드가 빈 칸에도 `default/gift_icon.png` 를 붙이는 경우 `iconKey`만으로는 빈 칸 판별 불가)
 */
function isWishSlotSemanticallyEmpty(row: WishItemData): boolean {
  if (row.itemName?.trim()) {
    return false;
  }
  const icon = row.iconKey?.trim() ?? "";
  if (!icon) {
    return true;
  }
  const lower = icon.toLowerCase();
  if (lower.includes("default/gift") || lower.endsWith("gift_icon.png")) {
    return true;
  }
  if (icon === GIFT_MODAL_PRESET_PRESENT_KEY || lower.endsWith("/present.png")) {
    return true;
  }
  if (lower === SERVER_DEFAULT_GIFT_ICON_KEY.toLowerCase()) {
    return true;
  }
  return false;
}

function areAllWishSlotsEmpty(items: WishItemData[]): boolean {
  if (items.length === 0) {
    return true;
  }
  return items.every(isWishSlotSemanticallyEmpty);
}

function deriveWishSlotState(items: WishItemData[]) {
  const allWishSlotsEmpty = areAllWishSlotsEmpty(items);
  if (allWishSlotsEmpty) {
    return {
      wishTexts: ["", "", ""],
      wishGiftIconKeys: ["", "", ""],
      bigCircleCount: 1 as GiftLayoutCount,
      allWishSlotsEmpty,
    };
  }

  const texts = ["", "", ""];
  const keys = ["", "", ""];
  for (const item of items) {
    const idx = item.slotIndex - 1;
    if (idx >= 0 && idx < 3) {
      texts[idx] = item.itemName ?? "";
      keys[idx] = item.iconKey ?? "";
    }
  }

  const filled = items.filter((i) => !isWishSlotSemanticallyEmpty(i)).length;

  return {
    wishTexts: texts,
    wishGiftIconKeys: keys,
    bigCircleCount: Math.max(1, Math.min(3, filled)) as GiftLayoutCount,
    allWishSlotsEmpty,
  };
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
  const [giftModalDeleting, setGiftModalDeleting] = useState(false);
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

        const derived = deriveWishSlotState(items);
        setAllWishSlotsEmpty(derived.allWishSlotsEmpty);
        setWishTexts(derived.wishTexts);
        setWishGiftIconKeys(derived.wishGiftIconKeys);
        setBigCircleCount(derived.bigCircleCount);
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

  /**
   * 빈 슬롯이면 꾸미기 시작 카드로 돌아갈 수 있게 bypass 해제.
   * 꾸미기 모드가 켜져 있을 때만 유지(보드 유지), 끄면 안내 카드 표시.
   */
  useEffect(() => {
    if (!wishSlotsLoaded || !allWishSlotsEmpty || isDecorateMode) {
      return;
    }
    setBypassEmptyState(false);
  }, [wishSlotsLoaded, allWishSlotsEmpty, isDecorateMode]);

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
    setGiftModalDeleting(false);
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
    setGiftModalDeleting(false);
    setGiftModalSaveError(null);
    setGiftModalSpecial(null);
    setIsSidebarOpen((prev) => !prev);
  };

  const closeGiftModal = () => {
    setIsGiftModalOpen(false);
    setGiftModalSaving(false);
    setGiftModalDeleting(false);
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
    if (!name || giftModalSaving || giftModalDeleting) {
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

  const handleResetGiftModal = async () => {
    if (giftModalSaving || giftModalDeleting) {
      return;
    }

    if (giftModalMode === "add") {
      setModalGiftName("");
      setModalSelectedIconId(null);
      setGiftModalSpecial(null);
      setGiftIconPage(0);
      setGiftModalSaveError(null);
      return;
    }

    setGiftModalDeleting(true);
    setGiftModalSaveError(null);

    try {
      await deleteMyWishItem(giftModalSlotIndex + 1);
      const board = await getMyBoard();
      const { items, assets, boardSlug } = board.data;
      setBoardSlug(boardSlug);
      setBoardAssets(assets);
      const derived = deriveWishSlotState(items);
      setAllWishSlotsEmpty(derived.allWishSlotsEmpty);
      setWishTexts(derived.wishTexts);
      setWishGiftIconKeys(derived.wishGiftIconKeys);
      setBigCircleCount(derived.bigCircleCount);
      if (derived.allWishSlotsEmpty) {
        setBypassEmptyState(false);
        setIsDecorateMode(false);
      }
      closeGiftModal();
    } catch (error) {
      setGiftModalSaveError(
        error instanceof Error ? error.message : "초기화에 실패했습니다.",
      );
    } finally {
      setGiftModalDeleting(false);
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
    return Boolean(modalGiftName.trim()) && !giftModalSaving && !giftModalDeleting;
  }, [giftModalDeleting, modalGiftName, giftModalSaving]);

  const canResetGiftModal = useMemo(() => {
    if (giftModalSaving || giftModalDeleting) {
      return false;
    }

    const firstIconId = giftIcons[0]?.id ?? null;
    const addFormTouched =
      Boolean(modalGiftName.trim()) ||
      giftModalSpecial !== null ||
      (modalSelectedIconId != null &&
        firstIconId != null &&
        modalSelectedIconId !== firstIconId);

    if (giftModalMode === "add") {
      return addFormTouched;
    }

    const slotHasContent =
      Boolean(wishTexts[giftModalSlotIndex]?.trim()) ||
      Boolean(wishGiftIconKeys[giftModalSlotIndex]?.trim());

    return slotHasContent || addFormTouched;
  }, [
    giftIcons,
    giftModalMode,
    giftModalSaving,
    giftModalSlotIndex,
    giftModalSpecial,
    modalGiftName,
    modalSelectedIconId,
    giftModalDeleting,
    wishGiftIconKeys,
    wishTexts,
  ]);

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
    <main className="wishlist-page-root app-shell-viewport-floor flex flex-col px-3 pb-[env(safe-area-inset-bottom,0px)] pt-[env(safe-area-inset-top,0px)] sm:px-4">
      <div
        className={`fixed inset-0 z-20 bg-black/20 transition-opacity duration-300 ${
          isCompactBackgroundOpen || isShareModalOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        }`}
        onClick={closeEditUi}
      />

      <div className="relative z-10 flex min-h-0 w-full flex-1 flex-col items-center justify-start transition-all duration-300 ease-out">
        {!wishSlotsLoaded ? (
          <div
            className={`${WISHLIST_APP_SHELL} ${WISHLIST_APP_SHELL_MAX_LOADING} flex min-h-[min(400px,70dvh)] w-full shrink-0 items-center justify-center px-8`}
          >
            <p className="text-body-sm text-[var(--color-text-secondary)]">
              위시 슬롯을 불러오는 중…
            </p>
          </div>
        ) : showEmptyWishlistHero ? (
          <section
            className={`${WISHLIST_APP_SHELL} flex h-full min-h-0 max-h-full w-full max-w-[372px] flex-1 flex-col overflow-hidden`}
          >
            <WishlistProfileTitleHeader
              viewerName={viewerName}
              isSidebarOpen={isSidebarOpen}
              onMenuClick={(event) => {
                event.stopPropagation();
                toggleSidebar();
              }}
            />

            <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-y-contain [-webkit-overflow-scrolling:touch]">
              <div className="flex flex-1 flex-col items-center justify-center gap-5 px-5 py-6">
                <img
                  src="/logo.png"
                  alt="오쩜오 로고"
                  className="mx-auto h-auto max-h-[5.25rem] w-auto max-w-[46%] object-contain"
                />
                <div className="w-full max-w-[272px] rounded-[16px] border border-dashed border-[#7B61FF] bg-transparent px-3 py-4 text-center">
                  <p className="text-xs text-[#7B61FF]">아직 위시리스트가 없어요!</p>
                  <p className="mt-2.5 text-[13px] font-bold leading-snug text-[#7B61FF]">
                    <span className="block">오쩜오와 함께</span>
                    <span className="mt-1 block">받고싶은 선물들을 모아볼까요?</span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setBypassEmptyState(true);
                    setIsDecorateMode(true);
                  }}
                  className="w-full max-w-[272px] rounded-[16px] bg-[#7B61FF] py-3 text-sm font-bold text-white shadow-md transition active:opacity-90 touch-manipulation hover:opacity-95"
                >
                  위시리스트 꾸미기 시작하기
                </button>
              </div>
            </div>

            <footer className={WISHLIST_APP_FOOTER}>광고 중...</footer>
          </section>
        ) : (
          <section className={`${WISHLIST_BOARD_PAGE_WRAP} mx-auto w-full`}>
            <div className="relative flex min-h-0 flex-1 flex-col p-0">
              <div className="relative flex min-h-0 flex-1 w-full min-w-0 items-center justify-center">
                <div
                  className={`${WISHLIST_BOARD_FRAME_BASE} wishlist-board-frame--decorate relative mx-auto w-full max-w-[372px] max-h-[min(680px,100%)] shrink-0 overflow-hidden ring-violet-200/55`}
                  style={{
                    aspectRatio: `${DESIGN_WIDTH} / ${DESIGN_HEIGHT}`,
                  }}
                >
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

              <WishlistProfileTitleHeader
                viewerName={viewerName}
                isSidebarOpen={isSidebarOpen}
                onMenuClick={(event) => {
                  event.stopPropagation();
                  toggleSidebar();
                }}
              />

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
                <div className="pointer-events-none absolute bottom-[5%] left-0 right-0 z-[24] flex justify-center px-[8%]">
                  <button
                    type="button"
                    onClick={() => openGiftModalAdd()}
                    className="pointer-events-auto rounded-full border border-dashed border-[#7B61FF]/60 bg-white/95 px-3 py-1.5 text-[11px] font-semibold text-[#7B61FF] shadow-sm backdrop-blur-sm transition hover:bg-white"
                  >
                    + 선물 추가 ({bigCircleCount}/3)
                  </button>
                </div>
              ) : null}

              <div
                className={`pointer-events-none absolute bottom-6 right-[4%] z-30 flex flex-col items-end gap-2.5 transition-opacity duration-200 ${
                  isBottomSheetOpen || isCompactBackgroundOpen ? "opacity-0" : "opacity-100"
                }`}
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
                  className={`pointer-events-auto flex size-[42px] items-center justify-center rounded-full text-body shadow-lg transition ${
                    isDecorateMode
                      ? "bg-[#7B61FF] text-white ring-2 ring-[#7B61FF]/40"
                      : "bg-white text-[#7B61FF]"
                  }`}
                  aria-label={isDecorateMode ? "보기 모드로 전환" : "꾸미기 모드로 전환"}
                  aria-pressed={isDecorateMode}
                >
                  <PencilSimple size={23} weight="bold" />
                </button>

                <button
                  type="button"
                  onClick={() => setIsShareModalOpen(true)}
                  className="pointer-events-auto flex size-[42px] items-center justify-center rounded-full bg-[#7B61FF] text-body text-white shadow-lg"
                  aria-label="위시리스트 공유"
                >
                  <Export size={23} weight="bold" />
                </button>
              </div>
                </div>
              </div>
            </div>

            <footer className={WISHLIST_APP_FOOTER}>광고 중...</footer>
          </section>
        )}
      </div>

      <section
        className={`fixed inset-x-0 bottom-0 z-[31] max-h-[36vh] rounded-t-[18px] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 pb-[max(0.5rem,var(--safe-area-bottom))] pt-3 shadow-[0_-8px_28px_rgba(0,0,0,0.1)] transition-transform duration-300 ease-out ${
          isCompactBackgroundOpen ? "translate-y-0" : "translate-y-full"
        }`}
        aria-hidden={!isCompactBackgroundOpen}
      >
        <div className="mx-auto w-full max-w-[372px]">
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
        className={`fixed left-1/2 top-1/2 z-30 w-[min(340px,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-[18px] border border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-6 shadow-[0_24px_60px_rgba(0,0,0,0.14)] transition-all duration-300 ${
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

        <div className="mt-5 break-all rounded-[14px] border border-[var(--color-border)] bg-[var(--color-bg-subtle)] px-4 py-3 text-sm text-[var(--color-text-primary)]">
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
            className="rounded-[14px] bg-[#7B61FF] px-4 py-3 text-sm font-semibold text-white disabled:opacity-40"
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
            className="rounded-[14px] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm font-semibold text-[var(--color-text-primary)] disabled:opacity-40"
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
                <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
                  <h2 id="gift-modal-title" className="text-h3 text-slate-900">
                    {giftModalMode === "add" ? "받고싶은 선물 추가" : "선물 수정"}
                  </h2>
                  <button
                    type="button"
                    onClick={() => void handleResetGiftModal()}
                    disabled={!canResetGiftModal}
                    title={
                      giftModalMode === "add"
                        ? "입력 내용 지우기"
                        : "슬롯 초기화 (이름·아이콘 삭제)"
                    }
                    aria-label={
                      giftModalDeleting
                        ? "초기화 중"
                        : giftModalMode === "add"
                          ? "입력 내용 지우기"
                          : "위시 슬롯 초기화"
                    }
                    aria-busy={giftModalDeleting}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-slate-200 text-slate-500 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {giftModalDeleting ? (
                      <span className="text-xs font-semibold tabular-nums text-slate-400">
                        …
                      </span>
                    ) : (
                      <TrashSimple size={22} weight="bold" aria-hidden />
                    )}
                  </button>
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
                className={`fixed inset-y-0 right-0 z-[101] flex w-[min(300px,88vw)] flex-col rounded-l-[18px] border-l border-[var(--color-border)] bg-[var(--color-surface)] shadow-[-12px_0_40px_rgba(0,0,0,0.1)] transition-transform duration-300 ease-out ${
                  isSidebarOpen ? "translate-x-0" : "translate-x-full"
                }`}
                aria-hidden={!isSidebarOpen}
              >
                <div className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-4">
                  <span className="text-h3 text-[var(--color-text-primary)]">메뉴</span>
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
                    className="flex items-center gap-3 rounded-[14px] px-4 py-3.5 text-body font-medium text-[var(--color-text-primary)] transition hover:bg-[var(--color-bg-subtle)]"
                  >
                    <UserCircle size={22} weight="regular" className="shrink-0 text-[#7B61FF]" />
                    내정보 조회
                  </Link>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 rounded-[14px] px-4 py-3.5 text-left text-body font-medium text-rose-600 transition hover:bg-rose-50"
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
