"use client";

import type { TransitionEvent } from "react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

import { MainLandingContent } from "@/components/home/MainLandingContent";
import {
  INTRO_GIFT_BURST_MS,
  INTRO_GIFT_SHAKE_MS,
  MainIntroExperience,
} from "@/components/main-intro/MainIntroExperience";
import { getMyProfile } from "@/features/user/api";
import { getAccessToken } from "@/lib/api/token-store";
import { ADMIN_PUBLIC_BOARD_SLUG } from "@/lib/admin-landing";

const MAIN_INTRO_DURATION_MS = INTRO_GIFT_SHAKE_MS + INTRO_GIFT_BURST_MS + 180;

const MAIN_INTRO_DURATION_REDUCED_MS = 480;

const GUEST_REVEAL_CLIP_MS = 880;

/** 탭 세션당 1회 — 메인 랜딩 인트로·원형 공개 애니메이션 재생 여부 */
const SESSION_MAIN_INTRO_DONE_KEY = "oh_jjeom_oh_main_landing_intro_done";

export default function Home() {
  const [guestShellMounted, setGuestShellMounted] = useState(false);
  const [guestClipExpanded, setGuestClipExpanded] = useState(false);
  const [introMounted, setIntroMounted] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);
  const [loggedInCtaReady, setLoggedInCtaReady] = useState(false);
  const [isLandingAdmin, setIsLandingAdmin] = useState(false);
  const [hasWishBoard, setHasWishBoard] = useState(false);

  const revealSkipIntro = useRef(false);

  /** 이미 이 탭에서 인트로를 본 경우 — 첫 페인트 전에 건너뜀(로그인 후 메인 재진입 등) */
  useLayoutEffect(() => {
    try {
      if (sessionStorage.getItem(SESSION_MAIN_INTRO_DONE_KEY) !== "1") return;
    } catch {
      return;
    }
    revealSkipIntro.current = true;
    setIntroMounted(false);
    setGuestShellMounted(true);
    setGuestClipExpanded(true);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (sessionStorage.getItem(SESSION_MAIN_INTRO_DONE_KEY) === "1") return;
    } catch {
      /* ignore */
    }

    const reduced =
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const wait = reduced ? MAIN_INTRO_DURATION_REDUCED_MS : MAIN_INTRO_DURATION_MS;

    const id = window.setTimeout(() => {
      if (reduced) {
        revealSkipIntro.current = true;
        setIntroMounted(false);
        setGuestShellMounted(true);
        setGuestClipExpanded(true);
        try {
          sessionStorage.setItem(SESSION_MAIN_INTRO_DONE_KEY, "1");
        } catch {
          /* ignore */
        }
        return;
      }

      setGuestShellMounted(true);
    }, wait);

    return () => window.clearTimeout(id);
  }, []);

  /** `guestShellMounted`가 바뀔 때마다 토큰 동기화 — 페인트 전에 반영해 로그인 직후 CTA가 한 박자 비로그인으로 보이지 않게 */
  useLayoutEffect(() => {
    setLoggedIn(!!getAccessToken());
  }, [guestShellMounted]);

  useEffect(() => {
    if (!guestShellMounted || !loggedIn) {
      setLoggedInCtaReady(false);
      setHasWishBoard(false);
      return;
    }

    let cancelled = false;
    setLoggedInCtaReady(false);

    void getMyProfile()
      .then((profile) => {
        if (cancelled) return;
        setHasWishBoard(profile.hasWishBoard);
        setLoggedInCtaReady(true);
      })
      .catch(() => {
        if (cancelled) return;
        setHasWishBoard(false);
        setLoggedInCtaReady(true);
      });

    return () => {
      cancelled = true;
    };
  }, [guestShellMounted, loggedIn]);

  useEffect(() => {
    if (!guestShellMounted || revealSkipIntro.current) return;

    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => setGuestClipExpanded(true));
    });

    return () => cancelAnimationFrame(id);
  }, [guestShellMounted]);

  const onGuestRevealEnd = (e: TransitionEvent<HTMLDivElement>) => {
    if (e.propertyName !== "clip-path") return;

    setIntroMounted(false);
    try {
      sessionStorage.setItem(SESSION_MAIN_INTRO_DONE_KEY, "1");
    } catch {
      /* ignore */
    }
  };

  return (
    <>
      {introMounted ? <MainIntroExperience /> : null}

      {guestShellMounted ? (
        <div
          className="fixed inset-0 z-[110] overflow-x-hidden overflow-y-auto"
          style={{
            clipPath: guestClipExpanded ? "circle(150% at 50% 50%)" : "circle(0% at 50% 50%)",
            transition: `clip-path ${GUEST_REVEAL_CLIP_MS}ms cubic-bezier(0.4, 0, 0.2, 1)`,
            willChange: guestClipExpanded ? "auto" : "clip-path",
          }}
          onTransitionEnd={onGuestRevealEnd}
        >
          <MainLandingContent
            loggedIn={loggedIn}
            loggedInCtaReady={!loggedIn || loggedInCtaReady}
            adminPublicBoardSlug={ADMIN_PUBLIC_BOARD_SLUG}
            hasWishBoard={hasWishBoard}
          />
        </div>
      ) : null}
    </>
  );
}
