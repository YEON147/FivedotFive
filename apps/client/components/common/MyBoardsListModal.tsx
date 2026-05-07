"use client";

import { ArrowSquareOut } from "@phosphor-icons/react";
import Link from "next/link";
import { useEffect, useId, useState } from "react";

import { WishlistCenterDialog } from "@/components/wishlist/WishlistCenterDialog";
import { getMyBoardsAll } from "@/features/wishlist/api";
import type { MyBoardListEntry } from "@/features/wishlist/types";

function entryHref(entry: MyBoardListEntry): string {
  if (entry.type === "WISH_BOARD") {
    return `/wishlist/${encodeURIComponent(entry.slug)}`;
  }
  /** 롤링페이퍼 상세 라우트 — 백엔드·라우트 스펙에 맞게 조정 가능 */
  return `/rolling-paper/${encodeURIComponent(entry.slug)}`;
}

function typeLabel(type: MyBoardListEntry["type"]): string {
  return type === "WISH_BOARD" ? "위시보드" : "롤링페이퍼";
}

function formatCreatedAt(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return iso;
  }
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);
}

export type MyBoardsListModalProps = {
  open: boolean;
  onClose: () => void;
};

export function MyBoardsListModal({ open, onClose }: MyBoardsListModalProps) {
  const titleId = useId();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<MyBoardListEntry[]>([]);

  useEffect(() => {
    if (!open) {
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    void getMyBoardsAll()
      .then((res) => {
        if (cancelled) return;
        setItems(Array.isArray(res.data) ? res.data : []);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "목록을 불러오지 못했습니다.");
        setItems([]);
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [open]);

  return (
    <WishlistCenterDialog
      open={open}
      onClose={onClose}
      title="내 페이지 목록"
      titleId={titleId}
      variant="static"
      staticStack="aboveMenu"
      description={
        <span>
          위시보드와 롤링페이퍼는 합산 최대 5개까지 저장되며, 최신 생성 순으로 표시됩니다.
        </span>
      }
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
          <ul className="flex flex-col gap-2">
            {items.map((entry) => (
              <li key={`${entry.type}-${entry.slug}`}>
                <Link
                  href={entryHref(entry)}
                  onClick={onClose}
                  className="flex min-h-[4rem] items-center gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-subtle)] px-3 py-2.5 transition hover:bg-[var(--color-surface)]"
                >
                  <span
                    className={`inline-flex shrink-0 rounded-lg px-2 py-1 text-[11px] font-semibold ${
                      entry.type === "WISH_BOARD"
                        ? "bg-violet-100 text-violet-800"
                        : "bg-amber-100 text-amber-900"
                    }`}
                  >
                    {typeLabel(entry.type)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-medium text-[var(--color-text-primary)]">
                      {entry.title?.trim() ? entry.title : "(제목 없음)"}
                    </p>
                    <p className="mt-0.5 text-[12px] text-[var(--color-text-secondary)]">
                      {formatCreatedAt(entry.createdAt)}
                    </p>
                  </div>
                  <ArrowSquareOut
                    className="shrink-0 text-[var(--color-text-secondary)]"
                    size={22}
                    weight="bold"
                    aria-hidden
                  />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </WishlistCenterDialog>
  );
}
