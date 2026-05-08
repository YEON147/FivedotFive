"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";

import { WishlistCenterDialog } from "@/components/wishlist/WishlistCenterDialog";
import { TextField } from "@/components/ui/TextField";
import { patchRollingPaper, patchWishBoard } from "@/features/wishlist/api";
import type { MyBoardListEntry } from "@/features/wishlist/types";
import { isRollingPaperListType } from "@/lib/board-entry-path";

/** 서버 WishBoardUpdateRequest */
const WISH_TITLE_MAX = 100;
/** 서버 RollingPaperUpdateRequest */
const ROLLING_TITLE_MAX = 200;
const RECIPIENT_MAX = 100;

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
  } | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [recipientName, setRecipientName] = useState("");

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

    setTitle(t);
    setTargetDate(td);
    setIsPublic(pub);
    setRecipientName(rn);
    setErrorMessage(null);
    initialRef.current = {
      title: t,
      targetDate: td,
      isPublic: pub,
      recipientName: rn,
    };
  }, [open, entry]);

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
        if (ti.length > ROLLING_TITLE_MAX) {
          setErrorMessage(`제목은 ${ROLLING_TITLE_MAX}자 이하로 입력해 주세요.`);
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

        const patch: Partial<{ title: string; recipientName: string; targetDate: string }> = {};
        if (ti !== init.title.trim()) patch.title = ti;
        if (rn !== init.recipientName.trim()) patch.recipientName = rn;
        if (td !== init.targetDate.trim()) patch.targetDate = td;

        if (Object.keys(patch).length === 0) {
          onClose();
          return;
        }

        setSubmitting(true);
        try {
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
      if (ti.length > WISH_TITLE_MAX) {
        setErrorMessage(`제목은 ${WISH_TITLE_MAX}자 이하로 입력해 주세요.`);
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
    [entry, isPublic, isRolling, onClose, onSaved, recipientName, targetDate, title],
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
        <span>
          변경한 항목만 서버에 반영됩니다. 종류(위시보드 / 롤링페이퍼)는 바꿀 수 없습니다.
        </span>
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
              maxLength={ROLLING_TITLE_MAX}
              hint={`최대 ${ROLLING_TITLE_MAX}자 · 변경된 항목만 저장됩니다.`}
              hintDisplay="inline"
            />
            <TextField
              label="받는 사람 이름"
              value={recipientName}
              onChange={(ev) => setRecipientName(ev.target.value)}
              maxLength={RECIPIENT_MAX}
            />
            <TextField
              label="설정 일자 (댓글 공개 기준일)"
              type="date"
              value={targetDate}
              onChange={(ev) => setTargetDate(ev.target.value)}
              hint="운영·댓글 공개 일정에 사용됩니다. yyyy-MM-dd"
              hintDisplay="inline"
            />
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <TextField
              label="제목"
              placeholder="미입력 시 기존 제목 유지"
              value={title}
              onChange={(ev) => setTitle(ev.target.value)}
              maxLength={WISH_TITLE_MAX}
              hint={`최대 ${WISH_TITLE_MAX}자`}
              hintDisplay="inline"
            />
            <TextField
              label="설정 일자 (운영·기념일)"
              type="date"
              value={targetDate}
              onChange={(ev) => setTargetDate(ev.target.value)}
              hint="위시보드 운영 일자(yyyy-MM-dd). 비우면 기존 값 유지(변경 없음)."
              hintDisplay="inline"
            />
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-subtle)] p-3">
              <p className="mb-2 text-[12px] font-semibold text-[var(--color-text-secondary)]">
                댓글 공개 방식
              </p>
              <p className="mb-3 text-[12px] leading-snug text-[var(--color-text-secondary)]">
                댓글 공개: 생성 후 설정 일자까지 댓글이 공개됩니다. 댓글 비공개: 설정 일자까지는 비공개였다가,
                해당 일자가 되면 댓글이 공개될 수 있습니다.
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
                댓글 비공개 (기준일 전까지 비공개)
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
