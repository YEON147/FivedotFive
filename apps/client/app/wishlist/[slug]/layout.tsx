import type { Metadata } from "next";
import type { ReactNode } from "react";

import type { PublicBoardData } from "@/features/wishlist/types";
import { effectivePublicSiteOrigin } from "@/lib/effective-site-origin";

/** 공유 미리보기용 — `public/OG.png` */
const OG_IMAGE = "/OG.png";

/**
 * Spring 주소를 직접 두지 않고, 같은 Next 인스턴스의 `/api/...` 로 요청합니다.
 * `next.config` 리라이트가 백엔드로 넘기므로 compose·추가 env 없이 동작합니다.
 */
function internalNextOrigin(): string {
  const port = process.env.PORT ?? "3000";
  return `http://127.0.0.1:${port}`;
}

async function loadPublicBoard(slug: string) {
  const url = `${internalNextOrigin()}/api/boards/${encodeURIComponent(slug)}`;
  try {
    const res = await fetch(url, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    const json = (await res.json()) as PublicBoardData;
    return json.data ?? null;
  } catch {
    return null;
  }
}

const ogOn = process.env.NEXT_PUBLIC_OG_ENABLED === "true";
const siteOrigin = effectivePublicSiteOrigin();

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const board = await loadPublicBoard(slug);
  const name =
    board?.nickname?.trim() || board?.username?.trim() || "회원";

  const title = `${name}님의 위시리스트 — 오쩜오`;
  const description = `${name}님의 위시리스트를 지금 확인해보세요 !`;

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
          alt: `${name}님의 위시리스트`,
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
