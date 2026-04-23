"use client";

import { useEffect } from "react";

const ADS_SCRIPT_SRC =
  "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2280190033939879";

/** next/script는 data-nscript를 붙여 AdSense 경고가 나므로, 순수 script 노드만 주입합니다. */
export function AdsenseBootstrap() {
  useEffect(() => {
    if (
      document.querySelector(
        `script[src^="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"]`,
      )
    ) {
      return;
    }
    const el = document.createElement("script");
    el.async = true;
    el.src = ADS_SCRIPT_SRC;
    el.crossOrigin = "anonymous";
    document.head.appendChild(el);
  }, []);

  return null;
}
