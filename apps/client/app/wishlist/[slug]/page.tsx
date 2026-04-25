"use client";

import {
  CaretLeftIcon,
  CaretRightIcon,
  ChatCircleDots,
  TextAlignJustify,
  X,
} from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  use,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent,
  type ReactNode,
} from "react";

import { CommentPopup, type CommentStickerTab } from "@/components/wishlist/CommentPopup";
import { PublicWishlistVisitorMenu } from "@/components/wishlist/PublicWishlistVisitorMenu";
import {
  DESIGN_HEIGHT,
  DESIGN_WIDTH,
  GiftSlots,
  StickerSlots,
} from "@/components/wishlist/WishlistSlots";
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
  PAGE_HEADER_MENU_BUTTON,
  PAGE_HEADER_ROW_COMPACT,
} from "@/lib/constants/page-header";
import { getStickerFolderLabel } from "@/lib/sticker-folder-labels";

function stickerOptionLabelFromAssetKey(assetKey: string): string {
  const norm = assetKey.replace(/\\/g, "/");
  const seg = norm.split("/").filter(Boolean);
  const last = seg[seg.length - 1] ?? assetKey;
  return last.replace(/\.[^.]+$/, "") || assetKey;
}

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
 * 공개 보드 바깥 프레임 — `app/wishlist/page.tsx` 꾸미기 보드 프레임과 동일.
 * 배경 에셋이 없을 때도 오로라 그라데이션(`wishlist-board-frame--decorate`)이 깔림.
 */
/** 공개 카드 전체(타이틀+보드) — `app/wishlist/page.tsx` 의 `WISHLIST_BOARD_FRAME_BASE` 와 동일 톤 */
const PUBLIC_WISHLIST_CARD_SHELL =
  "relative isolate flex w-full max-w-[372px] min-h-0 flex-1 flex-col overflow-visible rounded-[18px] shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] ring-1 ring-violet-200/55 wishlist-board-frame--decorate";

/** 가로 슬라이드 뷰포트 — `width`·`aspect-ratio`·`max-height:100%`로 남은 높이에 맞춤(세로 스크롤 없음) */
const PUBLIC_BOARD_SLIDE_VIEWPORT =
  "relative mx-auto min-h-0 max-h-full shrink-0 overflow-hidden self-center";

/** 배경 이미지는 위 레이어 — 없을 때는 바깥 프레임 오로라만 보임 */
const PUBLIC_BOARD_INNER =
  "relative h-full w-full min-h-0 min-w-0 overflow-visible bg-transparent";

function PublicBoardProfileHeader({
  ownerName,
  isSidebarOpen,
  onMenuClick,
}: {
  ownerName: string;
  isSidebarOpen: boolean;
  onMenuClick: (event: MouseEvent<HTMLButtonElement>) => void;
}) {
  const displayName = ownerName.trim() || "회원";

  return (
    <header className={PAGE_HEADER_ROW_COMPACT}>
      <h1 className="min-w-0 flex-1 text-left text-wish-title leading-tight text-slate-900">
        <span className="block">
          <span className="inline-flex items-baseline gap-0.5">
            <span className="font-bold text-[#7B61FF]">{displayName}</span>
            <span className="text-[18px] font-light leading-none text-slate-900">님의</span>
          </span>
        </span>
        <span className="mt-1 block text-[18px] font-light leading-snug text-slate-900">
          위시리스트 입니다.
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
        <img
          src={backgroundUrl}
          alt=""
          className="pointer-events-none absolute inset-0 z-0 h-full w-full object-cover"
        />
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

/** 페이지 1+: 댓글 슬롯 — `showEmptyCommentSlots`: 타인 보드에 로그인 후 댓글 작성 가능할 때만 빈 칸 표시 */
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
      if (row != null && row.id != null && rawKey) {
        acc[slotId] = getAssetImageUrl(rawKey);
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

  /** 타인 공개 보드에만 — 비로그인·자기 보드·내 슬러그 확인 전에는 빈 댓글 칸·꾸미기 톤 숨김 */
  const showEmptyCommentSlots = useMemo(
    () => Boolean(visitorMenuLoggedIn && myBoardSlug !== undefined && !isViewingOwnBoard),
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

  useEffect(() => {
    void fetchStickerFolders()
      .then((folders) => setApiStickerFolders(folders))
      .catch(() => setApiStickerFolders([]));
  }, []);

  useEffect(() => {
    let cancelled = false;
    setCommentStickersLoading(true);
    setCommentStickersError(null);
    const load = async () => {
      try {
        const list =
          commentStickerFolderId === "all"
            ? await fetchStickerAssets()
            : await fetchStickersByFolder(commentStickerFolderId);
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
  }, [commentStickerFolderId]);

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
  const navigateTo = (visualPage: number, totalVisualPagesOverride?: number) => {
    const cap = totalVisualPagesOverride ?? totalVisualPages;
    if (visualPage < 0 || visualPage >= cap || isSliding.current) return;
    isSliding.current = true;
    setCurrentVisualPage(visualPage);
    setTimeout(() => {
      isSliding.current = false;
    }, 350);
  };

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
    const globalSlotIndex = wroteOnPage * 6 + inPageSlot;
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
            <div className="relative flex min-h-0 min-w-0 flex-1 items-stretch justify-center overflow-visible px-1 pb-1 pt-1.5 sm:px-2 sm:pb-1.5 sm:pt-2">
              <div
                className={`${PUBLIC_WISHLIST_CARD_SHELL} mx-auto h-full min-h-0 max-h-full w-full max-w-[372px] flex-1`}
              >
                {boardBackgroundUrl ? (
                  <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden rounded-[18px]">
                    <img
                      src={boardBackgroundUrl}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  </div>
                ) : null}

                <div className="relative z-[1] shrink-0">
                  <PublicBoardProfileHeader
                    ownerName={ownerName}
                    isSidebarOpen={isSidebarOpen}
                    onMenuClick={handleVisitorMenuClick}
                  />
                </div>

                <div className="relative z-[1] flex min-h-0 min-w-0 flex-1 flex-col overflow-visible">
                  <div className="relative flex min-h-0 min-w-0 w-full flex-1 items-center justify-center overflow-visible">
                    <div
                      className={PUBLIC_BOARD_SLIDE_VIEWPORT}
                      style={{
                        aspectRatio: `${DESIGN_WIDTH} / ${DESIGN_HEIGHT}`,
                        width: "min(100%, 372px)",
                        maxHeight: "100%",
                      }}
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

                        {currentVisualPage === 0 ? (
                          <button
                            type="button"
                            onClick={handleGoToLastCommentPage}
                            className="pointer-events-auto flex size-[42px] items-center justify-center rounded-full bg-[#7B61FF] text-white shadow-lg transition hover:bg-[#6b52e0]"
                            aria-label="댓글 작성하러 가기"
                            title="댓글 작성하러 가기"
                          >
                            <ChatCircleDots size={23} weight="bold" />
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {guestAuthModalOpen ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-[40] cursor-default bg-black/45"
            aria-label="닫기"
            onClick={() => setGuestAuthModalOpen(false)}
          />
          <div
            className="fixed left-1/2 top-1/2 z-[41] w-[min(340px,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-[18px] border border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-6 shadow-[0_24px_60px_rgba(0,0,0,0.14)]"
            role="dialog"
            aria-modal="true"
            aria-labelledby="guest-auth-title"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <h2 id="guest-auth-title" className="text-h3 text-slate-900">
                  로그인이 필요해요
                </h2>
                <p className="mt-2 text-body-sm leading-snug text-slate-600">
                  댓글을 남기려면 로그인하거나 회원가입해 주세요.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setGuestAuthModalOpen(false)}
                className="inline-flex size-9 shrink-0 items-center justify-center rounded-full text-slate-800 transition hover:bg-slate-100 active:opacity-60"
                aria-label="닫기"
              >
                <X size={20} weight="bold" aria-hidden />
              </button>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <Link
                href="/login"
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
          </div>
        </>
      ) : null}

      {ownBoardWriteNoticeOpen ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-[40] cursor-default bg-black/45"
            aria-label="닫기"
            onClick={() => setOwnBoardWriteNoticeOpen(false)}
          />
          <div
            className="fixed left-1/2 top-1/2 z-[41] w-[min(340px,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-[18px] border border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-6 shadow-[0_24px_60px_rgba(0,0,0,0.14)]"
            role="dialog"
            aria-modal="true"
            aria-labelledby="own-board-notice-title"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <h2 id="own-board-notice-title" className="text-h3 text-slate-900">
                  댓글을 남길 수 없어요
                </h2>
                <p className="mt-2 text-body-sm leading-snug text-slate-600">
                  본인의 위시리스트에는 댓글을 작성할 수 없습니다.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOwnBoardWriteNoticeOpen(false)}
                className="inline-flex size-9 shrink-0 items-center justify-center rounded-full text-slate-800 transition hover:bg-slate-100 active:opacity-60"
                aria-label="닫기"
              >
                <X size={20} weight="bold" aria-hidden />
              </button>
            </div>
            <button
              type="button"
              onClick={() => setOwnBoardWriteNoticeOpen(false)}
              className="mt-5 w-full rounded-[14px] bg-[#7B61FF] py-3 text-sm font-semibold text-white transition hover:opacity-95"
            >
              확인
            </button>
          </div>
        </>
      ) : null}

      <PublicWishlistVisitorMenu
        open={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        loggedIn={visitorMenuLoggedIn}
        onLogout={handleVisitorLogout}
      />

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
