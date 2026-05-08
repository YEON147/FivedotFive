"use client";

import { ArrowSquareOut, PencilSimple, Trash } from "@phosphor-icons/react";
import Link from "next/link";
import { useCallback, useEffect, useId, useMemo, useState } from "react";

import { EditBoardOrRollingPaperModal } from "@/components/common/EditBoardOrRollingPaperModal";
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
    <li className="flex gap-2">
      <Link
        href={entryHref(entry)}
        onClick={onNavigate}
        className="flex min-h-[3.25rem] min-w-0 flex-1 items-center gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-subtle)] px-3 py-2.5 transition hover:bg-[var(--color-surface)]"
      >
        <p className="min-w-0 flex-1 truncate text-[15px] font-medium text-[var(--color-text-primary)]">
          {entry.title?.trim() ? entry.title : "(제목 없음)"}
        </p>
        <ArrowSquareOut
          className="shrink-0 text-[var(--color-text-secondary)]"
          size={22}
          weight="bold"
          aria-hidden
        />
      </Link>
      <div className="flex shrink-0 gap-1.5">
        <button
          type="button"
          onClick={() => onEdit(entry)}
          disabled={deletingSlug != null}
          className="inline-flex h-auto min-w-[3rem] flex-col items-center justify-center gap-0.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-subtle)] px-2.5 py-2 text-[var(--color-text-secondary)] transition hover:bg-[var(--color-surface)] hover:text-[var(--color-primary-main)] disabled:pointer-events-none disabled:opacity-45"
          aria-label={`${typeLabel(entry.type)} 설정 수정`}
        >
          <PencilSimple size={22} weight="bold" aria-hidden />
          <span className="text-[10px] font-medium leading-tight">수정</span>
        </button>
        <button
          type="button"
          onClick={() => void onDelete(entry)}
          disabled={deletingSlug != null}
          className="inline-flex h-auto min-w-[3rem] flex-col items-center justify-center gap-0.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-subtle)] px-2.5 py-2 text-rose-600 transition hover:bg-rose-50 hover:text-rose-700 disabled:pointer-events-none disabled:opacity-45"
          aria-label={`${typeLabel(entry.type)} 삭제`}
        >
          {deletingSlug === entry.slug ? (
            <span className="text-[10px] font-medium leading-tight">…</span>
          ) : (
            <>
              <Trash size={22} weight="bold" aria-hidden />
              <span className="text-[10px] font-medium leading-tight">삭제</span>
            </>
          )}
        </button>
      </div>
    </li>
  );
}

export function MyBoardsListModal({ open, onClose }: MyBoardsListModalProps) {
  const titleId = useId();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<MyBoardListEntry[]>([]);
  const [editEntry, setEditEntry] = useState<MyBoardListEntry | null>(null);
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
      return;
    }
    void reloadList();
  }, [open, reloadList]);

  const handleDeleteEntry = useCallback(
    async (entry: MyBoardListEntry) => {
      const label = typeLabel(entry.type);
      const name = entry.title?.trim() ? `"${entry.title.trim()}"` : "(제목 없음)";
      const ok = window.confirm(
        `${label} ${name} 페이지를 삭제할까요?\n삭제하면 되돌릴 수 없습니다.`,
      );
      if (!ok) return;

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
        <div className="mt-4 flex max-h-[min(380px,52vh)] flex-col gap-2 overflow-y-auto overscroll-y-contain pr-0.5 [-webkit-overflow-scrolling:touch]">
          {loading ? (
            <p className="py-8 text-center text-body-sm text-[var(--color-text-secondary)]">
              불러오는 중…
            </p>
          ) : error ? (
            <p className="rounded-xl bg-rose-50 px-3 py-2.5 text-[13px] leading-snug text-rose-700 ring-1 ring-rose-100">
              {error}
            </p>
          ) : items.length === 0 ? (
            <p className="py-8 text-center text-body-sm text-[var(--color-text-secondary)]">
              아직 생성된 페이지가 없습니다.
            </p>
          ) : (
            <div className="flex flex-col gap-5">
              {wishItems.length > 0 ? (
                <section>
                  <h3 className="mb-2 border-b border-[var(--color-border)] pb-1.5 text-[12px] font-semibold tracking-wide text-violet-800">
                    위시보드
                  </h3>
                  <ul className="flex flex-col gap-2">
                    {wishItems.map((entry) => (
                      <BoardListRow
                        key={`${entry.type}-${entry.slug}`}
                        entry={entry}
                        onNavigate={onClose}
                        deletingSlug={deletingSlug}
                        onEdit={setEditEntry}
                        onDelete={handleDeleteEntry}
                      />
                    ))}
                  </ul>
                </section>
              ) : null}

              {rollingItems.length > 0 ? (
                <section>
                  <h3 className="mb-2 border-b border-[var(--color-border)] pb-1.5 text-[12px] font-semibold tracking-wide text-amber-900">
                    롤링페이퍼
                  </h3>
                  <ul className="flex flex-col gap-2">
                    {rollingItems.map((entry) => (
                      <BoardListRow
                        key={`${entry.type}-${entry.slug}`}
                        entry={entry}
                        onNavigate={onClose}
                        deletingSlug={deletingSlug}
                        onEdit={setEditEntry}
                        onDelete={handleDeleteEntry}
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
    </>
  );
}
