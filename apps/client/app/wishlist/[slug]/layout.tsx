import type { Metadata } from "next";

import {
  displayNameFromBoard,
  getPublicBoardForOg,
} from "@/lib/server/public-board-for-og";

function resolveMetadataBase(): URL {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) {
    const normalized = explicit.replace(/\/+$/, "");
    try {
      return new URL(normalized.startsWith("http") ? normalized : `https://${normalized}`);
    } catch {
      /* fall through */
    }
  }
  if (process.env.VERCEL_URL) {
    return new URL(`https://${process.env.VERCEL_URL.replace(/^https?:\/\//, "")}`);
  }
  return new URL("http://localhost:3000");
}

const SITE_NAME = "오쩜오";

type LayoutProps = {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: LayoutProps): Promise<Metadata> {
  const { slug } = await params;
  const board = await getPublicBoardForOg(slug);
  const display = displayNameFromBoard(board);
  const title = `${display}님의 위시리스트 | ${SITE_NAME}`;
  const description = `${display}님의 ${SITE_NAME} 위시리스트를 확인해 보세요.`;
  const path = `/wishlist/${encodeURIComponent(slug.trim())}`;

  return {
    metadataBase: resolveMetadataBase(),
    title,
    description,
    openGraph: {
      title,
      description,
      siteName: SITE_NAME,
      type: "website",
      locale: "ko_KR",
      url: path,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default function WishlistSlugLayout({ children }: { children: React.ReactNode }) {
  return children;
}
