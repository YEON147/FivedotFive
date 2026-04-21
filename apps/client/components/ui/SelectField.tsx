import type { SelectHTMLAttributes } from "react";

type Option = {
  label: string;
  value: string;
};

type SelectFieldProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  options: readonly Option[];
  error?: string;
  hint?: string;
};

export function SelectField({
  label,
  options,
  error,
  hint,
  className = "",
  id,
  ...props
}: SelectFieldProps) {
  return (
    <label htmlFor={id} className="flex flex-col gap-2">
      <span className="text-sm font-semibold text-slate-800">{label}</span>
      <select
        id={id}
        className={`h-12 rounded-xl border px-4 text-sm outline-none transition focus:ring-2 ${
          error
            ? "border-rose-300 bg-rose-50 focus:ring-rose-200"
            : "border-slate-200 bg-white focus:ring-slate-200"
        } ${className}`}
        {...props}
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
