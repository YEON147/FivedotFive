"use client";

import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { setAccessToken } from "@/lib/api/token-store";
import { login } from "@/features/login/api";
import { resolvePostLoginDestination } from "@/features/login/post-login-destination";
import type {
  LoginFormErrors,
  LoginFormValues,
  LoginRequest,
} from "@/features/login/types";

const INITIAL_VALUES: LoginFormValues = {
  username: "",
  password: "",
};

function validateLoginForm(values: LoginFormValues): LoginFormErrors {
  const errors: LoginFormErrors = {};

  if (!values.username.trim()) {
    errors.username = "아이디를 입력해주세요.";
  }

  if (!values.password.trim()) {
    errors.password = "비밀번호를 입력해주세요.";
  }

  return errors;
}

function toLoginRequest(values: LoginFormValues): LoginRequest {
  return {
    username: values.username.trim(),
    password: values.password,
  };
}

export function useLoginForm(nextParam?: string | null) {
  const router = useRouter();
  const [values, setValues] = useState<LoginFormValues>(INITIAL_VALUES);
  const [errors, setErrors] = useState<LoginFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<boolean | null>(null);

  const onChange = useCallback(
    (name: keyof LoginFormValues, value: string) => {
      setValues((prev) => ({
        ...prev,
        [name]: value,
      }));

      setErrors((prev) => {
        if (!prev[name]) return prev;
        return {
          ...prev,
          [name]: undefined,
        };
      });

      if (submitMessage) {
        setSubmitMessage(null);
        setSubmitSuccess(null);
      }
    },
    [submitMessage]
  );

  const canSubmit = useMemo(() => {
    return !!values.username.trim() && !!values.password.trim() && !isSubmitting;
  }, [values, isSubmitting]);

  const onSubmit = useCallback(async () => {
    const nextErrors = validateLoginForm(values);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      setSubmitMessage("입력값을 확인해주세요.");
      setSubmitSuccess(false);
      return;
    }

    setIsSubmitting(true);
    setSubmitMessage(null);
    setSubmitSuccess(null);

    try {
      const payload = toLoginRequest(values);
      const response = await login(payload);

      if (response.data?.accessToken) {
        setAccessToken(response.data.accessToken);
      }

      setSubmitMessage(response.message ?? "로그인 되었습니다.");
      setSubmitSuccess(true);

      const destination = resolvePostLoginDestination(
        nextParam ?? null,
        response.data?.hasWishBoard,
      );
      router.push(destination);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "로그인 중 오류가 발생했습니다.";
      setSubmitMessage(message);
      setSubmitSuccess(false);
    } finally {
      setIsSubmitting(false);
    }
  }, [router, values, nextParam]);

  return {
    values,
    errors,
    isSubmitting,
    canSubmit,
    submitMessage,
    submitSuccess,
    onChange,
    onSubmit,
  };
}
