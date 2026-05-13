"use client";

import { useCallback, useEffect } from "react";

import { LoginForm } from "@/components/common/LoginForm";
import { useLoginForm } from "@/features/login/hooks";
import {
  stashLoginReturnFromReferrer,
  stashLoginReturnPath,
} from "@/features/login/post-login-destination";
import { touchTrafficAttribution } from "@/lib/analytics/wishlistCta";
import { KAKAO_OAUTH_START_URL } from "@/lib/constants/login";

type RollingPaperSaveLoginModalBodyProps = {
  /** 로그인 페이지 `next`와 동일 — 현재 롤링페이퍼 URL(쿼리 포함) */
  nextParam: string | null;
  onLoginSuccess: () => void;
};

export function RollingPaperSaveLoginModalBody({
  nextParam,
  onLoginSuccess,
}: RollingPaperSaveLoginModalBodyProps) {
  const handleSuccess = useCallback(() => {
    onLoginSuccess();
  }, [onLoginSuccess]);

  const {
    values,
    errors,
    isSubmitting,
    canSubmit,
    submitMessage,
    submitSuccess,
    onChange,
    onSubmit,
  } = useLoginForm(nextParam, { onSuccess: handleSuccess });

  useEffect(() => {
    stashLoginReturnFromReferrer();
  }, []);

  useEffect(() => {
    touchTrafficAttribution();
  }, []);

  const handleKakaoLogin = useCallback(() => {
    if (!stashLoginReturnPath(nextParam ?? undefined)) {
      stashLoginReturnFromReferrer();
    }
    window.location.href = KAKAO_OAUTH_START_URL;
  }, [nextParam]);

  return (
    <LoginForm
      values={values}
      errors={errors}
      isSubmitting={isSubmitting}
      canSubmit={canSubmit}
      submitMessage={submitMessage}
      submitSuccess={submitSuccess}
      onChange={onChange}
      onSubmit={onSubmit}
      onKakaoLogin={handleKakaoLogin}
    />
  );
}
