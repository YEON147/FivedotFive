"use client";

import { CaretLeftIcon, CaretRightIcon, ChatCircleDots } from "@phosphor-icons/react";
import Image from "next/image";
import { use, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

import { CommentPopup } from "@/components/wishlist/CommentPopup";
import {
  DESIGN_HEIGHT,
  DESIGN_WIDTH,
  GiftSlots,
  StickerSlots,
  STICKER_SIZE,
  getStickerSlotCssTransform,
  stickerSlots,
  toXPercent,
  toYPercent,
} from "@/components/wishlist/WishlistSlots";
import {
  createComment,
  deleteComment,
  getComments,
  getPublicBoard,
  updateComment,
} from "@/features/wishlist/api";
import { deriveWishSlotState } from "@/features/wishlist/wish-slot-state";
import type { BoardAssetData, CommentData, StickerOption, WishItemData } from "@/features/wishlist/types";
import { getAssetImageUrl } from "@/lib/asset-url";

const STICKER_OPTIONS: StickerOption[] = [
  { id: "sticker1", label: "Sticker 1", src: "/sticker/sticker1.png" },
  { id: "sticker2", label: "Sticker 2", src: "/sticker/sticker2.png" },
  { id: "sticker3", label: "Sticker 3", src: "/sticker/sticker3.png" },
  { id: "sticker4", label: "Sticker 4", src: "/sticker/sticker4.png" },
  { id: "sticker5", label: "Sticker 5", src: "/sticker/sticker5.png" },
  { id: "sticker6", label: "Sticker 6", src: "/sticker/sticker6.png" },
];

type PopupMode = "view" | "write" | "edit";

/**
 * `app/wishlist/page.tsx` 꾸미기·보드 영역과 동일 (`WISHLIST_BOARD_PAGE_WRAP`) — 흰 카드 셸 없음.
 */
const PUBLIC_WISHLIST_BOARD_WRAP =
  "relative flex h-full min-h-0 max-h-full w-full max-w-[372px] flex-1 flex-col overflow-hidden bg-transparent";

/**
 * 공개 보드 바깥 프레임 — `app/wishlist/page.tsx` 꾸미기 보드 프레임과 동일.
 * 배경 에셋이 없을 때도 오로라 그라데이션(`wishlist-board-frame--decorate`)이 깔림.
 */
const PUBLIC_BOARD_FRAME_OUTER =
  "relative isolate mx-auto w-full max-w-[372px] max-h-[min(680px,100%)] shrink-0 overflow-hidden rounded-[18px] shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] ring-1 ring-violet-200/55 wishlist-board-frame--decorate";

/** 배경 이미지는 위 레이어 — 없을 때는 바깥 프레임 오로라만 보임 */
const PUBLIC_BOARD_INNER =
  "relative h-full w-full min-h-0 min-w-0 overflow-hidden bg-transparent";

const PUBLIC_PROFILE_HEADER_ROW =
  "relative z-40 flex items-center gap-2.5 pl-[7%] pr-[4%] pt-[7%]";

const PUBLIC_WISHLIST_APP_FOOTER =
  "flex min-h-10 w-full shrink-0 items-center justify-center border-t border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-2.5 text-xs text-[var(--color-text-secondary)]";

function PublicBoardProfileHeader({ ownerName }: { ownerName: string }) {
  const displayName = ownerName.trim() || "회원";

  return (
    <header className={PUBLIC_PROFILE_HEADER_ROW}>
      <h1 className="min-w-0 flex-1 text-left text-wish-title leading-tight text-slate-900">
        <span className="block">
          <span className="inline-flex items-baseline gap-0.5">
            <span className="font-bold text-[#7B61FF]">{displayName}</span>
            <span className="text-[18px] font-light leading-none text-slate-900">님의</span>
          </span>
        </span>
        <span className="mt-1 block text-[18px] font-light leading-snug text-slate-900">
          위시리스트
        </span>
      </h1>
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
  children,
}: {
  ownerName: string;
  boardAssets: BoardAssetData[];
  boardItems: WishItemData[];
  children?: ReactNode;
}) {
  const backgroundUrl = useMemo(() => {
    const bg = boardAssets.find((a) => a.assetType === "BACKGROUND");
    return bg ? getAssetImageUrl(bg.assetKey) : null;
  }, [boardAssets]);

  const { bigCircleCount, wishGiftIconKeys } = useMemo(
    () => deriveWishSlotState(boardItems),
    [boardItems],
  );

  const giftImages = useMemo(() => {
    const out: Partial<Record<number, string>> = {};
    for (let i = 0; i < bigCircleCount; i++) {
      const key = wishGiftIconKeys[i]?.trim();
      if (key) {
        out[i + 1] = getAssetImageUrl(key);
      }
    }
    return out;
  }, [bigCircleCount, wishGiftIconKeys]);

  return (
    <div className={PUBLIC_BOARD_INNER}>
      {backgroundUrl ? (
        <img
          src={backgroundUrl}
          alt=""
          className="pointer-events-none absolute inset-0 z-0 h-full w-full object-cover"
        />
      ) : null}

      <PublicBoardProfileHeader ownerName={ownerName} />

      <GiftSlots count={bigCircleCount} images={giftImages} showPlaceholder />

      {children}
    </div>
  );
}

/** 페이지 0: 주인의 위시리스트 — 스티커 장식 표시 */
function MainBoardPage({
  ownerName,
  boardAssets,
  boardItems,
}: {
  ownerName: string;
  boardAssets: BoardAssetData[];
  boardItems: WishItemData[];
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
    <BoardFrame ownerName={ownerName} boardAssets={boardAssets} boardItems={boardItems}>
      <StickerSlots images={stickerImages} showPlaceholder={false} />
    </BoardFrame>
  );
}

/** 페이지 1+: 댓글 슬롯 */
function CommentBoardPage({
  ownerName,
  boardAssets,
  boardItems,
  comments,
  isLoading,
  onSlotClick,
}: {
  ownerName: string;
  boardAssets: BoardAssetData[];
  boardItems: WishItemData[];
  comments: CommentData[];
  isLoading: boolean;
  onSlotClick: (slotId: number) => void;
}) {
  return (
    <BoardFrame ownerName={ownerName} boardAssets={boardAssets} boardItems={boardItems}>
      {stickerSlots.map((slot, index) => {
        const comment = comments[index] ?? null;
        const rawKey = comment?.stickerKey?.trim();
        const imageSrc = rawKey ? getAssetImageUrl(rawKey) : null;

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
              transform: getStickerSlotCssTransform(slot.id),
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
    </BoardFrame>
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
  const [ownerName, setOwnerName] = useState("");

  const [commentCache, setCommentCache] = useState<Record<number, CommentData[]>>({});
  const [loadingPages, setLoadingPages] = useState<Set<number>>(new Set());
  const [commentTotalPages, setCommentTotalPages] = useState(1);

  const [currentVisualPage, setCurrentVisualPage] = useState(0);

  const totalVisualPages = 1 + commentTotalPages;

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

  useEffect(() => {
    getPublicBoard(slug)
      .then((data) => {
        setBoardItems(data.data.items);
        setBoardAssets(data.data.assets);
        setOwnerName(data.data.username ?? "");
      })
      .catch(() => {});

    fetchCommentPage(0);
  }, [slug]); // eslint-disable-line react-hooks/exhaustive-deps

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
    setTimeout(() => {
      isSliding.current = false;
    }, 350);
  };

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
    <main className="wishlist-page-root app-shell-viewport-floor flex flex-col px-3 pb-[env(safe-area-inset-bottom,0px)] pt-[env(safe-area-inset-top,0px)] sm:px-4">
      {selectedSlot !== null ? (
        <div className="fixed inset-0 z-20 bg-black/40" onClick={handleClosePopup} />
      ) : null}

      <div className="relative z-10 flex min-h-0 w-full flex-1 flex-col items-center justify-start">
        <section className={`${PUBLIC_WISHLIST_BOARD_WRAP} mx-auto w-full`}>
          <div className="relative flex min-h-0 flex-1 flex-col p-0">
            <div className="relative flex min-h-0 flex-1 w-full min-w-0 items-center justify-center">
              <div
                className={PUBLIC_BOARD_FRAME_OUTER}
                style={{
                  aspectRatio: `${DESIGN_WIDTH} / ${DESIGN_HEIGHT}`,
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
                    className="relative h-full min-h-0 p-0"
                    style={{ width: `${100 / totalVisualPages}%` }}
                  >
                    <MainBoardPage
                      ownerName={ownerName}
                      boardAssets={boardAssets}
                      boardItems={boardItems}
                    />
                  </div>

                  {Array.from({ length: commentTotalPages }, (_, commentIdx) => (
                    <div
                      key={commentIdx}
                      className="relative h-full min-h-0 p-0"
                      style={{ width: `${100 / totalVisualPages}%` }}
                    >
                      <CommentBoardPage
                        ownerName={ownerName}
                        boardAssets={boardAssets}
                        boardItems={boardItems}
                        comments={commentCache[commentIdx] ?? []}
                        isLoading={loadingPages.has(commentIdx)}
                        onSlotClick={(slotId) => handleSlotClick(slotId, commentIdx)}
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

            <footer className={PUBLIC_WISHLIST_APP_FOOTER}>광고 중...</footer>
          </div>
        </section>
      </div>

      {selectedSlot !== null ? (
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
      ) : null}
    </main>
  );
}
