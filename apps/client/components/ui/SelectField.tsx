import type { FocusEvent, SelectHTMLAttributes } from "react";

type Option = {
  label: string;
  value: string;
};

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
  ...props
}: SelectFieldProps) {
  const handleFocus = (event: FocusEvent<HTMLSelectElement>) => {
    onFocus?.(event);
    if (!scrollIntoViewOnFocus) return;
    requestAnimationFrame(() => {
      const reduceMotion =
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      event.currentTarget.scrollIntoView({
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
        onFocus={handleFocus}
        className={`h-11 rounded-xl border px-3.5 text-sm outline-none transition focus:ring-2 ${
          error
            ? "border-rose-300 bg-rose-50 focus:ring-rose-200"
            : "border-slate-200 bg-white focus:ring-[#7B61FF]/25"
        } ${className}`}
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
