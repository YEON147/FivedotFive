"use client";

import { ArrowSquareOut, Trash } from "@phosphor-icons/react";
import Link from "next/link";
import { useCallback, useEffect, useId, useMemo, useState } from "react";

import { SIDE_MENU_ICON_WRAP_ROSE } from "@/components/common/SideMenuPrimitives";
import {
  getMySavedRollingPapers,
  type SavedRollingPaperItem,
} from "@/features/rolling-paper/api";
import { deleteRollingPaper } from "@/features/wishlist/api";
import { clearWishlistPageSessionCache } from "@/features/wishlist/wishlist-session-cache";
import { WishlistCenterDialog } from "@/components/wishlist/WishlistCenterDialog";

export type SavedRollingPapersListModalProps = {
  open: boolean;
  onClose: () => void;
};

type SavedTabId = "all" | "CREATED" | "RECEIVED";

function sourceLabel(source: string): string {
  const s = source.trim().toUpperCase();
  if (s === "CREATED") return "내가 만든";
  if (s === "RECEIVED") return "선물받은";
  return source;
}

function formatSavedAt(iso: string): string {
  const d = new Date(iso.trim());
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function SavedRollingPapersListModal({
  open,
  onClose,
}: SavedRollingPapersListModalProps) {
  const titleId = useId();
  const deleteConfirmTitleId = useId();
  const [tab, setTab] = useState<SavedTabId>("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<SavedRollingPaperItem[]>([]);
  const [deletingSlug, setDeletingSlug] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<SavedRollingPaperItem | null>(
    null,
  );

  const reload = useCallback(async (quiet = false) => {
    if (!quiet) {
      setLoading(true);
    }
    setError(null);
    try {
      const res = await getMySavedRollingPapers();
      const raw = res.data?.saved;
      setItems(Array.isArray(raw) ? raw : []);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "목록을 불러오지 못했습니다.",
      );
      setItems([]);
    } finally {
      if (!quiet) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    void reload();
  }, [open, reload]);

  useEffect(() => {
    if (!open) {
      setTab("all");
      setDeletingSlug(null);
      setPendingDelete(null);
    }
  }, [open]);

  const filtered = useMemo(() => {
    if (tab === "all") return items;
    return items.filter(
      (row) => String(row.source ?? "").toUpperCase() === tab,
    );
  }, [items, tab]);

  const performDelete = useCallback(
    async (row: SavedRollingPaperItem) => {
      const slug = row.slug?.trim();
      if (!slug) return;
      setDeletingSlug(slug);
      setError(null);
      try {
        await deleteRollingPaper(slug);
        clearWishlistPageSessionCache();
        await reload(true);
      } catch (e) {
        setError(
          e instanceof Error ? e.message : "삭제하지 못했습니다.",
        );
      } finally {
        setDeletingSlug(null);
      }
    },
    [reload],
  );

  const handleConfirmDelete = useCallback(() => {
    const row = pendingDelete;
    if (!row) return;
    setPendingDelete(null);
    void performDelete(row);
  }, [pendingDelete, performDelete]);

  const tabBtn = (id: SavedTabId, label: string) => (
    <button
      key={id}
      type="button"
      role="tab"
      aria-selected={tab === id}
      className={`min-h-[40px] min-w-0 flex-1 rounded-[12px] px-2 py-2 text-center text-[12px] font-semibold transition-[background,box-shadow,color] sm:text-[13px] ${
        tab === id
          ? "bg-[var(--color-surface)] text-slate-900 shadow-sm ring-1 ring-black/[0.06]"
          : "text-slate-600 hover:text-slate-900"
      }`}
      onClick={() => setTab(id)}
    >
      {label}
    </button>
  );

  return (
    <>
      <WishlistCenterDialog
        open={open}
        onClose={onClose}
        title="저장한 롤링페이퍼"
        titleId={titleId}
        variant="static"
        staticStack="aboveMenu"
        closeLabel="닫기"
      >
        <div
          className="mt-3 flex gap-1 rounded-[14px] bg-[var(--color-bg-subtle)] p-1"
          role="tablist"
          aria-label="저장 구분"
        >
          {tabBtn("all", "전체")}
          {tabBtn("CREATED", "내가 만든")}
          {tabBtn("RECEIVED", "선물받은")}
        </div>

        <div className="mt-3 flex max-h-[min(calc(100svh-11rem),26rem)] flex-col overflow-y-auto overscroll-y-contain pb-[max(0.25rem,env(safe-area-inset-bottom,0px))] [-webkit-overflow-scrolling:touch] touch-pan-y sm:max-h-[min(380px,52vh)]">
          {loading ? (
            <p className="py-8 text-center text-[15px] leading-relaxed text-slate-500 sm:py-6 sm:text-[14px]">
              불러오는 중…
            </p>
          ) : error ? (
            <p className="border-l-[3px] border-rose-400 py-1.5 pl-3 text-[14px] leading-relaxed text-rose-700 sm:text-[13px]">
              {error}
            </p>
          ) : filtered.length === 0 ? (
            <p className="py-8 text-center text-[15px] leading-relaxed text-slate-500 sm:py-6 sm:text-[14px]">
              {items.length === 0
                ? "저장된 롤링페이퍼가 없습니다."
                : "이 탭에 해당하는 항목이 없습니다."}
            </p>
          ) : (
            <ul className="flex flex-col">
              {filtered.map((row) => (
                <li
                  key={row.slug}
                  className="flex min-h-[48px] items-center gap-1 border-b border-slate-200/90 last:border-b-0"
                >
                  <Link
                    href={`/rolling-paper/${encodeURIComponent(row.slug)}`}
                    onClick={onClose}
                    className="flex min-h-[48px] min-w-0 flex-1 flex-col justify-center gap-0.5 rounded-xl px-2 py-2 transition [-webkit-tap-highlight-color:transparent] [@media(pointer:coarse)]:bg-slate-50 [@media(pointer:fine)]:bg-transparent [@media(hover:hover)_and_(pointer:fine)]:hover:bg-slate-50 active:bg-slate-100/90 sm:min-h-[44px] sm:py-1.5 touch-manipulation"
                  >
                    <span className="flex min-w-0 items-start justify-between gap-2">
                      <span className="min-w-0 flex-1 truncate text-[15px] font-medium leading-snug text-slate-900">
                        {row.title?.trim() ? row.title : "(제목 없음)"}
                      </span>
                      <ArrowSquareOut
                        className="pointer-events-none mt-0.5 shrink-0 text-slate-600"
                        size={22}
                        weight="bold"
                        aria-hidden
                      />
                    </span>
                    <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[12px] text-slate-500">
                      <span className="font-medium text-violet-700">
                        {sourceLabel(String(row.source ?? ""))}
                      </span>
                      <span className="tabular-nums">
                        {formatSavedAt(row.savedAt ?? "")}
                      </span>
                    </span>
                  </Link>
                  <div className="flex shrink-0 items-center gap-1.5 pr-0.5 sm:gap-2">
                    <button
                      type="button"
                      onClick={() => setPendingDelete(row)}
                      disabled={deletingSlug != null}
                      className="inline-flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-xl p-1 transition [-webkit-tap-highlight-color:transparent] active:scale-[0.96] disabled:pointer-events-none disabled:opacity-40 touch-manipulation [@media(hover:hover)_and_(pointer:fine)]:hover:opacity-90"
                      aria-label="롤링페이퍼 삭제"
                    >
                      {deletingSlug === row.slug ? (
                        <span className={SIDE_MENU_ICON_WRAP_ROSE} aria-hidden>
                          <span className="text-[15px] font-semibold leading-none">
                            …
                          </span>
                        </span>
                      ) : (
                        <span className={SIDE_MENU_ICON_WRAP_ROSE} aria-hidden>
                          <Trash size={20} weight="bold" />
                        </span>
                      )}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </WishlistCenterDialog>

      <WishlistCenterDialog
        open={pendingDelete != null}
        onClose={() => setPendingDelete(null)}
        title="롤링페이퍼를 삭제할까요?"
        titleId={deleteConfirmTitleId}
        variant="static"
        staticStack="aboveDialogs"
        closeLabel="닫기"
        description={
          pendingDelete ? (
            <p className="text-[13px] leading-relaxed text-slate-500">
              {pendingDelete.title?.trim()
                ? pendingDelete.title.trim()
                : "(제목 없음)"}{" "}
              <span className="text-slate-400">
                · {sourceLabel(String(pendingDelete.source ?? ""))} — 복구할 수
                없습니다.
              </span>
            </p>
          ) : null
        }
      >
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setPendingDelete(null)}
            className="inline-flex min-h-[2.5rem] items-center justify-center rounded-xl border border-slate-200 bg-white text-[14px] font-medium text-slate-700 transition hover:bg-slate-50"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleConfirmDelete}
            className="inline-flex min-h-[2.5rem] items-center justify-center rounded-xl bg-rose-600 text-[14px] font-semibold text-white transition hover:bg-rose-700 active:scale-[0.99]"
          >
            삭제
          </button>
        </div>
      </WishlistCenterDialog>
    </>
  );
}
