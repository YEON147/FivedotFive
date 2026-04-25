"use client";

import { CaretLeft } from "@phosphor-icons/react";
import Link from "next/link";
import { useEffect } from "react";

import { SignupForm } from "@/components/common/SignupForm";
import { useSignupForm } from "@/features/signup/hooks";
import {
  PAGE_HEADER_BACK_BUTTON,
  PAGE_HEADER_END_SPACER,
  PAGE_HEADER_ROW,
} from "@/lib/constants/page-header";
import { touchTrafficAttribution } from "@/lib/analytics/wishlistCta";

export default function SignupPage() {
  useEffect(() => {
    touchTrafficAttribution();
  }, []);

  const {
    values,
    errors,
    isSubmitting,
    isNicknameLoading,
    canSubmit,
    submitMessage,
    submitSuccess,
    onChange,
    onSubmit,
    onRefetchNickname,
    usernameCheckStatus,
    usernameCheckMessage,
    userEmailCheckStatus,
    userEmailCheckMessage,
    nicknameCheckStatus,
    nicknameCheckMessage,
  } = useSignupForm();

  return (
    <main className="wishlist-page-root app-shell-viewport-floor flex flex-col px-3 pb-[env(safe-area-inset-bottom,0px)] pt-[env(safe-area-inset-top,0px)] sm:px-4">
      <div className="relative z-10 flex min-h-0 w-full flex-1 flex-col items-center justify-start">
        <div className="mx-auto flex w-full min-h-0 max-w-[372px] flex-1 flex-col">
          <header className={PAGE_HEADER_ROW}>
            <Link
              href="/login"
              scroll={false}
              prefetch
              className={PAGE_HEADER_BACK_BUTTON}
              aria-label="로그인으로 이동"
            >
              <CaretLeft size={22} weight="bold" />
            </Link>

            <div className="flex min-h-0 min-w-0 flex-1 justify-center px-2">
              <h1 className="text-center text-wish-title leading-tight text-slate-900">
                회원가입
              </h1>
            </div>

            <div className={PAGE_HEADER_END_SPACER} aria-hidden />
          </header>

          {/** 랭킹·My Page와 동일 — `wishlist-page-root` 오로라 위에 셸 없이 폼 */}
          <div className="relative flex min-h-0 min-w-0 flex-1 flex-col">
            <div className="signup-scroll flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-y-contain [-webkit-overflow-scrolling:touch] px-2 pb-5 pt-1 sm:px-3">
              <SignupForm
                values={values}
                errors={errors}
                isSubmitting={isSubmitting}
                isNicknameLoading={isNicknameLoading}
                canSubmit={canSubmit}
                submitMessage={submitMessage}
                submitSuccess={submitSuccess}
                usernameCheckStatus={usernameCheckStatus}
                usernameCheckMessage={usernameCheckMessage}
                userEmailCheckStatus={userEmailCheckStatus}
                userEmailCheckMessage={userEmailCheckMessage}
                nicknameCheckStatus={nicknameCheckStatus}
                nicknameCheckMessage={nicknameCheckMessage}
                onChange={onChange}
                onRefetchNickname={onRefetchNickname}
                onSubmit={onSubmit}
              />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
