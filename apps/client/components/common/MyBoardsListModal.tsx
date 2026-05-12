"use client";

import { ArrowSquareOut, PencilSimple, Trash } from "@phosphor-icons/react";
import Link from "next/link";
import { useCallback, useEffect, useId, useMemo, useState } from "react";

import { EditBoardOrRollingPaperModal } from "@/components/common/EditBoardOrRollingPaperModal";
import {
  SIDE_MENU_ICON_WRAP_PRIMARY,
  SIDE_MENU_ICON_WRAP_ROSE,
} from "@/components/common/SideMenuPrimitives";
import { WishlistCenterDialog } from "@/components/wishlist/WishlistCenterDialog";
import { deleteRollingPaper, deleteWishBoard, getMyBoardsAll } from "@/features/wishlist/api";
import type { MyBoardListEntry } from "@/features/wishlist/types";
import { isRollingPaperListType, listEntryHref } from "@/lib/board-entry-path";

function entryHref(entry: MyBoardListEntry): string {
  return listEntryHref(entry.type, entry.slug);
}

function typeLabel(type: string): string {
  return isRollingPaperListType(type) ? "롤링페이퍼" : "위시보드";
}

function coerceIsoDate(v: unknown): string {
  if (v == null || v === "") return "";
  if (typeof v === "string") return v.slice(0, 10);
  if (Array.isArray(v) && v.length >= 3) {
    const y = Number(v[0]);
    const m = Number(v[1]);
    const d = Number(v[2]);
    return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  }
  return "";
}

function normalizeBoardAllList(raw: unknown): MyBoardListEntry[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((row) => {
    const o = row && typeof row === "object" ? (row as Record<string, unknown>) : {};
    const createdRaw = o.createdAt;
    const createdAt =
      typeof createdRaw === "string"
        ? createdRaw
        : createdRaw != null
          ? String(createdRaw)
          : "";
    const td = coerceIsoDate(o.targetDate);
    return {
      type: String(o.type ?? ""),
      slug: String(o.slug ?? ""),
      title: o.title == null ? null : String(o.title),
      createdAt,
      targetDate: td || null,
      isPublic: typeof o.isPublic === "boolean" ? o.isPublic : undefined,
      recipientName: o.recipientName == null ? null : String(o.recipientName),
      imageKey: o.imageKey == null ? null : String(o.imageKey),
      isCommentPublic:
        typeof o.isCommentPublic === "boolean" ? o.isCommentPublic : undefined,
    };
  });
}

export type MyBoardsListModalProps = {
  open: boolean;
  onClose: () => void;
};

type BoardListRowProps = {
  entry: MyBoardListEntry;
  onNavigate: () => void;
  deletingSlug: string | null;
  onEdit: (entry: MyBoardListEntry) => void;
  onDelete: (entry: MyBoardListEntry) => void;
};

function BoardListRow({
  entry,
  onNavigate,
  deletingSlug,
  onEdit,
  onDelete,
}: BoardListRowProps) {
  return (
    <li className="flex min-h-[48px] items-center gap-1 border-b border-slate-200/90 last:border-b-0">
      <Link
        href={entryHref(entry)}
        onClick={onNavigate}
        className="flex min-h-[48px] min-w-0 flex-1 items-center gap-2 rounded-xl px-2 py-2 transition [-webkit-tap-highlight-color:transparent] [@media(pointer:coarse)]:bg-slate-50 [@media(pointer:fine)]:bg-transparent [@media(hover:hover)_and_(pointer:fine)]:hover:bg-slate-50 active:bg-slate-100/90 sm:min-h-[44px] sm:py-1.5 touch-manipulation"
      >
        <p className="min-w-0 flex-1 truncate text-[15px] font-medium leading-snug text-slate-900">
          {entry.title?.trim() ? entry.title : "(제목 없음)"}
        </p>
        <ArrowSquareOut
          className="pointer-events-none shrink-0 text-slate-600"
          size={22}
          weight="bold"
          aria-hidden
        />
      </Link>
      <div className="flex shrink-0 items-center gap-1.5 pr-0.5 sm:gap-2">
        <button
          type="button"
          onClick={() => onEdit(entry)}
          disabled={deletingSlug != null}
          className="inline-flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-xl p-1 transition [-webkit-tap-highlight-color:transparent] active:scale-[0.96] disabled:pointer-events-none disabled:opacity-40 touch-manipulation [@media(hover:hover)_and_(pointer:fine)]:hover:opacity-90"
          aria-label={`${typeLabel(entry.type)} 설정 수정`}
        >
          <span className={SIDE_MENU_ICON_WRAP_PRIMARY} aria-hidden>
            <PencilSimple size={20} weight="bold" />
          </span>
        </button>
        <button
          type="button"
          onClick={() => void onDelete(entry)}
          disabled={deletingSlug != null}
          className="inline-flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-xl p-1 transition [-webkit-tap-highlight-color:transparent] active:scale-[0.96] disabled:pointer-events-none disabled:opacity-40 touch-manipulation [@media(hover:hover)_and_(pointer:fine)]:hover:opacity-90"
          aria-label={`${typeLabel(entry.type)} 삭제`}
        >
          {deletingSlug === entry.slug ? (
            <span className={SIDE_MENU_ICON_WRAP_ROSE} aria-hidden>
              <span className="text-[15px] font-semibold leading-none">…</span>
            </span>
          ) : (
            <span className={SIDE_MENU_ICON_WRAP_ROSE} aria-hidden>
              <Trash size={20} weight="bold" />
            </span>
          )}
        </button>
      </div>
    </li>
  );
}

export function MyBoardsListModal({ open, onClose }: MyBoardsListModalProps) {
  const titleId = useId();
  const deleteConfirmTitleId = useId();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<MyBoardListEntry[]>([]);
  const [editEntry, setEditEntry] = useState<MyBoardListEntry | null>(null);
  /** 삭제 확인 모달에 표시할 항목 */
  const [pendingDeleteEntry, setPendingDeleteEntry] = useState<MyBoardListEntry | null>(null);
  /** 삭제 요청 중인 슬러그 (중복 클릭 방지) */
  const [deletingSlug, setDeletingSlug] = useState<string | null>(null);

  const reloadList = useCallback(async (quiet = false) => {
    if (!quiet) {
      setLoading(true);
    }
    setError(null);
    try {
      const res = await getMyBoardsAll();
      setItems(normalizeBoardAllList(res.data));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "목록을 불러오지 못했습니다.");
      setItems([]);
    } finally {
      if (!quiet) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    if (!open) {
      setEditEntry(null);
      setDeletingSlug(null);
      setPendingDeleteEntry(null);
      return;
    }
    void reloadList();
  }, [open, reloadList]);

  const performDeleteEntry = useCallback(
    async (entry: MyBoardListEntry) => {
      setDeletingSlug(entry.slug);
      setError(null);
      try {
        if (isRollingPaperListType(entry.type)) {
          await deleteRollingPaper(entry.slug);
        } else {
          await deleteWishBoard(entry.slug);
        }
        if (editEntry?.slug === entry.slug) {
          setEditEntry(null);
        }
        await reloadList(true);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "삭제하지 못했습니다.");
      } finally {
        setDeletingSlug(null);
      }
    },
    [editEntry, reloadList],
  );

  const requestDeleteEntry = useCallback((entry: MyBoardListEntry) => {
    setPendingDeleteEntry(entry);
  }, []);

  const handleConfirmDelete = useCallback(() => {
    const entry = pendingDeleteEntry;
    if (!entry) return;
    setPendingDeleteEntry(null);
    void performDeleteEntry(entry);
  }, [pendingDeleteEntry, performDeleteEntry]);

  const wishItems = useMemo(
    () => items.filter((e) => !isRollingPaperListType(e.type)),
    [items],
  );
  const rollingItems = useMemo(
    () => items.filter((e) => isRollingPaperListType(e.type)),
    [items],
  );

  return (
    <>
      <WishlistCenterDialog
        open={open}
        onClose={onClose}
        title="내 페이지 목록"
        titleId={titleId}
        variant="static"
        staticStack="aboveMenu"
        closeLabel="닫기"
      >
        <div className="mt-2 flex max-h-[min(calc(100svh-11rem),26rem)] flex-col overflow-y-auto overscroll-y-contain pb-[max(0.25rem,env(safe-area-inset-bottom,0px))] [-webkit-overflow-scrolling:touch] touch-pan-y sm:max-h-[min(380px,52vh)]">
          {loading ? (
            <p className="py-8 text-center text-[15px] leading-relaxed text-slate-500 sm:py-6 sm:text-[14px]">
              불러오는 중…
            </p>
          ) : error ? (
            <p className="border-l-[3px] border-rose-400 py-1.5 pl-3 text-[14px] leading-relaxed text-rose-700 sm:text-[13px]">
              {error}
            </p>
          ) : items.length === 0 ? (
            <p className="py-8 text-center text-[15px] leading-relaxed text-slate-500 sm:py-6 sm:text-[14px]">
              아직 생성된 페이지가 없습니다.
            </p>
          ) : (
            <div className="flex flex-col gap-4">
              {wishItems.length > 0 ? (
                <section>
                  <h3 className="mb-1 text-[12px] font-semibold uppercase tracking-[0.1em] text-violet-700 sm:mb-0.5 sm:text-[11px] sm:tracking-[0.12em]">
                    위시보드
                  </h3>
                  <ul className="flex flex-col">
                    {wishItems.map((entry) => (
                      <BoardListRow
                        key={`${entry.type}-${entry.slug}`}
                        entry={entry}
                        onNavigate={onClose}
                        deletingSlug={deletingSlug}
                        onEdit={setEditEntry}
                        onDelete={requestDeleteEntry}
                      />
                    ))}
                  </ul>
                </section>
              ) : null}

              {rollingItems.length > 0 ? (
                <section>
                  <h3 className="mb-1 text-[12px] font-semibold uppercase tracking-[0.1em] text-amber-900 sm:mb-0.5 sm:text-[11px] sm:tracking-[0.12em]">
                    롤링페이퍼
                  </h3>
                  <ul className="flex flex-col">
                    {rollingItems.map((entry) => (
                      <BoardListRow
                        key={`${entry.type}-${entry.slug}`}
                        entry={entry}
                        onNavigate={onClose}
                        deletingSlug={deletingSlug}
                        onEdit={setEditEntry}
                        onDelete={requestDeleteEntry}
                      />
                    ))}
                  </ul>
                </section>
              ) : null}
            </div>
          )}
        </div>
      </WishlistCenterDialog>

      <EditBoardOrRollingPaperModal
        open={editEntry != null}
        onClose={() => setEditEntry(null)}
        entry={editEntry}
        onSaved={() => void reloadList(true)}
      />

      <WishlistCenterDialog
        open={pendingDeleteEntry != null}
        onClose={() => setPendingDeleteEntry(null)}
        title="보드를 삭제할까요?"
        titleId={deleteConfirmTitleId}
        variant="static"
        staticStack="aboveDialogs"
        closeLabel="닫기"
        description={
          pendingDeleteEntry ? (
            <p className="text-[13px] leading-relaxed text-slate-500">
              {typeLabel(pendingDeleteEntry.type)}
              {pendingDeleteEntry.title?.trim()
                ? ` · ${pendingDeleteEntry.title.trim()}`
                : " · (제목 없음)"}
              <span className="text-slate-400"> — 복구할 수 없습니다.</span>
            </p>
          ) : null
        }
      >
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setPendingDeleteEntry(null)}
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
