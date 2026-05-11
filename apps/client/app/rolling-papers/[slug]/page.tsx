import { redirect } from "next/navigation";

/**
 * 서버 공유 URL은 `/rolling-papers/{slug}?token=…` 형태.
 * 앱 라우트는 `/rolling-paper/[slug]` 단수만 제공하므로 여기서 단일 리다이렉트합니다.
 */
export default async function RollingPapersAliasRedirect({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const rawToken = sp.token;
  const qs =
    typeof rawToken === "string" && rawToken.trim()
      ? `?token=${encodeURIComponent(rawToken.trim())}`
      : "";
  redirect(`/rolling-paper/${encodeURIComponent(slug.trim())}${qs}`);
}
