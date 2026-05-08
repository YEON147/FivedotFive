"use client";

import { Check, Copy } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState } from "react";

import { WishlistCenterDialog } from "@/components/wishlist/WishlistCenterDialog";
import { TextField } from "@/components/ui/TextField";
import {
  createRollingPaper,
  createWishBoard,
  formatCreateBoardLimitError,
  uploadRollingPaperRecipientImage,
  type CreateRollingPaperApiResponse,
} from "@/features/wishlist/api";

/** 서버 WishBoardCreateRequest @Size(max = 100) */
const WISH_TITLE_MAX = 100;
/** 서버 RollingPaperCreateRequest title @Size(max = 200) */
const ROLLING_TITLE_MAX = 200;
/** 서버 RollingPaperCreateRequest recipientName @Size(max = 100) */
const RECIPIENT_NAME_MAX = 100;

const RECIPIENT_IMAGE_ACCEPT =
  "image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp";

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
  const [wishPublic, setWishPublic] = useState(true);

  const [rpTitle, setRpTitle] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [rpTargetDate, setRpTargetDate] = useState("");
  const [recipientImageFile, setRecipientImageFile] = useState<File | null>(null);
  /** 제출 직전 리렌더·비동기 타이밍에도 동일 파일로 업로드되도록 유지 */
  const recipientImageFileRef = useRef<File | null>(null);
  const [recipientImagePreviewUrl, setRecipientImagePreviewUrl] = useState<
    string | null
  >(null);
  /** 같은 파일을 다시 고를 때 onChange가 안 오는 브라우저 대비 */
  const [recipientFileInputKey, setRecipientFileInputKey] = useState(0);
  /** 「캐릭터로 변환」업로드 API 성공 후 받은 CDN 키 — 「롤링페이퍼 만들기」에서만 사용 */
  const [convertedImageKey, setConvertedImageKey] = useState<string | null>(null);
  const [converting, setConverting] = useState(false);

  const [rollingSuccess, setRollingSuccess] =
    useState<CreateRollingPaperApiResponse["data"] | null>(null);
  const [copyTip, setCopyTip] = useState<string | null>(null);

  const resetForm = useCallback(() => {
    setKind("wish");
    setErrorMessage(null);
    setSubmitting(false);
    setWishTitle("");
    setWishTargetDate("");
    setWishPublic(true);
    setRpTitle("");
    setRecipientName("");
    setRpTargetDate("");
    setRecipientImageFile(null);
    recipientImageFileRef.current = null;
    setRecipientImagePreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setRecipientFileInputKey((k) => k + 1);
    setConvertedImageKey(null);
    setConverting(false);
    setRollingSuccess(null);
    setCopyTip(null);
  }, []);

  useEffect(() => {
    if (!open) {
      resetForm();
    }
  }, [open, resetForm]);

  const handleRecipientImageChange = useCallback(
    (ev: React.ChangeEvent<HTMLInputElement>) => {
      const file = ev.target.files?.[0] ?? null;
      setRecipientImagePreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return file ? URL.createObjectURL(file) : null;
      });
      recipientImageFileRef.current = file;
      setRecipientImageFile(file);
      setConvertedImageKey(null);
    },
    [],
  );

  const clearRecipientImage = useCallback(() => {
    setRecipientImagePreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    recipientImageFileRef.current = null;
    setRecipientImageFile(null);
    setConvertedImageKey(null);
    setRecipientFileInputKey((k) => k + 1);
  }, []);

  const handleCharacterConvert = useCallback(async () => {
    const file = recipientImageFileRef.current ?? recipientImageFile;
    if (!file) return;

    setErrorMessage(null);
    setConverting(true);
    try {
      const key = await uploadRollingPaperRecipientImage(file);
      setConvertedImageKey(key.trim() || null);
    } catch (err) {
      const raw = err instanceof Error ? err.message : "변환에 실패했습니다.";
      setErrorMessage(formatCreateBoardLimitError(raw));
    } finally {
      setConverting(false);
    }
  }, [recipientImageFile]);

  const handleCopy = useCallback(async (label: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopyTip(label);
      window.setTimeout(() => setCopyTip(null), 2000);
    } catch {
      setCopyTip(null);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (kind === "wish") {
      const titleTrim = wishTitle.trim();
      if (titleTrim.length > WISH_TITLE_MAX) {
        setErrorMessage(`제목은 ${WISH_TITLE_MAX}자 이하로 입력해 주세요.`);
        return;
      }

      setSubmitting(true);
      try {
        const res = await createWishBoard({
          title: titleTrim || null,
          targetDate: wishTargetDate.trim() || null,
          isPublic: wishPublic,
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
    const rn = recipientName.trim();
    const rd = rpTargetDate.trim();
    if (!rt) {
      setErrorMessage("롤링페이퍼 제목을 입력해 주세요.");
      return;
    }
    if (rt.length > ROLLING_TITLE_MAX) {
      setErrorMessage(`제목은 ${ROLLING_TITLE_MAX}자 이하로 입력해 주세요.`);
      return;
    }
    if (!rn) {
      setErrorMessage("받는 사람 이름을 입력해 주세요.");
      return;
    }
    if (rn.length > RECIPIENT_NAME_MAX) {
      setErrorMessage(`받는 사람 이름은 ${RECIPIENT_NAME_MAX}자 이하로 입력해 주세요.`);
      return;
    }
    if (!rd) {
      setErrorMessage("댓글 공개 기준일을 선택해 주세요.");
      return;
    }

    const hasLocalPhoto =
      Boolean(recipientImageFileRef.current ?? recipientImageFile);
    if (hasLocalPhoto && !convertedImageKey?.trim()) {
      setErrorMessage("사진을 사용하려면 먼저 「캐릭터로 변환」을 눌러 주세요.");
      return;
    }

    setSubmitting(true);
    try {
      const ik = convertedImageKey?.trim();
      const res = await createRollingPaper({
        title: rt,
        recipientName: rn,
        targetDate: rd,
        imageKey: ik || undefined,
      });
      setRollingSuccess(res.data);
    } catch (err) {
      const raw = err instanceof Error ? err.message : "생성에 실패했습니다.";
      setErrorMessage(formatCreateBoardLimitError(raw));
    } finally {
      setSubmitting(false);
    }
  };

  const rollingDoneView = rollingSuccess != null;

  return (
    <WishlistCenterDialog
      open={open}
      onClose={onClose}
      title={rollingDoneView ? "롤링페이퍼가 생성되었어요" : "생성하기"}
      titleId={titleId}
      variant="static"
      staticStack="aboveMenu"
      description={
        rollingDoneView ? (
          <span>링크 두 종류예요. 필요한 쪽만 복사해 공유하세요.</span>
        ) : (
          <span>종류를 고르고 폼을 채워 주세요.</span>
        )
      }
      closeLabel="닫기"
    >
      {rollingDoneView ? (
        <div className="mt-5 flex flex-col gap-4">
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-subtle)] px-3 py-2.5 text-body-sm text-[var(--color-text-secondary)]">
            슬러그:{" "}
            <span className="font-medium text-[var(--color-text-primary)]">
              {rollingSuccess.slug}
            </span>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-[12px] font-semibold text-[var(--color-text-secondary)]">
              댓글 작성용 링크
            </span>
            <div className="flex gap-2">
              <p className="min-w-0 flex-1 break-all rounded-xl border border-[var(--color-border)] bg-white px-3 py-2 text-[13px] leading-snug text-[var(--color-text-primary)]">
                {rollingSuccess.commentShareUrl}
              </p>
              <button
                type="button"
                onClick={() => void handleCopy("comment", rollingSuccess.commentShareUrl)}
                className="inline-flex shrink-0 items-center justify-center gap-1 rounded-xl border border-[var(--color-border)] bg-white px-3 py-2 text-[13px] font-medium text-[var(--color-text-primary)] transition hover:bg-[var(--color-bg-subtle)]"
              >
                {copyTip === "comment" ? (
                  <Check size={18} weight="bold" className="text-emerald-600" />
                ) : (
                  <Copy size={18} weight="bold" />
                )}
                복사
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-[12px] font-semibold text-[var(--color-text-secondary)]">
              저장 전용 링크 (수신자용)
            </span>
            <div className="flex gap-2">
              <p className="min-w-0 flex-1 break-all rounded-xl border border-[var(--color-border)] bg-white px-3 py-2 text-[13px] leading-snug text-[var(--color-text-primary)]">
                {rollingSuccess.viewShareUrl}
              </p>
              <button
                type="button"
                onClick={() => void handleCopy("view", rollingSuccess.viewShareUrl)}
                className="inline-flex shrink-0 items-center justify-center gap-1 rounded-xl border border-[var(--color-border)] bg-white px-3 py-2 text-[13px] font-medium text-[var(--color-text-primary)] transition hover:bg-[var(--color-bg-subtle)]"
              >
                {copyTip === "view" ? (
                  <Check size={18} weight="bold" className="text-emerald-600" />
                ) : (
                  <Copy size={18} weight="bold" />
                )}
                복사
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="mt-1 inline-flex min-h-[2.75rem] w-full items-center justify-center rounded-[14px] bg-[var(--color-primary-main)] text-[15px] font-semibold text-white transition hover:bg-[var(--color-primary-pressed)]"
          >
            확인
          </button>
        </div>
      ) : (
        <form className="mt-5 flex flex-col gap-4" onSubmit={handleSubmit}>
          <fieldset>
            <legend className="sr-only">생성 종류</legend>
            <div
              role="radiogroup"
              aria-labelledby={groupId}
              className="flex flex-col gap-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-subtle)] p-3"
            >
              <span id={groupId} className="text-[12px] font-semibold text-[var(--color-text-secondary)]">
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
                maxLength={WISH_TITLE_MAX}
              />
              <TextField
                label="공개 기준일"
                type="date"
                value={wishTargetDate}
                onChange={(ev) => setWishTargetDate(ev.target.value)}
              />
              <label className="flex cursor-pointer items-center gap-2.5 text-[14px] text-[var(--color-text-primary)]">
                <input
                  type="checkbox"
                  checked={wishPublic}
                  onChange={(ev) => setWishPublic(ev.target.checked)}
                  className="size-4 rounded border-[var(--color-border)] accent-[#7B61FF]"
                />
                공개
              </label>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <TextField
                label="제목"
                requiredMark
                placeholder="롤링페이퍼 제목"
                value={rpTitle}
                onChange={(ev) => setRpTitle(ev.target.value)}
                maxLength={ROLLING_TITLE_MAX}
              />
              <TextField
                label="받는 사람"
                requiredMark
                placeholder="이름"
                value={recipientName}
                onChange={(ev) => setRecipientName(ev.target.value)}
                maxLength={RECIPIENT_NAME_MAX}
              />
              <TextField
                label="댓글 공개일"
                requiredMark
                type="date"
                value={rpTargetDate}
                onChange={(ev) => setRpTargetDate(ev.target.value)}
              />
              <div className="flex flex-col gap-1.5">
                <span className="text-[12px] font-semibold text-[var(--color-text-secondary)]">
                  캐릭터 사진
                </span>
                <p className="text-[12px] text-[var(--color-text-secondary)]">
                  선택 · JPG, PNG, WEBP
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <label className="inline-flex cursor-pointer items-center justify-center rounded-xl border border-[var(--color-border)] bg-white px-3 py-2 text-[13px] font-medium text-[var(--color-text-primary)] transition hover:bg-[var(--color-bg-subtle)]">
                    사진 선택
                    <input
                      key={recipientFileInputKey}
                      type="file"
                      name="rollingRecipientImage"
                      accept={RECIPIENT_IMAGE_ACCEPT}
                      className="sr-only"
                      onChange={handleRecipientImageChange}
                    />
                  </label>
                  {recipientImageFile ? (
                    <button
                      type="button"
                      onClick={clearRecipientImage}
                      className="text-[13px] font-medium text-rose-600 underline-offset-2 hover:underline"
                    >
                      제거
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
                <button
                  type="button"
                  onClick={() => void handleCharacterConvert()}
                  disabled={
                    !recipientImageFile || converting || submitting
                  }
                  className="inline-flex min-h-[2.5rem] w-full items-center justify-center rounded-[14px] border border-[var(--color-border)] bg-white text-[14px] font-semibold text-[var(--color-text-primary)] transition hover:bg-[var(--color-bg-subtle)] disabled:opacity-50"
                >
                  {converting ? "변환 중…" : "캐릭터로 변환"}
                </button>
                {convertedImageKey ? (
                  <p className="text-[12px] font-medium text-emerald-700">
                    캐릭터 이미지 준비됨 · 롤링페이퍼 만들기를 눌러 주세요.
                  </p>
                ) : recipientImageFile ? (
                  <p className="text-[12px] text-[var(--color-text-secondary)]">
                    사진 사용 시 위 버튼으로 변환한 뒤 만들 수 있어요.
                  </p>
                ) : null}
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
            disabled={
              submitting ||
              converting ||
              (kind === "rolling" &&
                !!(recipientImageFileRef.current ?? recipientImageFile) &&
                !convertedImageKey?.trim())
            }
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
      )}
    </WishlistCenterDialog>
  );
}
