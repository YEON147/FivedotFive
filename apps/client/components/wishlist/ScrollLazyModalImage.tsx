"use client";

import Image from "next/image";
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type SyntheticEvent,
} from "react";

import { useModalLazyScrollRegister } from "@/components/wishlist/modal-lazy-scroll-root";

type ScrollLazyModalImageProps = {
  src: string;
  /** 첫 화면(고정 행 수)은 즉시 로드 */
  eager: boolean;
  useNativeImg: boolean;
  sizes?: string;
  imgClassName: string;
  /** eager + 원격 URL일 때 브라우저 로딩 우선순위(위시 아이콘 그리드 등) */
  highFetchPriority?: boolean;
  /**
   * true면 네트워크 로드 후 `decode()`까지 끝난 뒤에만 썸네일을 보여 줌.
   * (위→아래로 셀만 먼저 뜨는 느낌·반쯤 그려진 이미지 노출 완화)
   */
  hideUntilFullyDecoded?: boolean;
  /** 셀 콘텐츠가 나타날 때 짧은 opacity 페이드 */
  softContentFade?: boolean;
};

/**
 * `ModalLazyScrollRoot` 안에서만 지연 로드. Provider 밖이면 항상 즉시 표시.
 */
export function ScrollLazyModalImage({
  src,
  eager,
  useNativeImg,
  sizes,
  imgClassName,
  highFetchPriority = false,
  hideUntilFullyDecoded = false,
  softContentFade = false,
}: ScrollLazyModalImageProps) {
  const register = useModalLazyScrollRegister();
  const [loaded, setLoaded] = useState(eager);
  const [paintReady, setPaintReady] = useState(!hideUntilFullyDecoded);
  const [softFadeIn, setSoftFadeIn] = useState(!softContentFade);
  const wrapRef = useRef<HTMLDivElement>(null);

  const safeSrc = (src ?? "").trim();
  const effectiveLoaded = eager || loaded || register == null;

  useEffect(() => {
    if (!hideUntilFullyDecoded) {
      setPaintReady(true);
      return;
    }
    setPaintReady(false);
  }, [safeSrc, hideUntilFullyDecoded]);

  useEffect(() => {
    if (!softContentFade) {
      queueMicrotask(() => setSoftFadeIn(true));
      return;
    }
    queueMicrotask(() => setSoftFadeIn(false));
  }, [safeSrc, softContentFade]);

  useLayoutEffect(() => {
    if (!safeSrc || eager || loaded || register == null) {
      return;
    }
    const el = wrapRef.current;
    if (!el) {
      return;
    }
    return register(el, () => setLoaded(true));
  }, [eager, loaded, register, safeSrc]);

  const overlayVisible =
    !safeSrc ||
    !effectiveLoaded ||
    (hideUntilFullyDecoded && !paintReady);

  useEffect(() => {
    if (!softContentFade || overlayVisible) {
      return;
    }
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => setSoftFadeIn(true));
    });
    return () => cancelAnimationFrame(id);
  }, [softContentFade, overlayVisible]);

  const finishDecodeGate = () => {
    if (hideUntilFullyDecoded) {
      setPaintReady(true);
    }
  };

  const onNativeLoad = (event: SyntheticEvent<HTMLImageElement>) => {
    if (!hideUntilFullyDecoded) {
      return;
    }
    const el = event.currentTarget;
    void (async () => {
      try {
        await el.decode();
      } catch {
        /* decode 미지원·실패 시에도 한 장으로 표시 */
      }
      setPaintReady(true);
    })();
  };

  const mediaWrapClass =
    "absolute inset-0 z-[2] transition-opacity duration-200 ease-out motion-reduce:transition-none " +
    (softFadeIn ? "opacity-100" : "opacity-0");

  return (
    <div ref={wrapRef} className="absolute inset-0">
      {!safeSrc ? (
        <span
          className="absolute inset-0 rounded-[inherit] bg-slate-100/95"
          aria-hidden
        />
      ) : (
        <>
          {overlayVisible ? (
            <span
              className="absolute inset-0 z-[1] rounded-[inherit] bg-slate-100/95 transition-opacity duration-150 ease-out motion-reduce:transition-none"
              aria-hidden
            />
          ) : null}
          {effectiveLoaded ? (
            <span className={mediaWrapClass}>
              {useNativeImg ? (
                <img
                  src={safeSrc}
                  alt=""
                  className={imgClassName}
                  decoding="async"
                  loading={eager ? "eager" : "lazy"}
                  fetchPriority={highFetchPriority && eager ? "high" : undefined}
                  onLoad={onNativeLoad}
                  onError={finishDecodeGate}
                />
              ) : (
                <Image
                  src={safeSrc}
                  alt=""
                  fill
                  sizes={sizes}
                  priority={eager}
                  fetchPriority={highFetchPriority && eager ? "high" : undefined}
                  className={imgClassName}
                  onLoadingComplete={() => {
                    if (hideUntilFullyDecoded) {
                      setPaintReady(true);
                    }
                  }}
                  onError={finishDecodeGate}
                />
              )}
            </span>
          ) : null}
        </>
      )}
    </div>
  );
}
