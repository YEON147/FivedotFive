"use client";

import { CaretLeftIcon, CaretRightIcon } from "@phosphor-icons/react";
import Image from "next/image";
import { use, useCallback, useEffect, useRef, useState } from "react";

import { CommentPopup } from "@/components/wishlist/CommentPopup";
import {
  DESIGN_HEIGHT,
  DESIGN_WIDTH,
  GiftSlots,
  StickerSlots,
  STICKER_SIZE,
  stickerSlots,
  toXPercent,
  toYPercent,
  type GiftLayoutCount,
} from "@/components/wishlist/WishlistSlots";
import {
  createComment,
  deleteComment,
  getComments,
  getPublicBoard,
  updateComment,
} from "@/features/wishlist/api";
import type { BoardAssetData, CommentData, StickerOption, WishItemData } from "@/features/wishlist/types";

const STICKER_OPTIONS: StickerOption[] = [
  { id: "sticker1", label: "Sticker 1", src: "/sticker/sticker1.png" },
  { id: "sticker2", label: "Sticker 2", src: "/sticker/sticker2.png" },
  { id: "sticker3", label: "Sticker 3", src: "/sticker/sticker3.png" },
  { id: "sticker4", label: "Sticker 4", src: "/sticker/sticker4.png" },
  { id: "sticker5", label: "Sticker 5", src: "/sticker/sticker5.png" },
  { id: "sticker6", label: "Sticker 6", src: "/sticker/sticker6.png" },
];

type PopupMode = "view" | "write" | "edit";

/** 공통 보드 배경 + 선물 슬롯 레이아웃 */
function BoardBase({
  boardAssets,
  boardItems,
  children,
}: {
  boardAssets: BoardAssetData[];
  boardItems: WishItemData[];
  children?: React.ReactNode;
}) {
  const backgroundAsset = boardAssets.find((a) => a.assetType === "BACKGROUND");

  const giftCount = Math.max(
    1,
    Math.min(3, boardItems.filter((i) => i.itemName).length),
  ) as GiftLayoutCount;

  const giftImages = boardAssets
    .filter((a) => a.assetType === "GIFT_ICON" && a.slotIndex !== null)
    .reduce<Record<number, string>>((acc, a) => {
      if (a.slotIndex !== null) acc[a.slotIndex] = a.assetKey;
      return acc;
    }, {});

  return (
    <div className="relative h-full w-full overflow-hidden rounded-sm bg-[#efefef]">
      {backgroundAsset && (
        <Image
          src={backgroundAsset.assetKey}
          alt="board background"
          fill
          unoptimized
          sizes="390px"
          className="object-cover"
          priority
        />
      )}

      <header className="relative flex items-center pl-[8%] pt-[8%]">
        <h1 className="text-wish-title">WishList</h1>
      </header>

      <GiftSlots count={giftCount} images={giftImages} showPlaceholder={true} />

      {children}

      <footer className="absolute bottom-0 left-0 flex h-[6%] min-h-10 w-full items-center bg-[#d2d2d2] px-6">
        <span className="text-body-sm">Ad Banner</span>
      </footer>
    </div>
  );
}

/** 페이지 0: 주인의 위시리스트 원본 */
function MainBoardPage({
  boardAssets,
  boardItems,
}: {
  boardAssets: BoardAssetData[];
  boardItems: WishItemData[];
}) {
  const stickerImages = boardAssets
    .filter((a) => a.assetType === "STICKER" && a.slotIndex !== null)
    .reduce<Record<number, string>>((acc, a) => {
      if (a.slotIndex !== null) acc[a.slotIndex] = a.assetKey;
      return acc;
    }, {});

  return (
    <BoardBase boardAssets={boardAssets} boardItems={boardItems}>
      {/* 주인이 설정한 스티커 장식 (클릭 불가) */}
      <StickerSlots images={stickerImages} showPlaceholder={false} />
    </BoardBase>
  );
}

/** 페이지 1+: 댓글 슬롯 */
function CommentBoardPage({
  boardAssets,
  boardItems,
  comments,
  isLoading,
  onSlotClick,
}: {
  boardAssets: BoardAssetData[];
  boardItems: WishItemData[];
  comments: CommentData[];
  isLoading: boolean;
  onSlotClick: (slotId: number) => void;
}) {
  return (
    <BoardBase boardAssets={boardAssets} boardItems={boardItems}>
      {stickerSlots.map((slot, index) => {
        const comment = comments[index] ?? null;
        const imageSrc = comment?.stickerKey ?? null;

        return (
          <button
            key={slot.id}
            type="button"
            onClick={() => onSlotClick(slot.id)}
            className="absolute aspect-square overflow-hidden rounded-full border border-white/70 bg-[#d9d9d9] shadow-sm transition-transform hover:scale-[1.03] active:scale-95"
            style={{
              top: toYPercent(slot.top),
              left: toXPercent(slot.left),
              width: toXPercent(STICKER_SIZE),
              transform: "translate(-50%, -50%)",
            }}
            aria-label={comment ? `${comment.senderName}의 댓글 보기` : `슬롯 ${slot.id}에 댓글 남기기`}
          >
            {imageSrc ? (
              <Image
                src={imageSrc}
                alt={comment?.senderName ?? "comment"}
                fill
                unoptimized
                sizes={`${STICKER_SIZE}px`}
                className="object-cover"
              />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-[11px] font-semibold text-slate-400">
                {isLoading ? "·" : "+"}
              </span>
            )}
          </button>
        );
      })}
    </BoardBase>
  );
}

export default function PublicWishlistPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);

  const [boardItems, setBoardItems] = useState<WishItemData[]>([]);
  const [boardAssets, setBoardAssets] = useState<BoardAssetData[]>([]);

  // 댓글 페이지 캐시: 댓글 페이지 인덱스(0-based) → 댓글 목록
  const [commentCache, setCommentCache] = useState<Record<number, CommentData[]>>({});
  const [loadingPages, setLoadingPages] = useState<Set<number>>(new Set());
  // 댓글 페이지 수 (최소 1 — 빈 상태도 댓글 쓸 수 있는 1페이지 존재)
  const [commentTotalPages, setCommentTotalPages] = useState(1);

  // 현재 보이는 슬라이드 인덱스
  // 0 = 주인 위시리스트 / 1+ = 댓글 페이지 (댓글 인덱스 = currentVisualPage - 1)
  const [currentVisualPage, setCurrentVisualPage] = useState(0);

  const totalVisualPages = 1 + commentTotalPages;

  // 팝업
  const [popupCommentPage, setPopupCommentPage] = useState<number | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [popupMode, setPopupMode] = useState<PopupMode>("view");
  const [selectedComment, setSelectedComment] = useState<CommentData | null>(null);

  const isSliding = useRef(false);

  const fetchCommentPage = useCallback(
    async (commentPageIdx: number) => {
      if (commentCache[commentPageIdx] !== undefined || loadingPages.has(commentPageIdx)) return;

      setLoadingPages((prev) => new Set(prev).add(commentPageIdx));
      try {
        const data = await getComments(slug, commentPageIdx);
        setCommentCache((prev) => ({ ...prev, [commentPageIdx]: data.data.comments }));
        // totalPages=0 이면 빈 첫 페이지도 존재하므로 최소 1
        setCommentTotalPages(Math.max(1, data.data.totalPages || 1));
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

  // 보드 데이터 초기 로드
  useEffect(() => {
    getPublicBoard(slug)
      .then((data) => {
        setBoardItems(data.data.items);
        setBoardAssets(data.data.assets);
      })
      .catch(() => {});

    // 첫 번째 댓글 페이지도 미리 로드
    fetchCommentPage(0);
  }, [slug]); // eslint-disable-line react-hooks/exhaustive-deps

  // 현재 시각적 페이지가 변경될 때 해당 댓글 페이지 + 인접 페이지 로드
  useEffect(() => {
    if (currentVisualPage === 0) return;
    const commentIdx = currentVisualPage - 1;
    fetchCommentPage(commentIdx);
    if (commentIdx > 0) fetchCommentPage(commentIdx - 1);
    if (commentIdx < commentTotalPages - 1) fetchCommentPage(commentIdx + 1);
  }, [currentVisualPage, commentTotalPages]); // eslint-disable-line react-hooks/exhaustive-deps

  const navigateTo = (visualPage: number) => {
    if (visualPage < 0 || visualPage >= totalVisualPages || isSliding.current) return;
    isSliding.current = true;
    setCurrentVisualPage(visualPage);
    setTimeout(() => { isSliding.current = false; }, 350);
  };

  // 댓글 작성하러 가기 → 마지막 댓글 페이지 (visual index = totalVisualPages - 1)
  const handleGoToLastCommentPage = () => navigateTo(totalVisualPages - 1);

  const handleSlotClick = (slotId: number, commentPageIdx: number) => {
    const comment = (commentCache[commentPageIdx] ?? [])[slotId - 1] ?? null;
    setPopupCommentPage(commentPageIdx);
    setSelectedSlot(slotId);
    setSelectedComment(comment);
    setPopupMode(comment ? "view" : "write");
  };

  const handleClosePopup = () => {
    setPopupCommentPage(null);
    setSelectedSlot(null);
    setSelectedComment(null);
  };

  const refreshCommentPage = async (commentPageIdx: number) => {
    setLoadingPages((prev) => new Set(prev).add(commentPageIdx));
    try {
      const data = await getComments(slug, commentPageIdx);
      setCommentCache((prev) => ({ ...prev, [commentPageIdx]: data.data.comments }));
      setCommentTotalPages(Math.max(1, data.data.totalPages || 1));
    } finally {
      setLoadingPages((prev) => {
        const next = new Set(prev);
        next.delete(commentPageIdx);
        return next;
      });
    }
  };

  const handleCreate = async (content: string, stickerKey: string) => {
    await createComment(slug, content, stickerKey);
    if (popupCommentPage !== null) await refreshCommentPage(popupCommentPage);
    handleClosePopup();
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

  return (
    <main className="wishlist-page-root app-shell-viewport-floor flex flex-col bg-[var(--color-bg-base)] px-4 pb-[env(safe-area-inset-bottom,0px)] pt-[env(safe-area-inset-top,0px)] sm:px-5">
      {/* 팝업 백드롭 */}
      {selectedSlot !== null && (
        <div className="fixed inset-0 z-20 bg-black/40" onClick={handleClosePopup} />
      )}

      <div className="relative flex min-h-0 w-full flex-1 flex-col items-center justify-center gap-3 px-1 py-1">
        {/* ── 슬라이딩 보드 ── */}
        <div
          className="relative w-full max-w-[372px] overflow-hidden rounded-[14px] shadow-[0_8px_40px_rgba(0,0,0,0.08)]"
          style={{
            aspectRatio: `${DESIGN_WIDTH} / ${DESIGN_HEIGHT}`,
            maxHeight:
              "calc(100svh - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px) - 2rem)",
          }}
        >
          <div
            className="flex h-full transition-transform duration-300 ease-out"
            style={{
              width: `${totalVisualPages * 100}%`,
              transform: `translateX(calc(-${currentVisualPage} * (100% / ${totalVisualPages})))`,
            }}
          >
            {/* 페이지 0: 주인 위시리스트 */}
            <div className="relative h-full" style={{ width: `${100 / totalVisualPages}%` }}>
              <MainBoardPage boardAssets={boardAssets} boardItems={boardItems} />
            </div>

            {/* 페이지 1+: 댓글 페이지 */}
            {Array.from({ length: commentTotalPages }, (_, commentIdx) => (
              <div
                key={commentIdx}
                className="relative h-full"
                style={{ width: `${100 / totalVisualPages}%` }}
              >
                <CommentBoardPage
                  boardAssets={boardAssets}
                  boardItems={boardItems}
                  comments={commentCache[commentIdx] ?? []}
                  isLoading={loadingPages.has(commentIdx)}
                  onSlotClick={(slotId) => handleSlotClick(slotId, commentIdx)}
                />
              </div>
            ))}
          </div>
        </div>

        {/* ── 하단 컨트롤 ── */}
        <div className="flex w-full max-w-[390px] items-center justify-between px-1">
          {/* 이전 / 페이지 표시 / 다음 */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigateTo(currentVisualPage - 1)}
              disabled={currentVisualPage === 0}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-sm disabled:opacity-30"
              aria-label="이전 페이지"
            >
              <CaretLeftIcon size={16} weight="bold" className="text-slate-600" />
            </button>
            <span className="min-w-[40px] text-center text-xs font-semibold text-slate-600">
              {currentVisualPage + 1} / {totalVisualPages}
            </span>
            <button
              type="button"
              onClick={() => navigateTo(currentVisualPage + 1)}
              disabled={currentVisualPage === totalVisualPages - 1}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-sm disabled:opacity-30"
              aria-label="다음 페이지"
            >
              <CaretRightIcon size={16} weight="bold" className="text-slate-600" />
            </button>
          </div>

          {/* 댓글 작성하러 가기 — 주인 페이지(0)에서만 보임 */}
          {currentVisualPage === 0 && (
            <button
              type="button"
              onClick={handleGoToLastCommentPage}
              className="rounded-full bg-[#7B61FF] px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-[#6b52e0]"
            >
              댓글 작성하러 가기
            </button>
          )}
        </div>
      </div>

      {/* 댓글 팝업 */}
      {selectedSlot !== null && (
        <CommentPopup
          mode={popupMode}
          comment={selectedComment}
          stickerOptions={STICKER_OPTIONS}
          onClose={handleClosePopup}
          onModeChange={setPopupMode}
          onCreate={handleCreate}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
        />
      )}
    </main>
  );
}
