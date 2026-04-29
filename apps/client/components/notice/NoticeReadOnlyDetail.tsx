"use client";

import { PushPin } from "@phosphor-icons/react";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

import type { NoticeDetail, NoticeDetailImage } from "@/features/notice/api";
import {
  formatNoticeDateOnly,
  formatNoticeDateTime,
} from "@/features/notice/format-notice-datetime";

const SWIPE_THRESHOLD_PX = 56;

function NoticeImageCarousel({
  images,
  marginTopClass,
  variant,
}: {
  images: NoticeDetailImage[];
  marginTopClass: string;
  variant: "modal" | "page";
}) {
  const [index, setIndex] = useState(0);
  const [slideWidth, setSlideWidth] = useState(0);
  const [dragPx, setDragPx] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const viewportRef = useRef<HTMLDivElement>(null);
  const indexRef = useRef(0);
  const dragPxRef = useRef(0);
  const startClientXRef = useRef(0);
  const pointerActiveRef = useRef(false);

  useLayoutEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const w = Math.round(entries[0]?.contentRect.width ?? el.clientWidth);
      if (w > 0) setSlideWidth(w);
    });
    ro.observe(el);
    const w0 = Math.round(el.clientWidth);
    if (w0 > 0) setSlideWidth(w0);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    indexRef.current = index;
  }, [index]);

  const clamp = useCallback(
    (i: number) => Math.max(0, Math.min(images.length - 1, i)),
    [images.length],
  );

  const goTo = useCallback(
    (i: number) => {
      const next = clamp(i);
      setIndex(next);
      setDragPx(0);
      dragPxRef.current = 0;
    },
    [clamp],
  );

  const endDrag = useCallback(() => {
    const dx = dragPxRef.current;
    let next = indexRef.current;
    if (dx < -SWIPE_THRESHOLD_PX) next += 1;
    else if (dx > SWIPE_THRESHOLD_PX) next -= 1;
    goTo(next);
    pointerActiveRef.current = false;
    setIsDragging(false);
  }, [goTo]);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (images.length <= 1) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    pointerActiveRef.current = true;
    setIsDragging(true);
    startClientXRef.current = e.clientX;
    dragPxRef.current = 0;
    setDragPx(0);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!pointerActiveRef.current || images.length <= 1) return;
    const dx = e.clientX - startClientXRef.current;
    dragPxRef.current = dx;
    setDragPx(dx);
  };

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!pointerActiveRef.current) return;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* noop */
    }
    endDrag();
  };

  const onPointerCancel = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!pointerActiveRef.current) return;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* noop */
    }
    goTo(indexRef.current);
    pointerActiveRef.current = false;
    setIsDragging(false);
  };

  const trackOffset = slideWidth > 0 ? -index * slideWidth + dragPx : 0;
  const trackWidthPx = slideWidth > 0 ? slideWidth * images.length : undefined;

  const viewportClass =
    variant === "modal"
      ? "relative min-h-0 w-full flex-1 overflow-hidden select-none"
      : "relative h-[min(60vh,520px)] w-full overflow-hidden select-none";

  /** 모바일: 부모 `overflow-y-auto`가 세로 스크롤로 터치를 가로채지 않도록 가로 스와이프 구역만 기본 제스처 차단 */
  const touchSwipeClass = images.length > 1 ? "touch-none" : "";

  return (
    <div
      className={
        variant === "modal"
          ? `${marginTopClass} flex min-h-0 flex-1 flex-col`
          : marginTopClass
      }
    >
      <div
        ref={viewportRef}
        className={`${viewportClass} ${touchSwipeClass}`.trim()}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
        role="region"
        aria-roledescription="carousel"
        aria-label="공지 이미지"
      >
        <div
          className={`flex h-full will-change-transform ${
            isDragging ? "" : "transition-transform duration-300 ease-out"
          }`}
          style={{
            width: trackWidthPx,
            transform: `translate3d(${trackOffset}px,0,0)`,
          }}
        >
          {images.map((img) => (
            <div
              key={`${img.displayOrder}-${img.imageUrl}`}
              className="flex h-full shrink-0 items-center justify-center"
              style={
                slideWidth > 0
                  ? { width: slideWidth }
                  : { width: `${100 / images.length}%` }
              }
            >
              <img
                src={img.imageUrl}
                alt=""
                className="max-h-full max-w-full object-contain"
                draggable={false}
              />
            </div>
          ))}
        </div>
      </div>
      {images.length > 1 ? (
        <div
          className={`flex shrink-0 items-center justify-center gap-1.5 ${variant === "modal" ? "mt-2" : "mt-3"}`}
        >
          {images.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`${i + 1}번째 이미지로 이동`}
              aria-current={i === index ? "true" : undefined}
              className={`h-1.5 rounded-full transition-all ${
                i === index
                  ? "w-4 bg-[#7B61FF]"
                  : "w-1.5 bg-zinc-300 dark:bg-zinc-600"
              }`}
              onClick={() => goTo(i)}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

type Props = {
  detail: NoticeDetail;
  /**
   * true: 다이얼로그 안 — 제목은 `h3`(상단 패널 제목이 `h2`).
   * false: 전용 페이지 — 제목은 `h1`.
   */
  asModal?: boolean;
  /**
   * 일반 사용자: 제목·등록일·이미지만 (고정 핀·배너 문구·노출 기간 숨김).
   */
  summaryOnly?: boolean;
  /** 상위(다이얼로그 헤더 등)에 제목을 표시할 때 본문 제목·핀 행 생략 */
  suppressTitleRow?: boolean;
};

/**
 * 공지 읽기 전용 본문 (목록 모달 · `/notice/[id]` 비관리자 화면 공통).
 */
export function NoticeReadOnlyDetail({
  detail,
  asModal,
  summaryOnly,
  suppressTitleRow,
}: Props) {
  const sortedImages = [...detail.images].sort((a, b) => a.displayOrder - b.displayOrder);
  const titleClass = asModal
    ? "text-h3 min-w-0 flex-1 text-[var(--color-text-primary)]"
    : "text-h2 min-w-0 flex-1 text-[var(--color-text-primary)]";

  const TitleTag = asModal ? "h3" : "h1";
  const carouselVariant = asModal ? "modal" : "page";

  /** 목록 모달: 등록일 생략 + 이미지 위 여백 최소화 */
  const carouselMarginTop =
    asModal && suppressTitleRow
      ? "mt-0"
      : summaryOnly
        ? "mt-1"
        : "mt-4";

  const carousel =
    sortedImages.length > 0 ? (
      <NoticeImageCarousel
        key={detail.id}
        images={sortedImages}
        marginTopClass={carouselMarginTop}
        variant={carouselVariant}
      />
    ) : null;

  const inner = (
    <>
      {!suppressTitleRow ? (
        <div className={`flex shrink-0 items-start gap-2 ${summaryOnly ? "mb-2" : "mb-4"}`}>
          {detail.isPinned ? (
            <span
              className="mt-1 inline-flex shrink-0 text-[#7B61FF]"
              aria-label="고정 공지"
              title="고정"
            >
              <PushPin size={asModal ? 20 : 22} weight="fill" />
            </span>
          ) : null}
          <TitleTag className={titleClass}>{detail.title}</TitleTag>
        </div>
      ) : null}

      {!summaryOnly && detail.bannerText ? (
        <p className="mb-3 shrink-0 text-body text-[var(--color-text-secondary)]">
          {detail.bannerText}
        </p>
      ) : null}

      {!asModal ? (
        <p
          className={`shrink-0 text-xs text-[var(--color-text-secondary)] ${summaryOnly ? "mb-3" : ""}`}
        >
          {formatNoticeDateOnly(detail.createdAt)}
        </p>
      ) : null}
      {!summaryOnly ? (
        <p className="mt-0.5 shrink-0 text-xs text-[var(--color-text-secondary)]">
          노출 {formatNoticeDateTime(detail.startAt)} ~ {formatNoticeDateTime(detail.endAt)}
        </p>
      ) : null}

      {carousel}
    </>
  );

  if (asModal) {
    return (
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">{inner}</div>
    );
  }

  return inner;
}
