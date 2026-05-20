"use client";

import {
  PasswordResetForm,
  passwordResetStepTitle,
} from "@/components/common/PasswordResetForm";
import { usePasswordResetForm } from "@/features/password-reset/hooks";

export default function ForgotPasswordPage() {
  const {
    step,
    values,
    errors,
    isSubmitting,
    canSubmit,
    submitMessage,
    submitSuccess,
    onChange,
    onSubmit,
    goToPreviousStep,
    resendOtp,
  } = usePasswordResetForm();

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md items-center px-8 py-12">
      <section className="w-full">
        <h1 className="text-h1 mb-14">{passwordResetStepTitle(step)}</h1>
        <PasswordResetForm
          step={step}
          values={values}
          errors={errors}
          isSubmitting={isSubmitting}
          canSubmit={canSubmit}
          submitMessage={submitMessage}
          submitSuccess={submitSuccess}
          onChange={onChange}
          onSubmit={onSubmit}
          onPreviousStep={goToPreviousStep}
          onResendOtp={resendOtp}
        />
      </section>
    </main>
  );
}
