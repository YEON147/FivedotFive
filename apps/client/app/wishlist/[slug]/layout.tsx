import type { Metadata } from "next";
import type { ReactNode } from "react";

import { effectivePublicSiteOrigin } from "@/lib/effective-site-origin";

/** 공유 미리보기용 — `public/OG.png` */
const OG_IMAGE = "/OG.png";

const WISHLIST_OG_TITLE = "취향과 설렘이 담긴 작은 이야기 - 오쩜오";
const WISHLIST_OG_DESCRIPTION =
  "상대방이 공유한 위시리스트를 지금 확인해보세요 !";

const ogOn = process.env.NEXT_PUBLIC_OG_ENABLED === "true";
const siteOrigin = effectivePublicSiteOrigin();

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const title = WISHLIST_OG_TITLE;
  const description = WISHLIST_OG_DESCRIPTION;

  const base: Metadata = {
    title: { absolute: title },
    description,
  };

  if (!ogOn || !siteOrigin) {
    return base;
  }

  return {
    ...base,
    metadataBase: new URL(siteOrigin),
    openGraph: {
      title,
      description,
      url: `${siteOrigin}/wishlist/${encodeURIComponent(slug)}`,
      siteName: "오쩜오",
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
      title,
      description,
      images: [OG_IMAGE],
    },
  };
}

export default function WishlistSlugLayout({ children }: { children: ReactNode }) {
  return children;
}
