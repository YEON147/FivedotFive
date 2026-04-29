"use client";

import { CaretLeft, TextAlignJustify } from "@phosphor-icons/react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { AppSideMenu } from "@/components/common/AppSideMenu";
import { createAdminNotice } from "@/features/notice/api";
import { getMyProfile } from "@/features/user/api";
import { compressImagesForUpload } from "@/lib/images/compress-images-for-upload";
import { clearAccessToken, getAccessToken } from "@/lib/api/token-store";
import {
  APP_MAIN_COLUMN,
  APP_MAIN_SCROLL_BODY,
  APP_SHELL_STAGE,
  APP_SHELL_VIEWPORT_MAIN,
} from "@/lib/constants/app-shell-layout";
import {
  PAGE_HEADER_BACK_BUTTON,
  PAGE_HEADER_MENU_BUTTON,
  PAGE_HEADER_ROW,
} from "@/lib/constants/page-header";

function datetimeLocalToApiString(value: string): string {
  if (!value) return "";
  return value.length === 16 ? `${value}:00` : value;
}

export default function NoticeWritePage() {
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [gate, setGate] = useState<"loading" | "ready">("loading");

  const [title, setTitle] = useState("");
  const [bannerText, setBannerText] = useState("");
  const [isPinned, setIsPinned] = useState(false);
  const [startAtLocal, setStartAtLocal] = useState("");
  const [endAtLocal, setEndAtLocal] = useState("");
  const [files, setFiles] = useState<File[]>([]);

  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!getAccessToken()) {
      router.replace("/login?next=%2Fnotice%2Fwrite");
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const p = await getMyProfile();
        if (cancelled) return;
        if (p.role !== "ADMIN") {
          router.replace("/notice");
          return;
        }
        setGate("ready");
      } catch {
        if (!cancelled) router.replace("/login?next=%2Fnotice%2Fwrite");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  const handleLogout = useCallback(() => {
    clearAccessToken();
    setIsSidebarOpen(false);
    router.push("/login");
  }, [router]);

  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen((prev) => !prev);
  }, []);

  /** push 하면 히스토리가 [목록→작성→목록] 이 되어 목록에서 뒤로 시 다시 작성으로 돌아감 → replace */
  const handleHeaderBack = useCallback(() => {
    router.replace("/notice");
  }, [router]);

  const onFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const list = e.target.files;
    setFiles(list ? Array.from(list) : []);
  }, []);

  const onSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
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
      if (files.length === 0) {
        setSubmitError("이미지를 1개 이상 선택해 주세요.");
        return;
      }

      setIsSubmitting(true);
      try {
        const imagesToSend = await compressImagesForUpload(files);
        const res = await createAdminNotice(
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
          throw new Error(res.message ?? "등록에 실패했습니다.");
        }
        router.replace("/notice");
      } catch (err) {
        setSubmitError(
          err instanceof Error ? err.message : "등록 중 오류가 발생했습니다.",
        );
      } finally {
        setIsSubmitting(false);
      }
    },
    [bannerText, endAtLocal, files, isPinned, router, startAtLocal, title],
  );

  const fieldClass =
    "mt-1 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 text-body text-[var(--color-text-primary)] outline-none ring-0 placeholder:text-[var(--color-text-secondary)] focus:border-[#7B61FF]";

  if (gate === "loading") {
    return (
      <main className={APP_SHELL_VIEWPORT_MAIN}>
        <div className={APP_SHELL_STAGE}>
          <div className={`${APP_MAIN_COLUMN} px-2 pt-8 sm:px-3`}>
            <p className="text-body text-[var(--color-text-secondary)]">확인 중…</p>
          </div>
        </div>
      </main>
    );
  }

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
            <button
              type="button"
              onClick={handleHeaderBack}
              className={PAGE_HEADER_BACK_BUTTON}
              aria-label="공지사항 목록으로"
            >
              <CaretLeft size={22} weight="bold" />
            </button>

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
            <h1 className="text-h2 mb-4 text-[var(--color-text-primary)]">공지 작성</h1>

            <form onSubmit={onSubmit} className="flex flex-col gap-4">
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
                배너 문구 <span className="text-xs font-normal text-[var(--color-text-secondary)]">(선택)</span>
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
                이미지 <span className="text-rose-600">*</span>
                <p className="mb-1 text-xs font-normal text-[var(--color-text-secondary)]">
                  파일명 오름차순으로 본문 순서가 정해집니다. 여러 장 선택 가능합니다. 큰 이미지는 전송 전
                  자동으로 줄입니다(JPEG·최대 변 2048px).
                </p>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={onFileChange}
                  className="mt-1 block w-full text-sm text-[var(--color-text-primary)] file:mr-3 file:rounded-lg file:border-0 file:bg-[#7B61FF]/15 file:px-3 file:py-2 file:text-sm file:font-medium file:text-[#7B61FF]"
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
                  disabled={isSubmitting}
                  className="rounded-xl bg-[#7B61FF] px-4 py-3 text-body font-semibold text-white transition hover:opacity-95 disabled:opacity-50"
                >
                  {isSubmitting ? "등록 중…" : "등록"}
                </button>
                <Link
                  href="/notice"
                  replace
                  className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-center text-body font-medium text-[var(--color-text-primary)] transition hover:bg-[var(--color-bg-subtle)]"
                >
                  취소
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}
