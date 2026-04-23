"use client";

import { SignupForm } from "@/components/common/SignupForm";
import { useSignupForm } from "@/features/signup/hooks";

export default function SignupPage() {
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
    schoolKeyword,
    schoolResults,
    isSchoolSearching,
    isSchoolDropdownOpen,
    hasSelectedSchool,
    ignoreNextSchoolFocus,
    usernameCheckStatus,
    usernameCheckMessage,
    userEmailCheckStatus,
    userEmailCheckMessage,
    nicknameCheckStatus,
    nicknameCheckMessage,
    isNicknameDirty,
    onSchoolKeywordChange,
    onSelectSchool,
    setIsSchoolDropdownOpen,
    setIgnoreNextSchoolFocus,
  } = useSignupForm();

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl items-center px-6 py-12">
      <section className="w-full rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">회원가입</h1>
          <p className="mt-2 text-sm text-slate-500">
            필수 정보를 입력하고 회원가입을 진행해주세요.
          </p>
        </div>

        <SignupForm
          values={values}
          errors={errors}
          isSubmitting={isSubmitting}
          isNicknameLoading={isNicknameLoading}
          canSubmit={canSubmit}
          submitMessage={submitMessage}
          submitSuccess={submitSuccess}
          schoolKeyword={schoolKeyword}
          schoolResults={schoolResults}
          isSchoolSearching={isSchoolSearching}
          isSchoolDropdownOpen={isSchoolDropdownOpen}
          hasSelectedSchool={hasSelectedSchool}
          ignoreNextSchoolFocus={ignoreNextSchoolFocus}
          usernameCheckStatus={usernameCheckStatus}
          usernameCheckMessage={usernameCheckMessage}
          userEmailCheckStatus={userEmailCheckStatus}
          userEmailCheckMessage={userEmailCheckMessage}
          nicknameCheckStatus={nicknameCheckStatus}
          nicknameCheckMessage={nicknameCheckMessage}
          isNicknameDirty={isNicknameDirty}
          onChange={onChange}
          onSchoolKeywordChange={onSchoolKeywordChange}
          onSelectSchool={onSelectSchool}
          onRefetchNickname={onRefetchNickname}
          setIsSchoolDropdownOpen={setIsSchoolDropdownOpen}
          setIgnoreNextSchoolFocus={setIgnoreNextSchoolFocus}
          onSubmit={onSubmit}
        />
      </section>
    </main>
  );
}
