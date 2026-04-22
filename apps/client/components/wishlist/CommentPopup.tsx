"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

import type { CommentData, StickerOption } from "@/features/wishlist/types";

type PopupMode = "view" | "write" | "edit";

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

  // 10초 쿨다운 카운트다운
  const [cooldown, setCooldown] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

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

  const handleDelete = async () => {
    if (!comment) return;
    setLoading(true);
    try {
      await onDelete(comment.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "댓글 삭제에 실패했습니다.");
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

  return (
    <div className="fixed left-1/2 top-1/2 z-30 w-[min(340px,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-3xl bg-white px-5 py-6 shadow-[0_24px_60px_rgba(0,0,0,0.22)]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-slate-900">
          {mode === "view"
            ? (comment?.senderName ?? "댓글")
            : mode === "edit"
              ? "댓글 수정"
              : "댓글 쓰기"}
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-700"
          aria-label="닫기"
        >
          닫기
        </button>
      </div>

      {/* View mode */}
      {mode === "view" && comment && (
        <div className="mt-4 space-y-3">
          {comment.stickerKey && (
            <div className="flex justify-center">
              <div className="relative h-16 w-16 overflow-hidden rounded-full bg-slate-100">
                <Image
                  src={comment.stickerKey}
                  alt={comment.senderName}
                  fill
                  unoptimized
                  sizes="64px"
                  className="object-cover"
                />
              </div>
            </div>
          )}
          <p className="rounded-2xl bg-slate-50 px-4 py-3 text-sm leading-relaxed text-slate-800">
            {comment.content}
          </p>
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
                onClick={handleDelete}
                disabled={isDisabled}
                className="flex-1 rounded-2xl bg-red-50 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-100 disabled:opacity-40"
              >
                {loading ? "삭제 중..." : "삭제"}
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
            <div className="grid grid-cols-6 gap-2">
              {stickerOptions.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setSelectedSticker(option.src)}
                  disabled={isWriteBlocked}
                  className={`relative aspect-square overflow-hidden rounded-full border-2 transition ${
                    selectedSticker === option.src
                      ? "border-[#7B61FF] shadow-[0_0_0_2px_rgba(123,97,255,0.2)]"
                      : "border-transparent bg-slate-100"
                  } disabled:opacity-40`}
                  aria-label={option.label}
                >
                  <Image
                    src={option.src}
                    alt={option.label}
                    fill
                    unoptimized
                    sizes="48px"
                    className="object-cover"
                  />
                </button>
              ))}
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
          <div>
            <p className="mb-2 text-xs font-semibold text-slate-500">댓글 수정</p>
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
  );
}
