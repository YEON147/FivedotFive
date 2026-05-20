"use client";

import { ArrowSquareOut, Trash } from "@phosphor-icons/react";
import Link from "next/link";
import { Fragment, useCallback, useEffect, useId, useMemo, useState } from "react";

import { SIDE_MENU_ICON_WRAP_ROSE } from "@/components/common/SideMenuPrimitives";
import {
  deleteSavedRollingPaper,
  deleteSavedWishBoard,
  getMySavedWishBoards,
  type SavedWishBoardItem,
} from "@/features/wishlist/api";
import {
  getMySavedRollingPapers,
  type SavedRollingPaperItem,
} from "@/features/rolling-paper/api";
import { clearWishlistPageSessionCache } from "@/features/wishlist/wishlist-session-cache";
import { WishlistCenterDialog } from "@/components/wishlist/WishlistCenterDialog";

export type SavedRollingPapersListModalProps = {
  open: boolean;
  onClose: () => void;
};

type SavedRollingTabId = "all" | "CREATED" | "RECEIVED";
type SavedPrimaryTabId = "rolling" | "wish";

type PendingDelete =
  | { kind: "rolling"; row: SavedRollingPaperItem }
  | { kind: "wish"; row: SavedWishBoardItem };

function sourceLabel(source: string): string {
  const s = source.trim().toUpperCase();
  if (s === "CREATED") return "내가 만든";
  if (s === "RECEIVED") return "선물받은";
  return source;
}

/** 상세 이동 링크 — 회색 칩 배경 없이 텍스트·아이콘만 */
const SAVED_BOARD_LIST_LINK_CLASS =
  "flex min-h-[48px] min-w-0 flex-1 items-center gap-2 rounded-xl bg-transparent px-2 py-2 transition [-webkit-tap-highlight-color:transparent] sm:min-h-[44px] sm:py-1.5 touch-manipulation";

const SAVED_MODAL_SUB_TAB_SLOT_CLASS = "mt-3 min-h-[40px] shrink-0";

const SAVED_MODAL_SUB_TAB_STRIP_CLASS =
  "flex h-full min-h-[40px] items-center";

/** 탭 사이 짧은 세로 구분선 */
const SAVED_MODAL_SUB_TAB_VDIVIDER_CLASS =
  "mx-0.5 h-5 w-px shrink-0 bg-slate-200";

const ROLLING_SAVED_SUB_TABS: { id: SavedRollingTabId; label: string }[] = [
  { id: "all", label: "전체" },
  { id: "CREATED", label: "내가 만든" },
  { id: "RECEIVED", label: "선물받은" },
];

/** 목록 행 `min-h-[48px]` × 4 — 롤링은 하위 탭 아래, 위시는 그 높이만큼 목록에 합쳐 모달 전체 높이 동일 */
const SAVED_BOARD_LIST_SCROLL_BASE =
  "scrollbar-hidden mt-1.5 flex shrink-0 flex-col overflow-y-auto overscroll-y-contain pb-[max(0.25rem,env(safe-area-inset-bottom,0px))] [-webkit-overflow-scrolling:touch] touch-pan-y";

const SAVED_BOARD_LIST_SCROLL_ROLLING_CLASS = `${SAVED_BOARD_LIST_SCROLL_BASE} h-[12rem] min-h-[12rem] max-h-[12rem]`;

/** `12rem` + 하위 탭 슬롯(`mt-3` + `min-h-[40px]`) */
const SAVED_BOARD_LIST_SCROLL_WISH_CLASS = `${SAVED_BOARD_LIST_SCROLL_BASE} h-[calc(12rem+2.5rem+0.75rem)] min-h-[calc(12rem+2.5rem+0.75rem)] max-h-[calc(12rem+2.5rem+0.75rem)]`;

function savedModalSubTabButtonClass(active: boolean): string {
  return [
    "min-h-[40px] min-w-0 flex-1 px-2 py-2 text-center text-[12px] font-semibold transition-colors sm:text-[13px]",
    active ? "text-[#5B4ADB]" : "text-slate-500 hover:text-slate-800",
  ].join(" ");
}

function formatSavedAt(iso: string): string {
  const raw = iso.trim();
  if (!raw) return "";
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return raw;
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
  const [primaryTab, setPrimaryTab] = useState<SavedPrimaryTabId>("rolling");
  const [rollingTab, setRollingTab] = useState<SavedRollingTabId>("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rollingItems, setRollingItems] = useState<SavedRollingPaperItem[]>([]);
  const [wishItems, setWishItems] = useState<SavedWishBoardItem[]>([]);
  const [deletingSlug, setDeletingSlug] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null);

  const reload = useCallback(async (quiet = false) => {
    if (!quiet) {
      setLoading(true);
    }
    setError(null);
    try {
      const [rollingRes, wishRes] = await Promise.all([
        getMySavedRollingPapers(),
        getMySavedWishBoards(),
      ]);
      const rollingRaw = rollingRes.data?.saved;
      setRollingItems(Array.isArray(rollingRaw) ? rollingRaw : []);
      const wishRaw = wishRes.data?.saved;
      setWishItems(Array.isArray(wishRaw) ? wishRaw : []);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "목록을 불러오지 못했습니다.",
      );
      setRollingItems([]);
      setWishItems([]);
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
      setPrimaryTab("rolling");
      setRollingTab("all");
      setDeletingSlug(null);
      setPendingDelete(null);
    }
  }, [open]);

  const filteredRolling = useMemo(() => {
    if (rollingTab === "all") return rollingItems;
    return rollingItems.filter(
      (row) => String(row.source ?? "").toUpperCase() === rollingTab,
    );
  }, [rollingItems, rollingTab]);

  const performDelete = useCallback(
    async (target: PendingDelete) => {
      const slug = target.row.slug?.trim();
      if (!slug) return;
      setDeletingSlug(slug);
      setError(null);
      try {
        if (target.kind === "rolling") {
          await deleteSavedRollingPaper(slug);
        } else {
          await deleteSavedWishBoard(slug);
        }
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
    const target = pendingDelete;
    if (!target) return;
    setPendingDelete(null);
    void performDelete(target);
  }, [pendingDelete, performDelete]);

  const primaryTabBtn = (id: SavedPrimaryTabId, label: string) => (
    <button
      key={id}
      type="button"
      role="tab"
      aria-selected={primaryTab === id}
      className={`min-h-[40px] min-w-0 flex-1 rounded-[12px] px-2 py-2 text-center text-[12px] font-semibold transition-[background,box-shadow,color] sm:text-[13px] ${
        primaryTab === id
          ? "bg-[var(--color-surface)] text-slate-900 shadow-sm ring-1 ring-black/[0.06]"
          : "text-slate-600 hover:text-slate-900"
      }`}
      onClick={() => setPrimaryTab(id)}
    >
      {label}
    </button>
  );

  const rollingSubTabBtn = (id: SavedRollingTabId, label: string) => (
    <button
      key={id}
      type="button"
      role="tab"
      aria-selected={rollingTab === id}
      className={savedModalSubTabButtonClass(rollingTab === id)}
      onClick={() => setRollingTab(id)}
    >
      {label}
    </button>
  );

  return (
    <>
      <WishlistCenterDialog
        open={open}
        onClose={onClose}
        title="저장한 보드"
        titleId={titleId}
        variant="static"
        staticStack="aboveMenu"
        closeLabel="닫기"
      >
        <div
          className="mt-3 flex gap-1 rounded-[14px] bg-[var(--color-bg-subtle)] p-1"
          role="tablist"
          aria-label="보드 종류"
        >
          {primaryTabBtn("rolling", "롤링페이퍼")}
          {primaryTabBtn("wish", "위시리스트")}
        </div>

        {primaryTab === "rolling" ? (
          <div className={SAVED_MODAL_SUB_TAB_SLOT_CLASS}>
            <div
              className={SAVED_MODAL_SUB_TAB_STRIP_CLASS}
              role="tablist"
              aria-label="롤링 저장 구분"
            >
              {ROLLING_SAVED_SUB_TABS.map((tab, index) => (
                <Fragment key={tab.id}>
                  {index > 0 ? (
                    <span
                      className={SAVED_MODAL_SUB_TAB_VDIVIDER_CLASS}
                      aria-hidden
                    />
                  ) : null}
                  {rollingSubTabBtn(tab.id, tab.label)}
                </Fragment>
              ))}
            </div>
          </div>
        ) : null}

        <div
          className={
            primaryTab === "wish"
              ? SAVED_BOARD_LIST_SCROLL_WISH_CLASS
              : SAVED_BOARD_LIST_SCROLL_ROLLING_CLASS
          }
        >
          {loading ? (
            <p className="py-8 text-center text-[15px] leading-relaxed text-slate-500 sm:py-6 sm:text-[14px]">
              불러오는 중…
            </p>
          ) : error ? (
            <p className="border-l-[3px] border-rose-400 py-1.5 pl-3 text-[14px] leading-relaxed text-rose-700 sm:text-[13px]">
              {error}
            </p>
          ) : primaryTab === "wish" ? (
            wishItems.length === 0 ? (
              <p className="py-8 text-center text-[15px] leading-relaxed text-slate-500 sm:py-6 sm:text-[14px]">
                저장한 위시리스트가 없습니다.
              </p>
            ) : (
              <ul className="flex flex-col">
                {wishItems
                  .filter((w) => w.slug?.trim())
                  .map((row) => {
                  const slug = row.slug.trim();
                  return (
                    <li
                      key={slug}
                      className="flex min-h-[48px] items-center gap-1 border-b border-slate-200/90 last:border-b-0"
                    >
                      <Link
                        href={`/wishlist/${encodeURIComponent(slug)}`}
                        onClick={onClose}
                        className={SAVED_BOARD_LIST_LINK_CLASS}
                      >
                        <span className="flex min-w-0 flex-1 flex-col justify-center gap-0.5">
                          <span className="min-w-0 truncate text-[15px] font-medium leading-snug text-slate-900">
                            {row.title?.trim() ? row.title.trim() : "(제목 없음)"}
                          </span>
                          <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[12px] text-slate-500">
                            <span className="font-medium text-violet-700">
                              위시리스트
                            </span>
                            <span className="tabular-nums">
                              {formatSavedAt(row.savedAt ?? "")}
                            </span>
                          </span>
                        </span>
                        <ArrowSquareOut
                          className="pointer-events-none shrink-0 self-center text-slate-600"
                          size={22}
                          weight="bold"
                          aria-hidden
                        />
                      </Link>
                      <div className="flex shrink-0 items-center gap-1.5 pr-0.5 sm:gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            setPendingDelete({ kind: "wish", row })
                          }
                          disabled={deletingSlug != null}
                          className="inline-flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-xl p-1 transition [-webkit-tap-highlight-color:transparent] active:scale-[0.96] disabled:pointer-events-none disabled:opacity-40 touch-manipulation [@media(hover:hover)_and_(pointer:fine)]:hover:opacity-90"
                          aria-label="위시리스트 삭제"
                        >
                          {deletingSlug === slug ? (
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
                  );
                })}
              </ul>
            )
          ) : filteredRolling.length === 0 ? (
            <p className="py-8 text-center text-[15px] leading-relaxed text-slate-500 sm:py-6 sm:text-[14px]">
              {rollingItems.length === 0
                ? "저장한 롤링페이퍼가 없습니다."
                : "이 탭에 해당하는 항목이 없습니다."}
            </p>
          ) : (
            <ul className="flex flex-col">
              {filteredRolling.map((row) => (
                <li
                  key={row.slug}
                  className="flex min-h-[48px] items-center gap-1 border-b border-slate-200/90 last:border-b-0"
                >
                  <Link
                    href={`/rolling-paper/${encodeURIComponent(row.slug)}`}
                    onClick={onClose}
                    className={SAVED_BOARD_LIST_LINK_CLASS}
                  >
                    <span className="flex min-w-0 flex-1 flex-col justify-center gap-0.5">
                      <span className="min-w-0 truncate text-[15px] font-medium leading-snug text-slate-900">
                        {row.title?.trim() ? row.title : "(제목 없음)"}
                      </span>
                      <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[12px] text-slate-500">
                        <span className="font-medium text-violet-700">
                          {sourceLabel(String(row.source ?? ""))}
                        </span>
                        <span className="tabular-nums">
                          {formatSavedAt(row.savedAt ?? "")}
                        </span>
                      </span>
                    </span>
                    <ArrowSquareOut
                      className="pointer-events-none shrink-0 self-center text-slate-600"
                      size={22}
                      weight="bold"
                      aria-hidden
                    />
                  </Link>
                  <div className="flex shrink-0 items-center gap-1.5 pr-0.5 sm:gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setPendingDelete({ kind: "rolling", row })
                      }
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
        title={
          pendingDelete?.kind === "wish"
            ? "위시리스트를 삭제할까요?"
            : "롤링페이퍼를 삭제할까요?"
        }
        titleId={deleteConfirmTitleId}
        variant="static"
        staticStack="aboveDialogs"
        closeLabel="닫기"
        description={
          pendingDelete ? (
            <p className="text-[13px] leading-relaxed text-slate-500">
              {pendingDelete.row.title?.trim()
                ? pendingDelete.row.title.trim()
                : "(제목 없음)"}{" "}
              <span className="text-slate-400">
                ·{" "}
                {pendingDelete.kind === "wish"
                  ? "위시리스트"
                  : sourceLabel(
                      String(
                        (pendingDelete.row as SavedRollingPaperItem).source ??
                          "",
                      ),
                    )}{" "}
                — 복구할 수 없습니다.
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
