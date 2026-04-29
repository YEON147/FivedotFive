/**
 * OG·절대 URL용 공개 오리진.
 * 운영은 `NEXT_PUBLIC_SITE_URL` 필수. 로컬 개발에서는 비어 있으면 `localhost`로 보정.
 */
export function effectivePublicSiteOrigin(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "";
  if (explicit) return explicit;
  if (process.env.NODE_ENV === "development") {
    const port = process.env.PORT ?? "3000";
    return `http://localhost:${port}`;
  }
  return "";
}
