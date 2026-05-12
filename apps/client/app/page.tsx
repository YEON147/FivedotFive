"use client";

import type { TransitionEvent } from "react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

import { MainLandingContent } from "@/components/home/MainLandingContent";
import {
  INTRO_GIFT_BURST_MS,
  INTRO_GIFT_SHAKE_MS,
  MainIntroExperience,
} from "@/components/main-intro/MainIntroExperience";
import { getAccessToken } from "@/lib/api/token-store";

const MAIN_INTRO_DURATION_MS = INTRO_GIFT_SHAKE_MS + INTRO_GIFT_BURST_MS + 180;

const MAIN_INTRO_DURATION_REDUCED_MS = 480;

const GUEST_REVEAL_CLIP_MS = 880;

export default function Home() {
  const [guestShellMounted, setGuestShellMounted] = useState(false);
  const [guestClipExpanded, setGuestClipExpanded] = useState(false);
  const [introMounted, setIntroMounted] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);

  const revealSkipIntro = useRef(false);

  useEffect(() => {
    const reduced =
      typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const wait = reduced ? MAIN_INTRO_DURATION_REDUCED_MS : MAIN_INTRO_DURATION_MS;

    const id = window.setTimeout(() => {
      if (reduced) {
        revealSkipIntro.current = true;
        setIntroMounted(false);
        setGuestShellMounted(true);
        setGuestClipExpanded(true);
        return;
      }

      setGuestShellMounted(true);
    }, wait);

    return () => window.clearTimeout(id);
  }, []);

  /** 페인트 전에 토큰 반영 — `useEffect`만 쓰면 첫 화면이 비로그인 CTA로 잠깐 그려져 `/ranking`으로 잘못 안내 */
  useLayoutEffect(() => {
    if (!guestShellMounted) return;
    setLoggedIn(!!getAccessToken());
  }, [guestShellMounted]);

  useEffect(() => {
    if (!guestShellMounted) return;
    const sync = () => setLoggedIn(!!getAccessToken());
    window.addEventListener("focus", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("focus", sync);
      window.removeEventListener("storage", sync);
    };
  }, [guestShellMounted]);

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
  };

  return (
    <>
      {introMounted ? <MainIntroExperience /> : null}

      {guestShellMounted ? (
        <div
          className="home-guest-landing-shell fixed inset-0 z-[110] box-border w-full min-w-0 max-w-[100vw] overflow-x-hidden overflow-y-auto"
          style={{
            clipPath: guestClipExpanded ? "circle(150% at 50% 50%)" : "circle(0% at 50% 50%)",
            transition: `clip-path ${GUEST_REVEAL_CLIP_MS}ms cubic-bezier(0.4, 0, 0.2, 1)`,
            willChange: guestClipExpanded ? "auto" : "clip-path",
          }}
          onTransitionEnd={onGuestRevealEnd}
        >
          <MainLandingContent loggedIn={loggedIn} />
        </div>
      ) : null}
    </>
  );
}
