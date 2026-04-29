"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LoginForm } from "@/components/common/LoginForm";
import { useLoginForm } from "@/features/login/hooks";
import {
  resolvePostLoginDestination,
  stashLoginReturnFromReferrer,
  stashLoginReturnPath,
} from "@/features/login/post-login-destination";
import { getMyProfile } from "@/features/user/api";
import { getAccessToken } from "@/lib/api/token-store";
import { KAKAO_OAUTH_START_URL } from "@/lib/constants/login";
import { touchTrafficAttribution } from "@/lib/analytics/wishlistCta";

function LoginPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextParam = searchParams.get("next");

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

  useEffect(() => {
    stashLoginReturnFromReferrer();
  }, []);

  useEffect(() => {
    touchTrafficAttribution();
  }, []);

  useEffect(() => {
    if (!getAccessToken()) return;
    let cancelled = false;
    void (async () => {
      try {
        const profile = await getMyProfile();
        if (cancelled) return;
        router.replace(
          resolvePostLoginDestination(nextParam, profile.hasWishBoard),
        );
      } catch {
        if (cancelled) return;
        router.replace(resolvePostLoginDestination(nextParam, false));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router, nextParam]);

  const handleKakaoLogin = () => {
    if (!stashLoginReturnPath(nextParam)) {
      stashLoginReturnFromReferrer();
    }
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
