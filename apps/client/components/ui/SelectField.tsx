import type {
  FocusEvent,
  SelectHTMLAttributes,
} from "react";

import {
  COMPACT_FIELD_SELECT_CLASS,
  FIELD_SURFACE_FRAME,
  fieldSurfaceState,
} from "@/components/ui/fieldSurface";

/** 네이티브 화살표 대체 — 오른쪽 여백 안쪽에 두어 조금 더 왼쪽으로 보이게 함 */
const SELECT_CHEVRON_BG = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`;

/** 기본(variant default) 크기 전용 */
const SELECT_BASE_DEFAULT =
  "h-11 w-full cursor-pointer appearance-none bg-[length:1rem_1rem] bg-no-repeat pl-3.5 pr-10 text-sm font-normal text-slate-900 disabled:cursor-not-allowed";

type Option = {
  label: string;
  value: string;
};

function selectHasMeaningfulValue(
  value: SelectHTMLAttributes<HTMLSelectElement>["value"],
  defaultValue: SelectHTMLAttributes<HTMLSelectElement>["defaultValue"],
): boolean {
  const v = value ?? defaultValue;
  if (v == null || v === "") return false;
  if (typeof v === "string") return v.trim() !== "";
  if (typeof v === "number" || typeof v === "bigint") return true;
  return false;
}

type SelectFieldProps = Omit<
  SelectHTMLAttributes<HTMLSelectElement>,
  "aria-describedby"
> & {
  label: string;
  /** true면 `label` 텍스트를 렌더하지 않음(한 줄에 두 드롭다운 등). 스크린리더용 `aria-label`을 select에 넘기세요. */
  hideLabel?: boolean;
  options: readonly Option[];
  error?: string;
  hint?: string;
  scrollIntoViewOnFocus?: boolean;
  /** `compact`: 학교 검색 줄과 같은 글자·테두리 규격(34px) */
  variant?: "default" | "compact";
  "aria-describedby"?: string;
};

export function SelectField({
  label,
  hideLabel = false,
  options,
  error,
  hint,
  className = "",
  id,
  onFocus,
  scrollIntoViewOnFocus = false,
  variant = "default",
  style,
  value,
  defaultValue,
  ...props
}: SelectFieldProps) {
  const hasSelection = selectHasMeaningfulValue(value, defaultValue);
  const surface = fieldSurfaceState(Boolean(error), hasSelection);

  const handleFocus = (event: FocusEvent<HTMLSelectElement>) => {
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

  const selectClassName =
    variant === "compact"
      ? `${FIELD_SURFACE_FRAME} ${surface} ${COMPACT_FIELD_SELECT_CLASS} ${className}`
      : `${SELECT_BASE_DEFAULT} ${FIELD_SURFACE_FRAME} ${surface} ${className}`;

  const labelGapClass = hideLabel
    ? "gap-0"
    : variant === "compact"
      ? "gap-1"
      : "gap-1.5";

  /**
   * 보이는 라벨이 없을 때 `<label>` 대신 `div` — 래퍼 박스가 select 한 줄과 맞고,
   * 빈 `<label for>` 박스로 인한 크기·클릭 영역 혼동을 줄임 (접근성은 select `aria-label`).
   */
  /** hideLabel: 라벨 없음 — 래퍼 높이를 TextField `h-11`(또는 compact 34px)과 맞춤. `min-h-0`+flex 시 37px처럼 찌그러짐 방지 */
  const wrapperClassName = hideLabel
    ? `flex min-w-0 flex-1 flex-col self-start gap-0 p-0 ${
        variant === "compact"
          ? "h-[34px] min-h-[34px] shrink-0"
          : "h-11 min-h-11 shrink-0"
      } ${variant === "compact" ? "scroll-mt-6" : "scroll-mt-8"}`
    : `flex min-h-0 min-w-0 flex-1 flex-col self-start ${labelGapClass} scroll-mt-8`;

  const selectStyle = {
    ...style,
    backgroundImage: SELECT_CHEVRON_BG,
    backgroundPosition:
      variant === "compact" ? "right 0.625rem center" : "right 0.75rem center",
  };

  const inner = (
    <>
      {!hideLabel ? (
        <span
          className={`flex flex-wrap items-center gap-x-1 gap-y-0.5 font-semibold text-slate-800 ${
            variant === "compact"
              ? "min-h-0 text-xs leading-tight"
              : "min-h-[22px] text-sm"
          }`}
        >
          {label}
        </span>
      ) : null}
      <select
        {...props}
        id={id}
        {...(value !== undefined
          ? { value }
          : defaultValue !== undefined
            ? { defaultValue }
            : {})}
        onFocus={handleFocus}
        className={selectClassName}
        style={selectStyle}
      >
        {options.map((option) => (
          <option key={option.value || "empty"} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error ? (
        <span className="text-xs text-rose-600">{error}</span>
      ) : hint ? (
        <span className="text-xs text-slate-500">{hint}</span>
      ) : null}
    </>
  );

  if (hideLabel) {
    return <div className={wrapperClassName}>{inner}</div>;
  }

  return (
    <label htmlFor={id} className={wrapperClassName}>
      {inner}
    </label>
  );
}
