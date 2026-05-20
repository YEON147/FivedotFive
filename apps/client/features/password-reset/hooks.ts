"use client";

import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import {
  confirmPasswordReset,
  requestPasswordResetOtp,
  verifyPasswordResetOtp,
} from "@/features/password-reset/api";
import type {
  PasswordResetFormErrors,
  PasswordResetFormValues,
  PasswordResetStep,
} from "@/features/password-reset/types";

const OTP_REGEX = /^\d{6}$/;
const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,12}$/;

const INITIAL_VALUES: PasswordResetFormValues = {
  username: "",
  otp: "",
  newPassword: "",
  newPasswordConfirm: "",
};

function validateUsername(username: string): string | undefined {
  const trimmed = username.trim();
  if (!trimmed) return "아이디를 입력해 주세요.";
  return undefined;
}

function validateOtp(otp: string): string | undefined {
  const trimmed = otp.trim();
  if (!trimmed) return "인증번호를 입력해 주세요.";
  if (!OTP_REGEX.test(trimmed)) return "인증번호 6자리를 입력해 주세요.";
  return undefined;
}

function validateNewPassword(
  values: PasswordResetFormValues,
): PasswordResetFormErrors {
  const errors: PasswordResetFormErrors = {};

  if (!values.newPassword.trim()) {
    errors.newPassword = "새 비밀번호를 입력해 주세요.";
  } else if (!PASSWORD_REGEX.test(values.newPassword)) {
    errors.newPassword = "영문과 숫자를 모두 포함한 8~12자로 입력해 주세요.";
  }

  if (!values.newPasswordConfirm.trim()) {
    errors.newPasswordConfirm = "비밀번호 확인을 입력해 주세요.";
  } else if (values.newPassword !== values.newPasswordConfirm) {
    errors.newPasswordConfirm = "비밀번호가 일치하지 않습니다.";
  }

  return errors;
}

export function usePasswordResetForm() {
  const router = useRouter();
  const [step, setStep] = useState<PasswordResetStep>("username");
  const [values, setValues] = useState<PasswordResetFormValues>(INITIAL_VALUES);
  const [errors, setErrors] = useState<PasswordResetFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<boolean | null>(null);

  const onChange = useCallback(
    (name: keyof PasswordResetFormValues, value: string) => {
      setValues((prev) => ({ ...prev, [name]: value }));
      setErrors((prev) => {
        if (!prev[name]) return prev;
        return { ...prev, [name]: undefined };
      });
      if (submitMessage) {
        setSubmitMessage(null);
        setSubmitSuccess(null);
      }
    },
    [submitMessage],
  );

  const canSubmit = useMemo(() => {
    if (isSubmitting) return false;
    if (step === "username") return !!values.username.trim();
    if (step === "otp") return !!values.otp.trim();
    return (
      !!values.newPassword.trim() && !!values.newPasswordConfirm.trim()
    );
  }, [isSubmitting, step, values]);

  const requestOtp = useCallback(async () => {
    const usernameError = validateUsername(values.username);
    if (usernameError) {
      setErrors({ username: usernameError });
      setSubmitMessage(usernameError);
      setSubmitSuccess(false);
      return;
    }

    setIsSubmitting(true);
    setSubmitMessage(null);
    setSubmitSuccess(null);

    try {
      const response = await requestPasswordResetOtp(values.username);
      setSubmitMessage(
        response.message ??
          "등록된 이메일로 인증번호를 보냈습니다.",
      );
      setSubmitSuccess(true);
      setStep("otp");
      setValues((prev) => ({ ...prev, otp: "" }));
      setErrors({});
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "인증 메일 발송에 실패했습니다.";
      setSubmitMessage(message);
      setSubmitSuccess(false);
    } finally {
      setIsSubmitting(false);
    }
  }, [values.username]);

  const verifyOtp = useCallback(async () => {
    const usernameError = validateUsername(values.username);
    const otpError = validateOtp(values.otp);
    const nextErrors: PasswordResetFormErrors = {};
    if (usernameError) nextErrors.username = usernameError;
    if (otpError) nextErrors.otp = otpError;
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      setSubmitMessage(otpError ?? usernameError ?? "입력값을 확인해 주세요.");
      setSubmitSuccess(false);
      return;
    }

    setIsSubmitting(true);
    setSubmitMessage(null);
    setSubmitSuccess(null);

    try {
      const response = await verifyPasswordResetOtp(
        values.username,
        values.otp,
      );
      setSubmitMessage(response.message ?? "인증이 완료되었습니다.");
      setSubmitSuccess(true);
      setStep("password");
      setValues((prev) => ({
        ...prev,
        newPassword: "",
        newPasswordConfirm: "",
      }));
      setErrors({});
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "인증에 실패했습니다.";
      setSubmitMessage(message);
      setSubmitSuccess(false);
    } finally {
      setIsSubmitting(false);
    }
  }, [values.username, values.otp]);

  const submitNewPassword = useCallback(async () => {
    const nextErrors = validateNewPassword(values);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      setSubmitMessage("입력값을 확인해 주세요.");
      setSubmitSuccess(false);
      return;
    }

    setIsSubmitting(true);
    setSubmitMessage(null);
    setSubmitSuccess(null);

    try {
      const response = await confirmPasswordReset(
        values.username,
        values.newPassword,
      );
      const message = response.message ?? "비밀번호가 재설정되었습니다.";
      router.replace(`/login?reset=${encodeURIComponent(message)}`);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "비밀번호 재설정에 실패했습니다.";
      setSubmitMessage(message);
      setSubmitSuccess(false);
    } finally {
      setIsSubmitting(false);
    }
  }, [router, values]);

  const onSubmit = useCallback(async () => {
    if (step === "username") return requestOtp();
    if (step === "otp") return verifyOtp();
    return submitNewPassword();
  }, [requestOtp, step, submitNewPassword, verifyOtp]);

  const goToPreviousStep = useCallback(() => {
    setSubmitMessage(null);
    setSubmitSuccess(null);
    setErrors({});
    if (step === "password") {
      setStep("otp");
      return;
    }
    if (step === "otp") {
      setStep("username");
    }
  }, [step]);

  const resendOtp = useCallback(async () => {
    if (step !== "otp") return;
    await requestOtp();
  }, [requestOtp, step]);

  return {
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
  };
}
