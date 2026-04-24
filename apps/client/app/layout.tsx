import type { Metadata, Viewport } from "next";
import Script from "next/script";

import "./globals.css";

export const metadata: Metadata = {
  title: "오쩜오",
  description: "%s | 오쩜오",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  /** 웹뷰·노치 기기에서 safe-area env()가 올바르게 잡히도록 */
  viewportFit: "cover",
  themeColor: "#7B61FF",
};

const GTM_ID = "GTM-KXJF644T";

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
      <head>
        {/* AdSense — SSR HTML에 포함되어 크롤러·검증 도구가 스크립트를 즉시 확인할 수 있음 */}
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2280190033939879"
          crossOrigin="anonymous"
        />
      </head>
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
        {/* End Google Tag Manager (noscript) */}

        <Script id="google-tag-manager" strategy="beforeInteractive" dangerouslySetInnerHTML={{ __html: GTM_SCRIPT }} />

        {children}
      </body>
    </html>
  );
}
