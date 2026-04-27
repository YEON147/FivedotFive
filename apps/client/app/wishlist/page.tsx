"use client";

import {
  Export,
  Image as ImageIcon,
  PencilSimple,
  TextAlignJustify,
  TrashSimple,
  X,
} from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent,
} from "react";
import { createPortal } from "react-dom";

import { clearAccessToken, getAccessToken } from "@/lib/api/token-store";

import { AppSideMenu } from "@/components/common/AppSideMenu";
import { STICKER_GRID_6COL_3ROW_SCROLL_HEIGHT } from "@/components/wishlist/sticker-sheet-layout";
import { WishlistCenterDialog } from "@/components/wishlist/WishlistCenterDialog";
import {
  DESIGN_HEIGHT,
  DESIGN_WIDTH,
  GiftSlots,
  StickerSlots,
  type GiftLayoutCount,
} from "@/components/wishlist/WishlistSlots";
import {
  deleteMyBoardBackground,
  deleteMyWishItem,
  getMyBoard,
  deleteMyBoardStickerSlot,
  patchMyWishItem,
  putMyBoardBackground,
  putMyBoardStickerSlot,
} from "@/features/wishlist/api";
import {
  compactGiftAssetKeysToLayoutSlots,
  compactGiftTextsToLayoutSlots,
  deriveWishSlotState,
  firstSemanticallyEmptyApiIndex,
  matchesGiftPresetIcon,
  resolveLayoutGiftClickToApiIndex,
} from "@/features/wishlist/wish-slot-state";
import type { BoardAssetData, MyBoardData, WishItemData } from "@/features/wishlist/types";
import {
  clearWishlistPageSessionCache,
  getWishlistPageSessionCache,
  SESSION_OPEN_DECORATE_AFTER_CREATE_KEY,
  setWishlistPageSessionCache,
  type WishlistPageSessionCache,
} from "@/features/wishlist/wishlist-session-cache";
import { loginUrlWithCurrentPageAsNext } from "@/features/login/post-login-destination";
import { getMyProfile } from "@/features/user/api";
import { useMouseDragHorizontalScroll } from "@/hooks/use-mouse-drag-horizontal-scroll";
import {
  fetchBackgroundAssets,
  resolveBackgroundDisplayLabel,
  fetchGiftIcons,
  fetchStickerAssets,
  fetchStickersByFolder,
  postAdminAssetsResetSync,
  postAdminAssetsSync,
  type BackgroundAssetDto,
  type GiftIconDto,
  type StickerAssetDto,
} from "@/lib/api/assets";
import { getAssetImageUrl } from "@/lib/asset-url";
import { STORED_PUBLIC_DEFAULT_GIFT_ICON_KEY } from "@/lib/constants/gift-default-icon";
import {
  PAGE_HEADER_MENU_BUTTON,
  PAGE_HEADER_ROW_COMPACT,
} from "@/lib/constants/page-header";
import {
  GIFT_ICON_CATEGORY_LABELS,
  giftIconCategoryFromAssetKey,
  type GiftIconCategoryId,
} from "@/lib/gift-icon-category";

type GiftModalSpecial = "present" | null;

/** ADMIN: 탭당 1회 — `/api/admin/assets/reset-sync` (에셋 DB 전체 재동기화) */
const SESSION_ADMIN_RESET_SYNC_KEY = "oh_jjeom_oh_admin_assets_reset_sync_once";

/** 스티커 폴더명(`assets/stickers/{id}/`)과 동일한 id — 한글은 UI 표시용 */
const STICKER_MODAL_TABS = [
  { id: "all", label: "전체" },
  { id: "balloon", label: "풍선" },
  { id: "universe", label: "우주" },
  { id: "message", label: "메시지" },
  { id: "dinosaur", label: "공룡" },
  { id: "bubble", label: "버블" },
  { id: "cute", label: "귀여운" },
  { id: "dessert", label: "디저트" },
  { id: "toy", label: "토이" },
] as const;

type StickerModalTabId = (typeof STICKER_MODAL_TABS)[number]["id"];

/** 선물 아이콘 S3 카테고리(`icons/{id}/…`) — 스티커 탭과 동일한 pill UI */
const GIFT_ICON_MODAL_TABS = [
  { id: "all", label: "전체" },
  { id: "food", label: GIFT_ICON_CATEGORY_LABELS.food },
  { id: "kpop", label: GIFT_ICON_CATEGORY_LABELS.kpop },
  { id: "hobby", label: GIFT_ICON_CATEGORY_LABELS.hobby },
  { id: "life", label: GIFT_ICON_CATEGORY_LABELS.life },
] as const;

type GiftIconModalTabId = "all" | GiftIconCategoryId;

/** 빈 안내·로딩용 — 둥근 흰 카드 셸 */
const WISHLIST_APP_SHELL =
  "relative flex w-full max-w-[372px] flex-col overflow-hidden rounded-[18px] bg-[var(--color-surface)] shadow-[0_8px_40px_rgba(0,0,0,0.08)]";
/** 보드(보기·꾸미기) — 바깥 흰 박스 없음, 폭은 디자인 기준 372px로 공개 보드와 동일 */
/** 보드(372)보다 넓게 잡아 스티커·호버가 살짝 밖으로 나와도 섹션에서 잘리지 않게 함 */
const WISHLIST_BOARD_PAGE_WRAP =
  "relative flex h-full min-h-0 max-h-full w-full max-w-[min(420px,calc(100vw-1.5rem))] flex-1 flex-col overflow-visible bg-transparent";
/** 로딩 플레이스홀더만 한 번 카드 높이 상한 — 본문은 flex-1으로 뷰포트를 채움 */
const WISHLIST_APP_SHELL_MAX_LOADING =
  "max-h-[min(680px,calc(100svh-var(--safe-area-top)-var(--safe-area-bottom)-0.75rem))]";
/** 슬롯·호버가 프레임 밖으로 나와도 보이도록 `overflow-visible` — 배경만 안쪽 레이어에서 클립 */
const WISHLIST_BOARD_FRAME_BASE =
  "relative isolate overflow-visible rounded-[18px] shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] ring-1";

/** 선물 아이콘 모달「기본 선물」첫 칸 — `public/default_icon.png` (저장 키와 동일) */
const GIFT_MODAL_PRESET_IMAGE_SRC = STORED_PUBLIC_DEFAULT_GIFT_ICON_KEY;

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
    <header className={PAGE_HEADER_ROW_COMPACT}>
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
        className={PAGE_HEADER_MENU_BUTTON}
        aria-label="메뉴 열기"
        aria-expanded={isSidebarOpen}
      >
        <TextAlignJustify size={23} weight="bold" />
      </button>
    </header>
  );
}

function DefaultOptionButton({
  className = "",
  label = "Default",
  disabled = false,
  onClick,
}: {
  className?: string;
  label?: string;
  disabled?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`flex items-center justify-center overflow-hidden rounded-2xl border border-slate-300 bg-white text-slate-500 transition hover:border-slate-400 disabled:opacity-50 ${className}`}
      aria-label={`${label} option`}
    >
      <span className="text-xl font-semibold leading-none">×</span>
    </button>
  );
}

export default function WishlistPage() {
  const router = useRouter();
  const [bigCircleCount, setBigCircleCount] = useState<GiftLayoutCount>(
    () => getWishlistPageSessionCache()?.bigCircleCount ?? 1,
  );
  const [wishTexts, setWishTexts] = useState(
    () => getWishlistPageSessionCache()?.wishTexts ?? ["", "", ""],
  );
  const [wishGiftIconKeys, setWishGiftIconKeys] = useState(
    () => getWishlistPageSessionCache()?.wishGiftIconKeys ?? ["", "", ""],
  );
  const [isGiftModalOpen, setIsGiftModalOpen] = useState(false);
  const [giftModalMode, setGiftModalMode] = useState<"add" | "edit">("add");
  const [giftModalSlotIndex, setGiftModalSlotIndex] = useState(0);
  const [modalGiftName, setModalGiftName] = useState("");
  const [modalSelectedIconId, setModalSelectedIconId] = useState<number | null>(null);
  const [giftIcons, setGiftIcons] = useState<GiftIconDto[]>([]);
  const [giftIconsLoading, setGiftIconsLoading] = useState(false);
  const [giftIconsError, setGiftIconsError] = useState<string | null>(null);
  const [giftIconModalTab, setGiftIconModalTab] =
    useState<GiftIconModalTabId>("all");
  const [giftModalSaving, setGiftModalSaving] = useState(false);
  const [giftModalDeleting, setGiftModalDeleting] = useState(false);
  const [giftModalSaveError, setGiftModalSaveError] = useState<string | null>(null);
  const [giftModalSpecial, setGiftModalSpecial] = useState<GiftModalSpecial>(null);
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
  /** 공유 모달 – 링크 복사 성공 토스트(짧은 문구) */
  const [shareLinkCopyFeedback, setShareLinkCopyFeedback] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [sidebarPortalReady, setSidebarPortalReady] = useState(false);
  const [boardSlug, setBoardSlug] = useState<string | null>(
    () => getWishlistPageSessionCache()?.boardSlug ?? null,
  );
  const [boardAssets, setBoardAssets] = useState<BoardAssetData[]>(
    () => getWishlistPageSessionCache()?.boardAssets ?? [],
  );
  const [wishSlotsLoaded, setWishSlotsLoaded] = useState(
    () => getWishlistPageSessionCache() != null,
  );
  const [allWishSlotsEmpty, setAllWishSlotsEmpty] = useState(
    () => getWishlistPageSessionCache()?.allWishSlotsEmpty ?? false,
  );
  /** 초기 GET /api/boards/me 성공 여부 — 실패 시 보드 없음·일시 오류 구분 없이 생성 플로우 허용 */
  const [hasMyBoard, setHasMyBoard] = useState(
    () => getWishlistPageSessionCache()?.hasMyBoard ?? false,
  );
  const [viewerName, setViewerName] = useState(
    () => getWishlistPageSessionCache()?.viewerName ?? "회원",
  );
  const [backgroundAssets, setBackgroundAssets] = useState<BackgroundAssetDto[]>([]);
  const [backgroundsLoading, setBackgroundsLoading] = useState(false);
  const [backgroundsError, setBackgroundsError] = useState<string | null>(null);
  const [backgroundSaving, setBackgroundSaving] = useState(false);
  const [backgroundSaveError, setBackgroundSaveError] = useState<string | null>(null);
  const [stickerModalTab, setStickerModalTab] = useState<StickerModalTabId>("all");
  const [stickerSheetList, setStickerSheetList] = useState<StickerAssetDto[]>([]);
  const [stickerSheetLoading, setStickerSheetLoading] = useState(false);
  const [stickerSheetError, setStickerSheetError] = useState<string | null>(null);
  const [stickerSlotSaving, setStickerSlotSaving] = useState(false);
  const [stickerSlotSaveError, setStickerSlotSaveError] = useState<string | null>(null);
  const backgroundHoldTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stickerTabStripScroll = useMouseDragHorizontalScroll();
  const backgroundPickerStripScroll = useMouseDragHorizontalScroll();
  const giftIconTabStripScroll = useMouseDragHorizontalScroll();
  /** 선물 수정 모달: 목록 최초 로드 시에만 프리셋 여부 동기화(재선택 덮어쓰기 방지) */
  const giftEditPresetSyncRef = useRef<{ slot: number; done: boolean }>({
    slot: -1,
    done: false,
  });

  const applyLoadedBoard = useCallback((board: MyBoardData) => {
    const { items, assets, boardSlug } = board.data;
    setBoardSlug(boardSlug);
    setBoardAssets(assets);

    const derived = deriveWishSlotState(items);
    setAllWishSlotsEmpty(derived.allWishSlotsEmpty);
    setWishTexts(derived.wishTexts);
    setWishGiftIconKeys(derived.wishGiftIconKeys);
    setBigCircleCount(derived.bigCircleCount);
  }, []);

  useEffect(() => {
    if (!getAccessToken()) {
      clearWishlistPageSessionCache();
      router.replace(loginUrlWithCurrentPageAsNext());
      return;
    }

    let cancelled = false;

    const persistBoardSnapshot = (
      viewerNameForCache: string,
      board: MyBoardData,
    ) => {
      const derived = deriveWishSlotState(board.data.items);
      const next: WishlistPageSessionCache = {
        viewerName: viewerNameForCache,
        boardSlug: board.data.boardSlug,
        boardAssets: board.data.assets,
        wishTexts: derived.wishTexts,
        wishGiftIconKeys: derived.wishGiftIconKeys,
        bigCircleCount: derived.bigCircleCount,
        allWishSlotsEmpty: derived.allWishSlotsEmpty,
        hasMyBoard: true,
      };
      setWishlistPageSessionCache(next);
    };

    const persistEmptySnapshot = (viewerNameForCache: string) => {
      const next: WishlistPageSessionCache = {
        viewerName: viewerNameForCache,
        boardSlug: null,
        boardAssets: [],
        wishTexts: ["", "", ""],
        wishGiftIconKeys: ["", "", ""],
        bigCircleCount: 1,
        allWishSlotsEmpty: true,
        hasMyBoard: false,
      };
      setWishlistPageSessionCache(next);
    };

    const load = async () => {
      try {
        const profileResult = await Promise.allSettled([getMyProfile()]).then(
          (r) => r[0],
        );

        if (cancelled) {
          return;
        }

        if (profileResult.status === "fulfilled") {
          const profile = profileResult.value;
          const displayName =
            profile.nickname?.trim() || profile.username?.trim() || "회원";
          setViewerName(displayName);

          if (
            profile.role === "ADMIN" &&
            typeof window !== "undefined" &&
            sessionStorage.getItem(SESSION_ADMIN_RESET_SYNC_KEY) !== "1"
          ) {
            try {
              await postAdminAssetsResetSync();
              sessionStorage.setItem(SESSION_ADMIN_RESET_SYNC_KEY, "1");
            } catch {
              /* 401/403/500 — 일반 유저·일시 오류 시 보드 로드는 계속 */
            }
          }

          if (!profile.hasWishBoard) {
            setHasMyBoard(false);
            setAllWishSlotsEmpty(true);
            setBoardAssets([]);
            persistEmptySnapshot(displayName);
            return;
          }

          try {
            const board = await getMyBoard();
            if (cancelled) {
              return;
            }
            applyLoadedBoard(board);
            setHasMyBoard(true);
            persistBoardSnapshot(displayName, board);
          } catch {
            if (!cancelled) {
              setHasMyBoard(false);
              setAllWishSlotsEmpty(true);
              setBoardAssets([]);
              persistEmptySnapshot(displayName);
            }
          }
          return;
        }

        try {
          const board = await getMyBoard();
          if (cancelled) {
            return;
          }
          applyLoadedBoard(board);
          setHasMyBoard(true);
          const fallbackName =
            getWishlistPageSessionCache()?.viewerName ?? "회원";
          persistBoardSnapshot(fallbackName, board);
        } catch {
          if (!cancelled) {
            setHasMyBoard(false);
            setAllWishSlotsEmpty(true);
            setBoardAssets([]);
            persistEmptySnapshot(
              getWishlistPageSessionCache()?.viewerName ?? "회원",
            );
          }
        }
      } catch {
        if (!cancelled) {
          setHasMyBoard(false);
          setAllWishSlotsEmpty(true);
          setBoardAssets([]);
          persistEmptySnapshot(
            getWishlistPageSessionCache()?.viewerName ?? "회원",
          );
        }
      } finally {
        if (!cancelled) {
          setWishSlotsLoaded(true);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [router, applyLoadedBoard]);

  /** 보드 없음일 때 온보딩 UI는 메인(`/`)과 통합 — `/wishlist` 직진 시 메인으로 이동 */
  useEffect(() => {
    if (!wishSlotsLoaded || hasMyBoard) return;
    if (!getAccessToken()) return;
    router.replace("/");
  }, [wishSlotsLoaded, hasMyBoard, router]);

  /** 메인에서 위시보드 생성 직후 진입 시 한 번만 꾸미기 모드로 연다 */
  useEffect(() => {
    if (!wishSlotsLoaded || !hasMyBoard || typeof window === "undefined") return;
    try {
      if (sessionStorage.getItem(SESSION_OPEN_DECORATE_AFTER_CREATE_KEY) === "1") {
        sessionStorage.removeItem(SESSION_OPEN_DECORATE_AFTER_CREATE_KEY);
        setIsDecorateMode(true);
      }
    } catch {
      /* ignore */
    }
  }, [wishSlotsLoaded, hasMyBoard]);

  /** 라우트 이동 직전 항상 최신 보드 상태를 가리키도록 유지 — 언마운트 시에만 세션 캐시에 반영 */
  const wishlistSessionSnapshotRef = useRef<WishlistPageSessionCache | null>(null);
  wishlistSessionSnapshotRef.current = {
    viewerName,
    boardSlug,
    boardAssets,
    wishTexts,
    wishGiftIconKeys,
    bigCircleCount,
    allWishSlotsEmpty,
    hasMyBoard,
  };

  const wishSlotsLoadedRef = useRef(false);
  wishSlotsLoadedRef.current = wishSlotsLoaded;

  useEffect(() => {
    return () => {
      if (!getAccessToken()) {
        return;
      }
      if (!wishSlotsLoadedRef.current) {
        return;
      }
      const snap = wishlistSessionSnapshotRef.current;
      if (snap) {
        setWishlistPageSessionCache(snap);
      }
    };
  }, []);

  /** 선물 슬롯 클릭으로 모달이 열릴 때 — `/api/assets/gift-icons`(assetKey → `icons/{카테고리}/…`) 로드 */
  useEffect(() => {
    if (!isGiftModalOpen) {
      return;
    }

    let cancelled = false;

    const loadGiftIcons = async () => {
      setGiftIconsLoading(true);
      setGiftIconsError(null);
      try {
        const list = await fetchGiftIcons();
        if (!cancelled) {
          setGiftIcons(list);
        }
      } catch (error) {
        if (!cancelled) {
          setGiftIcons([]);
          setGiftIconsError(
            error instanceof Error
              ? error.message
              : "선물 아이콘을 불러오지 못했습니다.",
          );
        }
      } finally {
        if (!cancelled) {
          setGiftIconsLoading(false);
        }
      }
    };

    void loadGiftIcons();

    return () => {
      cancelled = true;
    };
  }, [isGiftModalOpen]);

  useEffect(() => {
    if (!isGiftModalOpen) {
      return;
    }
    setGiftIconModalTab("all");
  }, [isGiftModalOpen]);

  useEffect(() => {
    if (!isGiftModalOpen) {
      giftIconTabStripScroll.detach();
    }
  }, [isGiftModalOpen, giftIconTabStripScroll]);

  const catalogGiftIconsExtra = useMemo(() => giftIcons.slice(1), [giftIcons]);

  const filteredCatalogGiftIcons = useMemo(() => {
    if (giftIconModalTab === "all") {
      return catalogGiftIconsExtra;
    }
    return catalogGiftIconsExtra.filter(
      (icon) => giftIconCategoryFromAssetKey(icon.assetKey) === giftIconModalTab,
    );
  }, [catalogGiftIconsExtra, giftIconModalTab]);

  /** 목록 최초 로드 후 — 저장된 키가 카탈로그 첫 항목과 같으면 「기본 선물」로 표시 */
  useEffect(() => {
    if (!isGiftModalOpen || giftModalMode !== "edit") {
      giftEditPresetSyncRef.current = { slot: -1, done: false };
      return;
    }
    if (giftEditPresetSyncRef.current.slot !== giftModalSlotIndex) {
      giftEditPresetSyncRef.current = {
        slot: giftModalSlotIndex,
        done: false,
      };
    }
    if (giftIcons.length === 0 || giftEditPresetSyncRef.current.done) {
      return;
    }
    const key = wishGiftIconKeys[giftModalSlotIndex]?.trim() ?? "";
    const first = giftIcons[0]?.assetKey?.trim();
    giftEditPresetSyncRef.current.done = true;
    if (first && key && matchesGiftPresetIcon(key, first)) {
      setGiftModalSpecial("present");
    }
  }, [
    isGiftModalOpen,
    giftModalMode,
    giftModalSlotIndex,
    giftIcons,
    wishGiftIconKeys,
  ]);

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

  /** 스티커 바텀시트: 탭(전체 / 폴더)에 맞게 API 조회 */
  useEffect(() => {
    if (!isBottomSheetOpen) {
      return;
    }

    let cancelled = false;

    const run = async () => {
      setStickerSheetLoading(true);
      setStickerSheetError(null);
      try {
        if (stickerModalTab === "all") {
          const list = await fetchStickerAssets();
          if (!cancelled) {
            setStickerSheetList(list);
          }
        } else {
          const list = await fetchStickersByFolder(stickerModalTab);
          if (!cancelled) {
            setStickerSheetList(list);
          }
        }
      } catch (error) {
        if (!cancelled) {
          setStickerSheetList([]);
          setStickerSheetError(
            error instanceof Error
              ? error.message
              : "스티커를 불러오지 못했습니다.",
          );
        }
      } finally {
        if (!cancelled) {
          setStickerSheetLoading(false);
        }
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [isBottomSheetOpen, stickerModalTab]);

  useEffect(() => {
    if (!isBottomSheetOpen) {
      stickerTabStripScroll.detach();
    }
  }, [isBottomSheetOpen, stickerTabStripScroll]);

  useEffect(() => {
    if (!isCompactBackgroundOpen) {
      backgroundPickerStripScroll.detach();
    } else {
      setBackgroundSaveError(null);
    }
  }, [isCompactBackgroundOpen, backgroundPickerStripScroll]);

  useEffect(() => {
    if (!isShareModalOpen) {
      setShareLinkCopyFeedback(false);
    }
  }, [isShareModalOpen]);

  useEffect(() => {
    if (!shareLinkCopyFeedback) {
      return;
    }
    const t = window.setTimeout(() => setShareLinkCopyFeedback(false), 2500);
    return () => window.clearTimeout(t);
  }, [shareLinkCopyFeedback]);

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

  const closeGiftModal = () => {
    giftIconTabStripScroll.detach();
    setIsGiftModalOpen(false);
    setGiftModalSaving(false);
    setGiftModalDeleting(false);
    setGiftModalSaveError(null);
    setGiftModalSpecial(null);
  };

  const closeStickerPicker = useCallback(() => {
    stickerTabStripScroll.detach();
    setIsBottomSheetOpen(false);
    setStickerTargetSlotId(null);
    setStickerSlotSaveError(null);
  }, [stickerTabStripScroll]);

  const applyStickerSelection = useCallback(
    async (assetKey: string) => {
      const keyTrim = assetKey.trim();
      const slotId = stickerTargetSlotId;
      if (slotId == null || !keyTrim) {
        return;
      }

      setStickerSlotSaving(true);
      setStickerSlotSaveError(null);
      try {
        await putMyBoardStickerSlot(slotId, keyTrim);
        const board = await getMyBoard();
        applyLoadedBoard(board);
        setIsBottomSheetOpen(false);
        setStickerTargetSlotId(null);
        setStickerSlotSaveError(null);
      } catch (e) {
        setStickerSlotSaveError(
          e instanceof Error ? e.message : "스티커를 저장하지 못했습니다.",
        );
      } finally {
        setStickerSlotSaving(false);
      }
    },
    [stickerTargetSlotId, applyLoadedBoard],
  );

  const removeStickerFromSlot = useCallback(async () => {
    const slotId = stickerTargetSlotId;
    if (slotId == null) {
      return;
    }

    setStickerSlotSaving(true);
    setStickerSlotSaveError(null);
    try {
      await deleteMyBoardStickerSlot(slotId);
      const board = await getMyBoard();
      applyLoadedBoard(board);
      setIsBottomSheetOpen(false);
      setStickerTargetSlotId(null);
      setStickerSlotSaveError(null);
    } catch (e) {
      setStickerSlotSaveError(
        e instanceof Error ? e.message : "스티커를 삭제하지 못했습니다.",
      );
    } finally {
      setStickerSlotSaving(false);
    }
  }, [stickerTargetSlotId, applyLoadedBoard]);

  /**
   * 배경 시트를 내릴 때만 서버에 반영합니다.
   * 시트가 열린 동안 썸네일 클릭은 `draftBackgroundAssetKey`로만 미리보기합니다.
   * @returns 저장·닫기 성공 여부(실패 시 시트 유지)
   */
  const dismissCompactBackgroundSheet = useCallback(async (): Promise<boolean> => {
    if (!isCompactBackgroundOpen) {
      return true;
    }

    const serverKey =
      boardAssets.find((a) => a.assetType === "BACKGROUND")?.assetKey?.trim() ?? "";

    setBackgroundSaveError(null);
    const draft = draftBackgroundAssetKey;

    if (draft === null || draft === serverKey) {
      setDraftBackgroundAssetKey(null);
      setIsCompactBackgroundOpen(false);
      return true;
    }

    setBackgroundSaving(true);
    try {
      if (draft === "") {
        await deleteMyBoardBackground();
      } else {
        await putMyBoardBackground(draft);
      }
      const board = await getMyBoard();
      applyLoadedBoard(board);
      setDraftBackgroundAssetKey(null);
      setIsCompactBackgroundOpen(false);
      return true;
    } catch (e) {
      setBackgroundSaveError(
        e instanceof Error ? e.message : "배경을 저장하지 못했습니다.",
      );
      return false;
    } finally {
      setBackgroundSaving(false);
    }
  }, [applyLoadedBoard, boardAssets, draftBackgroundAssetKey, isCompactBackgroundOpen]);

  const toggleSidebar = () => {
    void (async () => {
      if (isCompactBackgroundOpen) {
        const ok = await dismissCompactBackgroundSheet();
        if (!ok) {
          return;
        }
      }
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
    })();
  };

  const openGiftModalAdd = () => {
    setGiftModalMode("add");
    setModalGiftName("");
    setModalSelectedIconId(null);
    /** 첫 칸 ×가 아닌 카탈로그 ①번(기본 선물) 이미지가 기본 선택 */
    setGiftModalSpecial("present");
    setGiftModalSaveError(null);
    setIsGiftModalOpen(true);
  };

  const openGiftModalEdit = (slotIndex: number) => {
    setGiftModalMode("edit");
    setGiftModalSlotIndex(slotIndex);
    setModalGiftName(wishTexts[slotIndex] ?? "");
    setModalSelectedIconId(null);
    const key = wishGiftIconKeys[slotIndex]?.trim() ?? "";
    if (!key || matchesGiftPresetIcon(key, giftIcons[0]?.assetKey)) {
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
      const emptyIdx = firstSemanticallyEmptyApiIndex(wishTexts, wishGiftIconKeys);
      if (emptyIdx === undefined) {
        return;
      }
      idx0 = emptyIdx;
    } else {
      idx0 = giftModalSlotIndex;
    }

    const slotIndexApi = idx0 + 1;

    let patchBody: Parameters<typeof patchMyWishItem>[1];
    let nextIconKeyForLocal: string;

    if (giftModalSpecial === "present") {
      const presetKey = STORED_PUBLIC_DEFAULT_GIFT_ICON_KEY;
      patchBody = { itemName: name, iconKey: presetKey };
      nextIconKeyForLocal = presetKey;
    } else {
      const resolvedIconId =
        modalSelectedIconId ??
        (giftModalMode === "add" && giftIcons.length > 0 ? giftIcons[0]?.id ?? null : null);
      const selected =
        resolvedIconId != null ? giftIcons.find((g) => g.id === resolvedIconId) : undefined;
      let iconKeyPayload = selected?.assetKey?.trim() ?? "";
      if (!iconKeyPayload) {
        iconKeyPayload = STORED_PUBLIC_DEFAULT_GIFT_ICON_KEY;
      }
      patchBody = {
        itemName: name,
        iconKey: iconKeyPayload,
      };
      nextIconKeyForLocal = iconKeyPayload;
    }

    setGiftModalSaving(true);
    setGiftModalSaveError(null);

    try {
      await patchMyWishItem(slotIndexApi, patchBody);

      try {
        const board = await getMyBoard();
        applyLoadedBoard(board);
        setHasMyBoard(true);
      } catch {
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
        setAllWishSlotsEmpty(false);
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
      setGiftModalSpecial("present");
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
    if (!isGiftModalOpen) {
      return;
    }
    // 카탈로그 없음: 카탈로그 기반 선택 불가 → 기본 선물(첫 칸)만
    if (giftIcons.length === 0) {
      if (giftModalSpecial == null) {
        setGiftModalSpecial("present");
      }
      return;
    }
    if (giftModalSpecial !== null) {
      return;
    }
    setModalSelectedIconId((prev) => {
      const inCatalog = (id: number) => giftIcons.some((g) => g.id === id);
      // 사용자가 방금 누른 선택(prev) — 서버 키로 다시 덮으면 첫 클릭이 씹힘(더블클릭 필요 현상)
      if (prev != null && inCatalog(prev)) {
        return prev;
      }
      if (giftModalMode === "edit") {
        const key = wishGiftIconKeys[giftModalSlotIndex]?.trim() ?? "";
        const found = key ? giftIcons.find((g) => g.assetKey === key) : undefined;
        return found?.id ?? giftIcons[0]!.id;
      }
      return giftIcons[0]!.id;
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
        closeStickerPicker();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isBottomSheetOpen, closeStickerPicker]);

  useEffect(() => {
    if (!isCompactBackgroundOpen) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        void dismissCompactBackgroundSheet();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isCompactBackgroundOpen, dismissCompactBackgroundSheet]);

  const giftSlotImages = useMemo(() => {
    const compact = compactGiftAssetKeysToLayoutSlots(wishTexts, wishGiftIconKeys);
    const out: Partial<Record<number, string>> = {};
    for (const [layoutId, key] of Object.entries(compact)) {
      const k = key?.trim();
      if (k) {
        out[Number(layoutId)] = getAssetImageUrl(k);
      }
    }
    return out;
  }, [wishTexts, wishGiftIconKeys]);

  const giftSlotLabels = useMemo(() => {
    return compactGiftTextsToLayoutSlots(wishTexts, wishGiftIconKeys);
  }, [wishTexts, wishGiftIconKeys]);

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

  /** 서버에 저장된 배경 에셋 키. 없으면 기본(빈 문자열). */
  const serverBackgroundAssetKey = useMemo(() => {
    const bg = boardAssets.find((a) => a.assetType === "BACKGROUND");
    return bg?.assetKey?.trim() ?? "";
  }, [boardAssets]);

  /** 시트에서 보여줄·강조할 현재 선택(미리보기 우선). */
  const effectiveBackgroundSelectionKey = useMemo(() => {
    if (draftBackgroundAssetKey !== null) {
      return draftBackgroundAssetKey;
    }
    return serverBackgroundAssetKey;
  }, [draftBackgroundAssetKey, serverBackgroundAssetKey]);

  const boardBackgroundDisplayUrl = useMemo(() => {
    if (draftBackgroundAssetKey === null) {
      return serverBackgroundUrl;
    }
    if (draftBackgroundAssetKey === "") {
      return null;
    }
    return getAssetImageUrl(draftBackgroundAssetKey);
  }, [draftBackgroundAssetKey, serverBackgroundUrl]);

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

    const addFormTouched =
      Boolean(modalGiftName.trim()) ||
      giftModalSpecial !== "present" ||
      modalSelectedIconId != null;

    if (giftModalMode === "add") {
      return addFormTouched;
    }

    const slotHasContent =
      Boolean(wishTexts[giftModalSlotIndex]?.trim()) ||
      Boolean(wishGiftIconKeys[giftModalSlotIndex]?.trim());

    return slotHasContent || addFormTouched;
  }, [
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

  const handleLogout = () => {
    clearAccessToken();
    clearWishlistPageSessionCache();
    setIsSidebarOpen(false);
    router.push("/login");
  };

  useEffect(() => {
    setSidebarPortalReady(true);
  }, []);

  const openStickerPickerForSlot = (slotId: number) => {
    setStickerTargetSlotId(slotId);
    setStickerModalTab("all");
    setStickerSlotSaveError(null);
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
        className={`fixed inset-0 z-20 transition-opacity duration-300 ${
          isShareModalOpen
            ? "pointer-events-auto bg-black/20 opacity-100"
            : isCompactBackgroundOpen
              ? "pointer-events-auto bg-black/10 opacity-100"
              : "pointer-events-none bg-black/20 opacity-0"
        }`}
        onClick={
          isShareModalOpen || isCompactBackgroundOpen
            ? () => {
                if (isShareModalOpen) {
                  closeEditUi();
                  return;
                }
                void dismissCompactBackgroundSheet();
              }
            : undefined
        }
        aria-hidden={!(isShareModalOpen || isCompactBackgroundOpen)}
      />

      <div className="relative z-10 flex min-h-0 w-full flex-1 flex-col items-center justify-start overflow-visible transition-all duration-300 ease-out">
        {!wishSlotsLoaded ? (
          <div
            className={`${WISHLIST_APP_SHELL} ${WISHLIST_APP_SHELL_MAX_LOADING} flex min-h-[min(400px,70dvh)] w-full shrink-0 items-center justify-center px-8`}
          >
            <p className="text-body-sm text-[var(--color-text-secondary)]">
              위시 슬롯을 불러오는 중…
            </p>
          </div>
        ) : !hasMyBoard ? (
          <div
            className={`${WISHLIST_APP_SHELL} ${WISHLIST_APP_SHELL_MAX_LOADING} flex min-h-[min(400px,70dvh)] w-full shrink-0 items-center justify-center px-8`}
          >
            <p className="text-body-sm text-[var(--color-text-secondary)]">
              메인으로 이동 중…
            </p>
          </div>
        ) : (
          <section className={`${WISHLIST_BOARD_PAGE_WRAP} mx-auto w-full`}>
            <div className="relative flex min-h-0 flex-1 flex-col overflow-visible p-0">
              <div className="relative flex min-h-0 flex-1 w-full min-w-0 items-center justify-end overflow-visible px-1 pb-1 pt-2 sm:px-2 sm:pb-2 sm:pt-3">
                <div
                  className={`${WISHLIST_BOARD_FRAME_BASE} wishlist-board-frame--decorate relative mx-auto w-full max-w-[372px] max-h-[min(680px,100%)] shrink-0 ring-violet-200/55`}
                  style={{
                    aspectRatio: `${DESIGN_WIDTH} / ${DESIGN_HEIGHT}`,
                  }}
                >
              {boardBackgroundDisplayUrl ? (
                <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden rounded-[18px]">
                  <img
                    src={boardBackgroundDisplayUrl}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                </div>
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
                labels={giftSlotLabels}
                decorateActive={isDecorateMode}
                onSlotClick={(slotId) => {
                  if (!isDecorateMode) {
                    return;
                  }
                  const apiIdx = resolveLayoutGiftClickToApiIndex(
                    slotId,
                    bigCircleCount,
                    wishTexts,
                    wishGiftIconKeys,
                  );
                  if (apiIdx != null) {
                    openGiftModalEdit(apiIdx);
                  }
                }}
                showPlaceholder={showSlotPlaceholders}
              />
              <StickerSlots
                decorateActive={isDecorateMode}
                images={stickerSlotImages}
                onSlotClick={(slotId) => {
                  if (!isDecorateMode) {
                    return;
                  }
                  openStickerPickerForSlot(slotId);
                }}
                showPlaceholder={showSlotPlaceholders}
              />

              {isDecorateMode ? (
                <div
                  className={`pointer-events-none absolute bottom-[5%] left-0 right-0 z-[24] flex justify-center px-[8%] transition-opacity duration-200 ${
                    isBottomSheetOpen || isCompactBackgroundOpen
                      ? "opacity-0"
                      : "opacity-100"
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsCompactBackgroundOpen(true)}
                      className="pointer-events-auto inline-flex items-center gap-1 rounded-full border border-dashed border-[#7B61FF]/60 bg-white/95 px-3 py-1.5 text-[11px] font-semibold text-[#7B61FF] shadow-sm backdrop-blur-sm transition hover:bg-white"
                      aria-label="배경 선택"
                    >
                      <ImageIcon size={15} weight="bold" className="shrink-0" aria-hidden />
                      배경
                    </button>
                    {bigCircleCount < 3 ? (
                      <button
                        type="button"
                        onClick={() => openGiftModalAdd()}
                        className="pointer-events-auto rounded-full border border-dashed border-[#7B61FF]/60 bg-white/95 px-3 py-1.5 text-[11px] font-semibold text-[#7B61FF] shadow-sm backdrop-blur-sm transition hover:bg-white"
                      >
                        + 선물 추가 ({bigCircleCount}/3)
                      </button>
                    ) : null}
                  </div>
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
                      void (async () => {
                        if (isCompactBackgroundOpen) {
                          const ok = await dismissCompactBackgroundSheet();
                          if (!ok) {
                            return;
                          }
                        }
                        setIsDecorateMode(false);
                        setIsBottomSheetOpen(false);
                        setIsCompactBackgroundOpen(false);
                        setStickerTargetSlotId(null);
                      })();
                      return;
                    }
                    void postAdminAssetsSync().catch((error) => {
                      console.warn("에셋 동기화 요청 실패", error);
                    });
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
          </section>
        )}
      </div>

      <section
        className={`fixed inset-x-0 bottom-0 z-[31] max-h-[min(48dvh,440px)] overflow-y-auto overscroll-y-contain rounded-t-[18px] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 pb-[max(0.5rem,var(--safe-area-bottom))] pt-3 shadow-[0_-8px_28px_rgba(0,0,0,0.1)] transition-transform duration-300 ease-out ${
          isCompactBackgroundOpen ? "translate-y-0" : "translate-y-full"
        }`}
        aria-hidden={!isCompactBackgroundOpen}
      >
        <div className="mx-auto w-full max-w-[372px]">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="bg-gradient-to-r from-[#5346C9] via-[#7B61FF] to-[#5B8DEF] bg-clip-text text-[1.0625rem] font-extrabold leading-snug tracking-tight text-transparent">
                배경 선택
              </p>
              <p className="mt-1 text-[12px] leading-snug text-slate-500">
                배경을 골라 미리 본 뒤, 시트를 닫으면 위시보드에 반영돼요
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                void dismissCompactBackgroundSheet();
              }}
              className="inline-flex size-9 shrink-0 items-center justify-center rounded-full text-slate-800 transition hover:bg-slate-100 active:opacity-60"
              aria-label="배경 선택 닫기"
            >
              <X size={20} weight="bold" aria-hidden />
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
          {backgroundSaveError ? (
            <p className="text-body-sm text-red-600" role="alert">
              {backgroundSaveError}
            </p>
          ) : null}

          <div
            ref={backgroundPickerStripScroll.stripRef}
            aria-label="배경 썸네일 목록"
            className="wishlist-background-picker-scroll mt-1 flex cursor-grab items-start gap-2.5 overflow-x-auto overflow-y-visible overscroll-x-contain pb-2 select-none active:cursor-grabbing touch-pan-x"
            onPointerDown={backgroundPickerStripScroll.onPointerDown}
          >
            <div className="flex w-24 shrink-0 flex-col gap-1.5 text-center">
              <p className="break-words text-center text-[10px] font-semibold leading-snug tracking-tight text-black">
                기본
              </p>
              <DefaultOptionButton
                className={`aspect-[3/4] w-full rounded-xl ${
                  effectiveBackgroundSelectionKey === ""
                    ? "ring-2 ring-[#7B61FF] ring-offset-2 ring-offset-[var(--color-surface)]"
                    : ""
                }`}
                label="기본 배경"
                disabled={backgroundSaving}
                onClick={() => {
                  setDraftBackgroundAssetKey("");
                }}
              />
            </div>

            {backgroundAssets.map((bg) => {
              const src = getAssetImageUrl(bg.assetKey);
              const label = resolveBackgroundDisplayLabel(bg.assetKey, bg.displayName);

              return (
                <button
                  key={bg.id}
                  type="button"
                  disabled={backgroundSaving}
                  onClick={() => {
                    setDraftBackgroundAssetKey(bg.assetKey.trim());
                  }}
                  className="group flex w-24 shrink-0 cursor-pointer flex-col gap-1.5 text-center transition hover:opacity-95 disabled:opacity-50"
                >
                  <p className="break-words text-center text-[10px] font-semibold leading-snug tracking-tight text-black">
                    {label}
                  </p>
                  <div
                    className={`relative aspect-[3/4] w-full overflow-hidden rounded-xl bg-slate-100 ring-1 transition group-hover:ring-[#7B61FF]/35 ${
                      effectiveBackgroundSelectionKey === bg.assetKey.trim()
                        ? "ring-2 ring-[#7B61FF] ring-offset-2 ring-offset-[var(--color-surface)]"
                        : "ring-slate-200/80"
                    }`}
                  >
                    <img
                      src={src}
                      alt={label}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <WishlistCenterDialog
        variant="animated"
        open={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        title="공유하기"
        titleId="wishlist-share-dialog-title"
        closeLabel="공유 창 닫기"
        description="위시리스트 링크를 복사하거나 공유할 수 있어요."
      >
        {/** URL 박스 위에만 덮어씀 — 모달·박스 밖으로 블러/배경 안 샘 */}
        <div className="relative mt-5 w-full min-w-0 max-w-full overflow-hidden rounded-[14px] border border-[var(--color-border)]">
          <div className="min-w-0 break-words break-all bg-[var(--color-bg-subtle)] px-4 py-3 text-sm text-[var(--color-text-primary)]">
            {boardSlug
              ? `${typeof window !== "undefined" ? window.location.origin : ""}/wishlist/${boardSlug}`
              : "링크를 불러오는 중..."}
          </div>
          {shareLinkCopyFeedback ? (
            <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center overflow-hidden rounded-[14px] bg-white/95 [backface-visibility:hidden] backdrop-blur-xl">
              <p
                className="min-w-0 max-w-full px-2 text-center text-sm font-semibold text-slate-700"
                role="status"
                aria-live="polite"
              >
                클립보드에 복사되었습니다.
              </p>
            </div>
          ) : null}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <button
            type="button"
            disabled={!boardSlug}
            onClick={async () => {
              if (!boardSlug) {
                return;
              }
              const url = `${window.location.origin}/wishlist/${boardSlug}`;
              try {
                await navigator.clipboard.writeText(url);
                setShareLinkCopyFeedback(true);
              } catch {
                // 클립보드 거부/비지원 — 조용히 무시(필요 시 토스트로 확장)
              }
            }}
            className="rounded-[14px] bg-[#7B61FF] px-4 py-3 text-sm font-semibold text-white transition-[transform,filter] active:scale-[0.98] active:brightness-95 disabled:opacity-50 disabled:active:scale-100"
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
            className="rounded-[14px] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm font-semibold text-[var(--color-text-primary)] transition-[transform,filter] active:scale-[0.98] active:brightness-95 disabled:opacity-40 disabled:active:scale-100"
          >
            공유하기
          </button>
        </div>
      </WishlistCenterDialog>

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

                <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-5 py-4">
                  {giftModalSaveError ? (
                    <p className="mb-3 shrink-0 text-body-sm text-red-600" role="alert">
                      {giftModalSaveError}
                    </p>
                  ) : null}
                  {giftIconsError ? (
                    <p className="mb-3 shrink-0 text-body-sm text-red-600" role="alert">
                      {giftIconsError}
                    </p>
                  ) : null}

                  <label className="block shrink-0">
                    <span className="text-sm font-medium text-slate-800">선물 이름</span>
                    <input
                      type="text"
                      value={modalGiftName}
                      onChange={(event) => setModalGiftName(event.target.value)}
                      placeholder="예: 터보 RC카"
                      className="mt-2 h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm text-slate-900 outline-none transition focus:border-[#7B61FF]"
                    />
                  </label>

                  <p className="mt-5 shrink-0 text-sm font-medium text-slate-800">선물 아이콘</p>

                  <div className="mt-3 flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-inner">
                    {giftIconsLoading ? (
                      <div className="flex min-h-[200px] flex-1 items-center justify-center">
                        <p className="text-body-sm text-slate-500">선물 아이콘 불러오는 중…</p>
                      </div>
                    ) : giftIconsError ? null : (
                      <>
                        {giftIcons.length > 0 ? (
                          <div
                            ref={giftIconTabStripScroll.stripRef}
                            role="tablist"
                            aria-label="선물 아이콘 카테고리"
                            className="scrollbar-x-none flex shrink-0 cursor-grab gap-1 overflow-x-auto overflow-y-hidden overscroll-x-contain border-b border-slate-100 px-2 pb-2 pt-2 select-none active:cursor-grabbing touch-pan-x"
                            onPointerDown={giftIconTabStripScroll.onPointerDown}
                          >
                            {GIFT_ICON_MODAL_TABS.map((tab) => {
                              const active = giftIconModalTab === tab.id;
                              return (
                                <button
                                  key={tab.id}
                                  type="button"
                                  role="tab"
                                  aria-selected={active}
                                  onClick={(clickEvent) => {
                                    if (giftIconTabStripScroll.mouseDragRef.current.dragged) {
                                      clickEvent.preventDefault();
                                      clickEvent.stopPropagation();
                                      return;
                                    }
                                    setGiftIconModalTab(tab.id);
                                  }}
                                  className={`shrink-0 cursor-pointer rounded-full px-3 py-1.5 text-xs font-semibold transition ${
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
                        ) : null}
                        <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain p-3 [-webkit-overflow-scrolling:touch]">
                          <div className="grid grid-cols-3 gap-2 content-start">
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
                                src={GIFT_MODAL_PRESET_IMAGE_SRC}
                                alt=""
                                className="h-full w-full object-contain p-1"
                                loading="lazy"
                                draggable={false}
                              />
                            </button>
                            {filteredCatalogGiftIcons.map((icon) => {
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
                              추가 아이콘 목록이 없습니다. 위 칸에서 기본 선물을 선택할 수 있어요.
                            </p>
                          ) : giftIconModalTab !== "all" &&
                            filteredCatalogGiftIcons.length === 0 &&
                            catalogGiftIconsExtra.length > 0 ? (
                            <p className="mt-2 text-center text-body-sm text-slate-500">
                              이 카테고리에 표시할 아이콘이 없습니다. 「전체」에서 선택해 보세요.
                            </p>
                          ) : null}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="grid shrink-0 grid-cols-2 gap-3 border-t border-slate-100 px-5 py-4">
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
                <div
                  ref={stickerTabStripScroll.stripRef}
                  role="tablist"
                  aria-label="스티커 카테고리"
                  className="scrollbar-x-none flex cursor-grab gap-1 overflow-x-auto overflow-y-hidden overscroll-x-contain border-b border-slate-100 px-2 pb-2 pt-2 select-none active:cursor-grabbing touch-pan-x"
                  onPointerDown={stickerTabStripScroll.onPointerDown}
                >
                  {STICKER_MODAL_TABS.map((tab) => {
                    const active = stickerModalTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        role="tab"
                        aria-selected={active}
                        onClick={(clickEvent) => {
                          if (stickerTabStripScroll.mouseDragRef.current.dragged) {
                            clickEvent.preventDefault();
                            clickEvent.stopPropagation();
                            return;
                          }
                          setStickerModalTab(tab.id);
                        }}
                        className={`shrink-0 cursor-pointer rounded-full px-3 py-1.5 text-xs font-semibold transition ${
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

                {stickerSlotSaveError ? (
                  <p className="px-3 pt-2 text-center text-body-sm text-red-600" role="alert">
                    {stickerSlotSaveError}
                  </p>
                ) : null}

                <div className="min-h-0 w-full px-2 pb-3 pt-2 [container-type:inline-size]">
                  {stickerSheetLoading ? (
                    <div
                      className="flex items-center justify-center"
                      style={{
                        minHeight: STICKER_GRID_6COL_3ROW_SCROLL_HEIGHT,
                      }}
                    >
                      <p className="text-body-sm text-slate-500">스티커 불러오는 중…</p>
                    </div>
                  ) : stickerSheetError ? (
                    <p
                      className="px-1 text-center text-body-sm text-red-600"
                      style={{
                        minHeight: STICKER_GRID_6COL_3ROW_SCROLL_HEIGHT,
                      }}
                      role="alert"
                    >
                      {stickerSheetError}
                    </p>
                  ) : (
                    <div
                      className="overflow-y-auto overflow-x-hidden overscroll-contain [-webkit-overflow-scrolling:touch] touch-pan-y"
                      style={{
                        maxHeight: STICKER_GRID_6COL_3ROW_SCROLL_HEIGHT,
                      }}
                    >
                      <div className="grid grid-cols-6 gap-1">
                        <button
                          type="button"
                          disabled={
                            stickerSlotSaving || stickerTargetSlotId == null
                          }
                          onClick={() => void removeStickerFromSlot()}
                          className="flex aspect-square items-center justify-center overflow-hidden rounded-md border-2 border-slate-300 bg-white text-xl font-semibold text-slate-500 transition enabled:hover:border-red-400 enabled:hover:bg-red-50 enabled:hover:text-red-600 enabled:active:scale-[0.98] disabled:opacity-50"
                          aria-label="이 슬롯에서 스티커 삭제"
                        >
                          ×
                        </button>
                        {stickerSheetList.map((sticker) => (
                          <button
                            key={sticker.id}
                            type="button"
                            disabled={
                              stickerSlotSaving ||
                              stickerTargetSlotId == null ||
                              !sticker.assetKey.trim()
                            }
                            onClick={() => void applyStickerSelection(sticker.assetKey)}
                            className="aspect-square overflow-hidden rounded-md border border-slate-200 bg-slate-50 transition enabled:hover:border-[#7B61FF]/50 enabled:active:scale-[0.98] disabled:opacity-50"
                            aria-label={`스티커 ${sticker.id}`}
                          >
                            <img
                              src={getAssetImageUrl(sticker.assetKey)}
                              alt=""
                              className="h-full w-full object-contain p-0.5"
                              loading="lazy"
                            />
                          </button>
                        ))}
                      </div>
                      {stickerSheetList.length === 0 ? (
                        <p className="mt-2 px-1 text-center text-body-sm text-slate-500">
                          이 탭에 표시할 스티커가 없습니다. 맨 앞 ×로 이 슬롯의 스티커를 지울 수
                          있어요.
                        </p>
                      ) : null}
                    </div>
                  )}
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}

      <AppSideMenu
        open={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onLogout={handleLogout}
      />
    </main>
  );
}
