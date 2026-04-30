"use client";

import { CaretLeft, TextAlignJustify } from "@phosphor-icons/react";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { AppSideMenu } from "@/components/common/AppSideMenu";
import { NoticeReadOnlyDetail } from "@/components/notice/NoticeReadOnlyDetail";
import { WishlistCenterDialog } from "@/components/wishlist/WishlistCenterDialog";
import {
  deleteAdminNotice,
  fetchNoticeDetail,
  updateAdminNotice,
  type NoticeDetail,
} from "@/features/notice/api";
import { getMyProfile } from "@/features/user/api";
import { compressImagesForUpload } from "@/lib/images/compress-images-for-upload";
import { clearAccessToken, getAccessToken } from "@/lib/api/token-store";
import { shouldUseNativeImg } from "@/lib/native-img";
import {
  APP_MAIN_COLUMN,
  APP_MAIN_SCROLL_BODY,
  APP_SHELL_STAGE,
  APP_SHELL_VIEWPORT_MAIN,
} from "@/lib/constants/app-shell-layout";
import {
  PAGE_HEADER_BACK_BUTTON,
  PAGE_HEADER_LEADING_CLUSTER,
  PAGE_HEADER_MENU_BUTTON,
  PAGE_HEADER_ROW,
  PAGE_HEADER_TITLE_INLINE,
} from "@/lib/constants/page-header";

function datetimeLocalToApiString(value: string): string {
  if (!value) return "";
  return value.length === 16 ? `${value}:00` : value;
}

function isoToDatetimeLocalValue(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const h = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${y}-${m}-${day}T${h}:${min}`;
}

export default function NoticeDetailPage() {
  const router = useRouter();
  const params = useParams();
  const idParam = params?.id;
  const noticeId = useMemo(() => {
    const raw = Array.isArray(idParam) ? idParam[0] : idParam;
    const n = raw != null ? Number.parseInt(String(raw), 10) : Number.NaN;
    return Number.isFinite(n) && n > 0 ? n : null;
  }, [idParam]);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [gate, setGate] = useState<"loading" | "ready" | "notfound">("loading");
  const [detail, setDetail] = useState<NoticeDetail | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const [title, setTitle] = useState("");
  const [bannerText, setBannerText] = useState("");
  const [isPinned, setIsPinned] = useState(false);
  const [startAtLocal, setStartAtLocal] = useState("");
  const [endAtLocal, setEndAtLocal] = useState("");
  const [files, setFiles] = useState<File[]>([]);

  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteModalError, setDeleteModalError] = useState<string | null>(null);

  useEffect(() => {
    if (noticeId == null) {
      router.replace("/notice");
    }
  }, [noticeId, router]);

  useEffect(() => {
    if (noticeId == null) return;

    let cancelled = false;
    void (async () => {
      setGate("loading");
      setLoadError(null);

      const token = getAccessToken();
      if (token) {
        try {
          const p = await getMyProfile();
          if (!cancelled) setIsAdmin(p.role === "ADMIN");
        } catch {
          if (!cancelled) setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
      }

      try {
        const res = await fetchNoticeDetail(noticeId);
        if (cancelled) return;
        if (!res.success || !res.data) {
          throw new Error(res.message ?? "공지를 불러오지 못했습니다.");
        }
        const d = res.data;
        setDetail(d);
        setTitle(d.title);
        setBannerText(d.bannerText ?? "");
        setIsPinned(d.isPinned);
        setStartAtLocal(isoToDatetimeLocalValue(d.startAt));
        setEndAtLocal(isoToDatetimeLocalValue(d.endAt));
        setGate("ready");
      } catch (e) {
        if (cancelled) return;
        const message =
          e instanceof Error ? e.message : "공지를 불러오는 중 오류가 발생했습니다.";
        setLoadError(message);
        setDetail(null);
        setGate("notfound");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [noticeId]);

  const handleLogout = useCallback(() => {
    clearAccessToken();
    setIsSidebarOpen(false);
    router.push("/login");
  }, [router]);

  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen((prev) => !prev);
  }, []);

  const handleHeaderBack = useCallback(() => {
    router.replace("/notice");
  }, [router]);

  const onFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const list = e.target.files;
    setFiles(list ? Array.from(list) : []);
  }, []);

  const onSubmitEdit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (noticeId == null) return;
      setSubmitError(null);

      const t = title.trim();
      if (!t) {
        setSubmitError("제목을 입력해 주세요.");
        return;
      }
      const startAt = datetimeLocalToApiString(startAtLocal);
      const endAt = datetimeLocalToApiString(endAtLocal);
      if (!startAt || !endAt) {
        setSubmitError("노출 시작·종료 일시를 모두 선택해 주세요.");
        return;
      }

      setIsSubmitting(true);
      try {
        const imagesToSend =
          files.length > 0 ? await compressImagesForUpload(files) : undefined;
        const res = await updateAdminNotice(
          noticeId,
          {
            title: t,
            bannerText: bannerText.trim() || undefined,
            isPinned,
            startAt,
            endAt,
          },
          imagesToSend,
        );
        if (!res.success) {
          throw new Error(res.message ?? "수정에 실패했습니다.");
        }
        router.replace("/notice");
      } catch (err) {
        setSubmitError(
          err instanceof Error ? err.message : "수정 중 오류가 발생했습니다.",
        );
      } finally {
        setIsSubmitting(false);
      }
    },
    [bannerText, endAtLocal, files, isPinned, noticeId, router, startAtLocal, title],
  );

  const openDeleteConfirm = useCallback(() => {
    setDeleteModalError(null);
    setDeleteConfirmOpen(true);
  }, []);

  const closeDeleteDialog = useCallback(() => {
    if (isDeleting) return;
    setDeleteModalError(null);
    setDeleteConfirmOpen(false);
  }, [isDeleting]);

  const handleDeleteConfirm = useCallback(async () => {
    if (noticeId == null) return;
    setDeleteModalError(null);
    setIsDeleting(true);
    try {
      const res = await deleteAdminNotice(noticeId);
      if (!res.success) {
        throw new Error(res.message ?? "삭제에 실패했습니다.");
      }
      setDeleteConfirmOpen(false);
      router.replace("/notice");
    } catch (err) {
      setDeleteModalError(
        err instanceof Error ? err.message : "삭제 중 오류가 발생했습니다.",
      );
    } finally {
      setIsDeleting(false);
    }
  }, [noticeId, router]);

  const fieldClass =
    "mt-1 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 text-body text-[var(--color-text-primary)] outline-none ring-0 placeholder:text-[var(--color-text-secondary)] focus:border-[#7B61FF]";

  if (noticeId == null) {
    return null;
  }

  if (gate === "loading") {
    return (
      <main className={APP_SHELL_VIEWPORT_MAIN}>
        <div className={APP_SHELL_STAGE}>
          <div className={`${APP_MAIN_COLUMN} px-2 pt-8 sm:px-3`}>
            <p className="text-body text-[var(--color-text-secondary)]">불러오는 중…</p>
          </div>
        </div>
      </main>
    );
  }

  if (gate === "notfound" || !detail) {
    return (
      <main className={APP_SHELL_VIEWPORT_MAIN}>
        <AppSideMenu
          open={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          onLogout={handleLogout}
        />
        <div className={APP_SHELL_STAGE}>
          <div className={`${APP_MAIN_COLUMN} px-2 pt-4 sm:px-3`}>
          <header className={PAGE_HEADER_ROW}>
            <div className={PAGE_HEADER_LEADING_CLUSTER}>
              <button
                type="button"
                onClick={handleHeaderBack}
                className={PAGE_HEADER_BACK_BUTTON}
                aria-label="공지사항 목록으로"
              >
                <CaretLeft size={22} weight="bold" />
              </button>
              <h1 className={PAGE_HEADER_TITLE_INLINE}>공지</h1>
            </div>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                toggleSidebar();
              }}
              className={PAGE_HEADER_MENU_BUTTON}
              aria-label="메뉴 열기"
              aria-expanded={isSidebarOpen}
            >
              <TextAlignJustify size={23} weight="bold" />
            </button>
          </header>
          <p className="mt-6 text-body text-[var(--color-text-secondary)]">
            {loadError ?? "공지를 찾을 수 없습니다."}
          </p>
          </div>
        </div>
      </main>
    );
  }

  const sortedImages = [...detail.images].sort((a, b) => a.displayOrder - b.displayOrder);

  return (
    <main className={APP_SHELL_VIEWPORT_MAIN}>
      <AppSideMenu
        open={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onLogout={handleLogout}
      />

      <div className={APP_SHELL_STAGE}>
        <div className={APP_MAIN_COLUMN}>
          <header className={PAGE_HEADER_ROW}>
            <div className={PAGE_HEADER_LEADING_CLUSTER}>
              <button
                type="button"
                onClick={handleHeaderBack}
                className={PAGE_HEADER_BACK_BUTTON}
                aria-label="공지사항 목록으로"
              >
                <CaretLeft size={22} weight="bold" />
              </button>

              <h1 className={PAGE_HEADER_TITLE_INLINE}>
                {isAdmin ? "공지 작성" : "공지"}
              </h1>
            </div>

            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                toggleSidebar();
              }}
              className={PAGE_HEADER_MENU_BUTTON}
              aria-label="메뉴 열기"
              aria-expanded={isSidebarOpen}
            >
              <TextAlignJustify size={23} weight="bold" />
            </button>
          </header>

          <div className={APP_MAIN_SCROLL_BODY}>
            {isAdmin ? (
              <>
                <form onSubmit={onSubmitEdit} className="flex flex-col gap-4">
                  <label className="block text-body font-medium text-[var(--color-text-primary)]">
                    제목 <span className="text-rose-600">*</span>
                    <input
                      type="text"
                      value={title}
                      onChange={(ev) => setTitle(ev.target.value)}
                      className={fieldClass}
                      placeholder="공지 제목"
                      autoComplete="off"
                    />
                  </label>

                  <label className="block text-body font-medium text-[var(--color-text-primary)]">
                    배너 문구{" "}
                    <span className="text-xs font-normal text-[var(--color-text-secondary)]">
                      (선택)
                    </span>
                    <input
                      type="text"
                      value={bannerText}
                      onChange={(ev) => setBannerText(ev.target.value)}
                      className={fieldClass}
                      placeholder="비우면 배너에 표시하지 않습니다"
                      autoComplete="off"
                    />
                  </label>

                  <label className="flex cursor-pointer items-center gap-2 text-body font-medium text-[var(--color-text-primary)]">
                    <input
                      type="checkbox"
                      checked={isPinned}
                      onChange={(ev) => setIsPinned(ev.target.checked)}
                      className="size-4 rounded border-[var(--color-border)] text-[#7B61FF] focus:ring-[#7B61FF]"
                    />
                    상단 고정
                  </label>

                  <label className="block text-body font-medium text-[var(--color-text-primary)]">
                    노출 시작 <span className="text-rose-600">*</span>
                    <input
                      type="datetime-local"
                      value={startAtLocal}
                      onChange={(ev) => setStartAtLocal(ev.target.value)}
                      className={fieldClass}
                    />
                  </label>

                  <label className="block text-body font-medium text-[var(--color-text-primary)]">
                    노출 종료 <span className="text-rose-600">*</span>
                    <input
                      type="datetime-local"
                      value={endAtLocal}
                      onChange={(ev) => setEndAtLocal(ev.target.value)}
                      className={fieldClass}
                    />
                  </label>

                  <div className="block text-body font-medium text-[var(--color-text-primary)]">
                    이미지{" "}
                    <span className="text-xs font-normal text-[var(--color-text-secondary)]">
                      (선택 — 새 파일을 넣으면 기존 이미지가 모두 교체됩니다)
                    </span>
                    <p className="mb-1 text-xs font-normal text-[var(--color-text-secondary)]">
                      파일명 오름차순으로 본문 순서가 정해집니다. 여러 장 선택 가능합니다. 큰 이미지는 전송 전
                      자동으로 줄입니다(JPEG·최대 변 2048px).
                    </p>
                    {sortedImages.length > 0 ? (
                      <ul className="mt-2 flex flex-col gap-2">
                        {sortedImages.map((img) => (
                          <li key={`${img.displayOrder}-${img.imageUrl}`}>
                            {shouldUseNativeImg(img.imageUrl) ? (
                              <img
                                src={img.imageUrl}
                                alt=""
                                className="max-h-48 w-full object-contain"
                              />
                            ) : (
                              <Image
                                src={img.imageUrl}
                                alt=""
                                width={1200}
                                height={800}
                                sizes="(max-width: 768px) 100vw, min(42rem, 90vw)"
                                className="max-h-48 w-full object-contain"
                              />
                            )}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={onFileChange}
                      className="mt-2 block w-full text-sm text-[var(--color-text-primary)] file:mr-3 file:rounded-lg file:border-0 file:bg-[#7B61FF]/15 file:px-3 file:py-2 file:text-sm file:font-medium file:text-[#7B61FF]"
                    />
                    {files.length > 0 ? (
                      <ul className="mt-2 space-y-1 text-xs text-[var(--color-text-secondary)]">
                        {[...files]
                          .sort((a, b) =>
                            a.name.localeCompare(b.name, undefined, {
                              numeric: true,
                              sensitivity: "base",
                            }),
                          )
                          .map((f) => (
                            <li key={`${f.name}-${f.size}`}>{f.name}</li>
                          ))}
                      </ul>
                    ) : null}
                  </div>

                  {submitError ? (
                    <p className="text-sm text-rose-600" role="alert">
                      {submitError}
                    </p>
                  ) : null}

                  <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:gap-3">
                    <button
                      type="submit"
                      disabled={isSubmitting || isDeleting}
                      className="rounded-xl bg-[#7B61FF] px-4 py-3 text-body font-semibold text-white transition hover:opacity-95 disabled:opacity-50"
                    >
                      {isSubmitting ? "수정 중…" : "수정"}
                    </button>
                    <button
                      type="button"
                      onClick={openDeleteConfirm}
                      disabled={isSubmitting}
                      className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-body font-semibold text-rose-700 transition hover:bg-rose-100 disabled:opacity-50"
                    >
                      삭제
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <NoticeReadOnlyDetail detail={detail} summaryOnly />
            )}
          </div>
        </div>
      </div>

      <WishlistCenterDialog
        variant="static"
        open={deleteConfirmOpen}
        onClose={closeDeleteDialog}
        title="공지를 삭제할까요?"
        titleId="notice-delete-confirm-title"
        description={
          <span className="block leading-relaxed">
            삭제하면 되돌릴 수 없습니다.
          </span>
        }
      >
        <div className="mt-5 flex flex-col gap-3">
          {deleteModalError ? (
            <p className="text-center text-xs text-red-500">{deleteModalError}</p>
          ) : null}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={closeDeleteDialog}
              disabled={isDeleting}
              className="rounded-[14px] border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-40"
            >
              취소
            </button>
            <button
              type="button"
              onClick={() => void handleDeleteConfirm()}
              disabled={isDeleting}
              className="rounded-[14px] bg-rose-500 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-500 disabled:opacity-40"
            >
              {isDeleting ? "삭제 중…" : "삭제하기"}
            </button>
          </div>
        </div>
      </WishlistCenterDialog>
    </main>
  );
}
