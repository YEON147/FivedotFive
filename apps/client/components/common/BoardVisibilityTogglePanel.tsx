"use client";

/**
 * 페이지 설정·생성 모달 — 보드/댓글 공개 UI (스크린샷과 동일 레이아웃)
 * 상단: 제목 + 「공개/비공개」 + 토글 / 하단: 설명
 */
function SettingsToggle({
  checked,
  onCheckedChange,
  ariaLabel,
  disabled,
}: {
  checked: boolean;
  onCheckedChange: (next: boolean) => void;
  ariaLabel: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors [-webkit-tap-highlight-color:transparent] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7B61FF] disabled:pointer-events-none disabled:opacity-45 touch-manipulation ${
        checked ? "bg-[#7B61FF]" : "bg-slate-300"
      }`}
    >
      <span
        className={`pointer-events-none absolute left-0.5 top-1/2 size-5 -translate-y-1/2 rounded-full bg-white shadow-sm ring-1 ring-slate-900/10 transition-transform duration-200 ease-out ${
          checked ? "translate-x-[24px]" : "translate-x-0"
        }`}
        aria-hidden
      />
    </button>
  );
}

const VISIBILITY_PANEL_CLASS =
  "rounded-xl border border-slate-200/80 bg-white p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.92)]";

/** 위시보드 — 보드 공개 (스크린샷 문구) */
export const WISH_BOARD_VISIBILITY_HELP =
  "비공개 시 공유 링크로도 다른 사람이 볼 수 없어요.";

/** 위시보드 — 댓글 공개 (스크린샷 문구, 오타 수정) */
export const WISH_COMMENT_VISIBILITY_HELP =
  "공개 전 작성된 댓글 표시 여부를 설정해요.";

/** 롤링페이퍼 — 댓글 공개 */
export const ROLLING_COMMENT_VISIBILITY_HELP =
  "비공개면 기준일까지 댓글은 비공개로 유지됩니다.";

export function BoardVisibilityTogglePanel({
  title,
  description,
  checked,
  onCheckedChange,
  ariaLabel,
  disabled,
}: {
  title: string;
  description?: string;
  checked: boolean;
  onCheckedChange: (next: boolean) => void;
  ariaLabel: string;
  disabled?: boolean;
}) {
  return (
    <div className={VISIBILITY_PANEL_CLASS}>
      <div className="flex items-center justify-between gap-3">
        <p className="min-w-0 flex-1 text-sm font-semibold text-slate-900">{title}</p>
        <div className="flex shrink-0 items-center gap-2">
          <span
            className={`whitespace-nowrap text-[12px] font-medium ${
              checked ? "text-[#7B61FF]" : "text-slate-400"
            }`}
            aria-hidden
          >
            {checked ? "공개" : "비공개"}
          </span>
          <SettingsToggle
            checked={checked}
            onCheckedChange={onCheckedChange}
            ariaLabel={ariaLabel}
            disabled={disabled}
          />
        </div>
      </div>
      {description?.trim() ? (
        <p className="mt-2 text-[12px] leading-snug text-slate-500">{description}</p>
      ) : null}
    </div>
  );
}
