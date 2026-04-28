import type { ButtonHTMLAttributes } from "react";

type ButtonVariant = "primary" | "kakao" | "brand";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

/** TextField `fieldSurfaceState` 포커스 링과 동일 톤 — 기본 검은 outline 제거 */
const FOCUS_RING =
  "outline-none focus:outline-none focus:ring-2 focus:ring-[#7B61FF]/25";

const VARIANT_CLASSNAME: Record<ButtonVariant, string> = {
  primary:
    `bg-[#4a4b4f] text-white hover:bg-[#3e3f42] disabled:opacity-60 ${FOCUS_RING}`,
  kakao: `bg-[#fee500] text-[#191919] hover:bg-[#f2d900] disabled:opacity-60 ${FOCUS_RING}`,
  /** 서비스 메인 보라(#7B61FF) — 비활성 시 연한 라벤더 톤 */
  brand:
    `bg-[#7B61FF] text-white shadow-sm hover:bg-[#6A52E0] active:opacity-95 disabled:bg-[#d2c8fc] disabled:text-[#5c4d99] disabled:shadow-none ${FOCUS_RING}`,
};

export function Button({
  variant = "primary",
  type = "button",
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`h-12 w-full rounded-full text-button transition disabled:cursor-not-allowed ${VARIANT_CLASSNAME[variant]} ${className}`}
      {...props}
    />
  );
}
