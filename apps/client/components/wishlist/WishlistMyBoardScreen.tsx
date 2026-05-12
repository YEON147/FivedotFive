"use client";

import {
  Image as ImageIcon,
  PencilSimple,
  TextAlignJustify,
  TrashSimple,
  X,
} from "@phosphor-icons/react";
import Image from "next/image";
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

import { logoutSession } from "@/features/login/api";
import { getAccessToken } from "@/lib/api/token-store";

import { AppSideMenu } from "@/components/common/AppSideMenu";
import { BoardShareDialog, BoardShareFabButton } from "@/components/common/ShareBoardLink";
import {
  GiftIconGridSkeleton,
  GiftIconModalChromeSkeleton,
  StickerGridSkeleton,
  StickerSheetFixedViewport,
} from "@/components/wishlist/asset-picker-skeletons";
import { ScrollLazyModalImage } from "@/components/wishlist/ScrollLazyModalImage";
import {
  UI_FOCUS_OUTLINE_VISIBLE,
  UI_FOCUS_RING_INSET_VISIBLE,
} from "@/components/ui/focus-ring";
import {
  DESIGN_HEIGHT,
  DESIGN_WIDTH,
  GiftSlots,
  StickerSlots,
  type GiftLayoutCount,
} from "@/components/wishlist/WishlistSlots";
import {
  deleteMyBoardBackground,
  deleteMyBoardStickerSlot,
  deleteMyWishItem,
  getMyWishBoardDetail,
  patchMyWishItem,
  putMyBoardBackground,
  putMyBoardStickerSlot,
} from "@/features/wishlist/api";
import {
  compactGiftAssetKeysToLayoutSlots,
  compactGiftTextsToLayoutSlots,
  deriveWishSlotState,
  firstSemanticallyEmptyApiIndex,
  isStoredKeyGiftModalStaticPreset,
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
import type { MyProfile } from "@/features/user/types";
import { useMouseDragHorizontalScroll } from "@/hooks/use-mouse-drag-horizontal-scroll";
import {
  fetchBackgroundAssets,
  resolveBackgroundDisplayLabel,
  fetchStickerFolders,
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
import { shouldUseNativeImg } from "@/lib/native-img";
import {
  getStickerFolderLabel,
  orderStickerFoldersForTabs,
} from "@/lib/sticker-folder-labels";
import {
  loadGiftIconsWithSessionCache,
  loadStickerFolderWithSessionCache,
} from "@/lib/wishlist-asset-session-cache";
import {
  GIFT_ICON_CATEGORY_LABELS,
  GIFT_ICON_TRAVEL_LEGACY_TAB_ID,
  GIFT_ICON_TRAVEL_REGION_IDS,
  GIFT_ICON_TRAVEL_REGION_LABELS,
  giftIconCategoryFromAssetKey,
  giftIconTravelRegionFromAssetKey,
  type GiftIconCategoryId,
  type GiftIconTravelSubTabId,
} from "@/lib/gift-icon-category";

export type WishlistMyBoardScreenProps = {
  /** `[slug]` 경로의 보드 — `/api/boards/{slug}/…` 편집용 호출에 사용 */
  routeBoardSlug: string;
  /** `/wishlist/[slug]` 캐러셀 첫 슬라이드에 넣을 때 — 중첩 `<main>` 방지 등 */
  embeddedInSlugCarousel?: boolean;
  /** 바깥에 프로필 헤더가 있을 때 내부 타이틀 헤더 숨김 */
  omitInnerTitleHeader?: boolean;
  /** 모달·꾸미기 중 가로 스와이프 잠금 */
  onCarouselInteractionLockChange?: (locked: boolean) => void;
  /** 부모 캐러셀에서 현재 보이는 페이지(0=위시). 댓글 면으로 넘어가면 플로팅 버튼 흐림 */
  embeddedCarouselVisualPage?: number;
  /**
   * 슬러그 공개 페이지에서 임베드할 때 — 카드 배경·댓글 면은 부모가 `boardAssets`/`items`를 들고 있음.
   * 자식에서 GET /boards/me 반영 시 부모 상태도 같이 맞춰야 배경이 즉시 바뀜.
   */
  onEmbeddedBoardSynced?: (payload: {
    assets: BoardAssetData[];
    items: WishItemData[];
  }) => void;
  /**
   * 슬러그 임베드 시 카드 배경은 부모가 그림 — 배경 시트가 열린 동안 선택값을 같은 규칙으로 미리보기.
   * `null`이면 시트 닫힘·저장 상태만 반영, 문자열은 시트 중 선택(빈 문자열=기본 배경).
   */
  onEmbeddedBackgroundDraftKeyChange?: (assetKey: string | null) => void;
  /**
   * `[slug]` 부모가 이미 `GET /api/users/me`로 받은 프로필 — 임베드 시 중복 `me` 호출 생략.
   */
  embeddedPrefetchedProfile?: MyProfile | null;
  /**
   * 부모가 `fetchStickerFolders(slug)` 결과를 넘김 — 임베드 시 동일 슬러그로 폴더 API 재호출 생략.
   * `undefined`면(비임베드·레거시) 기존처럼 자식에서 조회.
   */
  embeddedStickerFoldersFromParent?: string[];
};

type GiftModalSpecial = "present" | null;

const WISHLIST_BOARD_BG_SIZES =
  "(max-width: 480px) min(420px, calc(100vw - 1.5rem)), min(372px, 100vw)";
const BACKGROUND_PICKER_THUMB_SIZES = "96px";
const GIFT_ICON_GRID_SIZES = "(max-width: 400px) 30vw, 120px";
const STICKER_SHEET_CELL_SIZES = "(max-width: 360px) 16vw, 56px";

/** ADMIN: 탭당 1회 — `/api/admin/assets/reset-sync` (에셋 DB 전체 재동기화) */
const SESSION_ADMIN_RESET_SYNC_KEY = "oh_jjeom_oh_admin_assets_reset_sync_once";

/**
 * `GET /api/assets/stickers/folders?boardSlug=` 실패 시에만 사용하는 기본 폴더 id.
 * 야구 전용 폴더는 포함하지 않음(구단 보드는 API로만 폴더 목록 확보).
 */
const FALLBACK_STICKER_FOLDER_IDS: readonly string[] = [
  "balloon",
  "universe",
  "message",
  "dinosaur",
  "bubble",
  "cute",
  "dessert",
];

/** PUT/DELETE 직후 화면에 바로 반영 — 재조회 타이밍·`<Image>` 캐시로 배경이 늦게 바뀌는 현상 완화 */
function boardAssetsWithBackgroundKey(
  assets: BoardAssetData[],
  backgroundKey: string,
): BoardAssetData[] {
  const rest = assets.filter((a) => a.assetType !== "BACKGROUND");
  const trimmed = backgroundKey.trim();
  if (!trimmed) return rest;
  return [...rest, { assetType: "BACKGROUND", assetKey: trimmed, slotIndex: null }];
}

type StickerModalTabId = string;

/** 선물 아이콘 S3 카테고리(`icons/{id}/…`) — 스티커 탭과 동일한 pill UI */
const GIFT_ICON_MODAL_TABS = [
  { id: "travel", label: GIFT_ICON_CATEGORY_LABELS.travel },
  { id: "food", label: GIFT_ICON_CATEGORY_LABELS.food },
  { id: "kpop", label: GIFT_ICON_CATEGORY_LABELS.kpop },
  { id: "hobby", label: GIFT_ICON_CATEGORY_LABELS.hobby },
  { id: "life", label: GIFT_ICON_CATEGORY_LABELS.life },
  { id: "baseball", label: GIFT_ICON_CATEGORY_LABELS.baseball },
] as const;

type GiftIconModalTabId = GiftIconCategoryId;

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

/** 선물 이름 프론트 입력 제한 (서버 DB는 더 길게 허용 가능) */
const WISH_ITEM_NAME_MAX_LENGTH = 24;

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
            <span className="font-bold leading-[1.18] text-[#7B61FF]">{viewerName}</span>
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
      className={`flex items-center justify-center overflow-hidden rounded-2xl border border-slate-300 bg-white text-slate-500 transition hover:border-slate-400 disabled:opacity-50 ${UI_FOCUS_RING_INSET_VISIBLE} ${className}`}
      aria-label={`${label} option`}
    >
      <span className="text-xl font-semibold leading-none">×</span>
    </button>
  );
}

export function WishlistMyBoardScreen({
  routeBoardSlug,
  embeddedInSlugCarousel = false,
  omitInnerTitleHeader = false,
  onCarouselInteractionLockChange,
  embeddedCarouselVisualPage,
  onEmbeddedBoardSynced,
  onEmbeddedBackgroundDraftKeyChange,
  embeddedPrefetchedProfile = null,
  embeddedStickerFoldersFromParent,
}: WishlistMyBoardScreenProps) {
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
  /** 탭·지역 바뀔 때 썸네일 전부 디코딩 후 그리드 표시(위→아래 순차 등장 방지) */
  const [giftCatalogRasterReady, setGiftCatalogRasterReady] = useState(true);
  /** 프리로드 완료 뒤 스켈레톤 레이어 페이드아웃·언마운트(깜빡임 완화) */
  const [giftCatalogSkeletonFadeDone, setGiftCatalogSkeletonFadeDone] =
    useState(false);
  /** 그리드 래스터 준비 후 짧은 등장 트랜지션 */
  const [giftCatalogGridEntered, setGiftCatalogGridEntered] = useState(false);
  const [giftIconModalTab, setGiftIconModalTab] =
    useState<GiftIconModalTabId>("travel");
  /** 여행 카테고리 선택 시 — 도시별 서브탭 */
  const [giftIconTravelSubTab, setGiftIconTravelSubTab] =
    useState<GiftIconTravelSubTabId>("busan");
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
  /** 꾸미기 진입 시 에셋 동기화 API는 관리자만 호출 */
  const [viewerIsAdmin, setViewerIsAdmin] = useState(false);
  const [backgroundAssets, setBackgroundAssets] = useState<BackgroundAssetDto[]>([]);
  const [backgroundsLoading, setBackgroundsLoading] = useState(false);
  const [backgroundsError, setBackgroundsError] = useState<string | null>(null);
  const [backgroundSaving, setBackgroundSaving] = useState(false);
  const [backgroundSaveError, setBackgroundSaveError] = useState<string | null>(null);
  const [stickerModalTab, setStickerModalTab] = useState<StickerModalTabId>(
    () => FALLBACK_STICKER_FOLDER_IDS[0] ?? "balloon",
  );
  const [stickerSheetList, setStickerSheetList] = useState<StickerAssetDto[]>([]);
  const [stickerSheetLoading, setStickerSheetLoading] = useState(false);
  const [stickerSheetError, setStickerSheetError] = useState<string | null>(null);
  /** 현재 탭 썸네일 전부 디코딩 후 그리드 표시(위→아래 순차 로딩 완화) */
  const [stickerSheetRasterReady, setStickerSheetRasterReady] = useState(true);
  const [stickerSlotSaving, setStickerSlotSaving] = useState(false);
  const [stickerSlotSaveError, setStickerSlotSaveError] = useState<string | null>(null);
  /** `GET /api/assets/stickers/folders?boardSlug=` — 구단 보드면 야구 폴더 포함 목록 */
  const [stickerFolderIds, setStickerFolderIds] = useState<string[]>([]);
  const backgroundHoldTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stickerTabStripScroll = useMouseDragHorizontalScroll();
  const backgroundPickerStripScroll = useMouseDragHorizontalScroll();
  const giftIconTabStripScroll = useMouseDragHorizontalScroll();
  const giftTravelTabStripScroll = useMouseDragHorizontalScroll();
  /** 선물 수정 모달: 목록 최초 로드 시에만 프리셋 여부 동기화(재선택 덮어쓰기 방지) */
  const giftEditPresetSyncRef = useRef<{ slot: number; done: boolean }>({
    slot: -1,
    done: false,
  });
  /** 슬러그 임베드 + 배경 낙관적 반영 시 부모에 넘길 `items`(직전 GET 기준) */
  const lastLoadedWishItemsRef = useRef<WishItemData[]>([]);

  const wishlistShareLinkHref = useMemo(() => {
    const s = boardSlug?.trim();
    if (!s) return null;
    return `/wishlist/${encodeURIComponent(s)}`;
  }, [boardSlug]);

  const wishlistShareAbsoluteUrl = useMemo(() => {
    const s = boardSlug?.trim();
    if (!s || typeof window === "undefined") return null;
    return `${window.location.origin}/wishlist/${encodeURIComponent(s)}`;
  }, [boardSlug]);

  const applyLoadedBoard = useCallback(
    (board: MyBoardData) => {
      const { items, assets, boardSlug } = board.data;
      lastLoadedWishItemsRef.current = items;
      setBoardSlug(boardSlug);
      setBoardAssets(assets);

      const derived = deriveWishSlotState(items);
      setAllWishSlotsEmpty(derived.allWishSlotsEmpty);
      setWishTexts(derived.wishTexts);
      setWishGiftIconKeys(derived.wishGiftIconKeys);
      setBigCircleCount(derived.bigCircleCount);

      if (embeddedInSlugCarousel && onEmbeddedBoardSynced) {
        onEmbeddedBoardSynced({ assets, items });
      }
    },
    [embeddedInSlugCarousel, onEmbeddedBoardSynced],
  );

  const reloadMyBoardFromApi = useCallback(async (): Promise<MyBoardData> => {
    const s = routeBoardSlug.trim();
    if (!s) {
      throw new Error("보드 슬러그가 없습니다.");
    }
    const board = await getMyWishBoardDetail(s);
    applyLoadedBoard(board);
    return board;
  }, [routeBoardSlug, applyLoadedBoard]);

  useEffect(() => {
    if (embeddedInSlugCarousel && embeddedStickerFoldersFromParent !== undefined) {
      const fromParent = orderStickerFoldersForTabs(embeddedStickerFoldersFromParent);
      setStickerFolderIds(
        fromParent.length > 0 ? fromParent : [...FALLBACK_STICKER_FOLDER_IDS],
      );
      return;
    }
    let cancelled = false;
    const load = async () => {
      try {
        const folders = orderStickerFoldersForTabs(await fetchStickerFolders(boardSlug));
        if (cancelled) return;
        setStickerFolderIds(
          folders.length > 0 ? folders : [...FALLBACK_STICKER_FOLDER_IDS],
        );
      } catch {
        if (!cancelled) {
          setStickerFolderIds([...FALLBACK_STICKER_FOLDER_IDS]);
        }
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [boardSlug, embeddedInSlugCarousel, embeddedStickerFoldersFromParent]);

  const stickerModalTabs = useMemo(() => {
    const ids = orderStickerFoldersForTabs(
      stickerFolderIds.length > 0 ? stickerFolderIds : [...FALLBACK_STICKER_FOLDER_IDS],
    );
    return ids.map((id) => ({
      id,
      label: getStickerFolderLabel(id),
    }));
  }, [stickerFolderIds]);

  /** 폴더 목록이 바뀌어도 탭 상태와 목록이 어긋나지 않도록 실제 조회·하이라이트에 사용 */
  const stickerModalTabEffective = useMemo(() => {
    const allowed = new Set(stickerModalTabs.map((t) => t.id));
    if (allowed.has(stickerModalTab)) {
      return stickerModalTab;
    }
    return stickerModalTabs[0]?.id ?? FALLBACK_STICKER_FOLDER_IDS[0] ?? "balloon";
  }, [stickerModalTabs, stickerModalTab]);

  useEffect(() => {
    if (!getAccessToken()) {
      clearWishlistPageSessionCache();
      router.replace(loginUrlWithCurrentPageAsNext());
      return;
    }

    let cancelled = false;

    const loadBoardSnapshot = async (): Promise<MyBoardData | null> => {
      try {
        return await reloadMyBoardFromApi();
      } catch {
        return null;
      }
    };

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
        let profile: MyProfile | null = null;
        if (embeddedInSlugCarousel && embeddedPrefetchedProfile != null) {
          profile = embeddedPrefetchedProfile;
        } else if (!embeddedInSlugCarousel) {
          const profileResult = await Promise.allSettled([getMyProfile()]).then(
            (r) => r[0],
          );
          if (profileResult.status === "fulfilled") {
            profile = profileResult.value;
          }
        }
        /** `embeddedInSlugCarousel && !embeddedPrefetchedProfile` — 부모 `sync` 직전 마운트 등: 추가 `me` 호출 안 함 */

        if (cancelled) {
          return;
        }

        if (profile) {
          const displayName =
            profile.nickname?.trim() || profile.username?.trim() || "회원";
          setViewerName(displayName);
          setViewerIsAdmin(profile.role === "ADMIN");

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
            /**
             * 방금 POST /boards 직후에는 `hasWishBoard`가 아직 false인 경우가 있음.
             * 프로필과 무관하게 상세 조회로 실제 보드 존재를 한 번 확인한다.
             */
            try {
              const board = await loadBoardSnapshot();
              if (cancelled) return;
              if (!board) {
                setHasMyBoard(false);
                setAllWishSlotsEmpty(true);
                setBoardAssets([]);
                persistEmptySnapshot(displayName);
                return;
              }
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
            const board = await loadBoardSnapshot();
            if (cancelled) {
              return;
            }
            if (!board) {
              setHasMyBoard(false);
              setAllWishSlotsEmpty(true);
              setBoardAssets([]);
              persistEmptySnapshot(displayName);
              return;
            }
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

        setViewerIsAdmin(false);

        try {
          const board = await loadBoardSnapshot();
          if (cancelled) {
            return;
          }
          if (!board) {
            setHasMyBoard(false);
            setAllWishSlotsEmpty(true);
            setBoardAssets([]);
            persistEmptySnapshot(
              getWishlistPageSessionCache()?.viewerName ?? "회원",
            );
            return;
          }
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
          setViewerIsAdmin(false);
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
  }, [
    router,
    applyLoadedBoard,
    reloadMyBoardFromApi,
    embeddedInSlugCarousel,
    embeddedPrefetchedProfile,
  ]);

  /**
   * 허브 전용(`/wishlist` 레거시 단독 화면).
   * `[slug]`에 임베드된 경우 비공개 보드는 공개 GET이 안 되므로 잠깐 실패할 수 있는데,
   * 그때 메인(`/`)으로 보내면 안 됨 — 소유 슬러그 페이지에 남김.
   */
  useEffect(() => {
    if (!wishSlotsLoaded || hasMyBoard) return;
    if (!getAccessToken()) return;
    if (embeddedInSlugCarousel) return;
    router.replace("/");
  }, [wishSlotsLoaded, hasMyBoard, router, embeddedInSlugCarousel]);

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

  /** 내 보드 확보 후 선물 아이콘 카탈로그를 미리 받아 두어 수정 모달이 가볍게 열리게 함 */
  useEffect(() => {
    const slug = boardSlug?.trim();
    if (!slug || !hasMyBoard) {
      return;
    }
    void loadGiftIconsWithSessionCache(slug).catch(() => {
      /* 모달 열 때 재요청 — 프리패치 실패는 무시 */
    });
  }, [boardSlug, hasMyBoard]);

  /** 선물 슬롯 클릭으로 모달이 열릴 때 — `GET /api/assets/gift-icons?boardSlug=`(내 보드 slug) 로드 */
  useEffect(() => {
    if (!isGiftModalOpen) {
      return;
    }

    let cancelled = false;
    let loadingDelayTimer: ReturnType<typeof setTimeout> | null = null;

    const loadGiftIcons = async () => {
      setGiftIconsError(null);
      loadingDelayTimer = setTimeout(() => {
        if (!cancelled) {
          setGiftIconsLoading(true);
        }
      }, 100);

      try {
        const list = await loadGiftIconsWithSessionCache(boardSlug);
        if (!cancelled) {
          setGiftIcons(list);
        }
      } catch (error) {
        if (!cancelled) {
          setGiftIcons([]);
          setGiftIconsError(
            error instanceof Error
              ? error.message
              : "위시 아이콘을 불러오지 못했습니다.",
          );
        }
      } finally {
        if (loadingDelayTimer != null) {
          clearTimeout(loadingDelayTimer);
          loadingDelayTimer = null;
        }
        if (!cancelled) {
          setGiftIconsLoading(false);
        }
      }
    };

    void loadGiftIcons();

    return () => {
      cancelled = true;
      if (loadingDelayTimer != null) {
        clearTimeout(loadingDelayTimer);
      }
      setGiftIconsLoading(false);
    };
  }, [isGiftModalOpen, boardSlug]);

  useEffect(() => {
    if (!isGiftModalOpen) {
      return;
    }
    setGiftIconModalTab("travel");
    setGiftIconTravelSubTab("busan");
  }, [isGiftModalOpen]);

  useEffect(() => {
    if (!isGiftModalOpen) {
      giftIconTabStripScroll.detach();
    }
  }, [isGiftModalOpen, giftIconTabStripScroll]);

  /** 야구 아이콘이 없으면(비구단 등) 「야구」 탭 숨김 */
  const giftIconModalTabsForUi = useMemo(() => {
    const hasBaseball = giftIcons.some(
      (g) => giftIconCategoryFromAssetKey(g.assetKey) === "baseball",
    );
    return GIFT_ICON_MODAL_TABS.filter(
      (tab) => tab.id !== "baseball" || hasBaseball,
    );
  }, [giftIcons]);

  /** 숨겨진 야구 탭·불가능한 선택이 남아 있어도 목록·탭 하이라이스트와 일치 */
  const giftIconModalTabEffective = useMemo(() => {
    const tabs = giftIconModalTabsForUi;
    const allowed = new Set(tabs.map((tab) => tab.id));
    const selected = giftIconModalTab;
    if (!allowed.has(selected)) {
      return tabs[0]?.id ?? "travel";
    }
    if (selected === "baseball") {
      const hasBaseball = giftIcons.some(
        (g) => giftIconCategoryFromAssetKey(g.assetKey) === "baseball",
      );
      if (!hasBaseball) {
        return tabs[0]?.id ?? "travel";
      }
    }
    return selected;
  }, [giftIconModalTab, giftIconModalTabsForUi, giftIcons]);

  useEffect(() => {
    if (giftIconModalTabEffective !== "travel") {
      setGiftIconTravelSubTab("busan");
    }
  }, [giftIconModalTabEffective]);

  useEffect(() => {
    if (!isGiftModalOpen || giftIconModalTabEffective !== "travel") {
      giftTravelTabStripScroll.detach();
    }
  }, [isGiftModalOpen, giftIconModalTabEffective, giftTravelTabStripScroll]);

  /** 여행: 도시 서브탭 — 부산→여수 고정 순서, 루트 `icons/travel/*.png` 등만 있으면 「기타」추가 */
  const giftIconTravelSubTabsForUi = useMemo(() => {
    const base = GIFT_ICON_TRAVEL_REGION_IDS.map((id) => ({
      id,
      label: GIFT_ICON_TRAVEL_REGION_LABELS[id],
    }));
    const hasLegacyTravel = giftIcons.some(
      (g) =>
        giftIconCategoryFromAssetKey(g.assetKey) === "travel" &&
        giftIconTravelRegionFromAssetKey(g.assetKey) === null,
    );
    return hasLegacyTravel
      ? [
          ...base,
          {
            id: GIFT_ICON_TRAVEL_LEGACY_TAB_ID,
            label: "기타",
          },
        ]
      : base;
  }, [giftIcons]);

  const giftIconTravelSubTabEffective = useMemo(() => {
    if (giftIconModalTabEffective !== "travel") {
      return giftIconTravelSubTab;
    }
    const allowed = new Set(
      giftIconTravelSubTabsForUi.map((t) => t.id as GiftIconTravelSubTabId),
    );
    let effective = giftIconTravelSubTab;
    if (!allowed.has(effective)) {
      effective = "busan";
    }
    if (effective === GIFT_ICON_TRAVEL_LEGACY_TAB_ID) {
      const hasLegacy = giftIcons.some(
        (g) =>
          giftIconCategoryFromAssetKey(g.assetKey) === "travel" &&
          giftIconTravelRegionFromAssetKey(g.assetKey) === null,
      );
      if (!hasLegacy) {
        effective = "busan";
      }
    }
    return effective;
  }, [
    giftIconModalTabEffective,
    giftIconTravelSubTab,
    giftIconTravelSubTabsForUi,
    giftIcons,
  ]);

  /** 모달: 1번 칸은 고정 기본 선물, 그 다음 칸부터 API 목록 — 카테고리 미분류는 첫 탭에만 합침 */
  const filteredCatalogGiftIcons = useMemo(() => {
    const firstTabId = giftIconModalTabsForUi[0]?.id;
    const tab = giftIconModalTabEffective;
    const uncategorized = giftIcons.filter(
      (icon) => giftIconCategoryFromAssetKey(icon.assetKey) === null,
    );
    let inCategory = giftIcons.filter(
      (icon) => giftIconCategoryFromAssetKey(icon.assetKey) === tab,
    );

    if (tab === "travel") {
      const sub = giftIconTravelSubTabEffective;
      inCategory = inCategory.filter((icon) => {
        const region = giftIconTravelRegionFromAssetKey(icon.assetKey);
        if (sub === GIFT_ICON_TRAVEL_LEGACY_TAB_ID) {
          return region === null;
        }
        return region === sub;
      });
    }

    if (
      firstTabId !== undefined &&
      tab === firstTabId &&
      uncategorized.length > 0
    ) {
      const seen = new Set(inCategory.map((i) => i.id));
      return [...uncategorized.filter((u) => !seen.has(u.id)), ...inCategory];
    }
    return inCategory;
  }, [
    giftIcons,
    giftIconModalTabEffective,
    giftIconModalTabsForUi,
    giftIconTravelSubTabEffective,
  ]);

  /** 탭·여행 서브탭·아이콘 목록이 바뀔 때마다 래스터 프리로드 키 */
  const giftCatalogPreloadKey = useMemo(
    () =>
      `${giftIconModalTabEffective}|${
        giftIconModalTabEffective === "travel"
          ? giftIconTravelSubTabEffective
          : "-"
      }|${filteredCatalogGiftIcons.map((i) => i.id).join(",")}`,
    [
      giftIconModalTabEffective,
      giftIconTravelSubTabEffective,
      filteredCatalogGiftIcons,
    ],
  );

  useEffect(() => {
    if (!isGiftModalOpen) {
      return;
    }
    if (filteredCatalogGiftIcons.length === 0) {
      setGiftCatalogRasterReady(true);
      return;
    }
    setGiftCatalogRasterReady(false);
    let cancelled = false;

    const preloadOne = (url: string) =>
      new Promise<void>((resolve) => {
        const trimmed = url.trim();
        if (!trimmed) {
          resolve();
          return;
        }
        const im = new window.Image();
        im.onload = () => {
          void im.decode().then(resolve).catch(() => resolve());
        };
        im.onerror = () => resolve();
        im.src = trimmed;
      });

    void Promise.all(
      filteredCatalogGiftIcons.map((icon) =>
        preloadOne(getAssetImageUrl(icon.assetKey)),
      ),
    ).then(() => {
      if (!cancelled) {
        setGiftCatalogRasterReady(true);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [isGiftModalOpen, giftCatalogPreloadKey]);

  useEffect(() => {
    queueMicrotask(() => setGiftCatalogSkeletonFadeDone(false));
  }, [giftCatalogPreloadKey]);

  useEffect(() => {
    if (!giftCatalogRasterReady) {
      return;
    }
    if (filteredCatalogGiftIcons.length === 0) {
      setGiftCatalogSkeletonFadeDone(true);
      return;
    }
    const t = window.setTimeout(() => setGiftCatalogSkeletonFadeDone(true), 380);
    return () => window.clearTimeout(t);
  }, [
    giftCatalogRasterReady,
    giftCatalogPreloadKey,
    filteredCatalogGiftIcons.length,
  ]);

  useEffect(() => {
    if (!giftCatalogRasterReady) {
      setGiftCatalogGridEntered(false);
      return;
    }
    if (filteredCatalogGiftIcons.length === 0) {
      setGiftCatalogGridEntered(true);
      return;
    }
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => setGiftCatalogGridEntered(true));
    });
    return () => cancelAnimationFrame(id);
  }, [
    giftCatalogRasterReady,
    giftCatalogPreloadKey,
    filteredCatalogGiftIcons.length,
  ]);

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
    giftEditPresetSyncRef.current.done = true;
    if (isStoredKeyGiftModalStaticPreset(key)) {
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
        const list = await fetchBackgroundAssets(boardSlug);
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
  }, [isCompactBackgroundOpen, boardSlug]);

  /** 스티커 바텀시트: 폴더별 API 조회(세션 캐시 1회) */
  useEffect(() => {
    if (!isBottomSheetOpen) {
      return;
    }

    let cancelled = false;

    const run = async () => {
      setStickerSheetRasterReady(false);
      setStickerSheetLoading(true);
      setStickerSheetError(null);
      try {
        const list = await loadStickerFolderWithSessionCache(
          stickerModalTabEffective,
          boardSlug,
        );
        if (!cancelled) {
          setStickerSheetList(list);
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
  }, [isBottomSheetOpen, stickerModalTabEffective, boardSlug]);

  const stickerSheetPreloadKey = useMemo(
    () =>
      `${stickerModalTabEffective}|${stickerSheetList
        .map((s) => `${s.id}:${s.assetKey}`)
        .join(",")}`,
    [stickerModalTabEffective, stickerSheetList],
  );

  useEffect(() => {
    if (!isBottomSheetOpen) {
      setStickerSheetRasterReady(true);
      return;
    }
    if (stickerSheetLoading) {
      return;
    }
    if (stickerSheetList.length === 0) {
      setStickerSheetRasterReady(true);
      return;
    }

    let cancelled = false;
    setStickerSheetRasterReady(false);

    const preloadOne = (url: string) =>
      new Promise<void>((resolve) => {
        const trimmed = url.trim();
        if (!trimmed) {
          resolve();
          return;
        }
        const im = new window.Image();
        im.onload = () => {
          void im.decode().then(resolve).catch(() => resolve());
        };
        im.onerror = () => resolve();
        im.src = trimmed;
      });

    void Promise.all(
      stickerSheetList.map((s) =>
        preloadOne(getAssetImageUrl(s.assetKey)),
      ),
    ).then(() => {
      if (!cancelled) {
        setStickerSheetRasterReady(true);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [isBottomSheetOpen, stickerSheetLoading, stickerSheetPreloadKey]);

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
      const apiSlug = routeBoardSlug.trim();
      if (slotId == null || !keyTrim || !apiSlug) {
        return;
      }

      setStickerSlotSaving(true);
      setStickerSlotSaveError(null);
      try {
        await putMyBoardStickerSlot(apiSlug, slotId, keyTrim);
        await reloadMyBoardFromApi();
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
    [stickerTargetSlotId, reloadMyBoardFromApi, routeBoardSlug],
  );

  const removeStickerFromSlot = useCallback(async () => {
    const slotId = stickerTargetSlotId;
    const apiSlug = routeBoardSlug.trim();
    if (slotId == null || !apiSlug) {
      return;
    }

    setStickerSlotSaving(true);
    setStickerSlotSaveError(null);
    try {
      await deleteMyBoardStickerSlot(apiSlug, slotId);
      await reloadMyBoardFromApi();
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
  }, [stickerTargetSlotId, reloadMyBoardFromApi, routeBoardSlug]);

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

    const apiSlug = routeBoardSlug.trim();
    if (!apiSlug) {
      return false;
    }

    setBackgroundSaving(true);
    try {
      if (draft === "") {
        await deleteMyBoardBackground(apiSlug);
      } else {
        await putMyBoardBackground(apiSlug, draft);
      }
      setBoardAssets((prev) => {
        const next = boardAssetsWithBackgroundKey(prev, draft);
        if (embeddedInSlugCarousel && onEmbeddedBoardSynced) {
          onEmbeddedBoardSynced({
            assets: next,
            items: lastLoadedWishItemsRef.current,
          });
        }
        return next;
      });
      await reloadMyBoardFromApi();
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
  }, [
    boardAssets,
    draftBackgroundAssetKey,
    embeddedInSlugCarousel,
    isCompactBackgroundOpen,
    onEmbeddedBoardSynced,
    reloadMyBoardFromApi,
    routeBoardSlug,
  ]);

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
    /** 첫 칸은 고정 기본 선물 — 추가 시에도 기본 선물이 선택된 상태로 열림 */
    setGiftModalSpecial("present");
    setGiftModalSaveError(null);
    setIsGiftModalOpen(true);
  };

  const openGiftModalEdit = (slotIndex: number) => {
    setGiftModalMode("edit");
    setGiftModalSlotIndex(slotIndex);
    setModalGiftName((wishTexts[slotIndex] ?? "").slice(0, WISH_ITEM_NAME_MAX_LENGTH));
    setModalSelectedIconId(null);
    const key = wishGiftIconKeys[slotIndex]?.trim() ?? "";
    if (isStoredKeyGiftModalStaticPreset(key)) {
      setGiftModalSpecial("present");
    } else {
      setGiftModalSpecial(null);
    }
    setGiftModalSaveError(null);
    setIsGiftModalOpen(true);
  };

  const handleSaveGiftModal = async () => {
    const name = modalGiftName.trim().slice(0, WISH_ITEM_NAME_MAX_LENGTH);
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
    const apiSlug = routeBoardSlug.trim();
    if (!apiSlug) {
      return;
    }

    let patchBody: Parameters<typeof patchMyWishItem>[2];
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
      await patchMyWishItem(apiSlug, slotIndexApi, patchBody);

      try {
        await reloadMyBoardFromApi();
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

    const apiSlugReset = routeBoardSlug.trim();
    if (!apiSlugReset) {
      setGiftModalDeleting(false);
      return;
    }

    try {
      await deleteMyWishItem(apiSlugReset, giftModalSlotIndex + 1);
      const board = await reloadMyBoardFromApi();
      const derived = deriveWishSlotState(board.data.items);
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
        return found?.id ?? giftIcons[0]?.id ?? null;
      }
      return giftIcons[0]?.id ?? null;
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

  useEffect(() => {
    if (!embeddedInSlugCarousel || !onEmbeddedBackgroundDraftKeyChange) {
      return;
    }
    if (!isCompactBackgroundOpen) {
      onEmbeddedBackgroundDraftKeyChange(null);
      return;
    }
    const eff =
      draftBackgroundAssetKey !== null
        ? draftBackgroundAssetKey
        : serverBackgroundAssetKey;
    onEmbeddedBackgroundDraftKeyChange(eff);
  }, [
    embeddedInSlugCarousel,
    onEmbeddedBackgroundDraftKeyChange,
    isCompactBackgroundOpen,
    draftBackgroundAssetKey,
    serverBackgroundAssetKey,
  ]);

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

  const handleLogout = async () => {
    await logoutSession();
    clearWishlistPageSessionCache();
    setIsSidebarOpen(false);
    router.push("/login");
  };

  useEffect(() => {
    setSidebarPortalReady(true);
  }, []);

  const openStickerPickerForSlot = (slotId: number) => {
    setStickerTargetSlotId(slotId);
    setStickerModalTab(
      stickerModalTabs[0]?.id ?? FALLBACK_STICKER_FOLDER_IDS[0] ?? "balloon",
    );
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

  const carouselInteractionLocked =
    Boolean(embeddedInSlugCarousel) &&
    (isBottomSheetOpen ||
      isGiftModalOpen ||
      isShareModalOpen ||
      isCompactBackgroundOpen ||
      isDecorateMode);

  useEffect(() => {
    if (!embeddedInSlugCarousel || !onCarouselInteractionLockChange) {
      return;
    }
    onCarouselInteractionLockChange(carouselInteractionLocked);
  }, [
    carouselInteractionLocked,
    embeddedInSlugCarousel,
    onCarouselInteractionLockChange,
  ]);

  const RootTag = embeddedInSlugCarousel ? "div" : "main";

  return (
    <RootTag
      className={
        embeddedInSlugCarousel
          ? "relative flex h-full min-h-0 w-full flex-1 flex-col self-stretch overflow-visible px-0 pt-0 pb-[env(safe-area-inset-bottom,0px)]"
          : "wishlist-page-root app-shell-viewport-floor flex min-h-0 flex-1 flex-col px-3 pb-[env(safe-area-inset-bottom,0px)] pt-[env(safe-area-inset-top,0px)] sm:px-4"
      }
    >
      <div
        className={`${embeddedInSlugCarousel ? "absolute" : "fixed"} inset-0 z-20 transition-opacity duration-300 ${
          embeddedInSlugCarousel
            ? isCompactBackgroundOpen
              ? "pointer-events-auto bg-black/10 opacity-100"
              : "pointer-events-none bg-transparent opacity-0"
            : isShareModalOpen
              ? "pointer-events-auto bg-black/20 opacity-100"
              : isCompactBackgroundOpen
                ? "pointer-events-auto bg-black/10 opacity-100"
                : "pointer-events-none bg-black/20 opacity-0"
        }`}
        onClick={
          embeddedInSlugCarousel
            ? isCompactBackgroundOpen
              ? () => {
                  void dismissCompactBackgroundSheet();
                }
              : undefined
            : isShareModalOpen || isCompactBackgroundOpen
              ? () => {
                  if (isShareModalOpen) {
                    closeEditUi();
                    return;
                  }
                  void dismissCompactBackgroundSheet();
                }
              : undefined
        }
        aria-hidden={
          embeddedInSlugCarousel
            ? !isCompactBackgroundOpen
            : !(isShareModalOpen || isCompactBackgroundOpen)
        }
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
          <section
            className={
              embeddedInSlugCarousel
                ? "flex h-full min-h-0 w-full flex-1 flex-col overflow-visible"
                : `${WISHLIST_BOARD_PAGE_WRAP} mx-auto w-full`
            }
          >
            <div
              className={
                embeddedInSlugCarousel
                  ? "relative flex h-full min-h-0 w-full flex-1 flex-col overflow-visible"
                  : "relative flex min-h-0 flex-1 flex-col overflow-visible p-0"
              }
            >
              <div
                className={
                  embeddedInSlugCarousel
                    ? "relative flex h-full min-h-0 w-full flex-1 overflow-visible"
                    : "relative flex min-h-0 flex-1 w-full min-w-0 items-center justify-center overflow-visible px-1 pb-1 pt-2 sm:px-2 sm:pb-2 sm:pt-3"
                }
              >
                <div
                  className={
                    embeddedInSlugCarousel
                      ? "relative h-full w-full min-h-0 min-w-0 overflow-visible"
                      : `${WISHLIST_BOARD_FRAME_BASE} wishlist-board-frame--decorate relative mx-auto w-full max-w-[372px] max-h-[min(680px,100%)] shrink-0 ring-violet-200/55`
                  }
                  style={
                    embeddedInSlugCarousel
                      ? undefined
                      : {
                          aspectRatio: `${DESIGN_WIDTH} / ${DESIGN_HEIGHT}`,
                        }
                  }
                >
              {!embeddedInSlugCarousel && boardBackgroundDisplayUrl ? (
                <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden rounded-[18px]">
                  {shouldUseNativeImg(boardBackgroundDisplayUrl) ? (
                    <img
                      key={effectiveBackgroundSelectionKey || "default"}
                      src={boardBackgroundDisplayUrl}
                      alt=""
                      className="h-full w-full object-cover"
                      fetchPriority="high"
                    />
                  ) : (
                    <Image
                      key={effectiveBackgroundSelectionKey || "default"}
                      src={boardBackgroundDisplayUrl}
                      alt=""
                      fill
                      sizes={WISHLIST_BOARD_BG_SIZES}
                      className="object-cover"
                      priority
                    />
                  )}
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

              {!omitInnerTitleHeader ? (
                <WishlistProfileTitleHeader
                  viewerName={viewerName}
                  isSidebarOpen={isSidebarOpen}
                  onMenuClick={(event) => {
                    event.stopPropagation();
                    toggleSidebar();
                  }}
                />
              ) : null}

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
                        + 위시 추가 ({bigCircleCount}/3)
                      </button>
                    ) : null}
                  </div>
                </div>
              ) : null}

              <div
                className={`pointer-events-none absolute bottom-6 right-[4%] z-30 flex flex-col items-end gap-2.5 transition-[opacity,filter] duration-300 ease-out ${
                  isBottomSheetOpen || isCompactBackgroundOpen
                    ? "opacity-0"
                    : embeddedInSlugCarousel &&
                        typeof embeddedCarouselVisualPage === "number" &&
                        embeddedCarouselVisualPage !== 0
                      ? "opacity-[0.15] blur-[2px] saturate-[0.35] pointer-events-none"
                      : "opacity-100"
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
                    if (viewerIsAdmin) {
                      void postAdminAssetsSync().catch(() => {
                        /* 동기화 실패해도 꾸미기 진입은 허용 */
                      });
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

                <BoardShareFabButton
                  onClick={() => setIsShareModalOpen(true)}
                  ariaLabel="위시리스트 공유"
                />
              </div>
                </div>
              </div>
            </div>
          </section>
        )}
      </div>

      <section
        className={`${
          embeddedInSlugCarousel ? "absolute" : "fixed"
        } inset-x-0 bottom-0 z-[31] flex max-h-[min(48dvh,440px)] flex-col overflow-hidden rounded-t-[18px] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[0_-8px_28px_rgba(0,0,0,0.1)] transition-transform duration-300 ease-out ${
          isCompactBackgroundOpen ? "translate-y-0" : "translate-y-full"
        } ${!isCompactBackgroundOpen ? "pointer-events-none" : "pointer-events-auto"}`}
        aria-hidden={!isCompactBackgroundOpen}
      >
        <div className="mx-auto min-h-0 w-full max-w-[372px] flex-1 overflow-y-auto overscroll-y-contain px-5 pb-[max(0.75rem,var(--safe-area-bottom))] pt-4">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="bg-gradient-to-r from-[#5346C9] via-[#7B61FF] to-[#5B8DEF] bg-clip-text text-[1.0625rem] font-extrabold leading-snug tracking-tight text-transparent">
                배경 선택
              </p>
              <p className="mt-1 text-[12px] leading-snug text-slate-500">
                위시리스트 배경을 꾹 누르면 시트를 열 수 있어요 !
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                void dismissCompactBackgroundSheet();
              }}
              className={`inline-flex size-9 shrink-0 items-center justify-center rounded-full text-slate-800 transition hover:bg-slate-100 active:opacity-60 ${UI_FOCUS_OUTLINE_VISIBLE}`}
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
            className="wishlist-background-picker-scroll mt-1 flex cursor-grab items-start gap-2.5 overflow-x-auto overflow-y-visible overscroll-x-contain px-1 pb-3 pt-1 select-none active:cursor-grabbing touch-pan-x"
            onPointerDown={backgroundPickerStripScroll.onPointerDown}
          >
            <div className="flex w-24 shrink-0 flex-col gap-1.5 text-center">
              <p className="break-words text-center text-[10px] font-semibold leading-snug tracking-tight text-black">
                기본
              </p>
              <DefaultOptionButton
                className={`aspect-[3/4] w-full rounded-xl ${
                  effectiveBackgroundSelectionKey === ""
                    ? "ring-6 ring-inset ring-[#7B61FF]"
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
                  className="group flex w-24 shrink-0 cursor-pointer flex-col gap-1.5 text-center transition hover:opacity-95 disabled:opacity-50 rounded-xl outline-none"
                >
                  <p className="pointer-events-none break-words text-center text-[10px] font-semibold leading-snug tracking-tight text-black">
                    {label}
                  </p>
                  <div
                    className={`relative aspect-[3/4] w-full overflow-hidden rounded-xl bg-slate-100 ring-1 ring-inset transition group-hover:ring-[#7B61FF]/35 ${
                      effectiveBackgroundSelectionKey === bg.assetKey.trim()
                        ? "ring-2 ring-inset ring-[#7B61FF]"
                        : "ring-slate-200/80 group-focus-visible:ring-2 group-focus-visible:ring-inset group-focus-visible:ring-[#7B61FF]"
                    }`}
                  >
                    {shouldUseNativeImg(src) ? (
                      <img
                        src={src}
                        alt={label}
                        className="absolute inset-0 h-full w-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <Image
                        src={src}
                        alt={label}
                        fill
                        sizes={BACKGROUND_PICKER_THUMB_SIZES}
                        className="object-cover"
                      />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {embeddedInSlugCarousel ? (
        <BoardShareDialog
          presentation="carousel-portal"
          portalReady={sidebarPortalReady}
          open={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          titleId="wishlist-share-dialog-title"
          description="위시리스트 링크를 복사하거나 공유할 수 있어요."
          absoluteUrl={wishlistShareAbsoluteUrl}
          linkHref={wishlistShareLinkHref}
          navigatorShareTitle="내 위시리스트"
        />
      ) : (
        <BoardShareDialog
          presentation="page"
          open={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          titleId="wishlist-share-dialog-title"
          description="위시리스트 링크를 복사하거나 공유할 수 있어요."
          absoluteUrl={wishlistShareAbsoluteUrl}
          linkHref={wishlistShareLinkHref}
          navigatorShareTitle="내 위시리스트"
        />
      )}

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
                className="relative z-10 flex h-[min(90dvh,640px)] w-full max-w-[380px] flex-col overflow-hidden rounded-3xl bg-white shadow-[0_24px_80px_rgba(0,0,0,0.22)]"
                role="dialog"
                aria-modal="true"
                aria-labelledby="gift-modal-title"
              >
                <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
                  <h2 id="gift-modal-title" className="text-h3 text-slate-900">
                    {giftModalMode === "add" ? "위시 수정" : "위시 수정"}
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
                    <span className="flex items-baseline justify-between gap-2">
                      <span className="text-sm font-medium text-slate-800">위시 이름</span>
                      <span className="text-xs tabular-nums text-slate-400">
                        {modalGiftName.length}/{WISH_ITEM_NAME_MAX_LENGTH}
                      </span>
                    </span>
                    <input
                      type="text"
                      value={modalGiftName}
                      maxLength={WISH_ITEM_NAME_MAX_LENGTH}
                      onChange={(event) =>
                        setModalGiftName(
                          event.target.value.slice(0, WISH_ITEM_NAME_MAX_LENGTH),
                        )
                      }
                      placeholder="예: 터보 RC카"
                      className="mt-2 h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm text-slate-900 outline-none transition focus:border-[#7B61FF]"
                    />
                  </label>

                  <p className="mt-5 shrink-0 text-sm font-medium text-slate-800">위시 아이콘</p>

                  <div className="mt-3 flex min-h-[min(36dvh,260px)] flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-inner">
                    {giftIconsLoading ? (
                      <GiftIconModalChromeSkeleton />
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
                            {giftIconModalTabsForUi.map((tab) => {
                              const active = giftIconModalTabEffective === tab.id;
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
                        {giftIcons.length > 0 &&
                        giftIconModalTabEffective === "travel" ? (
                          <div
                            ref={giftTravelTabStripScroll.stripRef}
                            role="tablist"
                            aria-label="여행 지역"
                            className="scrollbar-x-none flex shrink-0 cursor-grab gap-1.5 overflow-x-auto overflow-y-hidden overscroll-x-contain border-b border-slate-100 bg-gradient-to-b from-slate-50/95 to-white px-2 pb-2 pt-2 select-none active:cursor-grabbing touch-pan-x"
                            onPointerDown={giftTravelTabStripScroll.onPointerDown}
                          >
                            {giftIconTravelSubTabsForUi.map((sub) => {
                              const active =
                                giftIconTravelSubTabEffective === sub.id;
                              return (
                                <button
                                  key={sub.id}
                                  type="button"
                                  role="tab"
                                  aria-selected={active}
                                  onClick={(clickEvent) => {
                                    if (
                                      giftTravelTabStripScroll.mouseDragRef
                                        .current.dragged
                                    ) {
                                      clickEvent.preventDefault();
                                      clickEvent.stopPropagation();
                                      return;
                                    }
                                    setGiftIconTravelSubTab(
                                      sub.id as GiftIconTravelSubTabId,
                                    );
                                  }}
                                  className={`shrink-0 cursor-pointer rounded-md border px-2.5 py-1 text-[11px] font-medium transition ${
                                    active
                                      ? "border-[#7B61FF] bg-violet-50/90 text-[#5B4ADB] shadow-[0_1px_2px_rgba(91,74,219,0.12)]"
                                      : "border-slate-200/90 bg-slate-50/80 text-slate-600 hover:border-slate-300 hover:bg-white"
                                  }`}
                                >
                                  {sub.label}
                                </button>
                              );
                            })}
                          </div>
                        ) : null}
                        <div
                          key={`${giftIconModalTabEffective}${giftIconModalTabEffective === "travel" ? `-${giftIconTravelSubTabEffective}` : ""}`}
                          className="relative min-h-[min(28dvh,200px)] flex-1 overflow-y-auto overscroll-y-contain p-3 [-webkit-overflow-scrolling:touch]"
                        >
                          {filteredCatalogGiftIcons.length > 0 &&
                          !(
                            giftCatalogRasterReady &&
                            giftCatalogSkeletonFadeDone
                          ) ? (
                            <div
                              className={`pointer-events-none absolute inset-0 z-10 flex justify-center bg-white/90 p-3 transition-opacity duration-300 ease-out motion-reduce:transition-none ${
                                giftCatalogRasterReady
                                  ? "opacity-0"
                                  : "opacity-100"
                              }`}
                              aria-busy={!giftCatalogRasterReady}
                              aria-label="선물 아이콘 불러오는 중"
                            >
                              <div className="w-full max-w-[360px]">
                                <GiftIconGridSkeleton />
                              </div>
                            </div>
                          ) : null}
                          {giftCatalogRasterReady ? (
                          <div
                            className={`relative z-0 grid grid-cols-3 gap-2 content-start transition-[opacity,transform] duration-300 ease-out motion-reduce:transition-none ${
                              giftCatalogGridEntered
                                ? "translate-y-0 opacity-100"
                                : "translate-y-0.5 opacity-0"
                            }`}
                          >
                            <button
                              type="button"
                              onClick={() => {
                                setGiftModalSpecial("present");
                                setModalSelectedIconId(null);
                              }}
                              className={`relative aspect-square overflow-hidden rounded-xl border-2 bg-slate-50 transition ${
                                giftModalSpecial === "present"
                                  ? "border-[#7B61FF] ring-2 ring-[#7B61FF]/35"
                                  : "border-slate-200 hover:border-slate-400"
                              }`}
                              aria-label="기본 선물 아이콘"
                              aria-pressed={giftModalSpecial === "present"}
                            >
                              <Image
                                src={GIFT_MODAL_PRESET_IMAGE_SRC}
                                alt=""
                                width={128}
                                height={128}
                                sizes={GIFT_ICON_GRID_SIZES}
                                className="h-full w-full object-contain p-1"
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
                                  className={`relative aspect-square overflow-hidden rounded-xl border-2 bg-slate-50 transition ${
                                    selected
                                      ? "border-[#7B61FF] ring-2 ring-[#7B61FF]/35"
                                      : "border-slate-200 hover:border-slate-400"
                                  }`}
                                  aria-label={`선물 아이콘 ${icon.id}`}
                                  aria-pressed={selected}
                                >
                                  <ScrollLazyModalImage
                                    src={src}
                                    eager
                                    highFetchPriority
                                    softContentFade
                                    useNativeImg={shouldUseNativeImg(src)}
                                    sizes={GIFT_ICON_GRID_SIZES}
                                    imgClassName="absolute inset-0 h-full w-full object-contain p-1"
                                  />
                                </button>
                              );
                            })}
                          </div>
                          ) : null}

                          {giftIcons.length === 0 ? (
                            <p className="mt-2 text-center text-body-sm text-slate-500">
                              추가 아이콘 목록이 없습니다. 위 칸에서 기본 선물을 선택할 수 있어요.
                            </p>
                          ) : filteredCatalogGiftIcons.length === 0 &&
                            giftIcons.length > 0 ? (
                            <p className="mt-2 text-center text-body-sm text-slate-500">
                              이 카테고리에 표시할 아이콘이 없습니다. 다른 카테고리를 선택해 보세요.
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
                  {stickerModalTabs.map((tab) => {
                    const active = stickerModalTabEffective === tab.id;
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
                  {stickerSheetError ? (
                    <StickerSheetFixedViewport className="flex items-center justify-center px-1">
                      <p className="text-center text-body-sm text-red-600" role="alert">
                        {stickerSheetError}
                      </p>
                    </StickerSheetFixedViewport>
                  ) : (
                    <StickerSheetFixedViewport
                      key={stickerModalTabEffective}
                      scrollable
                    >
                      {stickerSheetLoading ? (
                        <StickerGridSkeleton />
                      ) : stickerSheetList.length === 0 ? (
                        <>
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
                          </div>
                          <p className="mt-2 px-1 text-center text-body-sm text-slate-500">
                            이 탭에 표시할 스티커가 없습니다. 맨 앞 ×로 이 슬롯의 스티커를 지울 수
                            있어요.
                          </p>
                        </>
                      ) : (
                        <div className="relative min-h-0">
                          {!stickerSheetRasterReady ? (
                            <div
                              className="pointer-events-none absolute inset-0 z-10 flex justify-center bg-white/90 p-0.5"
                              aria-busy="true"
                              aria-label="스티커 썸네일 준비 중"
                            >
                              <StickerGridSkeleton />
                            </div>
                          ) : null}
                          {stickerSheetRasterReady ? (
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
                            {stickerSheetList.map((sticker) => {
                              const stickerSrc = getAssetImageUrl(sticker.assetKey);

                              return (
                                <button
                                  key={sticker.id}
                                  type="button"
                                  disabled={
                                    stickerSlotSaving ||
                                    stickerTargetSlotId == null ||
                                    !sticker.assetKey.trim()
                                  }
                                  onClick={() => void applyStickerSelection(sticker.assetKey)}
                                  className="relative aspect-square overflow-hidden rounded-md border border-slate-200 bg-slate-50 transition enabled:hover:border-[#7B61FF]/50 enabled:active:scale-[0.98] disabled:opacity-50"
                                  aria-label={`스티커 ${sticker.id}`}
                                >
                                  <ScrollLazyModalImage
                                    src={stickerSrc}
                                    eager
                                    highFetchPriority
                                    softContentFade
                                    useNativeImg={shouldUseNativeImg(stickerSrc)}
                                    sizes={STICKER_SHEET_CELL_SIZES}
                                    imgClassName="absolute inset-0 h-full w-full object-contain p-0.5"
                                  />
                                </button>
                              );
                            })}
                          </div>
                          ) : null}
                        </div>
                      )}
                    </StickerSheetFixedViewport>
                  )}
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}

      {!embeddedInSlugCarousel ? (
        <AppSideMenu
          open={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          onLogout={handleLogout}
          hideMyWishlistShortcut
        />
      ) : null}
    </RootTag>
  );
}
