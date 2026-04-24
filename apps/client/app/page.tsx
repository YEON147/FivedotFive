"use client";

import type { TransitionEvent } from "react";
import { useEffect, useRef, useState } from "react";

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

  useEffect(() => {
    setLoggedIn(!!getAccessToken());
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
          className="fixed inset-0 z-[110] overflow-hidden"
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
