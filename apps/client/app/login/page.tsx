"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LoginForm } from "@/components/common/LoginForm";
import { useLoginForm } from "@/features/login/hooks";
import { stashLoginReturnFromReferrer } from "@/features/login/post-login-destination";
import { getAccessToken } from "@/lib/api/token-store";
import { KAKAO_OAUTH_START_URL } from "@/lib/constants/login";
import { touchTrafficAttribution } from "@/lib/analytics/wishlistCta";

function LoginPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextParam = searchParams.get("next");
  const resetNotice = searchParams.get("reset");

  const {
    values,
    errors,
    isSubmitting,
    canSubmit,
    submitMessage,
    submitSuccess,
    onChange,
    onSubmit,
  } = useLoginForm(nextParam);

  const bannerMessage = resetNotice?.trim() || submitMessage;
  const bannerSuccess = resetNotice?.trim()
    ? true
    : submitSuccess;

  useEffect(() => {
    stashLoginReturnFromReferrer();
  }, []);

  useEffect(() => {
    touchTrafficAttribution();
  }, []);

  useEffect(() => {
    if (!getAccessToken()) return;
    router.replace("/");
  }, [router]);

  const handleKakaoLogin = () => {
    stashLoginReturnFromReferrer();
    window.location.href = KAKAO_OAUTH_START_URL;
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md items-center px-8 py-12">
      <section className="w-full">
        <h1 className="text-h1 mb-14">로그인</h1>
        <LoginForm
          values={values}
          errors={errors}
          isSubmitting={isSubmitting}
          canSubmit={canSubmit}
          submitMessage={bannerMessage}
          submitSuccess={bannerSuccess}
          onChange={onChange}
          onSubmit={onSubmit}
          onKakaoLogin={handleKakaoLogin}
        />
      </section>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto flex min-h-screen w-full max-w-md items-center px-8 py-12">
          <p className="text-body-sm text-[#6e6e6e]">불러오는 중…</p>
        </main>
      }
    >
      <LoginPageInner />
    </Suspense>
  );
}
