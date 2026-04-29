"use client";

import { Info } from "@phosphor-icons/react";
import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type FocusEvent,
  type InputHTMLAttributes,
} from "react";
import { createPortal } from "react-dom";

import {
  FIELD_SURFACE_FRAME,
  fieldSurfaceState,
} from "@/components/ui/fieldSurface";

type TextFieldProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "aria-describedby"
> & {
  label: string;
  error?: string;
  hint?: string;
  /**
   * - `inline`: 입력란 아래 작은 글씨
   * - `tooltip`: 라벨 옆 ℹ️ — 클릭 시 말풍선
   * - `label-inline`: ℹ️ 클릭 시 옆에 힌트 텍스트 표시·재클릭 시 숨김(말풍선 없음)
   */
  hintDisplay?: "inline" | "tooltip" | "label-inline";
  /** `true`이면 포커스 시 가까운 스크롤 영역 안에서 입력란이 보이도록 스크롤합니다. */
  scrollIntoViewOnFocus?: boolean;
  requiredMark?: boolean;
  /**
   * 채움 배경·테두리 톤을 이 글자 수 이상일 때만 적용.
   * 미지정 시에는 값이 비어 있지 않으면 적용(아이디 등).
   */
  filledMinLength?: number;
  "aria-describedby"?: string;
};

function mergeDescribedBy(
  ...parts: (string | undefined)[]
): string | undefined {
  const s = parts.filter(Boolean).join(" ").trim();
  return s.length > 0 ? s : undefined;
}

function inputHasNonEmptyValue(
  value: InputHTMLAttributes<HTMLInputElement>["value"],
  defaultValue: InputHTMLAttributes<HTMLInputElement>["defaultValue"],
): boolean {
  const v = value ?? defaultValue;
  if (v == null || v === "") return false;
  if (typeof v === "string") return v.trim().length > 0;
  if (typeof v === "number" || typeof v === "bigint") return true;
  return false;
}

function inputShowsFilledBackground(
  value: InputHTMLAttributes<HTMLInputElement>["value"],
  defaultValue: InputHTMLAttributes<HTMLInputElement>["defaultValue"],
  filledMinLength?: number,
): boolean {
  if (filledMinLength != null && filledMinLength > 0) {
    const v = value ?? defaultValue;
    if (v == null || v === "") return false;
    const str = typeof v === "string" ? v : String(v);
    return str.length >= filledMinLength;
  }
  return inputHasNonEmptyValue(value, defaultValue);
}

/** 모바일 주소창·홈 인디케이터를 고려해 보이는 영역 안에 맞춤 */
function getVisibleViewportBounds() {
  if (typeof window === "undefined") {
    return { left: 0, top: 0, right: 0, bottom: 0, width: 0, height: 0 };
  }

  const vv = window.visualViewport;
  const padX = 12;
  /** 하단 제스처·세이프 에어리어 여유 */
  const padY = Math.max(12, 16);

  if (!vv) {
    const w = window.innerWidth;
    const h = window.innerHeight;
    return {
      left: padX,
      top: padY,
      right: w - padX,
      bottom: h - padY,
      width: w - padX * 2,
      height: h - padY * 2,
    };
  }

  const left = padX;
  const top = Math.max(padY, vv.offsetTop + padY);
  const right = window.innerWidth - padX;
  const bottom = Math.min(
    window.innerHeight - padY,
    vv.offsetTop + vv.height - padY,
  );

  return {
    left,
    top,
    right,
    bottom,
    width: right - left,
    height: Math.max(0, bottom - top),
  };
}

function HintBubblePortal({
  open,
  hint,
  anchorRef,
  popoverId,
}: {
  open: boolean;
  hint: string;
  anchorRef: React.RefObject<HTMLElement | null>;
  popoverId: string;
}) {
  const bubbleRef = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState<CSSProperties>({
    visibility: "hidden",
    pointerEvents: "none",
  });

  const updatePosition = useCallback(() => {
    const btn = anchorRef.current;
    const bubble = bubbleRef.current;
    if (!btn || !bubble || typeof window === "undefined") return;

    const rect = btn.getBoundingClientRect();
    const bounds = getVisibleViewportBounds();
    const gap = 8;

    const maxContentW = Math.min(288, bounds.width);
    const maxAllowedH = Math.max(80, Math.min(220, bounds.bottom - bounds.top));
    bubble.style.width = `${maxContentW}px`;
    bubble.style.maxHeight = `${maxAllowedH}px`;

    const w = bubble.offsetWidth;
    const h = bubble.offsetHeight;

    let left = rect.left + rect.width / 2 - w / 2;
    left = Math.max(bounds.left, Math.min(left, bounds.right - w));

    let top = rect.bottom + gap;
    const fitsBelow = top + h <= bounds.bottom;
    const aboveCandidate = rect.top - gap - h;
    const fitsAbove = aboveCandidate >= bounds.top;

    if (!fitsBelow && fitsAbove) {
      top = aboveCandidate;
    } else if (!fitsBelow && !fitsAbove) {
      /** 위·아래 모두 부족하면 보이는 영역 안에서 세로만 조정 */
      top = Math.max(bounds.top, Math.min(top, bounds.bottom - h));
    }

    if (top < bounds.top) top = bounds.top;
    if (top + h > bounds.bottom) top = bounds.bottom - h;

    setStyle({
      position: "fixed",
      left,
      top,
      width: maxContentW,
      maxWidth: maxContentW,
      zIndex: 300,
      visibility: "visible",
      pointerEvents: "auto",
    });
  }, [anchorRef]);

  useLayoutEffect(() => {
    if (!open) return;

    updatePosition();
    const id = requestAnimationFrame(() => updatePosition());
    return () => cancelAnimationFrame(id);
  }, [open, hint, updatePosition]);

  useEffect(() => {
    if (!open) return;

    const bubble = bubbleRef.current;
    if (!bubble) return;

    const ro = new ResizeObserver(() => updatePosition());
    ro.observe(bubble);

    const onVV = () => updatePosition();
    window.visualViewport?.addEventListener("resize", onVV);
    window.visualViewport?.addEventListener("scroll", onVV);
    window.addEventListener("scroll", onVV, true);
    window.addEventListener("resize", onVV);

    return () => {
      ro.disconnect();
      window.visualViewport?.removeEventListener("resize", onVV);
      window.visualViewport?.removeEventListener("scroll", onVV);
      window.removeEventListener("scroll", onVV, true);
      window.removeEventListener("resize", onVV);
    };
  }, [open, updatePosition]);

  if (!open || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div
      ref={bubbleRef}
      id={popoverId}
      role="tooltip"
      style={style}
      className="box-border min-w-0 break-words overflow-y-auto overscroll-y-contain rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom,0px))] text-left text-[11px] leading-snug text-[var(--color-text-secondary)] shadow-[0_8px_24px_rgba(0,0,0,0.12)] [-webkit-overflow-scrolling:touch]"
    >
      {hint}
    </div>,
    document.body,
  );
}

export function TextField({
  label,
  error,
  hint,
  hintDisplay = "inline",
  scrollIntoViewOnFocus = false,
  requiredMark = false,
  className = "",
  id,
  onFocus,
  "aria-describedby": ariaDescribedByProp,
  filledMinLength,
  ...props
}: TextFieldProps) {
  const hasFilledValue = inputShowsFilledBackground(
    props.value,
    props.defaultValue,
    filledMinLength,
  );

  const reactId = useId();
  const hintId =
    id && hint && (hintDisplay === "tooltip" || hintDisplay === "label-inline")
      ? `${String(id)}-field-hint`
      : undefined;
  const popoverId =
    id && hint && hintDisplay === "tooltip"
      ? `${String(id)}-hint-popover-${reactId.replace(/:/g, "")}`
      : "";

  const hintBtnRef = useRef<HTMLButtonElement>(null);
  const labelInlineWrapRef = useRef<HTMLSpanElement>(null);
  const [hintOpen, setHintOpen] = useState(false);

  const describedBy = mergeDescribedBy(
    ariaDescribedByProp,
    hintDisplay === "tooltip" && hintId
      ? hintId
      : hintDisplay === "label-inline" && hintOpen && hintId
        ? hintId
        : undefined,
  );

  useEffect(() => {
    if (!hintOpen) return;

    const onDocMouseDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (hintBtnRef.current?.contains(target)) return;
      if (labelInlineWrapRef.current?.contains(target)) return;
      const popoverEl = popoverId
        ? document.getElementById(popoverId)
        : null;
      if (popoverEl?.contains(target)) return;
      setHintOpen(false);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setHintOpen(false);
    };

    document.addEventListener("mousedown", onDocMouseDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onDocMouseDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [hintOpen, popoverId]);

  const handleFocus = (event: FocusEvent<HTMLInputElement>) => {
    onFocus?.(event);
    if (!scrollIntoViewOnFocus) return;
    const el = event.currentTarget;
    requestAnimationFrame(() => {
      if (!el?.isConnected) return;
      const reduceMotion =
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      el.scrollIntoView({
        behavior: reduceMotion ? "auto" : "smooth",
        block: "center",
        inline: "nearest",
      });
    });
  };

  return (
    <label htmlFor={id} className="flex flex-col gap-1.5 scroll-mt-8">
      <span className="flex min-h-[22px] flex-wrap items-center gap-x-1 gap-y-0.5 text-sm font-semibold text-slate-800">
        <span>{label}</span>
        {requiredMark ? <span className="text-rose-500">*</span> : null}
        {hint && hintDisplay === "tooltip" ? (
          <>
            <span id={hintId} className="sr-only">
              {hint}
            </span>
            <button
              ref={hintBtnRef}
              type="button"
              title={hint}
              aria-label={`${label} 입력 안내`}
              aria-expanded={hintOpen}
              aria-controls={popoverId}
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                setHintOpen((prev) => !prev);
              }}
              className="inline-flex shrink-0 rounded-full p-0.5 text-slate-400 transition-colors hover:text-[#7B61FF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7B61FF]/35"
            >
              <Info size={16} weight="bold" aria-hidden />
            </button>
            <HintBubblePortal
              open={hintOpen}
              hint={hint}
              anchorRef={hintBtnRef}
              popoverId={popoverId}
            />
          </>
        ) : null}
        {hint && hintDisplay === "label-inline" ? (
          <span
            ref={labelInlineWrapRef}
            className="inline-flex max-w-full flex-wrap items-center gap-x-1 gap-y-0.5"
          >
            <button
              type="button"
              title={hintOpen ? undefined : hint}
              aria-label={`${label} 입력 안내`}
              aria-expanded={hintOpen}
              aria-controls={hintOpen ? hintId : undefined}
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                setHintOpen((prev) => !prev);
              }}
              className="inline-flex shrink-0 rounded-full p-0.5 text-slate-400 transition-colors hover:text-[#7B61FF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7B61FF]/35"
            >
              <Info size={16} weight="bold" aria-hidden />
            </button>
            {hintOpen ? (
              <span
                id={hintId}
                className="min-w-0 max-w-full text-xs font-normal text-slate-500"
              >
                {hint}
              </span>
            ) : null}
          </span>
        ) : null}
      </span>
      <input
        {...props}
        id={id}
        aria-describedby={describedBy}
        onFocus={handleFocus}
        className={`h-11 px-3.5 text-sm ${FIELD_SURFACE_FRAME} ${fieldSurfaceState(
          Boolean(error),
          hasFilledValue,
        )} ${className}`}
      />
      {error ? (
        <span className="text-xs text-rose-600">{error}</span>
      ) : hint && hintDisplay === "inline" ? (
        <span className="text-xs text-slate-500">{hint}</span>
      ) : null}
    </label>
  );
}
