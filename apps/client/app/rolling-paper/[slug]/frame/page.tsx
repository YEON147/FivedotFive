"use client";

import { Suspense, use } from "react";

import { RollingPaperWebviewFrame } from "@/components/rolling-paper/RollingPaperWebviewFrame";

/**
 * 롤링페이퍼 액자형 웹뷰 — 가운데 폴라로이드 + 주변 댓글(최대 30).
 * 기존 `/rolling-paper/[slug]` 페이지는 수정하지 않고, 별도 URL로만 제공합니다.
 *
 * 예: `/rolling-paper/{slug}/frame?token=...`
 */
function RollingPaperFramePageInner({ slug }: { slug: string }) {
  return <RollingPaperWebviewFrame slug={slug} />;
}

export default function RollingPaperFramePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug: raw } = use(params);
  const slug = raw?.trim() ?? "";

  return (
    <Suspense
      fallback={
        <main className="flex min-h-dvh items-center justify-center bg-[#e8e4dc] text-[14px] text-slate-600">
          불러오는 중…
        </main>
      }
    >
      <RollingPaperFramePageInner slug={slug} />
    </Suspense>
  );
}
