"use client";

import {
  CaretLeftIcon,
  CaretRightIcon,
  TextAlignJustify,
} from "@phosphor-icons/react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  use,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent,
  type ReactNode,
  type TouchEvent,
} from "react";

import { AppSideMenu } from "@/components/common/AppSideMenu";
import { CommentPopup, type CommentStickerTab } from "@/components/wishlist/CommentPopup";
import { PublicWishlistVisitorMenu } from "@/components/wishlist/PublicWishlistVisitorMenu";
import { WishlistCenterDialog } from "@/components/wishlist/WishlistCenterDialog";
import {
  DESIGN_HEIGHT,
  DESIGN_WIDTH,
  GiftSlots,
  STICKER_SLOT_IMAGE_MASKED,
  StickerSlots,
} from "@/components/wishlist/WishlistSlots";
import { loginUrlForPath } from "@/features/login/post-login-destination";
import { getMyProfile } from "@/features/user/api";
import {
  createComment,
  deleteComment,
  getComments,
  getMyBoard,
  getPublicBoard,
  updateComment,
} from "@/features/wishlist/api";
import { resolveBoardBackgroundImageUrl } from "@/features/wishlist/board-background";
import {
  computeCommentSheetCount,
  normalizeCommentsToSlotGrid,
  resolveGlobalSlotIndexForCreate,
} from "@/features/wishlist/comment-slot-layout";
import {
  compactGiftAssetKeysToLayoutSlots,
  compactGiftTextsToLayoutSlots,
  deriveWishSlotState,
} from "@/features/wishlist/wish-slot-state";
import { clearWishlistPageSessionCache } from "@/features/wishlist/wishlist-session-cache";
import type {
  BoardAssetData,
  CommentData,
  CommentListPayload,
  StickerOption,
  WishItemData,
} from "@/features/wishlist/types";
import {
  fetchStickerAssets,
  fetchStickerFolders,
  fetchStickersByFolder,
  type StickerAssetDto,
} from "@/lib/api/assets";
import {
  ACCESS_TOKEN_STORAGE_KEY,
  clearAccessToken,
  getAccessToken,
} from "@/lib/api/token-store";
import { getAssetImageUrl } from "@/lib/asset-url";
import {
  PAGE_HEADER_BACK_BUTTON,
  PAGE_HEADER_LEADING_CLUSTER,
  PAGE_HEADER_MENU_BUTTON,
  PAGE_HEADER_ROW_COMPACT,
} from "@/lib/constants/page-header";
import { navigateAppBack } from "@/lib/navigate-app-back";
import { shouldUseNativeImg } from "@/lib/native-img";
import { getStickerFolderLabel } from "@/lib/sticker-folder-labels";

/** 공개 보드 프레임 배경 — 최대 폭 372px·모바일 100vw 근사 */
const PUBLIC_BOARD_BG_SIZES =
  "(max-width: 480px) min(420px, calc(100vw - 1.5rem)), min(372px, 100vw)";

function stickerOptionLabelFromAssetKey(assetKey: string): string {
  const norm = assetKey.replace(/\\/g, "/");
  const seg = norm.split("/").filter(Boolean);
  const last = seg[seg.length - 1] ?? assetKey;
  return last.replace(/\.[^.]+$/, "") || assetKey;
}

/** 캐러셀 스와이프: 버튼·링크 등에서는 페이지 넘김 무시 */
function isCarouselSwipeInteractiveTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  return Boolean(
    target.closest(
      "button, a, [role='button'], input, textarea, select, label",
    ),
  );
}

const CAROUSEL_SWIPE_MIN_PX = 56;
const CAROUSEL_SWIPE_HORIZONTAL_RATIO = 1.15;

/** 서버·Jackson 필드명 차이 + `hasNext` 생략 시에도 `totalCount`로 마지막 면 꽉 참 판별 */
function resolveIsLastPageFull(p: CommentListPayload): boolean {
  const tc = p.totalCount;
  if (typeof tc === "number" && tc > 0 && tc % 6 === 0) {
    return true;
  }
  if (typeof p.isLastPageFull === "boolean") {
    return p.isLastPageFull;
  }
  if (typeof p.lastPageFull === "boolean") {
    return p.lastPageFull;
  }
  return p.comments.length === 6 && p.hasNext === false;
}

/** GET `?size=6` 응답으로 캐러셀 댓글 면 수 */
function commentSheetCountFromPayload(p: CommentListPayload): number {
  return computeCommentSheetCount(p.totalPages ?? 0, resolveIsLastPageFull(p), {
    commentsLength: p.comments.length,
    hasNext: p.hasNext,
    totalCount: p.totalCount,
  });
}

function isCommentListLastPageFullByShape(p: CommentListPayload): boolean {
  return resolveIsLastPageFull(p);
}

type PopupMode = "view" | "write" | "edit";

/**
 * `app/wishlist/page.tsx` 꾸미기·보드 영역과 동일 (`WISHLIST_BOARD_PAGE_WRAP`) — 흰 카드 셸 없음.
 */
const PUBLIC_WISHLIST_BOARD_WRAP =
  "relative flex h-full min-h-0 max-h-full w-full max-w-[min(420px,calc(100vw-1.5rem))] flex-1 flex-col overflow-visible bg-transparent";

/**
 * 공개 보드 한 장 — `app/wishlist/page.tsx` 꾸미기 보드(`WISHLIST_BOARD_FRAME_BASE` + decorate)와 동일.
 * 배경 에셋이 없을 때도 오로라(`wishlist-board-frame--decorate`)가 깔림.
 */
const PUBLIC_WISHLIST_BOARD_FRAME =
  "relative isolate overflow-visible rounded-[18px] shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] ring-1 wishlist-board-frame--decorate mx-auto w-full max-w-[372px] max-h-[min(680px,100%)] shrink-0 ring-violet-200/55";

/** 배경 이미지는 위 레이어 — 없을 때는 바깥 프레임 오로라만 보임 */
const PUBLIC_BOARD_INNER =
  "relative h-full w-full min-h-0 min-w-0 overflow-visible bg-transparent";

function PublicBoardProfileHeader({
  ownerName,
  isSidebarOpen,
  onMenuClick,
  onBack,
}: {
  ownerName: string;
  isSidebarOpen: boolean;
  onMenuClick: (event: MouseEvent<HTMLButtonElement>) => void;
  /** 없으면 좌측 뒤로 버튼 숨김 */
  onBack?: () => void;
}) {
  const displayName = ownerName.trim() || "회원";

  return (
    <header className={PAGE_HEADER_ROW_COMPACT}>
      <div className={`${PAGE_HEADER_LEADING_CLUSTER} items-start`}>
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className={PAGE_HEADER_BACK_BUTTON}
            aria-label="이전 페이지로"
          >
            <CaretLeftIcon size={22} weight="bold" />
          </button>
        ) : null}
        <h1 className="min-w-0 flex-1 text-left text-wish-title leading-tight text-slate-900">
          <span className="block">
            <span className="inline-flex items-baseline gap-0.5">
              <span className="font-bold leading-[0.8] text-[#7B61FF]">{displayName}</span>
              <span className="text-[18px] font-light leading-none text-slate-900">님의</span>
            </span>
          </span>
          <span className="mt-1 block text-[18px] font-light leading-snug text-slate-900">위시리스트</span>
        </h1>
      </div>
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

/**
 * 보드 한 면 — 배경·선물·헤더는 내 위시리스트와 동일 규칙(`getAssetImageUrl`, `deriveWishSlotState`).
 */
function BoardFrame({
  ownerName,
  boardAssets,
  boardItems,
  isSidebarOpen,
  onMenuClick,
  showHeader = true,
  omitBackground = false,
  children,
}: {
  ownerName: string;
  boardAssets: BoardAssetData[];
  boardItems: WishItemData[];
  isSidebarOpen: boolean;
  onMenuClick: (event: MouseEvent<HTMLButtonElement>) => void;
  /** false: 닉네임·메뉴는 바깥 고정 헤더만 사용 */
  showHeader?: boolean;
  /** true: 배경은 부모 카드에서 한 번만 깔음 */
  omitBackground?: boolean;
  children?: ReactNode;
}) {
  const backgroundUrl = useMemo(() => {
    if (omitBackground) {
      return null;
    }
    return resolveBoardBackgroundImageUrl(boardAssets);
  }, [boardAssets, omitBackground]);

  const { bigCircleCount, wishGiftIconKeys, wishTexts } = useMemo(
    () => deriveWishSlotState(boardItems),
    [boardItems],
  );

  const giftImages = useMemo(() => {
    const out: Partial<Record<number, string>> = {};
    const compact = compactGiftAssetKeysToLayoutSlots(wishTexts, wishGiftIconKeys);
    for (const [layoutId, key] of Object.entries(compact)) {
      const k = key?.trim();
      if (k) {
        out[Number(layoutId)] = getAssetImageUrl(k);
      }
    }
    return out;
  }, [wishTexts, wishGiftIconKeys]);

  const giftLabels = useMemo(
    () => compactGiftTextsToLayoutSlots(wishTexts, wishGiftIconKeys),
    [wishTexts, wishGiftIconKeys],
  );

  return (
    <div
      className={
        showHeader || omitBackground
          ? PUBLIC_BOARD_INNER
          : `${PUBLIC_BOARD_INNER} pt-[7%]`
      }
    >
      {backgroundUrl ? (
        shouldUseNativeImg(backgroundUrl) ? (
          <img
            src={backgroundUrl}
            alt=""
            className="pointer-events-none absolute inset-0 z-0 h-full w-full object-cover"
          />
        ) : (
          <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
            <Image
              src={backgroundUrl}
              alt=""
              fill
              sizes={PUBLIC_BOARD_BG_SIZES}
              className="object-cover"
            />
          </div>
        )
      ) : null}

      {showHeader ? (
        <PublicBoardProfileHeader
          ownerName={ownerName}
          isSidebarOpen={isSidebarOpen}
          onMenuClick={onMenuClick}
        />
      ) : null}

      {/* 타인 보드: 채워진 선물만 표시 — 빈 슬롯(꾸미기용) 숨김 */}
      <GiftSlots
        count={bigCircleCount}
        images={giftImages}
        labels={giftLabels}
        showPlaceholder={false}
        decorateActive={false}
      />

      {children}
    </div>
  );
}

/** 페이지 0: 주인의 위시리스트 — 스티커 장식 표시 */
function MainBoardPage({
  ownerName,
  boardAssets,
  boardItems,
  isSidebarOpen,
  onMenuClick,
  omitBackground = false,
}: {
  ownerName: string;
  boardAssets: BoardAssetData[];
  boardItems: WishItemData[];
  isSidebarOpen: boolean;
  onMenuClick: (event: MouseEvent<HTMLButtonElement>) => void;
  omitBackground?: boolean;
}) {
  const stickerImages = useMemo(() => {
    const acc: Partial<Record<number, string>> = {};
    for (const a of boardAssets) {
      if (a.assetType === "STICKER" && a.slotIndex !== null) {
        acc[a.slotIndex] = getAssetImageUrl(a.assetKey);
      }
    }
    return acc;
  }, [boardAssets]);

  return (
    <BoardFrame
      ownerName={ownerName}
      boardAssets={boardAssets}
      boardItems={boardItems}
      isSidebarOpen={isSidebarOpen}
      onMenuClick={onMenuClick}
      showHeader={false}
      omitBackground={omitBackground}
    >
      <StickerSlots images={stickerImages} showPlaceholder={false} decorateActive={false} />
    </BoardFrame>
  );
}

/** 페이지 1+: 댓글 슬롯 — `showEmptyCommentSlots`: 타인 보드에서 빈 칸·「댓글작성」표시(비로그인은 클릭 시 로그인·가입 유도) */
function CommentBoardPage({
  ownerName,
  boardAssets,
  boardItems,
  comments,
  isLoading,
  onSlotClick,
  isSidebarOpen,
  onMenuClick,
  omitBackground = false,
  showEmptyCommentSlots,
}: {
  ownerName: string;
  boardAssets: BoardAssetData[];
  boardItems: WishItemData[];
  comments: (CommentData | null)[];
  isLoading: boolean;
  onSlotClick: (slotId: number) => void;
  isSidebarOpen: boolean;
  onMenuClick: (event: MouseEvent<HTMLButtonElement>) => void;
  omitBackground?: boolean;
  showEmptyCommentSlots: boolean;
}) {
  const stickerImages = useMemo(() => {
    const acc: Partial<Record<number, string | null>> = {};
    for (let i = 0; i < comments.length; i++) {
      const slotId = i + 1;
      const row = comments[i];
      const rawKey = row?.stickerKey?.trim();
      if (row != null && row.id != null) {
        acc[slotId] = rawKey ? getAssetImageUrl(rawKey) : STICKER_SLOT_IMAGE_MASKED;
      }
    }
    return acc;
  }, [comments]);

  return (
    <BoardFrame
      ownerName={ownerName}
      boardAssets={boardAssets}
      boardItems={boardItems}
      isSidebarOpen={isSidebarOpen}
      onMenuClick={onMenuClick}
      showHeader={false}
      omitBackground={omitBackground}
    >
      <div
        className={
          isLoading ? "pointer-events-none h-full w-full opacity-55 transition-opacity" : "h-full w-full"
        }
        aria-busy={isLoading || undefined}
      >
        <StickerSlots
          images={stickerImages}
          showPlaceholder={showEmptyCommentSlots}
          decorateActive
          stickerEmptyLabel={showEmptyCommentSlots ? "댓글작성" : undefined}
          onSlotClick={onSlotClick}
        />
      </div>
    </BoardFrame>
  );
}

export default function PublicWishlistPage({
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

  const [boardItems, setBoardItems] = useState<WishItemData[]>([]);
  const [boardAssets, setBoardAssets] = useState<BoardAssetData[]>([]);
  const [ownerName, setOwnerName] = useState("");

  const [commentCache, setCommentCache] = useState<Record<number, (CommentData | null)[]>>({});
  const [loadingPages, setLoadingPages] = useState<Set<number>>(new Set());
  const [commentTotalPages, setCommentTotalPages] = useState(1);

  const [currentVisualPage, setCurrentVisualPage] = useState(0);

  const totalVisualPages = 1 + commentTotalPages;

  const [popupCommentPage, setPopupCommentPage] = useState<number | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [popupMode, setPopupMode] = useState<PopupMode>("view");
  const [selectedComment, setSelectedComment] = useState<CommentData | null>(null);

  const isSliding = useRef(false);
  const carouselSwipeStartRef = useRef<{
    x: number;
    y: number;
    swipeAllowed: boolean;
  } | null>(null);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [visitorMenuLoggedIn, setVisitorMenuLoggedIn] = useState(false);
  /** 로그인 후 내 보드 slug — `undefined`: 아직 조회 전, `null`: 보드 없음·조회 실패 */
  const [myBoardSlug, setMyBoardSlug] = useState<string | null | undefined>(undefined);
  const [guestAuthModalOpen, setGuestAuthModalOpen] = useState(false);
  const [ownBoardWriteNoticeOpen, setOwnBoardWriteNoticeOpen] = useState(false);

  const [apiStickerFolders, setApiStickerFolders] = useState<string[]>([]);
  const [commentStickerFolderId, setCommentStickerFolderId] = useState("all");
  const [commentStickerSheet, setCommentStickerSheet] = useState<StickerAssetDto[]>([]);
  const [commentStickersLoading, setCommentStickersLoading] = useState(false);
  const [commentStickersError, setCommentStickersError] = useState<string | null>(null);

  /** 토큰 유무 + `/api/users/me` 성공 여부로 판별 (토큰만으로는 오판 가능) */
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
      // 401 등으로 토큰이 비워지면 false, 일시적 네트워크 오류는 토큰 기준 유지
      setVisitorMenuLoggedIn(!!getAccessToken()?.trim());
    }
  }, []);

  useEffect(() => {
    void syncVisitorSession();
  }, [slug, syncVisitorSession]);

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

  useEffect(() => {
    if (!visitorMenuLoggedIn) {
      setMyBoardSlug(undefined);
      return;
    }
    let cancelled = false;
    void getMyBoard()
      .then((board) => {
        if (!cancelled) {
          setMyBoardSlug(board.data.boardSlug?.trim() || null);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setMyBoardSlug(null);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [visitorMenuLoggedIn]);

  const isViewingOwnBoard = useMemo(() => {
    if (!visitorMenuLoggedIn || myBoardSlug === undefined || myBoardSlug === null) {
      return false;
    }
    return myBoardSlug === slug.trim();
  }, [visitorMenuLoggedIn, myBoardSlug, slug]);

  /**
   * 타인 보드에서만 빈 댓글 칸 표시.
   * 로그인 사용자는 내 보드 슬러그를 알 때까지 잠시 숨겨 자기 보드 오판 방지.
   * 비로그인은 바로 표시 — 빈 칸 클릭 시 `handleSlotClick`에서 로그인·회원가입 모달로 유도.
   */
  const showEmptyCommentSlots = useMemo(
    () => !isViewingOwnBoard && (!visitorMenuLoggedIn || myBoardSlug !== undefined),
    [visitorMenuLoggedIn, myBoardSlug, isViewingOwnBoard],
  );

  const loadPublicBoard = useCallback(() => {
    return getPublicBoard(slug)
      .then((data) => {
        setBoardItems(data.data.items);
        setBoardAssets(data.data.assets);
        const display =
          data.data.nickname?.trim() ||
          data.data.username?.trim() ||
          "회원";
        setOwnerName(display);
      })
      .catch(() => {});
  }, [slug]);

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

  const handleNavigateBack = useCallback(() => {
    navigateAppBack(router, "/");
  }, [router]);

  useEffect(() => {
    void fetchStickerFolders(slug)
      .then((folders) => setApiStickerFolders(folders))
      .catch(() => setApiStickerFolders([]));
  }, [slug]);

  useEffect(() => {
    setCommentStickerFolderId("all");
  }, [slug]);

  useEffect(() => {
    let cancelled = false;
    setCommentStickersLoading(true);
    setCommentStickersError(null);
    const load = async () => {
      try {
        const list =
          commentStickerFolderId === "all"
            ? await fetchStickerAssets(slug)
            : await fetchStickersByFolder(commentStickerFolderId, slug);
        if (!cancelled) setCommentStickerSheet(list);
      } catch (e) {
        if (!cancelled) {
          setCommentStickerSheet([]);
          setCommentStickersError(
            e instanceof Error ? e.message : "스티커를 불러오지 못했습니다.",
          );
        }
      } finally {
        if (!cancelled) setCommentStickersLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [commentStickerFolderId, slug]);

  useEffect(() => {
    if (selectedSlot !== null && popupMode === "write") {
      setCommentStickerFolderId("all");
    }
  }, [selectedSlot, popupMode]);

  const commentStickerTabs: CommentStickerTab[] = useMemo(() => {
    const tabs: CommentStickerTab[] = [{ id: "all", label: "전체" }];
    for (const id of apiStickerFolders) {
      tabs.push({ id, label: getStickerFolderLabel(id) });
    }
    return tabs;
  }, [apiStickerFolders]);

  const commentStickerOptions: StickerOption[] = useMemo(
    () =>
      commentStickerSheet.map((s) => ({
        id: `st-${s.id}`,
        assetKey: s.assetKey.trim(),
        label: stickerOptionLabelFromAssetKey(s.assetKey),
      })),
    [commentStickerSheet],
  );

  const fetchCommentPage = useCallback(
    async (commentPageIdx: number) => {
      if (commentCache[commentPageIdx] !== undefined || loadingPages.has(commentPageIdx)) return;

      setLoadingPages((prev) => new Set(prev).add(commentPageIdx));
      try {
        const data = await getComments(slug, commentPageIdx);
        setCommentCache((prev) => ({
          ...prev,
          [commentPageIdx]: normalizeCommentsToSlotGrid(data.data.comments, commentPageIdx),
        }));
        setCommentTotalPages(commentSheetCountFromPayload(data.data));
      } finally {
        setLoadingPages((prev) => {
          const next = new Set(prev);
          next.delete(commentPageIdx);
          return next;
        });
      }
    },
    [slug, commentCache, loadingPages],
  );

  useEffect(() => {
    setCommentCache({});
    setCommentTotalPages(1);
    setCurrentVisualPage(0);
    setLoadingPages(new Set());
    setPopupCommentPage(null);
    setSelectedSlot(null);
    setSelectedComment(null);

    void loadPublicBoard();
    void fetchCommentPage(0);
  }, [slug, loadPublicBoard]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === "visible") {
        void loadPublicBoard();
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [loadPublicBoard]);

  useEffect(() => {
    if (currentVisualPage === 0) return;
    const commentIdx = currentVisualPage - 1;
    fetchCommentPage(commentIdx);
    if (commentIdx > 0) fetchCommentPage(commentIdx - 1);
    if (commentIdx < commentTotalPages - 1) fetchCommentPage(commentIdx + 1);
  }, [currentVisualPage, commentTotalPages]); // eslint-disable-line react-hooks/exhaustive-deps

  /** `totalVisualPagesOverride`: 방금 갱신한 댓글 면 수 반영 전에도 이동할 때 사용 */
  const navigateTo = useCallback(
    (visualPage: number, totalVisualPagesOverride?: number) => {
      const cap = totalVisualPagesOverride ?? totalVisualPages;
      if (visualPage < 0 || visualPage >= cap || isSliding.current) return;
      if (visualPage === currentVisualPage) return;
      isSliding.current = true;
      setCurrentVisualPage(visualPage);
      window.setTimeout(() => {
        isSliding.current = false;
      }, 350);
    },
    [totalVisualPages, currentVisualPage],
  );

  const onCarouselTouchStart = useCallback(
    (e: TouchEvent<HTMLDivElement>) => {
      if (selectedSlot !== null) return;
      if (e.touches.length !== 1) return;
      const t = e.touches[0];
      carouselSwipeStartRef.current = {
        x: t.clientX,
        y: t.clientY,
        swipeAllowed: !isCarouselSwipeInteractiveTarget(e.target),
      };
    },
    [selectedSlot],
  );

  const onCarouselTouchEnd = useCallback(
    (e: TouchEvent<HTMLDivElement>) => {
      const start = carouselSwipeStartRef.current;
      carouselSwipeStartRef.current = null;
      if (selectedSlot !== null || !start?.swipeAllowed) return;
      if (e.changedTouches.length !== 1) return;
      const t = e.changedTouches[0];
      const dx = t.clientX - start.x;
      const dy = t.clientY - start.y;
      if (Math.abs(dx) < CAROUSEL_SWIPE_MIN_PX) return;
      if (Math.abs(dx) < Math.abs(dy) * CAROUSEL_SWIPE_HORIZONTAL_RATIO) return;
      if (dx < 0) {
        navigateTo(currentVisualPage + 1);
      } else {
        navigateTo(currentVisualPage - 1);
      }
    },
    [currentVisualPage, navigateTo, selectedSlot],
  );

  const handleGoToLastCommentPage = () => {
    if (!visitorMenuLoggedIn) {
      setGuestAuthModalOpen(true);
      return;
    }
    navigateTo(totalVisualPages - 1);
  };

  const handleSlotClick = (slotId: number, commentPageIdx: number) => {
    const row = (commentCache[commentPageIdx] ?? [])[slotId - 1] ?? null;
    const hasComment = row != null && row.id != null;
    if (hasComment) {
      setPopupCommentPage(commentPageIdx);
      setSelectedSlot(slotId);
      setSelectedComment(row);
      setPopupMode("view");
      return;
    }
    if (!visitorMenuLoggedIn) {
      setGuestAuthModalOpen(true);
      return;
    }
    if (visitorMenuLoggedIn && myBoardSlug === undefined) {
      return;
    }
    if (isViewingOwnBoard) {
      setOwnBoardWriteNoticeOpen(true);
      return;
    }
    setPopupCommentPage(commentPageIdx);
    setSelectedSlot(slotId);
    setSelectedComment(null);
    setPopupMode("write");
  };

  const handleClosePopup = () => {
    setPopupCommentPage(null);
    setSelectedSlot(null);
    setSelectedComment(null);
  };

  const refreshCommentPage = async (commentPageIdx: number): Promise<CommentListPayload> => {
    setLoadingPages((prev) => new Set(prev).add(commentPageIdx));
    try {
      const data = await getComments(slug, commentPageIdx);
      const payload = data.data;
      const grid = normalizeCommentsToSlotGrid(payload.comments, commentPageIdx);
      setCommentCache((prev) => ({
        ...prev,
        [commentPageIdx]: grid,
      }));
      setCommentTotalPages(commentSheetCountFromPayload(payload));
      return payload;
    } finally {
      setLoadingPages((prev) => {
        const next = new Set(prev);
        next.delete(commentPageIdx);
        return next;
      });
    }
  };

  const handleCreate = async (content: string, stickerKey: string) => {
    if (popupCommentPage === null || selectedSlot === null || isViewingOwnBoard) {
      return;
    }
    const inPageSlot = selectedSlot - 1;
    if (inPageSlot < 0 || inPageSlot > 5) {
      return;
    }
    const wroteOnPage = popupCommentPage;
    const pageGrid = commentCache[wroteOnPage] ?? [];
    const pageComments = pageGrid.filter((c): c is CommentData => c != null);
    const globalSlotIndex = resolveGlobalSlotIndexForCreate(
      pageComments,
      wroteOnPage,
      inPageSlot,
    );
    await createComment(slug, content, stickerKey, globalSlotIndex);
    const payload = await refreshCommentPage(wroteOnPage);
    handleClosePopup();

    /** 현재 면에서 마지막 칸(전역 slotIndex % 6 === 5) + 마지막 API 페이지가 꽉 찬 경우에만 다음 면으로 이동 */
    if (!isCommentListLastPageFullByShape(payload) || globalSlotIndex % 6 !== 5) {
      return;
    }
    const sheetCount = commentSheetCountFromPayload(payload);
    const nextVisualCap = 1 + sheetCount;
    const targetVisual = sheetCount;
    window.setTimeout(() => {
      navigateTo(targetVisual, nextVisualCap);
    }, 0);
  };

  const handleUpdate = async (commentId: number, content: string) => {
    await updateComment(slug, commentId, content);
    if (popupCommentPage !== null) await refreshCommentPage(popupCommentPage);
    handleClosePopup();
  };

  const handleDelete = async (commentId: number) => {
    await deleteComment(slug, commentId);
    if (popupCommentPage !== null) await refreshCommentPage(popupCommentPage);
    handleClosePopup();
  };

  const boardBackgroundUrl = useMemo(
    () => resolveBoardBackgroundImageUrl(boardAssets),
    [boardAssets],
  );

  return (
    <main className="wishlist-page-root app-shell-viewport-floor flex min-h-0 flex-col overflow-visible px-3 pb-[env(safe-area-inset-bottom,0px)] pt-[env(safe-area-inset-top,0px)] sm:px-4">
      {selectedSlot !== null ? (
        <div className="fixed inset-0 z-20 bg-black/40" onClick={handleClosePopup} />
      ) : null}

      <div className="relative z-10 flex min-h-0 w-full min-w-0 flex-1 flex-col items-stretch justify-start overflow-visible transition-all duration-300 ease-out">
        <section className={`${PUBLIC_WISHLIST_BOARD_WRAP} mx-auto min-h-0 w-full`}>
          <div className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-visible p-0">
            {/** `app/wishlist/page.tsx` 꾸미기 보드 래퍼와 동일 패딩 */}
            {/** `app/wishlist/page.tsx` 꾸미기 보드 래퍼와 동일: 세로 가운데 + 가로 중앙 */}
            <div className="relative flex min-h-0 min-w-0 flex-1 items-center justify-center overflow-visible px-1 pb-1 pt-2 sm:px-2 sm:pb-2 sm:pt-3">
              <div
                className={PUBLIC_WISHLIST_BOARD_FRAME}
                style={{
                  aspectRatio: `${DESIGN_WIDTH} / ${DESIGN_HEIGHT}`,
                }}
              >
                {boardBackgroundUrl ? (
                  <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden rounded-[18px]">
                    {shouldUseNativeImg(boardBackgroundUrl) ? (
                      <img
                        src={boardBackgroundUrl}
                        alt=""
                        className="h-full w-full object-cover"
                        fetchPriority="high"
                      />
                    ) : (
                      <Image
                        src={boardBackgroundUrl}
                        alt=""
                        fill
                        sizes={PUBLIC_BOARD_BG_SIZES}
                        className="object-cover"
                        priority
                      />
                    )}
                  </div>
                ) : null}

                {/** 가로 슬라이드만 여기서 — 높이·좌표는 보드 박스 전체(320×680 비율) = 내 위시와 동일 */}
                <div
                  className="absolute inset-0 z-10 overflow-hidden rounded-[18px] touch-pan-y"
                  onTouchStart={onCarouselTouchStart}
                  onTouchEnd={onCarouselTouchEnd}
                >
                  <div
                    className="absolute inset-0 flex h-full min-h-0 transition-transform duration-300 ease-out"
                    style={{
                      width: `${totalVisualPages * 100}%`,
                      transform: `translateX(calc(-${currentVisualPage} * (100% / ${totalVisualPages})))`,
                    }}
                  >
                    <div
                      className="relative h-full min-h-0 min-w-0 overflow-visible p-0"
                      style={{ width: `${100 / totalVisualPages}%` }}
                    >
                      <MainBoardPage
                        ownerName={ownerName}
                        boardAssets={boardAssets}
                        boardItems={boardItems}
                        isSidebarOpen={isSidebarOpen}
                        onMenuClick={handleVisitorMenuClick}
                        omitBackground
                      />
                    </div>

                    {Array.from({ length: commentTotalPages }, (_, commentIdx) => (
                      <div
                        key={commentIdx}
                        className="relative h-full min-h-0 min-w-0 overflow-visible p-0"
                        style={{ width: `${100 / totalVisualPages}%` }}
                      >
                        <CommentBoardPage
                          ownerName={ownerName}
                          boardAssets={boardAssets}
                          boardItems={boardItems}
                          comments={commentCache[commentIdx] ?? []}
                          isLoading={loadingPages.has(commentIdx)}
                          onSlotClick={(slotId) => handleSlotClick(slotId, commentIdx)}
                          isSidebarOpen={isSidebarOpen}
                          onMenuClick={handleVisitorMenuClick}
                          omitBackground
                          showEmptyCommentSlots={showEmptyCommentSlots}
                        />
                      </div>
                    ))}
                  </div>

                  <div className="pointer-events-none absolute inset-x-0 bottom-3 z-20 flex items-end justify-between px-[4%]">
                    <div className="pointer-events-auto flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => navigateTo(currentVisualPage - 1)}
                        disabled={currentVisualPage === 0}
                        className="flex size-[42px] shrink-0 items-center justify-center rounded-full bg-white text-[#7B61FF] shadow-lg transition hover:bg-white/95 disabled:pointer-events-none disabled:opacity-30"
                        aria-label="이전 페이지"
                      >
                        <CaretLeftIcon size={23} weight="bold" />
                      </button>
                      <span className="min-w-[44px] text-center text-[11px] font-bold tabular-nums text-slate-700">
                        {currentVisualPage + 1} / {totalVisualPages}
                      </span>
                      <button
                        type="button"
                        onClick={() => navigateTo(currentVisualPage + 1)}
                        disabled={currentVisualPage === totalVisualPages - 1}
                        className="flex size-[42px] shrink-0 items-center justify-center rounded-full bg-white text-[#7B61FF] shadow-lg transition hover:bg-white/95 disabled:pointer-events-none disabled:opacity-30"
                        aria-label="다음 페이지"
                      >
                        <CaretRightIcon size={23} weight="bold" />
                      </button>
                    </div>

                    {currentVisualPage === 0 && totalVisualPages > 1 ? (
                      <button
                        type="button"
                        onClick={handleGoToLastCommentPage}
                        className="pointer-events-auto flex max-w-[min(200px,calc(100vw-6rem))] shrink-0 items-center justify-center gap-2 rounded-full bg-[#7B61FF] px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:bg-[#6b52e0] active:scale-[0.98]"
                        aria-label="마지막 댓글 페이지로 이동"
                        title="위시 다음 페이지들 중 가장 마지막(댓글)으로 이동합니다"
                      >
                        <CaretRightIcon size={20} weight="bold" className="shrink-0 opacity-95" aria-hidden />
                        <span className="min-w-0 truncate">마지막 페이지로</span>
                      </button>
                    ) : null}
                  </div>
                </div>

                <PublicBoardProfileHeader
                  ownerName={ownerName}
                  isSidebarOpen={isSidebarOpen}
                  onMenuClick={handleVisitorMenuClick}
                  onBack={handleNavigateBack}
                />
              </div>
            </div>
          </div>
        </section>
      </div>

      <WishlistCenterDialog
        variant="static"
        open={guestAuthModalOpen}
        onClose={() => setGuestAuthModalOpen(false)}
        title="로그인이 필요해요"
        titleId="guest-auth-title"
        description="댓글을 남기려면 로그인이나 회원가입해 주세요."
      >
        <div className="mt-5 grid grid-cols-2 gap-3">
          <Link
            href={loginHrefWithReturn}
            onClick={() => setGuestAuthModalOpen(false)}
            className="flex items-center justify-center rounded-[14px] bg-[#7B61FF] px-4 py-3 text-center text-sm font-semibold text-white transition hover:opacity-95"
          >
            로그인
          </Link>
          <Link
            href="/signup"
            onClick={() => setGuestAuthModalOpen(false)}
            className="flex items-center justify-center rounded-[14px] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-center text-sm font-semibold text-[var(--color-text-primary)] transition hover:bg-slate-50"
          >
            회원가입
          </Link>
        </div>
      </WishlistCenterDialog>

      <WishlistCenterDialog
        variant="static"
        open={ownBoardWriteNoticeOpen}
        onClose={() => setOwnBoardWriteNoticeOpen(false)}
        title="댓글을 남길 수 없어요"
        titleId="own-board-notice-title"
        description="본인의 위시리스트에는 댓글을 작성할 수 없습니다."
      >
        <button
          type="button"
          onClick={() => setOwnBoardWriteNoticeOpen(false)}
          className="mt-5 w-full rounded-[14px] bg-[#7B61FF] py-3 text-sm font-semibold text-white transition hover:opacity-95"
        >
          확인
        </button>
      </WishlistCenterDialog>

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

      {selectedSlot !== null ? (
        <CommentPopup
          mode={popupMode}
          comment={selectedComment}
          stickerOptions={commentStickerOptions}
          stickerTabs={commentStickerTabs}
          stickerFolderId={commentStickerFolderId}
          onStickerFolderChange={setCommentStickerFolderId}
          stickersLoading={commentStickersLoading}
          stickersError={commentStickersError}
          onClose={handleClosePopup}
          onModeChange={setPopupMode}
          onCreate={handleCreate}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
        />
      ) : null}
    </main>
  );
}
