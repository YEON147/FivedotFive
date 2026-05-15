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
  type PointerEvent,
  type ReactNode,
} from "react";

import { AppSideMenu } from "@/components/common/AppSideMenu";
import { WishlistMyBoardScreen } from "@/components/wishlist/WishlistMyBoardScreen";
import {
  CommentPopup,
  type CommentCreateGuestFields,
  type CommentStickerTab,
} from "@/components/wishlist/CommentPopup";
import { PublicWishlistVisitorMenu } from "@/components/wishlist/PublicWishlistVisitorMenu";
import { WishlistCenterDialog } from "@/components/wishlist/WishlistCenterDialog";
import {
  GiftSlots,
  STICKER_SLOT_IMAGE_MASKED,
  StickerSlots,
} from "@/components/wishlist/WishlistSlots";
import {
  PUBLIC_BOARD_INNER,
  PUBLIC_BOARD_PAGE_CENTER_CLASS,
  PUBLIC_BOARD_PAGE_COLUMN_CLASS,
  PUBLIC_BOARD_PAGE_MAIN_CLASS,
  PUBLIC_BOARD_PAGE_Z10_CLASS,
  PUBLIC_WISHLIST_BOARD_FRAME,
  PUBLIC_WISHLIST_BOARD_WRAP,
  publicBoardAspectRatioStyle,
} from "@/lib/constants/public-board-shell";
import { logoutSession } from "@/features/login/api";
import { loginUrlForPath } from "@/features/login/post-login-destination";
import { getMyProfile } from "@/features/user/api";
import type { MyProfile } from "@/features/user/types";
import {
  createComment,
  deleteComment,
  getComments,
  getPublicBoard,
  updateComment,
  verifyGuestCommentPassword,
} from "@/features/wishlist/api";
import { isLoggedInOwnerOfBoardSlug } from "@/features/wishlist/resolve-logged-in-home";
import {
  resolveBoardBackgroundAssetKey,
  resolveBoardBackgroundImageUrl,
} from "@/features/wishlist/board-background";
import { getAssetImageUrl } from "@/lib/asset-url";
import {
  getKstStartOfLocalDateMs,
  inferWishBoardCommentsRevealed,
} from "@/features/wishlist/comment-reveal-at";
import {
  isMaskedOthersWishComment,
  isSoftDeletedWishComment,
} from "@/features/wishlist/comment-display";
import {
  computeCommentSheetCount,
  normalizeCommentsToSlotGrid,
  resolveGlobalSlotIndexForCreate,
} from "@/features/wishlist/comment-slot-layout";
import {
  canEditGuestWishComment,
  rememberGuestWishComment,
} from "@/features/wishlist/guest-comment-session";
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
import { ACCESS_TOKEN_STORAGE_KEY, getAccessToken } from "@/lib/api/token-store";
import {
  PAGE_HEADER_BACK_BUTTON,
  PAGE_HEADER_LEADING_CLUSTER,
  PAGE_HEADER_MENU_BUTTON,
  PAGE_HEADER_ROW_COMPACT,
} from "@/lib/constants/page-header";
import { shouldUseNativeImg } from "@/lib/native-img";
import {
  getStickerFolderLabel,
  orderStickerFoldersForTabs,
} from "@/lib/sticker-folder-labels";

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
      "button, a, [role='button'], input, textarea, select, label, [data-carousel-no-swipe]",
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

/** `NaN`/비정상 값이면 캐러셀·translate 깨짐 → 최소 1면 보장 */
function safeCommentSheetCountFromPayload(p: CommentListPayload): number {
  const raw = commentSheetCountFromPayload(p);
  if (typeof raw === "number" && Number.isFinite(raw) && raw >= 1) {
    return Math.floor(raw);
  }
  return 1;
}

function isCommentListLastPageFullByShape(p: CommentListPayload): boolean {
  return resolveIsLastPageFull(p);
}

type PopupMode = "view" | "write" | "edit";

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

      {/* 메인·댓글 면 공통 — 1페이지와 동일한 위시 선물 원 */}
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
  /** 내 보드 + 배경 시트 열림 — 저장 전 미리보기 키(`null`이면 `boardAssets`만 사용) */
  const [embeddedBgDraftKey, setEmbeddedBgDraftKey] = useState<string | null>(null);
  const [ownerName, setOwnerName] = useState("");
  const [boardRevealMeta, setBoardRevealMeta] = useState<{
    targetDate: string | null;
    commentsRevealed: boolean;
  } | null>(null);

  const wishCommentRevealAtMs = useMemo(() => {
    if (!boardRevealMeta || boardRevealMeta.commentsRevealed) return undefined;
    const raw = boardRevealMeta.targetDate;
    if (raw == null || String(raw).trim() === "") return undefined;
    const ms = getKstStartOfLocalDateMs(raw);
    return Number.isFinite(ms) ? ms : undefined;
  }, [boardRevealMeta]);

  const [commentCache, setCommentCache] = useState<Record<number, (CommentData | null)[]>>({});
  const [loadingPages, setLoadingPages] = useState<Set<number>>(new Set());
  /** `fetchCommentPage`가 state 클로저에 묶이면 콜백 참조가 매 응답마다 바뀌고, 그걸 deps로 둔 초기화 이펙트가 캐시를 비우며 `comments?page=0` 무한 호출됨 */
  const commentCacheRef = useRef(commentCache);
  const loadingPagesRef = useRef(loadingPages);
  commentCacheRef.current = commentCache;
  loadingPagesRef.current = loadingPages;

  const [commentTotalPages, setCommentTotalPages] = useState(1);

  const [currentVisualPage, setCurrentVisualPage] = useState(0);

  /** 소유자 에디터(첫 슬라이드)에서 모달·꾸미기 중 캐러셀 스와이프 차단 */
  const [editorCarouselLocked, setEditorCarouselLocked] = useState(false);

  /** 상태 오염·API 이상치 대비 — 댓글 슬라이드가 0폭·NaN 되지 않게 */
  const commentPagesSafe = useMemo(() => {
    const n = commentTotalPages;
    if (typeof n === "number" && Number.isFinite(n) && n >= 1) {
      return Math.floor(n);
    }
    return 1;
  }, [commentTotalPages]);

  const totalVisualPages = 1 + commentPagesSafe;

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

  /** 이전 캐러셀 페이지 — 0→댓글 이동 시 공개 보드 재조회용 */
  const prevVisualPageRef = useRef(0);
  /** 소유 확정 등으로 이펙트만 재실행될 때 댓글 캐시를 비우지 않음 → `comments?page=0` 이중 호출 방지 */
  const boardBootstrapSlugRef = useRef<string | null>(null);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  /** `syncVisitorSession`에서 한 번 받아 임베드 에디터에 넘겨 `/api/users/me` 중복 호출 방지 */
  const [visitorProfile, setVisitorProfile] = useState<MyProfile | null>(null);
  const [visitorMenuLoggedIn, setVisitorMenuLoggedIn] = useState(false);
  /** 로그인 후 내 보드 slug — `undefined`: 아직 조회 전, `null`: 보드 없음·조회 실패 */
  const [myBoardSlug, setMyBoardSlug] = useState<string | null | undefined>(undefined);
  const [guestAuthModalOpen, setGuestAuthModalOpen] = useState(false);
  const [ownBoardWriteNoticeOpen, setOwnBoardWriteNoticeOpen] = useState(false);

  const [apiStickerFolders, setApiStickerFolders] = useState<string[]>([]);
  /** 폴더 API 완료 전엔 댓글 스티커를 `…/stickers`로 먼저 열었다가 첫 폴더로 다시 부르는 이중 호출이 남 */
  const [stickerFoldersFetchDone, setStickerFoldersFetchDone] = useState(false);
  /** `""`: 폴더 목록 수신 전 — `all` 탭 없음, 수신 후 첫 폴더로 맞춤 */
  const [commentStickerFolderId, setCommentStickerFolderId] = useState("");
  const [commentStickerSheet, setCommentStickerSheet] = useState<StickerAssetDto[]>([]);
  const [commentStickersLoading, setCommentStickersLoading] = useState(false);
  const [commentStickersError, setCommentStickersError] = useState<string | null>(null);

  /** 토큰 유무 + `/api/users/me` 성공 여부로 판별 (토큰만으로는 오판 가능) */
  const syncVisitorSession = useCallback(async () => {
    const token = getAccessToken()?.trim();
    if (!token) {
      setVisitorMenuLoggedIn(false);
      setVisitorProfile(null);
      return;
    }
    try {
      const profile = await getMyProfile();
      setVisitorProfile(profile);
      setVisitorMenuLoggedIn(true);
    } catch {
      setVisitorProfile(null);
      // 401 등으로 토큰이 비워지면 false, 일시적 네트워크 오류는 토큰 기준 유지
      setVisitorMenuLoggedIn(!!getAccessToken()?.trim());
    }
  }, []);

  /** 슬러그 바뀔 때마다 `me` 부르지 않음 — 포커스·storage·mount에서만 동기화 */
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

  useEffect(() => {
    if (!visitorMenuLoggedIn) {
      setMyBoardSlug(undefined);
      return;
    }
    setMyBoardSlug(undefined);
    let cancelled = false;
    void (async () => {
      try {
        const isOwner = await isLoggedInOwnerOfBoardSlug(slug);
        if (!cancelled) {
          setMyBoardSlug(isOwner ? slug.trim() : null);
        }
      } catch {
        if (!cancelled) setMyBoardSlug(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [visitorMenuLoggedIn, slug]);

  const isViewingOwnBoard = useMemo(() => {
    if (!visitorMenuLoggedIn || myBoardSlug === undefined || myBoardSlug === null) {
      return false;
    }
    return myBoardSlug === slug.trim();
  }, [visitorMenuLoggedIn, myBoardSlug, slug]);

  useEffect(() => {
    if (!isViewingOwnBoard) {
      setEmbeddedBgDraftKey(null);
    }
  }, [isViewingOwnBoard]);

  /**
   * 타인 보드에서만 빈 댓글 칸 표시.
   * 내 보드 여부는 `GET /api/me/boards-all`·`/api/boards/me` 기반 소유 확인 후에만 확정되므로,
   * 슬러그 로딩 중(`undefined`)에는
   * 예전처럼 빈 칸을 숨기면 타인 보드에서도 댓글 작성 UI가 안 뜸 → 숨김은
   * 「로그인 + 슬러그 확정 + 내 보드」일 때만.
   */
  const showEmptyCommentSlots = useMemo(
    () =>
      !(visitorMenuLoggedIn && myBoardSlug !== undefined && isViewingOwnBoard),
    [visitorMenuLoggedIn, myBoardSlug, isViewingOwnBoard],
  );

  /** 수정·삭제: 회원 본인 또는 이 세션에서 작성한 비회원 댓글 */
  const canModifySelectedComment = useMemo(() => {
    if (!selectedComment) return false;
    if (selectedComment.isUser) return true;
    if (visitorMenuLoggedIn) return false;
    if (
      isMaskedOthersWishComment(selectedComment) ||
      isSoftDeletedWishComment(selectedComment)
    ) {
      return false;
    }
    return canEditGuestWishComment(slug, selectedComment.id);
  }, [selectedComment, visitorMenuLoggedIn, slug]);

  const loadPublicBoard = useCallback(() => {
    return getPublicBoard(slug).then((data) => {
      if (!data) {
        setBoardItems([]);
        setBoardAssets([]);
        setBoardRevealMeta(null);
        setOwnerName("");
        return;
      }
      setBoardItems(data.data.items);
      setBoardAssets(data.data.assets);
      const display =
        data.data.nickname?.trim() ||
        data.data.username?.trim() ||
        "회원";
      setOwnerName(display);
      setBoardRevealMeta({
        targetDate: data.data.targetDate,
        commentsRevealed: inferWishBoardCommentsRevealed(data.data),
      });
    });
  }, [slug]);

  /** 내 보드 에디터가 GET /boards/me 반영 시 — 카드 배경 레이어는 부모 상태라 동기화 필요 */
  const handleEmbeddedBoardSynced = useCallback(
    (payload: { assets: BoardAssetData[]; items: WishItemData[] }) => {
      setBoardAssets(payload.assets);
      setBoardItems(payload.items);
    },
    [],
  );

  const handleEmbeddedBackgroundDraftKeyChange = useCallback((key: string | null) => {
    setEmbeddedBgDraftKey(key);
  }, []);

  const handleVisitorMenuClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    void syncVisitorSession();
    setIsSidebarOpen((open) => !open);
  };

  const handleVisitorLogout = useCallback(async () => {
    await logoutSession();
    clearWishlistPageSessionCache();
    setVisitorMenuLoggedIn(false);
    setVisitorProfile(null);
    setIsSidebarOpen(false);
    router.push("/login");
  }, [router]);

  useEffect(() => {
    setStickerFoldersFetchDone(false);
    void fetchStickerFolders()
      .then((folders) => {
        setApiStickerFolders(orderStickerFoldersForTabs(folders));
        setStickerFoldersFetchDone(true);
      })
      .catch(() => {
        setApiStickerFolders([]);
        setStickerFoldersFetchDone(true);
      });
  }, [slug]);

  useEffect(() => {
    setCommentStickerFolderId("");
  }, [slug]);

  /** `전체` 탭 제거 — 폴더 id만 사용, 유효하지 않으면 첫 폴더 */
  useEffect(() => {
    if (apiStickerFolders.length === 0) return;
    setCommentStickerFolderId((prev) => {
      if (prev === "" || prev === "all" || !apiStickerFolders.includes(prev)) {
        return apiStickerFolders[0] ?? "";
      }
      return prev;
    });
  }, [apiStickerFolders]);

  useEffect(() => {
    if (!stickerFoldersFetchDone) {
      setCommentStickersLoading(true);
      return;
    }
    let cancelled = false;
    setCommentStickersLoading(true);
    setCommentStickersError(null);
    const load = async () => {
      try {
        let list: StickerAssetDto[];
        if (apiStickerFolders.length === 0) {
          list = await fetchStickerAssets();
        } else {
          const folder =
            commentStickerFolderId !== "" &&
            apiStickerFolders.includes(commentStickerFolderId)
              ? commentStickerFolderId
              : (apiStickerFolders[0] ?? "");
          list =
            folder !== ""
              ? await fetchStickersByFolder(folder, slug)
              : [];
        }
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
  }, [
    commentStickerFolderId,
    slug,
    apiStickerFolders,
    stickerFoldersFetchDone,
  ]);

  useEffect(() => {
    if (selectedSlot !== null && popupMode === "write" && apiStickerFolders.length > 0) {
      setCommentStickerFolderId((prev) => {
        if (prev === "" || prev === "all" || !apiStickerFolders.includes(prev)) {
          return apiStickerFolders[0] ?? "";
        }
        return prev;
      });
    }
  }, [selectedSlot, popupMode, apiStickerFolders]);

  const commentStickerTabs: CommentStickerTab[] = useMemo(
    () =>
      apiStickerFolders.map((id) => ({
        id,
        label: getStickerFolderLabel(id),
      })),
    [apiStickerFolders],
  );

  const commentStickerOptions: StickerOption[] = useMemo(
    () =>
      commentStickerSheet.map((s) => ({
        id: `st-${s.id}`,
        assetKey: s.assetKey.trim(),
        label: stickerOptionLabelFromAssetKey(s.assetKey),
      })),
    [commentStickerSheet],
  );

  const fetchCommentPage = useCallback(async (commentPageIdx: number) => {
    if (
      commentCacheRef.current[commentPageIdx] !== undefined ||
      loadingPagesRef.current.has(commentPageIdx)
    ) {
      return;
    }

    setLoadingPages((prev) => new Set(prev).add(commentPageIdx));
    try {
      const data = await getComments(slug, commentPageIdx);
      setCommentCache((prev) => ({
        ...prev,
        [commentPageIdx]: normalizeCommentsToSlotGrid(data.data.comments, commentPageIdx),
      }));
      setCommentTotalPages(safeCommentSheetCountFromPayload(data.data));
    } finally {
      setLoadingPages((prev) => {
        const next = new Set(prev);
        next.delete(commentPageIdx);
        return next;
      });
    }
  }, [slug]);

  useEffect(() => {
    const slugChanged = boardBootstrapSlugRef.current !== slug;
    if (slugChanged) {
      boardBootstrapSlugRef.current = slug;
      setCommentCache({});
      setCommentTotalPages(1);
      setCurrentVisualPage(0);
      prevVisualPageRef.current = 0;
      setLoadingPages(new Set());
      setPopupCommentPage(null);
      setSelectedSlot(null);
      setSelectedComment(null);
    }

    const hasToken = Boolean(getAccessToken()?.trim());
    /** 로그인 + 소유 확정 전에는 공개 보드·댓글 로드를 미룸 — 소유자에게는 에디터 `GET …/list`와 겹치는 GET `/boards/{slug}` 제거 */
    if (hasToken && visitorMenuLoggedIn && myBoardSlug === undefined) {
      return;
    }

    const skipPublicBoard =
      hasToken && visitorMenuLoggedIn && isViewingOwnBoard;

    if (!skipPublicBoard) {
      void loadPublicBoard();
    }
    void fetchCommentPage(0);
  }, [
    slug,
    loadPublicBoard,
    fetchCommentPage,
    visitorMenuLoggedIn,
    myBoardSlug,
    isViewingOwnBoard,
  ]);

  /** 소유자 보드는 초기 `loadPublicBoard`를 생략하므로 헤더·댓글 면 표시용 이름을 프로필에서 채움 */
  useEffect(() => {
    if (!isViewingOwnBoard || !visitorProfile) return;
    const display =
      visitorProfile.nickname?.trim() ||
      visitorProfile.username?.trim() ||
      "회원";
    setOwnerName(display);
  }, [isViewingOwnBoard, visitorProfile]);

  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState !== "visible") return;
      const hasToken = Boolean(getAccessToken()?.trim());
      if (hasToken && isViewingOwnBoard) return;
      void loadPublicBoard();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [loadPublicBoard, isViewingOwnBoard]);

  useEffect(() => {
    if (currentVisualPage === 0) return;
    const commentIdx = currentVisualPage - 1;
    fetchCommentPage(commentIdx);
    if (commentIdx > 0) fetchCommentPage(commentIdx - 1);
    if (commentIdx < commentTotalPages - 1) fetchCommentPage(commentIdx + 1);
  }, [currentVisualPage, commentTotalPages]); // eslint-disable-line react-hooks/exhaustive-deps

  /** 소유자가 첫 슬라이드 → 댓글 면으로 넘어갈 때만 공개 보드 재조회(편집 반영) */
  useEffect(() => {
    const prev = prevVisualPageRef.current;
    prevVisualPageRef.current = currentVisualPage;
    if (!isViewingOwnBoard) {
      return;
    }
    if (prev === 0 && currentVisualPage > 0) {
      void loadPublicBoard();
    }
  }, [currentVisualPage, isViewingOwnBoard, loadPublicBoard]);

  /** `totalVisualPagesOverride`: 방금 갱신한 댓글 면 수 반영 전에도 이동할 때 사용 */
  const navigateTo = useCallback(
    (visualPage: number, totalVisualPagesOverride?: number) => {
      const cap = totalVisualPagesOverride ?? totalVisualPages;
      if (visualPage < 0 || visualPage >= cap || isSliding.current) return;
      if (visualPage === currentVisualPage) return;
      if (
        editorCarouselLocked &&
        currentVisualPage === 0 &&
        visualPage !== 0
      ) {
        return;
      }
      isSliding.current = true;
      setCurrentVisualPage(visualPage);
      window.setTimeout(() => {
        isSliding.current = false;
      }, 350);
    },
    [totalVisualPages, currentVisualPage, editorCarouselLocked],
  );

  /** 터치·마우스 공통 — 데스크톱에서도 좌우 드래그로 페이지 전환 */
  const onCarouselPointerDown = useCallback(
    (e: PointerEvent<HTMLDivElement>) => {
      if (editorCarouselLocked) return;
      if (selectedSlot !== null) return;
      if (!e.isPrimary) return;
      if (e.pointerType === "mouse" && e.button !== 0) return;
      const swipeAllowed = !isCarouselSwipeInteractiveTarget(e.target);
      carouselSwipeStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        swipeAllowed,
      };
      /**
       * 포인터 캡처는 스와이프에만 사용. 버튼/링크 위에서도 캡처하면
       * `pointerup`·`click`이 캐러셀으로 가로채져 UI가 전부 죽는다.
       */
      if (swipeAllowed) {
        try {
          e.currentTarget.setPointerCapture(e.pointerId);
        } catch {
          /* 이미 캡처됨 등 */
        }
      }
    },
    [editorCarouselLocked, selectedSlot],
  );

  const onCarouselPointerUp = useCallback(
    (e: PointerEvent<HTMLDivElement>) => {
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        /* 캡처 없음 */
      }
      const start = carouselSwipeStartRef.current;
      carouselSwipeStartRef.current = null;
      if (editorCarouselLocked) return;
      if (selectedSlot !== null || !start?.swipeAllowed) return;
      if (!e.isPrimary) return;
      const dx = e.clientX - start.x;
      const dy = e.clientY - start.y;
      if (Math.abs(dx) < CAROUSEL_SWIPE_MIN_PX) return;
      if (Math.abs(dx) < Math.abs(dy) * CAROUSEL_SWIPE_HORIZONTAL_RATIO) return;
      if (dx < 0) {
        navigateTo(currentVisualPage + 1);
      } else {
        navigateTo(currentVisualPage - 1);
      }
    },
    [currentVisualPage, editorCarouselLocked, navigateTo, selectedSlot],
  );

  const onCarouselPointerCancel = useCallback(() => {
    carouselSwipeStartRef.current = null;
  }, []);

  const handleGoToLastCommentPage = () => {
    if (!visitorMenuLoggedIn) {
      setGuestAuthModalOpen(true);
      return;
    }
    if (editorCarouselLocked && currentVisualPage === 0) {
      return;
    }
    navigateTo(totalVisualPages - 1);
  };

  const handleSlotClick = (slotId: number, commentPageIdx: number) => {
    void (async () => {
      const row = (commentCache[commentPageIdx] ?? [])[slotId - 1] ?? null;
      const hasComment = row != null && row.id != null;
      if (hasComment) {
        setPopupCommentPage(commentPageIdx);
        setSelectedSlot(slotId);
        setSelectedComment(row);
        setPopupMode("view");
        return;
      }
      let boardSlugResolved = myBoardSlug;
      if (boardSlugResolved === undefined && visitorMenuLoggedIn) {
        try {
          const ok = await isLoggedInOwnerOfBoardSlug(slug);
          const resolved = ok ? slug.trim() : null;
          boardSlugResolved = resolved;
          setMyBoardSlug(resolved);
        } catch {
          boardSlugResolved = null;
          setMyBoardSlug(null);
        }
      }

      const viewingOwnBoardResolved =
        boardSlugResolved != null && boardSlugResolved === slug.trim();
      if (viewingOwnBoardResolved) {
        setOwnBoardWriteNoticeOpen(true);
        return;
      }

      setPopupCommentPage(commentPageIdx);
      setSelectedSlot(slotId);
      setSelectedComment(null);
      setPopupMode("write");
    })();
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
      setCommentTotalPages(safeCommentSheetCountFromPayload(payload));
      return payload;
    } finally {
      setLoadingPages((prev) => {
        const next = new Set(prev);
        next.delete(commentPageIdx);
        return next;
      });
    }
  };

  const handleCreate = async (
    content: string,
    stickerKey: string,
    guest?: CommentCreateGuestFields,
  ) => {
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
    const created = await createComment(slug, {
      content,
      stickerKey,
      slotIndex: globalSlotIndex,
      ...(visitorMenuLoggedIn
        ? {}
        : {
            guestNickname: guest?.guestNickname ?? "",
            guestPassword: guest?.guestPassword ?? "",
          }),
    });
    if (!visitorMenuLoggedIn && created.data?.id != null) {
      rememberGuestWishComment(slug, created.data.id);
    }
    const payload = await refreshCommentPage(wroteOnPage);
    handleClosePopup();

    /** 현재 면에서 마지막 칸(전역 slotIndex % 6 === 5) + 마지막 API 페이지가 꽉 찬 경우에만 다음 면으로 이동 */
    if (!isCommentListLastPageFullByShape(payload) || globalSlotIndex % 6 !== 5) {
      return;
    }
    const sheetCount = safeCommentSheetCountFromPayload(payload);
    const nextVisualCap = 1 + sheetCount;
    const targetVisual = sheetCount;
    window.setTimeout(() => {
      navigateTo(targetVisual, nextVisualCap);
    }, 0);
  };

  const handleUpdate = async (
    commentId: number,
    content: string,
    guestMeta?: { verifyToken: string },
  ) => {
    const vt = guestMeta?.verifyToken?.trim();
    if (vt) {
      await updateComment(slug, commentId, { content, verifyToken: vt });
    } else {
      await updateComment(slug, commentId, { content });
    }
    if (popupCommentPage !== null) await refreshCommentPage(popupCommentPage);
    handleClosePopup();
  };

  const handleDelete = async (commentId: number, guestPassword?: string) => {
    if (guestPassword !== undefined) {
      const verifyToken = await verifyGuestCommentPassword(
        slug,
        commentId,
        guestPassword,
      );
      await deleteComment(slug, commentId, { verifyToken });
    } else {
      await deleteComment(slug, commentId);
    }
    if (popupCommentPage !== null) await refreshCommentPage(popupCommentPage);
    handleClosePopup();
  };

  const boardBackgroundUrl = useMemo(() => {
    if (embeddedBgDraftKey !== null) {
      if (embeddedBgDraftKey === "") {
        return null;
      }
      return getAssetImageUrl(embeddedBgDraftKey);
    }
    return resolveBoardBackgroundImageUrl(boardAssets);
  }, [embeddedBgDraftKey, boardAssets]);

  const boardBackgroundAssetKey = useMemo(() => {
    if (embeddedBgDraftKey !== null) {
      return embeddedBgDraftKey === "" ? "default" : embeddedBgDraftKey;
    }
    return resolveBoardBackgroundAssetKey(boardAssets);
  }, [embeddedBgDraftKey, boardAssets]);

  return (
    <main className={PUBLIC_BOARD_PAGE_MAIN_CLASS}>
      {selectedSlot !== null ? (
        <div className="fixed inset-0 z-20 bg-black/40" onClick={handleClosePopup} />
      ) : null}

      <div className={PUBLIC_BOARD_PAGE_Z10_CLASS}>
        <section className={`${PUBLIC_WISHLIST_BOARD_WRAP} mx-auto min-h-0 w-full`}>
          <div className={PUBLIC_BOARD_PAGE_COLUMN_CLASS}>
            {/** `app/wishlist/page.tsx` 꾸미기 보드 래퍼와 동일 패딩 */}
            {/** `app/wishlist/page.tsx` 꾸미기 보드 래퍼와 동일: 세로 가운데 + 가로 중앙 */}
            <div className={PUBLIC_BOARD_PAGE_CENTER_CLASS}>
              <div className={PUBLIC_WISHLIST_BOARD_FRAME} style={publicBoardAspectRatioStyle()}>
                {boardBackgroundUrl ? (
                  <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden rounded-[18px]">
                    {shouldUseNativeImg(boardBackgroundUrl) ? (
                      <img
                        key={boardBackgroundAssetKey || "default"}
                        src={boardBackgroundUrl}
                        alt=""
                        className="h-full w-full object-cover"
                        fetchPriority="high"
                      />
                    ) : (
                      <Image
                        key={boardBackgroundAssetKey || "default"}
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
                  className="absolute inset-0 z-10 select-none overflow-hidden rounded-[18px] [touch-action:pan-x_pan-y]"
                  onPointerDown={onCarouselPointerDown}
                  onPointerUp={onCarouselPointerUp}
                  onPointerCancel={onCarouselPointerCancel}
                >
                  <div
                    className="absolute inset-0 grid h-full min-h-0 transition-transform duration-300 ease-out"
                    style={{
                      width: `${totalVisualPages * 100}%`,
                      gridTemplateColumns: `repeat(${totalVisualPages}, minmax(0, 1fr))`,
                      transform: `translateX(-${(currentVisualPage * 100) / totalVisualPages}%)`,
                    }}
                  >
                    <div className="relative flex h-full min-h-0 min-w-0 flex-col items-stretch justify-center overflow-x-clip overflow-y-visible p-0">
                      {isViewingOwnBoard ? (
                        <WishlistMyBoardScreen
                          routeBoardSlug={slug}
                          embeddedInSlugCarousel
                          omitInnerTitleHeader
                          onCarouselInteractionLockChange={setEditorCarouselLocked}
                          embeddedCarouselVisualPage={currentVisualPage}
                          onEmbeddedBoardSynced={handleEmbeddedBoardSynced}
                          onEmbeddedBackgroundDraftKeyChange={
                            handleEmbeddedBackgroundDraftKeyChange
                          }
                          embeddedPrefetchedProfile={visitorProfile}
                          embeddedStickerFoldersFromParent={apiStickerFolders}
                        />
                      ) : (
                        <MainBoardPage
                          ownerName={ownerName}
                          boardAssets={boardAssets}
                          boardItems={boardItems}
                          isSidebarOpen={isSidebarOpen}
                          onMenuClick={handleVisitorMenuClick}
                          omitBackground
                        />
                      )}
                    </div>

                    {Array.from({ length: commentPagesSafe }, (_, commentIdx) => (
                      <div
                        key={commentIdx}
                        className="relative flex h-full min-h-0 min-w-0 flex-col items-stretch justify-center overflow-x-clip overflow-y-visible p-0"
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

                  {totalVisualPages > 1 &&
                  !(editorCarouselLocked && currentVisualPage === 0) ? (
                    <div className="pointer-events-none absolute inset-x-0 bottom-6 z-20 flex items-end justify-between px-[4%]">
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
                          disabled={
                            currentVisualPage >= totalVisualPages - 1 ||
                            (editorCarouselLocked && currentVisualPage === 0)
                          }
                          className="flex size-[42px] shrink-0 items-center justify-center rounded-full bg-white text-[#7B61FF] shadow-lg transition hover:bg-white/95 disabled:pointer-events-none disabled:opacity-30"
                          aria-label={
                            currentVisualPage === 0 ? "댓글 페이지로" : "다음 페이지"
                          }
                          title={currentVisualPage === 0 ? "댓글 면으로 이동" : undefined}
                        >
                          <CaretRightIcon size={23} weight="bold" />
                        </button>
                      </div>

                      {currentVisualPage > 0 &&
                      currentVisualPage < totalVisualPages - 1 ? (
                        <button
                          type="button"
                          onClick={handleGoToLastCommentPage}
                          className="pointer-events-auto flex max-w-[min(200px,calc(100vw-6rem))] shrink-0 items-center justify-center gap-2 rounded-full bg-[#7B61FF] px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:bg-[#6b52e0] active:scale-[0.98]"
                          aria-label="마지막 댓글 페이지로 이동"
                          title="댓글 면 중 가장 마지막으로 이동합니다"
                        >
                          <CaretRightIcon size={20} weight="bold" className="shrink-0 opacity-95" aria-hidden />
                          <span className="min-w-0 truncate">마지막 페이지로</span>
                        </button>
                      ) : null}
                    </div>
                  ) : null}
                </div>

                <PublicBoardProfileHeader
                  ownerName={ownerName}
                  isSidebarOpen={isSidebarOpen}
                  onMenuClick={handleVisitorMenuClick}
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
          hideMyWishlistShortcut={isViewingOwnBoard}
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
          boardSlug={slug}
          commentRevealAtMs={wishCommentRevealAtMs}
          commentAsLoggedInUser={visitorMenuLoggedIn}
          canModifyComment={canModifySelectedComment}
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
