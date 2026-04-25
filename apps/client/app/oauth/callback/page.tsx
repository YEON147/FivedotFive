"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { trackSignUp } from "@/lib/analytics/conversion";
import { touchTrafficAttribution } from "@/lib/analytics/wishlistCta";
import { setAccessToken } from "@/lib/api/token-store";
import { getMyProfile } from "@/features/user/api";

const GA_OAUTH_SIGNUP_DEDUPE_KEY = "ohjjeomoh_ga_kakao_signup_tracked";

function OAuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [message, setMessage] = useState("로그인 처리 중...");

  useEffect(() => {
    const accessToken = searchParams.get("accessToken");
    const oauthNewUser = searchParams.get("oauth_new_user");

    if (!accessToken) {
      setMessage("로그인 정보를 찾을 수 없습니다.");
      router.replace("/login");
      return;
    }

    setAccessToken(accessToken);
    touchTrafficAttribution();

    if (oauthNewUser === "true" && typeof window !== "undefined") {
      if (!sessionStorage.getItem(GA_OAUTH_SIGNUP_DEDUPE_KEY)) {
        trackSignUp("kakao");
        sessionStorage.setItem(GA_OAUTH_SIGNUP_DEDUPE_KEY, "1");
      }
    }

    let cancelled = false;
    void (async () => {
      try {
        const profile = await getMyProfile();
        if (cancelled) return;
        const destination = profile.hasWishBoard ? "/wishlist" : "/";
        router.replace(destination);
      } catch {
        if (cancelled) return;
        router.replace("/");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router, searchParams]);

  return (
    <p className="text-body-sm text-[#6e6e6e]">{message}</p>
  );
}

export default function OAuthCallbackPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md items-center justify-center px-8">
      <Suspense fallback={<p className="text-body-sm text-[#6e6e6e]">로그인 처리 중...</p>}>
        <OAuthCallbackContent />
      </Suspense>
    </main>
  );
}
