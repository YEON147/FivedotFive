"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";

import {
  BoardVisibilityTogglePanel,
  ROLLING_COMMENT_VISIBILITY_HELP,
  WISH_BOARD_VISIBILITY_HELP,
  WISH_COMMENT_VISIBILITY_HELP,
} from "@/components/common/BoardVisibilityTogglePanel";
import { WishlistCenterDialog } from "@/components/wishlist/WishlistCenterDialog";
import { TextField } from "@/components/ui/TextField";
import {
  getRollingPaperProfileAssets,
  type RollingPaperDetailPayload,
  type RollingPaperProfileAsset,
} from "@/features/rolling-paper/api";
import {
  patchRollingPaper,
  patchWishBoard,
  uploadRollingPaperRecipientImage,
} from "@/features/wishlist/api";
import type { MyBoardListEntry } from "@/features/wishlist/types";
import { getAssetImageUrl } from "@/lib/asset-url";
import { isRollingPaperListType } from "@/lib/board-entry-path";

/** 서버 WishBoardUpdateRequest·RollingPaperUpdateRequest title @Size(max = 8) */
const PAGE_TITLE_MAX = 8;
const RECIPIENT_MAX = 100;

const RECIPIENT_IMAGE_ACCEPT =
  "image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp";

/** 롤링페이퍼 저장 직후 상세 화면에 바로 반영할 필드 */
export type RollingPaperSavedDetailPartial = Partial<
  Pick<
    RollingPaperDetailPayload,
    "title" | "recipientName" | "targetDate" | "imageKey" | "isCommentPublic"
  >
>;

export type EditBoardOrRollingPaperModalProps = {
  open: boolean;
  onClose: () => void;
  entry: MyBoardListEntry | null;
  /** 저장 후 — 롤링이면 갱신된 필드를 넘겨 부모가 `detail`을 즉시 병합할 수 있음 */
  onSaved?: (rollingDetailUpdates?: RollingPaperSavedDetailPartial) => void;
  /** 롤링페이퍼: `true`면 받는 사람 사진(`imageKey`)만 변경·PATCH */
  rollingPhotoOnly?: boolean;
};

export function EditBoardOrRollingPaperModal({
  open,
  onClose,
  entry,
  onSaved,
  rollingPhotoOnly = false,
}: EditBoardOrRollingPaperModalProps) {
  const titleId = useId();
  const kindGroupId = useId();
  const initialRef = useRef<{
    title: string;
    targetDate: string;
    /** 위시보드: 보드 공개(isPublic). 롤링: 플레이스홀더(true) */
    boardPublic: boolean;
    recipientName: string;
    /** 위시·롤링: 댓글 공개(isCommentPublic) */
    commentPublic: boolean;
    /** 롤링: 받는 사람 이미지 키(카탈로그·업로드) */
    imageKey: string;
  } | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [targetDate, setTargetDate] = useState("");
  /** 위시보드: 다른 사람이 링크로 보드를 열 수 있는지 */
  const [isPublic, setIsPublic] = useState(true);
  /** 위시보드: 공개 기준일 전 타인 댓글 노출 */
  const [wishCommentPublic, setWishCommentPublic] = useState(false);
  /** 롤링페이퍼 전용 · 백엔드 `isCommentPublic` */
  const [rollingCommentPublic, setRollingCommentPublic] = useState(true);
  const [recipientName, setRecipientName] = useState("");
  const [recipientImageFile, setRecipientImageFile] = useState<File | null>(null);
  const [recipientImagePreviewUrl, setRecipientImagePreviewUrl] = useState<
    string | null
  >(null);
  /** 카탈로그 프로필 — `GET /api/assets/rolling-paper-profiles` */
  const [rollingProfiles, setRollingProfiles] = useState<RollingPaperProfileAsset[]>([]);
  const [rollingProfilesLoading, setRollingProfilesLoading] = useState(false);
  const [rollingProfilesError, setRollingProfilesError] = useState<string | null>(null);
  const [selectedProfileId, setSelectedProfileId] = useState<number | null>(null);
  /** 선택된 프리셋 `assetKey` — 파일 업로드와 배타 */
  const [recipientPresetImageKey, setRecipientPresetImageKey] = useState<string | null>(
    null,
  );

  const isRolling = entry ? isRollingPaperListType(entry.type) : false;
  const rollingPhotoOnlyMode = Boolean(isRolling && rollingPhotoOnly);

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
    const commentPub = entry.isCommentPublic === true;

    setTitle(t);
    setTargetDate(td);
    if (rolling) {
      setRollingCommentPublic(commentPub);
    } else {
      setIsPublic(pub);
      setWishCommentPublic(commentPub);
    }
    setRecipientName(rn);
    setRecipientImageFile(null);
    setRecipientImagePreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setErrorMessage(null);
    const ik = (entry.imageKey ?? "").trim();
    initialRef.current = {
      title: t,
      targetDate: td,
      boardPublic: rolling ? true : pub,
      recipientName: rn,
      commentPublic: commentPub,
      imageKey: ik,
    };
  }, [
    open,
    entry?.slug,
    entry?.type,
    entry?.title,
    entry?.targetDate,
    entry?.recipientName,
    entry?.imageKey,
    entry?.isPublic,
    entry?.isCommentPublic,
  ]);

  useEffect(() => {
    if (!open || !entry || !isRollingPaperListType(entry.type)) {
      return;
    }
    let cancelled = false;
    setRollingProfilesLoading(true);
    setRollingProfilesError(null);
    const imageKeyForMatch = (entry.imageKey ?? "").trim();
    void getRollingPaperProfileAssets()
      .then((res) => {
        if (cancelled) return;
        const profiles = res.data?.profiles ?? [];
        setRollingProfiles(profiles);
        const match = profiles.find((p) => (p.assetKey ?? "").trim() === imageKeyForMatch);
        if (match) {
          setSelectedProfileId(match.id);
          setRecipientPresetImageKey(match.assetKey.trim());
        } else {
          setSelectedProfileId(null);
          setRecipientPresetImageKey(null);
        }
      })
      .catch((err) => {
        if (cancelled) return;
        setRollingProfilesError(
          err instanceof Error ? err.message : "프로필 이미지 목록을 불러오지 못했습니다.",
        );
        setRollingProfiles([]);
        setSelectedProfileId(null);
        setRecipientPresetImageKey(null);
      })
      .finally(() => {
        if (!cancelled) setRollingProfilesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, entry?.slug, entry?.type, entry?.imageKey]);

  const handleRecipientImageChange = useCallback(
    (ev: React.ChangeEvent<HTMLInputElement>) => {
      const file = ev.target.files?.[0] ?? null;
      setRecipientImagePreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return file ? URL.createObjectURL(file) : null;
      });
      setRecipientImageFile(file);
      if (file) {
        setSelectedProfileId(null);
        setRecipientPresetImageKey(null);
      }
    },
    [],
  );

  const handleSelectRollingProfile = useCallback(
    (profile: RollingPaperProfileAsset) => {
      setErrorMessage(null);
      const key = profile.assetKey?.trim();
      if (!key) return;
      if (selectedProfileId === profile.id) {
        setSelectedProfileId(null);
        setRecipientPresetImageKey(null);
        return;
      }
      setSelectedProfileId(profile.id);
      setRecipientPresetImageKey(key);
      setRecipientImagePreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      setRecipientImageFile(null);
    },
    [selectedProfileId],
  );

  const clearRecipientImageSelection = useCallback(() => {
    setRecipientImagePreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setRecipientImageFile(null);
    if (!entry || !isRollingPaperListType(entry.type)) return;
    const ik = (entry.imageKey ?? "").trim();
    const match = rollingProfiles.find((p) => (p.assetKey ?? "").trim() === ik);
    if (match) {
      setSelectedProfileId(match.id);
      setRecipientPresetImageKey(match.assetKey.trim());
    } else {
      setSelectedProfileId(null);
      setRecipientPresetImageKey(null);
    }
  }, [entry, rollingProfiles]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!entry || !initialRef.current) return;

      setErrorMessage(null);

      const init = initialRef.current;

      if (isRolling && rollingPhotoOnlyMode) {
        const initIk = init.imageKey.trim();
        const presetIk = (recipientPresetImageKey ?? "").trim();
        const presetImageChanged =
          !recipientImageFile &&
          presetIk.length > 0 &&
          presetIk !== initIk;

        if (!recipientImageFile && !presetImageChanged) {
          onClose();
          return;
        }

        setSubmitting(true);
        try {
          const patch: Partial<{ imageKey: string }> = {};
          if (recipientImageFile) {
            patch.imageKey = await uploadRollingPaperRecipientImage(recipientImageFile);
          } else if (presetImageChanged) {
            patch.imageKey = presetIk;
          }
          await patchRollingPaper(entry.slug, patch);
          const imageKeyAfter =
            patch.imageKey !== undefined ? patch.imageKey : initIk || null;
          onSaved?.({ imageKey: imageKeyAfter });
          onClose();
        } catch (err) {
          setErrorMessage(err instanceof Error ? err.message : "저장에 실패했습니다.");
        } finally {
          setSubmitting(false);
        }
        return;
      }

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
        if (rollingCommentPublic !== init.commentPublic) {
          patch.isCommentPublic = rollingCommentPublic;
        }

        const initIk = init.imageKey.trim();
        const presetIk = (recipientPresetImageKey ?? "").trim();
        const presetImageChanged =
          presetIk.length > 0 && presetIk !== initIk;

        if (Object.keys(patch).length === 0 && !presetImageChanged) {
          onClose();
          return;
        }

        setSubmitting(true);
        try {
          if (presetImageChanged) {
            patch.imageKey = presetIk;
          }
          await patchRollingPaper(entry.slug, patch);
          const imageKeyAfter =
            patch.imageKey !== undefined
              ? patch.imageKey
              : initIk || null;
          onSaved?.({
            title: ti,
            recipientName: rn,
            targetDate: td,
            isCommentPublic: rollingCommentPublic,
            imageKey: imageKeyAfter,
          });
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

      const patch: Partial<{
        title: string | null;
        isPublic: boolean;
        isCommentPublic: boolean;
        targetDate: string | null;
      }> = {};
      if (ti !== init.title.trim()) {
        patch.title = ti === "" ? null : ti;
      }
      if (isPublic !== init.boardPublic) {
        patch.isPublic = isPublic;
      }
      if (wishCommentPublic !== init.commentPublic) {
        patch.isCommentPublic = wishCommentPublic;
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
      wishCommentPublic,
      onClose,
      onSaved,
      recipientImageFile,
      recipientPresetImageKey,
      recipientName,
      rollingPhotoOnlyMode,
      targetDate,
      title,
    ],
  );

  if (!entry) {
    return null;
  }

  const dialogTitle = rollingPhotoOnlyMode ? "받는 사람 사진" : "페이지 설정";

  return (
    <WishlistCenterDialog
      open={open}
      onClose={onClose}
      title={dialogTitle}
      titleId={titleId}
      variant="static"
      staticStack="aboveDialogs"
      closeLabel="닫기"
    >
      <form className="mt-5 flex flex-col gap-4" onSubmit={handleSubmit}>
        {!rollingPhotoOnlyMode ? (
          <fieldset>
            <legend className="sr-only">페이지 종류</legend>
            <div
              role="radiogroup"
              aria-labelledby={kindGroupId}
              className="flex flex-col gap-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-subtle)] p-3"
            >
              <span
                id={kindGroupId}
                className="text-sm font-semibold text-slate-800"
              >
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
        ) : null}

        {isRolling ? (
          <div className="flex flex-col gap-3">
            {!rollingPhotoOnlyMode ? (
              <>
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
                <BoardVisibilityTogglePanel
                  title="댓글 공개"
                  description={ROLLING_COMMENT_VISIBILITY_HELP}
                  checked={rollingCommentPublic}
                  onCheckedChange={setRollingCommentPublic}
                  ariaLabel="롤링페이퍼 댓글 공개"
                  disabled={submitting}
                />
              </>
            ) : null}
            <div className="flex flex-col gap-2">
              <span className="text-sm font-semibold text-slate-800">
                {rollingPhotoOnlyMode ? "사진" : "받는 사람 이미지"}
              </span>
              {rollingPhotoOnlyMode ? (
                <p className="text-[12px] leading-snug text-[var(--color-text-secondary)]">
                  아래 썸네일을 고르거나 새 파일을 올려 바꿀 수 있어요. 썸네일을 다시 누르면 선택이
                  해제됩니다.
                </p>
              ) : null}
              {rollingProfilesLoading ? (
                <p className="text-[13px] text-[var(--color-text-secondary)]">
                  프로필 이미지 목록을 불러오는 중…
                </p>
              ) : rollingProfilesError ? (
                <p className="text-[13px] text-rose-600" role="alert">
                  {rollingProfilesError}
                </p>
              ) : rollingProfiles.length === 0 ? (
                <p className="text-[13px] text-[var(--color-text-secondary)]">
                  등록된 프로필 이미지가 없습니다.
                </p>
              ) : (
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-3">
                  {rollingProfiles.map((p) => {
                    const selected = selectedProfileId === p.id;
                    const src = getAssetImageUrl(p.assetKey);
                    return (
                      <button
                        key={p.id}
                        type="button"
                        title={p.assetKey}
                        disabled={submitting}
                        onClick={() => handleSelectRollingProfile(p)}
                        className={`flex flex-col items-center gap-1 rounded-xl border-2 bg-white p-1.5 text-center transition hover:bg-[var(--color-bg-subtle)] disabled:opacity-50 ${
                          selected
                            ? "border-[#7B61FF] ring-1 ring-[#7B61FF]/30"
                            : "border-[var(--color-border)]"
                        }`}
                      >
                        {src ? (
                          /* eslint-disable-next-line @next/next/no-img-element -- CDN assetKey URL */
                          <img
                            src={src}
                            alt=""
                            className="mx-auto h-[4.5rem] w-full object-contain"
                          />
                        ) : (
                          <div className="flex h-[4.5rem] w-full items-center justify-center text-[10px] text-slate-400">
                            이미지
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
              {entry.imageKey?.trim() &&
              !recipientImageFile &&
              selectedProfileId == null ? (
                <div className="flex flex-col gap-1">
                  <span className="text-[12px] font-medium text-[var(--color-text-secondary)]">
                    현재 적용 중 (카탈로그에 없는 이미지)
                  </span>
                  <div className="overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-subtle)] p-1">
                    {/* eslint-disable-next-line @next/next/no-img-element -- CDN */}
                    <img
                      src={getAssetImageUrl(entry.imageKey.trim())}
                      alt=""
                      className="mx-auto max-h-36 w-auto object-contain"
                    />
                  </div>
                </div>
              ) : null}
              {rollingPhotoOnlyMode ? (
                <>
                  <p className="text-[12px] text-[var(--color-text-secondary)]">
                    또는 파일 업로드 (JPG, PNG, WEBP)
                  </p>
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
                </>
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
            <BoardVisibilityTogglePanel
              title="보드 공개"
              description={WISH_BOARD_VISIBILITY_HELP}
              checked={isPublic}
              onCheckedChange={setIsPublic}
              ariaLabel="위시보드 공개"
              disabled={submitting}
            />
            <BoardVisibilityTogglePanel
              title="댓글 공개"
              description={WISH_COMMENT_VISIBILITY_HELP}
              checked={wishCommentPublic}
              onCheckedChange={setWishCommentPublic}
              ariaLabel="위시보드 댓글 공개"
              disabled={submitting}
            />
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
