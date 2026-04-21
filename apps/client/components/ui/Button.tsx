import type { ButtonHTMLAttributes } from "react";

type ButtonVariant = "primary" | "kakao";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

const VARIANT_CLASSNAME: Record<ButtonVariant, string> = {
  primary: "bg-[#4a4b4f] text-white hover:bg-[#3e3f42]",
  kakao: "bg-[#fee500] text-[#191919] hover:bg-[#f2d900]",
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
      className={`h-12 w-full rounded-full text-button transition disabled:cursor-not-allowed disabled:opacity-60 ${VARIANT_CLASSNAME[variant]} ${className}`}
      {...props}
    />
  );
}
