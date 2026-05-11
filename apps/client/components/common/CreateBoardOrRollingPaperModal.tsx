"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useId, useState } from "react";

import { WishlistCenterDialog } from "@/components/wishlist/WishlistCenterDialog";
import { TextField } from "@/components/ui/TextField";
import {
  getRollingPaperProfileAssets,
  type RollingPaperProfileAsset,
} from "@/features/rolling-paper/api";
import {
  createRollingPaper,
  createWishBoard,
  formatCreateBoardLimitError,
} from "@/features/wishlist/api";
import { getAssetImageUrl } from "@/lib/asset-url";

/** 서버 WishBoardCreateRequest·RollingPaperCreateRequest title @Size(max = 8) */
const PAGE_TITLE_MAX = 8;

type CreateKind = "wish" | "rolling";

export type CreateBoardOrRollingPaperModalProps = {
  open: boolean;
  onClose: () => void;
};

export function CreateBoardOrRollingPaperModal({
  open,
  onClose,
}: CreateBoardOrRollingPaperModalProps) {
  const router = useRouter();
  const titleId = useId();
  const groupId = useId();

  const [kind, setKind] = useState<CreateKind>("wish");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [wishTitle, setWishTitle] = useState("");
  const [wishTargetDate, setWishTargetDate] = useState("");
  /** 위시보드 `isPublic` — 다른 사람이 링크로 보드를 열 수 있는지 (본인은 항상 가능) */
  const [wishBoardPublic, setWishBoardPublic] = useState(true);
  /** 위시보드 `isCommentPublic` — 공개 기준일 전 타인 댓글 노출 여부 */
  const [wishCommentPublic, setWishCommentPublic] = useState(true);

  const [rpTitle, setRpTitle] = useState("");
  const [rpTargetDate, setRpTargetDate] = useState("");
  /** 롤링 isCommentPublic — 백엔드 스케줄러·코멘트 페이지 로직과 동일 개념 */
  const [rpCommentPublic, setRpCommentPublic] = useState(true);

  /** `GET /api/assets/rolling-paper-profiles` — 생성 요청의 `imageKey`로 그대로 전달 */
  const [recipientImageKey, setRecipientImageKey] = useState<string | null>(null);
  const [selectedProfileId, setSelectedProfileId] = useState<number | null>(null);
  const [rollingProfiles, setRollingProfiles] = useState<RollingPaperProfileAsset[]>([]);
  const [rollingProfilesLoading, setRollingProfilesLoading] = useState(false);
  const [rollingProfilesError, setRollingProfilesError] = useState<string | null>(null);

  const resetForm = useCallback(() => {
    setKind("wish");
    setErrorMessage(null);
    setSubmitting(false);
    setWishTitle("");
    setWishTargetDate("");
    setWishBoardPublic(true);
    setWishCommentPublic(true);
    setRpTitle("");
    setRpTargetDate("");
    setRpCommentPublic(true);
    setRecipientImageKey(null);
    setSelectedProfileId(null);
    setRollingProfiles([]);
    setRollingProfilesLoading(false);
    setRollingProfilesError(null);
  }, []);

  useEffect(() => {
    if (!open) {
      resetForm();
    }
  }, [open, resetForm]);

  useEffect(() => {
    if (!open || kind !== "rolling") {
      return;
    }
    let cancelled = false;
    setRollingProfilesLoading(true);
    setRollingProfilesError(null);
    void getRollingPaperProfileAssets()
      .then((res) => {
        if (cancelled) return;
        setRollingProfiles(res.data?.profiles ?? []);
      })
      .catch((err) => {
        if (cancelled) return;
        const msg =
          err instanceof Error ? err.message : "프로필 이미지 목록을 불러오지 못했습니다.";
        setRollingProfilesError(msg);
        setRollingProfiles([]);
      })
      .finally(() => {
        if (!cancelled) {
          setRollingProfilesLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [open, kind]);

  const handleSelectProfile = useCallback((profile: RollingPaperProfileAsset) => {
    setErrorMessage(null);
    const key = profile.assetKey?.trim();
    if (!key) return;
    if (selectedProfileId === profile.id) {
      setSelectedProfileId(null);
      setRecipientImageKey(null);
      return;
    }
    setSelectedProfileId(profile.id);
    setRecipientImageKey(key);
  }, [selectedProfileId]);

  const clearRecipientProfile = useCallback(() => {
    setSelectedProfileId(null);
    setRecipientImageKey(null);
    setErrorMessage(null);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (kind === "wish") {
      const titleTrim = wishTitle.trim();
      if (titleTrim.length > PAGE_TITLE_MAX) {
        setErrorMessage(`제목은 ${PAGE_TITLE_MAX}자 이하로 입력해 주세요.`);
        return;
      }

      setSubmitting(true);
      try {
        const res = await createWishBoard({
          title: titleTrim || null,
          targetDate: wishTargetDate.trim() || null,
          isPublic: wishBoardPublic,
          isCommentPublic: wishCommentPublic,
        });
        onClose();
        router.push(`/wishlist/${encodeURIComponent(res.data.boardSlug)}`);
      } catch (err) {
        const raw = err instanceof Error ? err.message : "생성에 실패했습니다.";
        setErrorMessage(formatCreateBoardLimitError(raw));
      } finally {
        setSubmitting(false);
      }
      return;
    }

    const rt = rpTitle.trim();
    const rd = rpTargetDate.trim();
    if (!rt) {
      setErrorMessage("롤링페이퍼 제목을 입력해 주세요.");
      return;
    }
    if (rt.length > PAGE_TITLE_MAX) {
      setErrorMessage(`제목은 ${PAGE_TITLE_MAX}자 이하로 입력해 주세요.`);
      return;
    }
    if (!rd) {
      setErrorMessage("댓글 공개 기준일을 선택해 주세요.");
      return;
    }

    setSubmitting(true);
    try {
      const ik = recipientImageKey?.trim();
      const res = await createRollingPaper({
        title: rt,
        targetDate: rd,
        imageKey: ik || undefined,
        isCommentPublic: rpCommentPublic,
      });
      onClose();
      router.push(`/rolling-paper/${encodeURIComponent(res.data.slug)}`);
    } catch (err) {
      const raw = err instanceof Error ? err.message : "생성에 실패했습니다.";
      setErrorMessage(formatCreateBoardLimitError(raw));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <WishlistCenterDialog
      open={open}
      onClose={onClose}
      title="생성하기"
      titleId={titleId}
      variant="static"
      staticStack="aboveMenu"
      description={<span>종류를 고르고 폼을 채워 주세요.</span>}
      closeLabel="닫기"
    >
      <form className="mt-5 flex flex-col gap-4" onSubmit={handleSubmit}>
        <fieldset>
          <legend className="sr-only">생성 종류</legend>
          <div
            role="radiogroup"
            aria-labelledby={groupId}
            className="flex flex-col gap-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-subtle)] p-3"
          >
            <span
              id={groupId}
              className="text-[12px] font-semibold text-[var(--color-text-secondary)]"
            >
              종류
            </span>
            <label className="flex cursor-pointer items-center gap-2.5 text-[15px] text-[var(--color-text-primary)]">
              <input
                type="radio"
                name="create-kind"
                checked={kind === "wish"}
                onChange={() => setKind("wish")}
                className="size-4 accent-[#7B61FF]"
              />
              위시보드
            </label>
            <label className="flex cursor-pointer items-center gap-2.5 text-[15px] text-[var(--color-text-primary)]">
              <input
                type="radio"
                name="create-kind"
                checked={kind === "rolling"}
                onChange={() => setKind("rolling")}
                className="size-4 accent-[#7B61FF]"
              />
              롤링페이퍼
            </label>
          </div>
        </fieldset>

        {kind === "wish" ? (
          <div className="flex flex-col gap-3">
            <TextField
              label="제목"
              placeholder="선택"
              value={wishTitle}
              onChange={(ev) => setWishTitle(ev.target.value)}
              maxLength={PAGE_TITLE_MAX}
            />
            <TextField
              label="공개 기준일"
              type="date"
              value={wishTargetDate}
              onChange={(ev) => setWishTargetDate(ev.target.value)}
            />
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-subtle)] p-3">
              <p className="mb-2 text-[12px] font-semibold text-[var(--color-text-secondary)]">
                보드 공개
              </p>
              <p className="mb-3 text-[12px] leading-snug text-[var(--color-text-secondary)]">
                비공개면 링크를 알아도 다른 사람은 위시보드를 열 수 없어요. 본인은 항상 볼 수
                있어요.
              </p>
              <label className="flex cursor-pointer items-center gap-2.5 text-[14px] text-[var(--color-text-primary)]">
                <input
                  type="radio"
                  name="create-wish-board-vis"
                  checked={wishBoardPublic}
                  onChange={() => setWishBoardPublic(true)}
                  className="size-4 accent-[#7B61FF]"
                />
                보드 공개
              </label>
              <label className="mt-2 flex cursor-pointer items-center gap-2.5 text-[14px] text-[var(--color-text-primary)]">
                <input
                  type="radio"
                  name="create-wish-board-vis"
                  checked={!wishBoardPublic}
                  onChange={() => setWishBoardPublic(false)}
                  className="size-4 accent-[#7B61FF]"
                />
                보드 비공개
              </label>
            </div>
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-subtle)] p-3">
              <p className="mb-2 text-[12px] font-semibold text-[var(--color-text-secondary)]">
                댓글 공개
              </p>
              <p className="mb-3 text-[12px] leading-snug text-[var(--color-text-secondary)]">
                공개 기준일 전에 다른 사람이 작성한 댓글을 볼 수 있는지 정해요. 비공개면 기준일까지
                타인 댓글은 숨겨져요.
              </p>
              <label className="flex cursor-pointer items-center gap-2.5 text-[14px] text-[var(--color-text-primary)]">
                <input
                  type="radio"
                  name="create-wish-comment"
                  checked={wishCommentPublic}
                  onChange={() => setWishCommentPublic(true)}
                  className="size-4 accent-[#7B61FF]"
                />
                댓글 공개
              </label>
              <label className="mt-2 flex cursor-pointer items-center gap-2.5 text-[14px] text-[var(--color-text-primary)]">
                <input
                  type="radio"
                  name="create-wish-comment"
                  checked={!wishCommentPublic}
                  onChange={() => setWishCommentPublic(false)}
                  className="size-4 accent-[#7B61FF]"
                />
                댓글 비공개
              </label>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <TextField
              label="제목"
              requiredMark
              placeholder="롤링페이퍼 제목"
              value={rpTitle}
              onChange={(ev) => setRpTitle(ev.target.value)}
              maxLength={PAGE_TITLE_MAX}
            />
            <TextField
              label="공개 기준일"
              requiredMark
              type="date"
              value={rpTargetDate}
              onChange={(ev) => setRpTargetDate(ev.target.value)}
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
                  name="create-rolling-comment"
                  checked={rpCommentPublic}
                  onChange={() => setRpCommentPublic(true)}
                  className="size-4 accent-[#7B61FF]"
                />
                댓글 공개
              </label>
              <label className="mt-2 flex cursor-pointer items-center gap-2.5 text-[14px] text-[var(--color-text-primary)]">
                <input
                  type="radio"
                  name="create-rolling-comment"
                  checked={!rpCommentPublic}
                  onChange={() => setRpCommentPublic(false)}
                  className="size-4 accent-[#7B61FF]"
                />
                댓글 비공개
              </label>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-[12px] font-semibold text-[var(--color-text-secondary)]">
                받는 사람 이미지 (선택)
              </span>
              <p className="text-[12px] leading-snug text-[var(--color-text-secondary)]">
                선택한 썸네일을 다시 누르면 선택이 해제됩니다.
              </p>
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
                        onClick={() => handleSelectProfile(p)}
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
          {submitting
            ? kind === "wish"
              ? "만드는 중…"
              : "만드는 중…"
            : kind === "rolling"
              ? "롤링페이퍼 만들기"
              : "만들기"}
        </button>
      </form>
    </WishlistCenterDialog>
  );
}
