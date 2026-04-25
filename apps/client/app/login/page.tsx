"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LoginForm } from "@/components/common/LoginForm";
import { useLoginForm } from "@/features/login/hooks";
import { getAccessToken } from "@/lib/api/token-store";
import { KAKAO_OAUTH_START_URL } from "@/lib/constants/login";
import { touchTrafficAttribution } from "@/lib/analytics/wishlistCta";

export default function LoginPage() {
  const router = useRouter();
  const {
    values,
    errors,
    isSubmitting,
    canSubmit,
    submitMessage,
    submitSuccess,
    onChange,
    onSubmit,
  } = useLoginForm();

  useEffect(() => {
    touchTrafficAttribution();
  }, []);

  useEffect(() => {
    if (!getAccessToken()) return;
    router.replace("/");
  }, [router]);

  const handleKakaoLogin = () => {
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
          submitMessage={submitMessage}
          submitSuccess={submitSuccess}
          onChange={onChange}
          onSubmit={onSubmit}
          onKakaoLogin={handleKakaoLogin}
        />
      </section>
    </main>
  );
}
