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
    usernameCheckStatus,
    usernameCheckMessage,
    userEmailCheckStatus,
    userEmailCheckMessage,
    nicknameCheckStatus,
    nicknameCheckMessage,
  } = useSignupForm();

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl items-center px-6 py-12">
      <section className="w-full rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">회원가입</h1>
          <p className="mt-2 text-sm text-slate-500">
            아이디·이메일·닉네임 중복 확인 후 회원가입을 완료해 주세요.
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
      </section>
    </main>
  );
}
