"use client";

import { CaretLeft } from "@phosphor-icons/react";
import { useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";

import { SignupForm } from "@/components/common/SignupForm";
import { useSignupForm } from "@/features/signup/hooks";
import {
  APP_MAIN_COLUMN,
  APP_MAIN_SCROLL_BODY_FORM,
  APP_SHELL_STAGE,
  APP_SHELL_VIEWPORT_MAIN,
} from "@/lib/constants/app-shell-layout";
import {
  PAGE_HEADER_BACK_BUTTON,
  PAGE_HEADER_END_SPACER,
  PAGE_HEADER_ROW,
} from "@/lib/constants/page-header";
import { navigateAppBack } from "@/lib/navigate-app-back";
import { touchTrafficAttribution } from "@/lib/analytics/wishlistCta";

export default function SignupPage() {
  const router = useRouter();

  const handleHeaderBack = useCallback(() => {
    navigateAppBack(router, "/login");
  }, [router]);

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
    schoolKeyword,
    schoolResults,
    isSchoolSearching,
    isSchoolDropdownOpen,
    hasSelectedSchool,
    ignoreNextSchoolFocus,
    selectSchool,
    setIsSchoolDropdownOpen,
    setIgnoreNextSchoolFocus,
  } = useSignupForm();

  return (
    <main className={APP_SHELL_VIEWPORT_MAIN}>
      <div className={APP_SHELL_STAGE}>
        <div className={APP_MAIN_COLUMN}>
          <header className={PAGE_HEADER_ROW}>
            <button
              type="button"
              onClick={handleHeaderBack}
              className={PAGE_HEADER_BACK_BUTTON}
              aria-label="이전 페이지로"
            >
              <CaretLeft size={22} weight="bold" />
            </button>

            <div className="flex min-h-0 min-w-0 flex-1 justify-center px-2">
              <h1 className="text-center text-wish-title leading-tight text-slate-900">
                회원가입
              </h1>
            </div>

            <div className={PAGE_HEADER_END_SPACER} aria-hidden />
          </header>

          {/** 랭킹·My Page와 동일 — `wishlist-page-root` 오로라 위에 셸 없이 폼 */}
          <div className="relative flex min-h-0 min-w-0 flex-1 flex-col">
            <div className={APP_MAIN_SCROLL_BODY_FORM}>
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
                schoolKeyword={schoolKeyword}
                schoolResults={schoolResults}
                isSchoolSearching={isSchoolSearching}
                isSchoolDropdownOpen={isSchoolDropdownOpen}
                hasSelectedSchool={hasSelectedSchool}
                ignoreNextSchoolFocus={ignoreNextSchoolFocus}
                onChange={onChange}
                onRefetchNickname={onRefetchNickname}
                onSubmit={onSubmit}
                onSelectSchool={selectSchool}
                onSetSchoolDropdownOpen={setIsSchoolDropdownOpen}
                onSetIgnoreNextSchoolFocus={setIgnoreNextSchoolFocus}
              />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
