"use client";

import { useCallback, type FocusEvent } from "react";

type GenderToggleProps = {
  id?: string;
  label?: string;
  value: string;
  onChange: (value: "" | "MALE" | "FEMALE") => void;
  disabled?: boolean;
  error?: string;
  className?: string;
  scrollIntoViewOnFocus?: boolean;
  /**
   * `compact` — 34px, 회원가입·추가정보 줄과 동일.
   * `comfortable` — 44px(`h-11`), 내 정보 등 TextField 기본 입력과 동일 높이.
   */
  density?: "compact" | "comfortable";
};

export function GenderToggle({
  id = "gender-toggle",
  label = "성별",
  value,
  onChange,
  disabled = false,
  error,
  className = "",
  scrollIntoViewOnFocus = false,
  density = "compact",
}: GenderToggleProps) {
  const isMale = value === "MALE";
  const isFemale = value === "FEMALE";

  const handleFocus = useCallback(
    (event: FocusEvent<HTMLButtonElement>) => {
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
    },
    [scrollIntoViewOnFocus],
  );

  /** `compact`: 추가 정보 줄(34px). `comfortable`: TextField 기본 h-11 과 동일 */
  const btnBase =
    density === "comfortable"
      ? "box-border h-11 min-h-[44px] max-h-[44px] min-w-0 flex-[1_1_0%] rounded-xl border px-3.5 py-0 text-sm font-semibold leading-normal outline-none transition focus-visible:ring-2 focus-visible:ring-[#7B61FF]/25 disabled:cursor-not-allowed disabled:opacity-60"
      : "box-border h-[34px] min-h-[34px] max-h-[34px] min-w-0 flex-[1_1_0%] rounded-lg border px-3 py-0 text-xs font-semibold leading-normal outline-none transition focus-visible:ring-2 focus-visible:ring-[#7B61FF]/25 disabled:cursor-not-allowed disabled:opacity-60";
  const btnIdle =
    "border-slate-200 bg-white text-slate-700 hover:bg-slate-50/90 active:bg-slate-50";
  const btnActive =
    "border-[#7B61FF]/45 bg-[#faf8ff] text-[#5a4acb] shadow-[0_1px_2px_rgb(123_97_255/0.12)]";

  return (
    <div
      className={`flex min-w-0 flex-col ${density === "comfortable" ? "gap-1.5" : "gap-1"} scroll-mt-6 ${className}`}
    >
      <span
        id={`${id}-label`}
        className={`font-semibold text-slate-800 ${density === "comfortable" ? "text-sm" : "text-xs"}`}
      >
        {label}
      </span>
      <div
        className="flex w-full min-w-0 gap-1"
        role="group"
        aria-labelledby={`${id}-label`}
      >
        <button
          type="button"
          id={`${id}-male`}
          disabled={disabled}
          aria-pressed={isMale}
          aria-label="남자"
          onFocus={handleFocus}
          onClick={() => onChange(isMale ? "" : "MALE")}
          className={`${btnBase} ${isMale ? btnActive : btnIdle}`}
        >
          남자
        </button>
        <button
          type="button"
          id={`${id}-female`}
          disabled={disabled}
          aria-pressed={isFemale}
          aria-label="여자"
          onFocus={handleFocus}
          onClick={() => onChange(isFemale ? "" : "FEMALE")}
          className={`${btnBase} ${isFemale ? btnActive : btnIdle}`}
        >
          여자
        </button>
      </div>
      {error ? (
        <span className="text-xs text-rose-600">{error}</span>
      ) : null}
    </div>
  );
}
