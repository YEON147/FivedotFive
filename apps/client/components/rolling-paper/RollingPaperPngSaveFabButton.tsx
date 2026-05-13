"use client";

import { CircleNotch, DownloadSimple } from "@phosphor-icons/react";

export type RollingPaperPngSaveFabButtonProps = {
  busy: boolean;
  onClick: () => void | Promise<void>;
  /** 기본: 롤링페이퍼 전체 PNG 저장 */
  idleLabel?: string;
  busyLabel?: string;
};

/**
 * 롤링페이퍼 보드 우측 하단 FAB 열에서 쓰는 **전체 PNG 저장** 단일 버튼.
 * 부모에서 `absolute` 열·공유/저장 버튼 배치만 맞추면 됩니다.
 */
export function RollingPaperPngSaveFabButton({
  busy,
  onClick,
  idleLabel = "롤링페이퍼 전체 이미지 저장",
  busyLabel = "이미지 저장 중",
}: RollingPaperPngSaveFabButtonProps) {
  return (
    <button
      type="button"
      onClick={() => void onClick()}
      disabled={busy}
      className="pointer-events-auto flex size-[42px] min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-white/95 text-slate-800 shadow-lg ring-1 ring-black/[0.06] transition-[transform,filter] active:scale-[0.98] active:brightness-95 disabled:pointer-events-none disabled:opacity-70"
      aria-label={busy ? busyLabel : idleLabel}
    >
      {busy ? (
        <CircleNotch
          className="animate-spin"
          size={23}
          weight="bold"
          aria-hidden
        />
      ) : (
        <DownloadSimple size={23} weight="bold" aria-hidden />
      )}
    </button>
  );
}
