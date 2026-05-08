"use client";

import Image from "next/image";
import { useLayoutEffect, useRef, useState } from "react";

import { useModalLazyScrollRegister } from "@/components/wishlist/modal-lazy-scroll-root";

type ScrollLazyModalImageProps = {
  src: string;
  /** 첫 화면(고정 행 수)은 즉시 로드 */
  eager: boolean;
  useNativeImg: boolean;
  sizes?: string;
  imgClassName: string;
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
}: ScrollLazyModalImageProps) {
  const register = useModalLazyScrollRegister();
  const [loaded, setLoaded] = useState(eager);
  const wrapRef = useRef<HTMLDivElement>(null);

  const effectiveLoaded = eager || loaded || register == null;

  useLayoutEffect(() => {
    if (eager || loaded || register == null) {
      return;
    }
    const el = wrapRef.current;
    if (!el) {
      return;
    }
    return register(el, () => setLoaded(true));
  }, [eager, loaded, register, src]);

  return (
    <div ref={wrapRef} className="absolute inset-0">
      {effectiveLoaded ? (
        useNativeImg ? (
          <img
            src={src}
            alt=""
            className={imgClassName}
            decoding="async"
          />
        ) : (
          <Image
            src={src}
            alt=""
            fill
            sizes={sizes}
            priority={eager}
            className={imgClassName}
          />
        )
      ) : (
        <span
          className="absolute inset-0 rounded-[inherit] bg-slate-100/95"
          aria-hidden
        />
      )}
    </div>
  );
}
