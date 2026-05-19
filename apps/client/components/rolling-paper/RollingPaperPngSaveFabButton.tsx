"use client";

import { CircleNotch, DownloadSimple } from "@phosphor-icons/react";

const FAB_PRIMARY_CLASS =
  "pointer-events-auto flex size-[42px] min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-full bg-[#7B61FF] text-white shadow-lg ring-1 ring-black/[0.06] transition-[transform,filter] active:scale-[0.98] active:brightness-95 disabled:pointer-events-none disabled:opacity-70";

/** 위시 보드 스피드다이얼 서브 버튼과 동일 — 흰 배경·보라 아이콘 */
const FAB_SPEED_DIAL_SUB_CLASS =
  "pointer-events-auto flex size-[42px] min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-full bg-white text-[#7B61FF] shadow-lg ring-1 ring-black/[0.06] transition-[transform,filter] active:scale-[0.98] active:brightness-95 disabled:pointer-events-none disabled:opacity-70";

export type RollingPaperPngSaveFabButtonProps = {
  busy: boolean;
  onClick: () => void | Promise<void>;
  /** 기본: 롤링페이퍼 전체 PNG 저장 */
  idleLabel?: string;
  busyLabel?: string;
  /**
   * `speedDialSub` — ＋ 메뉴에서 위로 펼쳐지는 보조 버튼(흰 배경).
   * 기본 `fab` — 단독 FAB일 때 보라 원형.
   */
  tone?: "fab" | "speedDialSub";
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
  tone = "fab",
}: RollingPaperPngSaveFabButtonProps) {
  const buttonClass =
    tone === "speedDialSub" ? FAB_SPEED_DIAL_SUB_CLASS : FAB_PRIMARY_CLASS;

  return (
    <button
      type="button"
      onClick={() => void onClick()}
      disabled={busy}
      className={buttonClass}
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
