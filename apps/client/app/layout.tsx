import type { Metadata, Viewport } from "next";
import Script from "next/script";

import { AppTopNoticeBanner } from "@/components/common/AppTopNoticeBanner";
import { AuthSessionMaintainer } from "@/components/auth/AuthSessionMaintainer";
import { effectivePublicSiteOrigin } from "@/lib/effective-site-origin";

import "./globals.css";

/** 공유 미리보기용 정적 이미지 — `public/OG.png` */
const OG_IMAGE = "/OG.png";

const ogOn = process.env.NEXT_PUBLIC_OG_ENABLED === "true";
const siteOrigin = effectivePublicSiteOrigin();

/**
 * 기본(비공개 위시 URL) OG — `NEXT_PUBLIC_OG_ENABLED=true` 이고 `NEXT_PUBLIC_SITE_URL` 이 있을 때만 출력.
 * 공개 위시(`/wishlist/[slug]`)는 해당 segment `layout`에서 덮어씀.
 */
const openGraphDefaults: Metadata =
  ogOn && siteOrigin
    ? {
        metadataBase: new URL(siteOrigin),
        openGraph: {
          type: "website",
          locale: "ko_KR",
          siteName: "오쩜오",
          title: "오쩜오 — 우리들의 위시리스트",
          description: "친구들과 위시리스트를 공유해 보세요.",
          url: siteOrigin,
          images: [
            {
              url: OG_IMAGE,
              width: 1200,
              height: 630,
              alt: "오쩜오",
            },
          ],
        },
        twitter: {
          card: "summary_large_image",
          title: "오쩜오 — 우리들의 위시리스트",
          description: "친구들과 위시리스트를 공유해 보세요.",
          images: [OG_IMAGE],
        },
      }
    : {};

export const metadata: Metadata = {
  title: "오쩜오",
  description: "%s | 오쩜오",
  ...openGraphDefaults,
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  /** 웹뷰·노치 기기에서 safe-area env()가 올바르게 잡히도록 */
  viewportFit: "cover",
  themeColor: "#7B61FF",
  /** 라이트 UI 고정 — OS 다크 모드와 무관하게 폼·스크롤바 등 UA 톤 유지 */
  colorScheme: "light",
};

/**
 * 애드센스 / 외부 광고 / 일반 UI·스크롤: GTM(`GTM-PJ9RR78P`)에서만 삽입·관리.
 * 핵심 전환은 `lib/analytics/conversion.ts` → gtag 이벤트.
 */
const GTM_ID = "GTM-PJ9RR78P";

/** Google Analytics 4 (gtag.js) — Page View·기초 측정. GTM 쪽 GA4에선 페이지 조회 중복 전송 끄기(운영). */
const GA4_MEASUREMENT_ID = "G-4N35N8KWG2";

const GA4_GTAG_INLINE = `
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', '${GA4_MEASUREMENT_ID}');
`;

const GTM_SCRIPT = `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${GTM_ID}');`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full antialiased" suppressHydrationWarning>
      <head />
      <body className="min-h-full flex flex-col">
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe
            src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
            height={0}
            width={0}
            style={{ display: "none", visibility: "hidden" }}
            title="Google Tag Manager"
          />
        </noscript>

        <Script id="google-tag-manager" strategy="afterInteractive" dangerouslySetInnerHTML={{ __html: GTM_SCRIPT }} />

        {/* Google tag (gtag.js) — GA4 기초 + 자동 page_view */}
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA4_MEASUREMENT_ID}`}
          strategy="afterInteractive"
        />
        <Script
          id="ga4-gtag"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{ __html: GA4_GTAG_INLINE }}
        />

        <header className="relative z-[95] shrink-0">
          <AppTopNoticeBanner />
        </header>
        <AuthSessionMaintainer />
        <div className="flex min-h-0 flex-1 flex-col">{children}</div>
      </body>
    </html>
  );
}
