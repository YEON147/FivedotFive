"use client";

import Script from "next/script";
import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ReactElement,
} from "react";

import { KakaoAdFitNoAdBaseballFallback } from "@/components/ads/KakaoAdFitNoAdBaseballFallback";
import { isKakaoAdFitInsFilled } from "@/lib/ads/kakao-adfit-detect-fill";
import {
  installKakaoAdfitOnFailGlobal,
  KAKAO_ADFIT_ONFAIL_CALLBACK_NAME,
  registerKakaoAdfitOnFailHandler,
  unregisterKakaoAdfitOnFailHandler,
} from "@/lib/ads/kakao-adfit-onfail";
import {
  isKakaoAdFitCarouselEnabled,
  KAKAO_ADFIT_CAROUSEL_HEIGHT,
  KAKAO_ADFIT_CAROUSEL_WIDTH,
  KAKAO_ADFIT_SDK_URL,
  KAKAO_ADFIT_UNIT_CAROUSEL,
} from "@/lib/constants/kakao-adfit";

const NO_AD_POLL_INTERVAL_MS = 80;
const NO_AD_FALLBACK_MAX_WAIT_MS = 420;

let sdkLoadRequested = false;

export function KakaoAdFitLoader(): ReactElement | null {
  if (!isKakaoAdFitCarouselEnabled()) return null;
  if (sdkLoadRequested) return null;
  sdkLoadRequested = true;

  return (
    <Script id="kakao-adfit-sdk" src={KAKAO_ADFIT_SDK_URL} strategy="afterInteractive" />
  );
}

type KakaoAdFitCarouselFaceProps = {
  isActive: boolean;
  className?: string;
};

export function KakaoAdFitCarouselFace({
  isActive,
  className = "",
}: KakaoAdFitCarouselFaceProps): ReactElement | null {
  const reactInstanceId = useId();
  const adInstanceId = reactInstanceId.replace(/:/g, "");
  const insRef = useRef<HTMLModElement>(null);
  const showFallbackRef = useRef(false);
  const [mountKey, setMountKey] = useState(0);
  const [showNoAdFallback, setShowNoAdFallback] = useState(false);

  showFallbackRef.current = showNoAdFallback;

  useEffect(() => {
    installKakaoAdfitOnFailGlobal();
  }, []);

  useEffect(() => {
    if (isActive) {
      setMountKey((k) => k + 1);
    }
  }, [isActive]);

  useLayoutEffect(() => {
    if (!isActive) return;
    setShowNoAdFallback(false);
    registerKakaoAdfitOnFailHandler(adInstanceId, () => {
      setShowNoAdFallback(true);
    });
    return () => unregisterKakaoAdfitOnFailHandler(adInstanceId);
  }, [isActive, adInstanceId, mountKey]);

  useEffect(() => {
    if (!isActive) return;

    let elapsed = 0;
    let done = false;

    const showFallback = () => {
      if (done || showFallbackRef.current) return;
      if (isKakaoAdFitInsFilled(insRef.current)) return;
      done = true;
      setShowNoAdFallback(true);
    };

    const timeoutId = window.setTimeout(showFallback, NO_AD_FALLBACK_MAX_WAIT_MS);

    const intervalId = window.setInterval(() => {
      if (done) return;
      if (isKakaoAdFitInsFilled(insRef.current)) {
        done = true;
        window.clearTimeout(timeoutId);
        window.clearInterval(intervalId);
        return;
      }
      elapsed += NO_AD_POLL_INTERVAL_MS;
      if (elapsed >= NO_AD_FALLBACK_MAX_WAIT_MS) {
        showFallback();
        window.clearInterval(intervalId);
      }
    }, NO_AD_POLL_INTERVAL_MS);

    let observer: MutationObserver | null = null;
    if (typeof MutationObserver !== "undefined" && insRef.current) {
      observer = new MutationObserver(() => {
        if (isKakaoAdFitInsFilled(insRef.current)) {
          done = true;
          window.clearTimeout(timeoutId);
          window.clearInterval(intervalId);
          observer?.disconnect();
        }
      });
      observer.observe(insRef.current, { childList: true, subtree: true });
    }

    return () => {
      done = true;
      window.clearTimeout(timeoutId);
      window.clearInterval(intervalId);
      observer?.disconnect();
    };
  }, [isActive, mountKey]);

  if (!isKakaoAdFitCarouselEnabled()) return null;

  return (
    <div
      className={`relative flex h-full min-h-0 w-full flex-col items-center justify-center px-2 ${className}`}
      aria-label={showNoAdFallback ? "야구 구단 응원" : "배너"}
    >
      <KakaoAdFitLoader />
      {isActive ? (
        <div
          key={mountKey}
          className="flex w-full max-w-[320px] flex-col items-center justify-center"
        >
          {showNoAdFallback ? (
            <KakaoAdFitNoAdBaseballFallback />
          ) : (
            <div
              className="overflow-hidden rounded-2xl"
              style={{
                width: KAKAO_ADFIT_CAROUSEL_WIDTH,
                height: KAKAO_ADFIT_CAROUSEL_HEIGHT,
                maxWidth: "100%",
              }}
            >
                <ins
                  ref={insRef}
                  className="kakao_ad_area"
                  style={{ display: "none" }}
                  data-ad-unit={KAKAO_ADFIT_UNIT_CAROUSEL}
                  data-ad-width={String(KAKAO_ADFIT_CAROUSEL_WIDTH)}
                  data-ad-height={String(KAKAO_ADFIT_CAROUSEL_HEIGHT)}
                  data-ad-onfail={KAKAO_ADFIT_ONFAIL_CALLBACK_NAME}
                  data-ad-instance-id={adInstanceId}
                />
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
