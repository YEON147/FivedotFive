"use client";

import Link from "next/link";
import { use } from "react";

/**
 * 롤링페이퍼 상세 — 백엔드·디자인 연동 전 플레이스홀더.
 * 목록·진입 경로(`/rolling-paper/[slug]`)에서 404가 나지 않도록 최소 페이지만 둡니다.
 */
export default function RollingPaperSlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);

  return (
    <main className="flex min-h-[min(680px,85dvh)] flex-col items-center justify-center gap-6 px-6 py-12">
      <p className="text-center text-[15px] text-[var(--color-text-primary)]">
        롤링페이퍼{" "}
        <span className="font-mono text-[13px] text-[var(--color-text-secondary)]">
          {slug}
        </span>
      </p>
      <p className="max-w-sm text-center text-body-sm text-[var(--color-text-secondary)]">
        화면은 준비 중입니다. 위시보드와 동일하게 메뉴·목록에서 이동할 수 있도록 경로만 열어 두었어요.
      </p>
      <Link
        href="/wishlist"
        className="text-body-sm font-medium text-[var(--color-primary-main)] underline-offset-4 hover:underline"
      >
        위시리스트 홈으로
      </Link>
    </main>
  );
}
