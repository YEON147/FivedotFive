"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { trackSignUpComplete } from "@/lib/analytics/conversion";
import { touchTrafficAttribution } from "@/lib/analytics/wishlistCta";
import { setAccessToken } from "@/lib/api/token-store";
import {
  APP_MAIN_COLUMN_AUTH,
  APP_SHELL_STAGE_CENTERED,
  APP_SHELL_VIEWPORT_MAIN,
} from "@/lib/constants/app-shell-layout";
import { resolvePostLoginDestination } from "@/features/login/post-login-destination";
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
        trackSignUpComplete("kakao");
        sessionStorage.setItem(GA_OAUTH_SIGNUP_DEDUPE_KEY, "1");
      }
    }

    let cancelled = false;
    void (async () => {
      try {
        const profile = await getMyProfile();
        if (cancelled) return;
        const next = searchParams.get("next");
        const destination = resolvePostLoginDestination(
          next,
          profile.hasWishBoard,
        );
        router.replace(destination);
      } catch {
        if (cancelled) return;
        const next = searchParams.get("next");
        router.replace(resolvePostLoginDestination(next, false));
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
    <main className={APP_SHELL_VIEWPORT_MAIN}>
      <div className={APP_SHELL_STAGE_CENTERED}>
        <div className={`${APP_MAIN_COLUMN_AUTH} px-2 sm:px-3`}>
          <Suspense fallback={<p className="text-body-sm text-[#6e6e6e]">로그인 처리 중...</p>}>
            <OAuthCallbackContent />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
