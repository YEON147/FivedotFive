import type {
  FocusEvent,
  SelectHTMLAttributes,
} from "react";

/** 네이티브 화살표 대체 — 오른쪽 여백 안쪽에 두어 조금 더 왼쪽으로 보이게 함 */
const SELECT_CHEVRON_BG = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`;

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
  options: readonly Option[];
  error?: string;
  hint?: string;
  scrollIntoViewOnFocus?: boolean;
  "aria-describedby"?: string;
};

export function SelectField({
  label,
  options,
  error,
  hint,
  className = "",
  id,
  onFocus,
  scrollIntoViewOnFocus = false,
  style,
  value,
  defaultValue,
  ...props
}: SelectFieldProps) {
  const hasSelection = selectHasMeaningfulValue(value, defaultValue);

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

  return (
    <label htmlFor={id} className="flex flex-col gap-1.5 scroll-mt-8">
      <span className="text-sm font-semibold text-slate-800">{label}</span>
      <select
        {...props}
        id={id}
        {...(value !== undefined
          ? { value }
          : defaultValue !== undefined
            ? { defaultValue }
            : {})}
        onFocus={handleFocus}
        className={`h-12 w-full cursor-pointer appearance-none rounded-xl border bg-[length:1rem_1rem] bg-no-repeat pl-4 pr-10 text-sm outline-none transition focus:ring-2 ${
          error
            ? "border-rose-300 bg-rose-50 focus:ring-rose-200"
            : hasSelection
              ? "border-[#7B61FF]/30 bg-[#faf8ff] focus:ring-[#7B61FF]/25"
              : "border-slate-200 bg-white focus:ring-[#7B61FF]/25"
        } ${className}`}
        style={{
          ...style,
          backgroundImage: SELECT_CHEVRON_BG,
          backgroundPosition: "right 2rem center",
        }}
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
    </label>
  );
}
