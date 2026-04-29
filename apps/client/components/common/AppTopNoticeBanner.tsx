"use client";

import { Bell, CaretRight } from "@phosphor-icons/react";
import Link from "next/link";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

import { fetchNoticeBanners } from "@/features/notice/api";

/** `app-shell-viewport-floor` 의 `top` / `height` 와 맞춤 — 배너가 위시 화면을 덮지 않게 함 */
const APP_TOP_BANNER_H = "--app-top-banner-h";
const DATA_BANNER_VISIBLE = "data-notice-banner-visible";

function clearAppTopInset() {
  document.documentElement.removeAttribute(DATA_BANNER_VISIBLE);
  document.documentElement.style.setProperty(APP_TOP_BANNER_H, "0px");
}

/**
 * 전역 상단 배너 — 관리자가 공지에 넣은 `bannerText`가 있고 노출 기간이면 표시.
 * 탭 시 해당 공지 상세(`/notice/[id]`)로 이동.
 * 문서 플로우 상단에 두고 높이를 `--app-top-banner-h` 로 반영해 고정 위시 셸과 겹치지 않게 함.
 */
export function AppTopNoticeBanner() {
  const [target, setTarget] = useState<{ id: number; text: string } | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    void fetchNoticeBanners()
      .then((res) => {
        if (cancelled || !res.success || !Array.isArray(res.data?.banners)) {
          return;
        }
        const first = res.data.banners.find(
          (b) => typeof b.bannerText === "string" && b.bannerText.trim().length > 0,
        );
        if (first) {
          setTarget({ id: first.id, text: first.bannerText.trim() });
        }
      })
      .catch(() => {
        /* 네트워크 오류 시 배너 생략 */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useLayoutEffect(() => {
    if (!target) {
      clearAppTopInset();
      return;
    }

    const apply = () => {
      const el = rootRef.current;
      if (!el) return;
      document.documentElement.setAttribute(DATA_BANNER_VISIBLE, "");
      document.documentElement.style.setProperty(APP_TOP_BANNER_H, `${el.offsetHeight}px`);
    };

    apply();

    const el = rootRef.current;
    if (!el || typeof ResizeObserver === "undefined") {
      const onResize = () => apply();
      window.addEventListener("resize", onResize);
      return () => {
        window.removeEventListener("resize", onResize);
      };
    }

    const ro = new ResizeObserver(() => apply());
    ro.observe(el);
    return () => {
      ro.disconnect();
    };
  }, [target]);

  useEffect(
    () => () => {
      clearAppTopInset();
    },
    [],
  );

  if (!target) {
    return null;
  }

  return (
    <div
      ref={rootRef}
      className="shrink-0 border-b border-[var(--color-border)] bg-[var(--color-primary-light)] pt-[env(safe-area-inset-top,0px)]"
      role="region"
      aria-label="공지 배너"
    >
      <Link
        href={`/notice/${target.id}`}
        className="flex w-full items-start gap-2 px-3 py-2 text-left transition hover:bg-[#E0D9FF]/80 active:bg-[#E0D9FF]"
      >
        <span className="mt-0.5 inline-flex shrink-0 text-[var(--color-primary-main)]" aria-hidden>
          <Bell size={16} weight="bold" />
        </span>
        <p className="min-w-0 flex-1 text-[12px] leading-snug text-[var(--color-text-primary)] sm:text-[13px] sm:leading-snug">
          <span className="line-clamp-2 [overflow-wrap:anywhere]">{target.text}</span>
        </p>
        <span
          className="mt-0.5 inline-flex shrink-0 text-[var(--color-text-secondary)]"
          aria-hidden
        >
          <CaretRight size={16} weight="bold" />
        </span>
      </Link>
    </div>
  );
}
