"use client";

import { X } from "@phosphor-icons/react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

import {
  StickerGridSkeleton,
  StickerSheetFixedViewport,
} from "@/components/wishlist/asset-picker-skeletons";
import { CommentRevealCountdown } from "@/components/wishlist/CommentRevealCountdown";
import { WishlistCenterDialog } from "@/components/wishlist/WishlistCenterDialog";
import {
  getCommentDisplaySenderName,
  isMaskedOthersWishComment,
  isSoftDeletedWishComment,
} from "@/features/wishlist/comment-display";
import type { CommentData, StickerOption } from "@/features/wishlist/types";
import { getAssetImageUrl } from "@/lib/asset-url";
import { useMouseDragHorizontalScroll } from "@/hooks/use-mouse-drag-horizontal-scroll";
import { shouldUseNativeImg } from "@/lib/native-img";

type PopupMode = "view" | "write" | "edit";

export type CommentStickerTab = { id: string; label: string };

const RATE_LIMIT_KEY = "comment_last_submit";
const COOLDOWN_MS = 10_000;

function getRemainingCooldown(): number {
  if (typeof window === "undefined") return 0;
  const last = Number(localStorage.getItem(RATE_LIMIT_KEY) ?? 0);
  const remaining = COOLDOWN_MS - (Date.now() - last);
  return remaining > 0 ? remaining : 0;
}

function setLastSubmitNow() {
  localStorage.setItem(RATE_LIMIT_KEY, String(Date.now()));
}

type CommentPopupProps = {
  mode: PopupMode;
  comment: CommentData | null;
  stickerOptions: StickerOption[];
  /** 폴더 탭(전체 + API 폴더). 없으면 탭 UI 생략 */
  stickerTabs?: CommentStickerTab[];
  stickerFolderId?: string;
  onStickerFolderChange?: (folderId: string) => void;
  stickersLoading?: boolean;
  stickersError?: string | null;
  isSubmitting?: boolean;
  onClose: () => void;
  onModeChange: (mode: PopupMode) => void;
  onCreate: (content: string, stickerKey: string) => Promise<void>;
  onUpdate: (commentId: number, content: string) => Promise<void>;
  onDelete: (commentId: number) => Promise<void>;
};

export function CommentPopup({
  mode,
  comment,
  stickerOptions,
  stickerTabs,
  stickerFolderId = "all",
  onStickerFolderChange,
  stickersLoading = false,
  stickersError = null,
  isSubmitting = false,
  onClose,
  onModeChange,
  onCreate,
  onUpdate,
  onDelete,
}: CommentPopupProps) {
  const [content, setContent] = useState(mode === "edit" ? (comment?.content ?? "") : "");
  const [selectedSticker, setSelectedSticker] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  // 10초 쿨다운 카운트다운
  const [cooldown, setCooldown] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const commentStickerTabStripScroll = useMouseDragHorizontalScroll();

  useEffect(() => {
    if (mode !== "write") {
      commentStickerTabStripScroll.detach();
    }
    return () => {
      commentStickerTabStripScroll.detach();
    };
  }, [mode, commentStickerTabStripScroll]);

  useEffect(() => {
    if (mode === "edit" && comment) {
      setContent(comment.content ?? "");
    }
  }, [mode, comment?.id, comment?.content]);

  useEffect(() => {
    if (!comment || mode !== "view") {
      setDeleteConfirmOpen(false);
    }
  }, [comment, mode]);

  useEffect(() => {
    if (mode !== "write") return;
    setSelectedSticker((prev) => {
      if (!prev) return null;
      return stickerOptions.some((o) => o.assetKey === prev) ? prev : null;
    });
  }, [mode, stickerOptions, stickerFolderId]);

  useEffect(() => {
    if (mode !== "write") return;

    const startCooldown = () => {
      const remaining = getRemainingCooldown();
      if (remaining <= 0) {
        setCooldown(0);
        return;
      }
      setCooldown(Math.ceil(remaining / 1000));
      timerRef.current = setInterval(() => {
        const r = getRemainingCooldown();
        if (r <= 0) {
          setCooldown(0);
          if (timerRef.current) clearInterval(timerRef.current);
        } else {
          setCooldown(Math.ceil(r / 1000));
        }
      }, 500);
    };

    startCooldown();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [mode]);

  const handleCreate = async () => {
    if (cooldown > 0) {
      setError(`댓글은 10초에 한 번만 작성할 수 있습니다. (${cooldown}초 후 가능)`);
      return;
    }
    if (!content.trim()) {
      setError("댓글 내용을 입력해주세요.");
      return;
    }
    if (!selectedSticker) {
      setError("스티커를 선택해주세요.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await onCreate(content.trim(), selectedSticker);
      setLastSubmitNow();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "댓글 작성에 실패했습니다.";
      // 429 메시지 정규화
      setError(msg.includes("10초") ? "댓글은 10초에 한 번만 작성할 수 있습니다." : msg);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!comment) return;
    if (isSoftDeletedWishComment(comment)) {
      setError("삭제된 댓글은 수정할 수 없습니다.");
      return;
    }
    if (!content.trim()) {
      setError("댓글 내용을 입력해주세요.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await onUpdate(comment.id, content.trim());
    } catch (e) {
      setError(e instanceof Error ? e.message : "댓글 수정에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!comment) return;
    setError(null);
    setLoading(true);
    try {
      await onDelete(comment.id);
      setDeleteConfirmOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "댓글 삭제에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = () => {
    setContent(comment?.content ?? "");
    setError(null);
    onModeChange("edit");
  };

  const isDisabled = loading || isSubmitting;
  const isWriteBlocked = mode === "write" && cooldown > 0;

  const closeDeleteDialog = () => {
    if (loading) return;
    setError(null);
    setDeleteConfirmOpen(false);
  };

  return (
    <>
    <div className="fixed left-1/2 top-1/2 z-30 w-[min(340px,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-3xl bg-white px-5 py-6 shadow-[0_24px_60px_rgba(0,0,0,0.22)]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2
          className={`text-base font-bold ${
            mode === "view" && comment && isSoftDeletedWishComment(comment)
              ? "text-slate-600"
              : "text-slate-900"
          }`}
        >
          {mode === "view"
            ? (comment ? getCommentDisplaySenderName(comment) : "댓글")
            : mode === "edit"
              ? "댓글 수정"
              : "댓글 쓰기"}
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex size-9 shrink-0 items-center justify-center rounded-full text-slate-800 transition hover:opacity-70 active:opacity-50"
          aria-label="닫기"
        >
          <X size={20} weight="bold" aria-hidden />
        </button>
      </div>

      {/* View mode */}
      {mode === "view" && comment && (
        <div className="mt-4 space-y-3">
          {comment.stickerKey?.trim() ? (
            <div className="flex justify-center">
              <div className="relative h-16 w-16 overflow-hidden rounded-full border-0 bg-transparent shadow-none">
                {shouldUseNativeImg(getAssetImageUrl(comment.stickerKey.trim())) ? (
                  <img
                    src={getAssetImageUrl(comment.stickerKey.trim())}
                    alt=""
                    className="absolute inset-0 h-full w-full object-contain object-center p-0.5"
                  />
                ) : (
                  <Image
                    src={getAssetImageUrl(comment.stickerKey.trim())}
                    alt=""
                    fill
                    sizes="64px"
                    className="object-contain object-center p-0.5"
                  />
                )}
              </div>
            </div>
          ) : isMaskedOthersWishComment(comment) ? (
            <div className="flex justify-center" aria-hidden>
              <div className="flex h-16 w-16 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-lg font-bold text-slate-400">
                ?
              </div>
            </div>
          ) : null}
          {isMaskedOthersWishComment(comment) ? (
            <div className="rounded-2xl border border-violet-100 bg-violet-50/90 px-4 py-3 text-center">
              <p className="text-xs font-semibold text-violet-900">
                댓글 전체 공개까지
              </p>
              <p
                className="mt-1 text-lg font-bold leading-snug tracking-tight text-violet-700"
                aria-live="polite"
                aria-atomic="true"
              >
                <CommentRevealCountdown />
              </p>
              <p className="mt-1.5 text-[11px] leading-snug text-violet-700/85">
                공개 후 작성자 닉네임·내용·선물 아이콘이 표시됩니다.
              </p>
            </div>
          ) : null}
          {isSoftDeletedWishComment(comment) ? (
            <p className="rounded-2xl bg-slate-100 px-4 py-3 text-sm italic leading-relaxed text-slate-500">
              {comment.content}
            </p>
          ) : comment.content != null ? (
            <p className="rounded-2xl bg-slate-50 px-4 py-3 text-sm leading-relaxed text-slate-800">
              {comment.content}
            </p>
          ) : null}
          {comment.isUser && (
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={handleEditClick}
                disabled={isDisabled}
                className="flex-1 rounded-2xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-40"
              >
                수정
              </button>
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setDeleteConfirmOpen(true);
                }}
                disabled={isDisabled}
                className="flex-1 rounded-2xl bg-red-50 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-100 disabled:opacity-40"
              >
                삭제
              </button>
            </div>
          )}
        </div>
      )}

      {/* Write mode */}
      {mode === "write" && (
        <div className="mt-4 space-y-4">
          {/* 쿨다운 배너 */}
          {isWriteBlocked && (
            <div className="rounded-2xl bg-amber-50 px-4 py-3 text-center">
              <p className="text-sm font-semibold text-amber-700">
                {cooldown}초 후 작성 가능합니다
              </p>
              <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-amber-200">
                <div
                  className="h-full rounded-full bg-amber-400 transition-all duration-500"
                  style={{ width: `${(cooldown / 10) * 100}%` }}
                />
              </div>
            </div>
          )}

          <div>
            <p className="mb-2 text-xs font-semibold text-slate-500">스티커 선택 *</p>
            {stickerTabs && stickerTabs.length > 0 && onStickerFolderChange ? (
              <div
                ref={commentStickerTabStripScroll.stripRef}
                role="tablist"
                aria-label="스티커 카테고리"
                className="scrollbar-x-none mb-2 flex cursor-grab gap-1 overflow-x-auto overflow-y-hidden overscroll-x-contain border-b border-slate-100 pb-2 pt-0.5 select-none active:cursor-grabbing touch-pan-x"
                onPointerDown={commentStickerTabStripScroll.onPointerDown}
              >
                {stickerTabs.map((tab) => {
                  const active = stickerFolderId === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      onClick={(clickEvent) => {
                        if (commentStickerTabStripScroll.mouseDragRef.current.dragged) {
                          clickEvent.preventDefault();
                          clickEvent.stopPropagation();
                          return;
                        }
                        onStickerFolderChange(tab.id);
                      }}
                      disabled={isWriteBlocked || stickersLoading}
                      className={`shrink-0 cursor-pointer rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                        active
                          ? "bg-[#7B61FF] text-white"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      } disabled:opacity-40`}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            ) : null}
            {/** 조상만 container-type — 로딩/본문 동일 `scrollable` 래퍼로 틀 고정 */}
            <div className="min-h-0 w-full [container-type:inline-size]">
              {stickersError ? (
                <StickerSheetFixedViewport className="flex items-center justify-center px-1">
                  <p className="text-center text-xs text-red-500">{stickersError}</p>
                </StickerSheetFixedViewport>
              ) : (
                <StickerSheetFixedViewport scrollable className="pr-0.5">
                  {stickersLoading ? (
                    <StickerGridSkeleton />
                  ) : stickerOptions.length === 0 ? (
                    <div className="flex h-full min-h-0 flex-col items-center justify-center px-1">
                      <p className="text-center text-xs text-slate-500">
                        선택할 스티커가 없습니다.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-6 gap-1">
                      {stickerOptions.map((option) => {
                        const thumb = getAssetImageUrl(option.assetKey);
                        const selected = selectedSticker === option.assetKey;
                        return (
                          <button
                            key={option.id}
                            type="button"
                            onClick={() => setSelectedSticker(option.assetKey)}
                            disabled={isWriteBlocked}
                            className={`relative aspect-square overflow-hidden rounded-md border transition enabled:active:scale-[0.98] ${
                              selected
                                ? "border-[#7B61FF] bg-slate-50 shadow-[0_0_0_2px_rgba(123,97,255,0.2)]"
                                : "border-slate-200 bg-slate-50 enabled:hover:border-[#7B61FF]/50"
                            } disabled:opacity-40`}
                            aria-label={option.label}
                          >
                            {shouldUseNativeImg(thumb) ? (
                              <img
                                src={thumb}
                                alt={option.label}
                                className="absolute inset-0 h-full w-full object-contain object-center p-0.5"
                              />
                            ) : (
                              <Image
                                src={thumb}
                                alt={option.label}
                                fill
                                sizes="(max-width: 340px) 14vw, 48px"
                                className="object-contain object-center p-0.5"
                              />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </StickerSheetFixedViewport>
              )}
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold text-slate-500">댓글 *</p>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              maxLength={200}
              rows={4}
              disabled={isWriteBlocked}
              placeholder="따뜻한 메시지를 남겨보세요 (최대 200자)"
              className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#7B61FF] focus:bg-white disabled:opacity-40"
            />
            <p className="mt-1 text-right text-xs text-slate-400">{content.length} / 200</p>
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}

          <button
            type="button"
            onClick={handleCreate}
            disabled={isDisabled || isWriteBlocked}
            className="w-full rounded-2xl bg-[#7B61FF] py-3 text-sm font-semibold text-white transition hover:bg-[#6b52e0] disabled:opacity-40"
          >
            {loading ? "작성 중..." : isWriteBlocked ? `${cooldown}초 후 작성 가능` : "작성하기"}
          </button>
        </div>
      )}

      {/* Edit mode */}
      {mode === "edit" && (
        <div className="mt-4 space-y-4">
          {comment?.stickerKey?.trim() ? (
            <div className="flex justify-center">
              <div className="relative h-16 w-16 overflow-hidden rounded-full border border-slate-100 bg-slate-50">
                {shouldUseNativeImg(getAssetImageUrl(comment.stickerKey.trim())) ? (
                  <img
                    src={getAssetImageUrl(comment.stickerKey.trim())}
                    alt=""
                    className="absolute inset-0 h-full w-full object-contain object-center p-0.5"
                  />
                ) : (
                  <Image
                    src={getAssetImageUrl(comment.stickerKey.trim())}
                    alt=""
                    fill
                    sizes="64px"
                    className="object-contain object-center p-0.5"
                  />
                )}
              </div>
            </div>
          ) : null}
          <div>
            <p className="mb-2 text-xs font-semibold text-slate-500">내용만 수정할 수 있어요</p>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              maxLength={200}
              rows={4}
              className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#7B61FF] focus:bg-white"
            />
            <p className="mt-1 text-right text-xs text-slate-400">{content.length} / 200</p>
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => { setError(null); onModeChange("view"); }}
              disabled={isDisabled}
              className="flex-1 rounded-2xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-40"
            >
              취소
            </button>
            <button
              type="button"
              onClick={handleUpdate}
              disabled={isDisabled}
              className="flex-1 rounded-2xl bg-[#7B61FF] py-2.5 text-sm font-semibold text-white transition hover:bg-[#6b52e0] disabled:opacity-40"
            >
              {loading ? "저장 중..." : "저장"}
            </button>
          </div>
        </div>
      )}
    </div>

    <WishlistCenterDialog
      variant="static"
      open={deleteConfirmOpen}
      onClose={closeDeleteDialog}
      title="댓글을 삭제할까요?"
      titleId="comment-delete-confirm-title"
      description={
        <span className="block leading-relaxed">
          닉네임과 내용은 가려진 상태로 남고, 스티커는 이 칸에 그대로 보입니다.
        </span>
      }
    >
      <div className="mt-5 flex flex-col gap-3">
        {error ? <p className="text-center text-xs text-red-500">{error}</p> : null}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={closeDeleteDialog}
            disabled={loading}
            className="rounded-[14px] border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-40"
          >
            취소
          </button>
          <button
            type="button"
            onClick={() => void handleDeleteConfirm()}
            disabled={loading}
            className="rounded-[14px] bg-red-500 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-red-600 disabled:opacity-40"
          >
            {loading ? "삭제 중…" : "삭제하기"}
          </button>
        </div>
      </div>
    </WishlistCenterDialog>
    </>
  );
}
