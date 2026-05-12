"use client";

import { useEffect } from "react";

import {
  kickProactiveTokenRefreshIfNeeded,
  scheduleProactiveAccessTokenRefresh,
} from "@/lib/api/client";

/**
 * 새로고침 후에도 `localStorage` 토큰 기준으로 선제 리프레시를 잡고,
 * 백그라운드 탭 복귀 시 만료 임박이면 한 번 갱신합니다.
 */
export function AuthSessionMaintainer() {
  useEffect(() => {
    scheduleProactiveAccessTokenRefresh();

    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        kickProactiveTokenRefreshIfNeeded();
      }
    };

    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return null;
}
