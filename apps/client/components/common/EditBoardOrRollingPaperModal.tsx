"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";

import { WishlistCenterDialog } from "@/components/wishlist/WishlistCenterDialog";
import { TextField } from "@/components/ui/TextField";
import {
  patchRollingPaper,
  patchWishBoard,
  uploadRollingPaperRecipientImage,
} from "@/features/wishlist/api";
import type { MyBoardListEntry } from "@/features/wishlist/types";
import { isRollingPaperListType } from "@/lib/board-entry-path";

/** 서버 WishBoardUpdateRequest·RollingPaperUpdateRequest title @Size(max = 8) */
const PAGE_TITLE_MAX = 8;
const RECIPIENT_MAX = 100;

const RECIPIENT_IMAGE_ACCEPT =
  "image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp";

export type EditBoardOrRollingPaperModalProps = {
  open: boolean;
  onClose: () => void;
  entry: MyBoardListEntry | null;
  /** 저장 후 목록 새로고침 등 */
  onSaved?: () => void;
};

export function EditBoardOrRollingPaperModal({
  open,
  onClose,
  entry,
  onSaved,
}: EditBoardOrRollingPaperModalProps) {
  const titleId = useId();
  const kindGroupId = useId();
  const initialRef = useRef<{
    title: string;
    targetDate: string;
    isPublic: boolean;
    recipientName: string;
    isCommentPublic: boolean;
  } | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  /** 롤링페이퍼 전용 · 백엔드 `isCommentPublic` */
  const [rollingCommentPublic, setRollingCommentPublic] = useState(true);
  const [recipientName, setRecipientName] = useState("");
  const [recipientImageFile, setRecipientImageFile] = useState<File | null>(null);
  const [recipientImagePreviewUrl, setRecipientImagePreviewUrl] = useState<
    string | null
  >(null);

  const isRolling = entry ? isRollingPaperListType(entry.type) : false;

  useEffect(() => {
    if (!open || !entry) {
      return;
    }
    const t = entry.title?.trim() ?? "";
    const td =
      entry.targetDate && String(entry.targetDate).trim() !== ""
        ? String(entry.targetDate).slice(0, 10)
        : "";
    const pub = entry.isPublic !== undefined && entry.isPublic !== null ? Boolean(entry.isPublic) : true;
    const rn = entry.recipientName?.trim() ?? "";
    const rolling = isRollingPaperListType(entry.type);
    const cpRoll = entry.isCommentPublic === true;

    setTitle(t);
    setTargetDate(td);
    if (rolling) {
      setRollingCommentPublic(cpRoll);
    } else {
      setIsPublic(pub);
    }
    setRecipientName(rn);
    setRecipientImageFile(null);
    setRecipientImagePreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setErrorMessage(null);
    initialRef.current = {
      title: t,
      targetDate: td,
      isPublic: rolling ? true : pub,
      recipientName: rn,
      isCommentPublic: rolling ? cpRoll : false,
    };
  }, [open, entry]);

  const handleRecipientImageChange = useCallback(
    (ev: React.ChangeEvent<HTMLInputElement>) => {
      const file = ev.target.files?.[0] ?? null;
      setRecipientImagePreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return file ? URL.createObjectURL(file) : null;
      });
      setRecipientImageFile(file);
    },
    [],
  );

  const clearRecipientImageSelection = useCallback(() => {
    setRecipientImagePreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setRecipientImageFile(null);
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!entry || !initialRef.current) return;

      setErrorMessage(null);

      const init = initialRef.current;

      if (isRolling) {
        const ti = title.trim();
        if (!ti) {
          setErrorMessage("제목을 입력해 주세요.");
          return;
        }
        if (ti.length > PAGE_TITLE_MAX) {
          setErrorMessage(`제목은 ${PAGE_TITLE_MAX}자 이하로 입력해 주세요.`);
          return;
        }
        const rn = recipientName.trim();
        if (!rn) {
          setErrorMessage("받는 사람 이름을 입력해 주세요.");
          return;
        }
        if (rn.length > RECIPIENT_MAX) {
          setErrorMessage(`받는 사람 이름은 ${RECIPIENT_MAX}자 이하로 입력해 주세요.`);
          return;
        }
        const td = targetDate.trim();
        if (!td) {
          setErrorMessage("설정 일자(댓글 공개 기준일)를 선택해 주세요.");
          return;
        }

        const patch: Partial<{
          title: string;
          recipientName: string;
          targetDate: string;
          imageKey: string;
          isCommentPublic: boolean;
        }> = {};
        if (ti !== init.title.trim()) patch.title = ti;
        if (rn !== init.recipientName.trim()) patch.recipientName = rn;
        if (td !== init.targetDate.trim()) patch.targetDate = td;
        if (rollingCommentPublic !== init.isCommentPublic) {
          patch.isCommentPublic = rollingCommentPublic;
        }

        if (Object.keys(patch).length === 0 && !recipientImageFile) {
          onClose();
          return;
        }

        setSubmitting(true);
        try {
          if (recipientImageFile) {
            patch.imageKey = await uploadRollingPaperRecipientImage(recipientImageFile);
          }
          await patchRollingPaper(entry.slug, patch);
          onSaved?.();
          onClose();
        } catch (err) {
          setErrorMessage(err instanceof Error ? err.message : "저장에 실패했습니다.");
        } finally {
          setSubmitting(false);
        }
        return;
      }

      const ti = title.trim();
      if (ti.length > PAGE_TITLE_MAX) {
        setErrorMessage(`제목은 ${PAGE_TITLE_MAX}자 이하로 입력해 주세요.`);
        return;
      }

      const patch: Partial<{ title: string | null; isPublic: boolean; targetDate: string | null }> =
        {};
      if (ti !== init.title.trim()) {
        patch.title = ti === "" ? null : ti;
      }
      if (isPublic !== init.isPublic) {
        patch.isPublic = isPublic;
      }
      const td = targetDate.trim();
      const initTd = init.targetDate.trim();
      if (td !== initTd) {
        patch.targetDate = td === "" ? null : td;
      }

      if (Object.keys(patch).length === 0) {
        onClose();
        return;
      }

      setSubmitting(true);
      try {
        await patchWishBoard(entry.slug, patch);
        onSaved?.();
        onClose();
      } catch (err) {
        setErrorMessage(err instanceof Error ? err.message : "저장에 실패했습니다.");
      } finally {
        setSubmitting(false);
      }
    },
    [
      entry,
      isPublic,
      isRolling,
      rollingCommentPublic,
      onClose,
      onSaved,
      recipientImageFile,
      recipientName,
      targetDate,
      title,
    ],
  );

  if (!entry) {
    return null;
  }

  return (
    <WishlistCenterDialog
      open={open}
      onClose={onClose}
      title="페이지 설정"
      titleId={titleId}
      variant="static"
      staticStack="aboveDialogs"
      description={
        <span>바뀐 내용만 저장됩니다. 종류는 변경할 수 없어요.</span>
      }
      closeLabel="닫기"
    >
      <form className="mt-5 flex flex-col gap-4" onSubmit={handleSubmit}>
        <fieldset>
          <legend className="sr-only">페이지 종류</legend>
          <div
            role="radiogroup"
            aria-labelledby={kindGroupId}
            className="flex flex-col gap-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-subtle)] p-3 opacity-95"
          >
            <span id={kindGroupId} className="text-[12px] font-semibold text-[var(--color-text-secondary)]">
              종류 (변경 불가)
            </span>
            <label className="flex cursor-not-allowed items-center gap-2.5 text-[15px] text-[var(--color-text-primary)]">
              <input
                type="radio"
                name="edit-kind"
                checked={!isRolling}
                readOnly
                disabled
                className="size-4 accent-[#7B61FF]"
              />
              위시보드
            </label>
            <label className="flex cursor-not-allowed items-center gap-2.5 text-[15px] text-[var(--color-text-primary)]">
              <input
                type="radio"
                name="edit-kind"
                checked={isRolling}
                readOnly
                disabled
                className="size-4 accent-[#7B61FF]"
              />
              롤링페이퍼
            </label>
          </div>
        </fieldset>

        {isRolling ? (
          <div className="flex flex-col gap-3">
            <TextField
              label="제목"
              value={title}
              onChange={(ev) => setTitle(ev.target.value)}
              maxLength={PAGE_TITLE_MAX}
            />
            <TextField
              label="받는 사람"
              value={recipientName}
              onChange={(ev) => setRecipientName(ev.target.value)}
              maxLength={RECIPIENT_MAX}
            />
            <TextField
              label="공개 기준일"
              type="date"
              value={targetDate}
              onChange={(ev) => setTargetDate(ev.target.value)}
            />
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-subtle)] p-3">
              <p className="mb-2 text-[12px] font-semibold text-[var(--color-text-secondary)]">
                댓글 공개
              </p>
              <p className="mb-3 text-[12px] leading-snug text-[var(--color-text-secondary)]">
                비공개면 기준일까지 댓글은 비공개로 유지됩니다.
              </p>
              <label className="flex cursor-pointer items-center gap-2.5 text-[14px] text-[var(--color-text-primary)]">
                <input
                  type="radio"
                  name="edit-rolling-comment"
                  checked={rollingCommentPublic}
                  onChange={() => setRollingCommentPublic(true)}
                  className="size-4 accent-[#7B61FF]"
                />
                댓글 공개
              </label>
              <label className="mt-2 flex cursor-pointer items-center gap-2.5 text-[14px] text-[var(--color-text-primary)]">
                <input
                  type="radio"
                  name="edit-rolling-comment"
                  checked={!rollingCommentPublic}
                  onChange={() => setRollingCommentPublic(false)}
                  className="size-4 accent-[#7B61FF]"
                />
                댓글 비공개
              </label>
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-[12px] font-semibold text-[var(--color-text-secondary)]">
                캐릭터 사진
              </span>
              <p className="text-[12px] text-[var(--color-text-secondary)]">
                선택 · 새 파일을 올리면 교체 · JPG, PNG, WEBP
              </p>
              {entry.imageKey && !recipientImageFile ? (
                <p className="text-[12px] text-[var(--color-text-secondary)]">
                  등록된 사진이 있어요.
                </p>
              ) : null}
              <div className="flex flex-wrap items-center gap-2">
                <label className="inline-flex cursor-pointer items-center justify-center rounded-xl border border-[var(--color-border)] bg-white px-3 py-2 text-[13px] font-medium text-[var(--color-text-primary)] transition hover:bg-[var(--color-bg-subtle)]">
                  사진 선택
                  <input
                    type="file"
                    accept={RECIPIENT_IMAGE_ACCEPT}
                    className="sr-only"
                    onChange={handleRecipientImageChange}
                  />
                </label>
                {recipientImageFile ? (
                  <button
                    type="button"
                    onClick={clearRecipientImageSelection}
                    className="text-[13px] font-medium text-rose-600 underline-offset-2 hover:underline"
                  >
                    선택 취소
                  </button>
                ) : null}
              </div>
              {recipientImagePreviewUrl ? (
                <div className="mt-1 overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-subtle)] p-1">
                  {/* eslint-disable-next-line @next/next/no-img-element -- 로컬 blob 미리보기 */}
                  <img
                    src={recipientImagePreviewUrl}
                    alt="선택한 사진 미리보기"
                    className="mx-auto max-h-40 w-auto object-contain"
                  />
                </div>
              ) : null}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <TextField
              label="제목"
              placeholder="선택"
              value={title}
              onChange={(ev) => setTitle(ev.target.value)}
              maxLength={PAGE_TITLE_MAX}
            />
            <TextField
              label="공개 기준일"
              type="date"
              value={targetDate}
              onChange={(ev) => setTargetDate(ev.target.value)}
            />
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-subtle)] p-3">
              <p className="mb-2 text-[12px] font-semibold text-[var(--color-text-secondary)]">
                댓글 공개
              </p>
              <label className="flex cursor-pointer items-center gap-2.5 text-[14px] text-[var(--color-text-primary)]">
                <input
                  type="radio"
                  name="wish-comment-mode"
                  checked={isPublic}
                  onChange={() => setIsPublic(true)}
                  className="size-4 accent-[#7B61FF]"
                />
                댓글 공개
              </label>
              <label className="mt-2 flex cursor-pointer items-center gap-2.5 text-[14px] text-[var(--color-text-primary)]">
                <input
                  type="radio"
                  name="wish-comment-mode"
                  checked={!isPublic}
                  onChange={() => setIsPublic(false)}
                  className="size-4 accent-[#7B61FF]"
                />
                댓글 비공개
              </label>
            </div>
          </div>
        )}

        {errorMessage ? (
          <p className="rounded-xl bg-rose-50 px-3 py-2 text-[13px] leading-snug text-rose-700 ring-1 ring-rose-100">
            {errorMessage}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={submitting}
          className="inline-flex min-h-[2.75rem] w-full items-center justify-center rounded-[14px] bg-[var(--color-primary-main)] text-[15px] font-semibold text-white transition hover:bg-[var(--color-primary-pressed)] disabled:opacity-50"
        >
          {submitting ? "저장 중…" : "저장"}
        </button>
      </form>
    </WishlistCenterDialog>
  );
}
