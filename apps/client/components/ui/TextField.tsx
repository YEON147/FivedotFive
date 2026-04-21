import type { InputHTMLAttributes } from "react";

type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
  hint?: string;
  requiredMark?: boolean;
};

export function TextField({
  label,
  error,
  hint,
  requiredMark = false,
  className = "",
  id,
  ...props
}: TextFieldProps) {
  return (
    <label htmlFor={id} className="flex flex-col gap-2">
      <span className="text-sm font-semibold text-slate-800">
        {label}
        {requiredMark ? <span className="ml-1 text-rose-500">*</span> : null}
      </span>
      <input
        id={id}
        className={`h-12 rounded-xl border px-4 text-sm outline-none transition focus:ring-2 ${
          error
            ? "border-rose-300 bg-rose-50 focus:ring-rose-200"
            : "border-slate-200 bg-white focus:ring-slate-200"
        } ${className}`}
        {...props}
      />
      {error ? (
        <span className="text-xs text-rose-600">{error}</span>
      ) : hint ? (
        <span className="text-xs text-slate-500">{hint}</span>
      ) : null}
    </label>
  );
}
