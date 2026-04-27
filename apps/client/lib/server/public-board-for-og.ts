import { cache } from "react";

/** GET `/api/boards/:slug` 래핑 본문 — Jackson 필드명과 동일 */
export type WishBoardPublicPayload = {
  boardSlug: string;
  username: string;
  nickname?: string | null;
  targetDate?: string;
};

type ApiEnvelope<T> = {
  success?: boolean;
  message?: string;
  data?: T | null;
};

function resolveBackendOrigin(): string {
  const fromPublic =
    process.env.NEXT_PUBLIC_API_URL?.trim().replace(/\/+$/, "") ?? "";
  if (fromPublic) {
    return fromPublic;
  }
  const rewrite =
    process.env.BACKEND_REWRITE_TARGET?.trim().replace(/\/+$/, "") ?? "";
  if (rewrite) {
    return rewrite;
  }
  return "http://127.0.0.1:8080";
}

/**
 * OG·메타데이터용 공개 보드 요약 조회 (서버 전용).
 * Next fetch 캐시로 동일 슬러그 요청을 묶습니다.
 */
export const getPublicBoardForOg = cache(
  async (slug: string): Promise<WishBoardPublicPayload | null> => {
    const safe = slug.trim();
    if (!safe) {
      return null;
    }
    const base = resolveBackendOrigin();
    const url = `${base}/api/boards/${encodeURIComponent(safe)}`;
    try {
      const res = await fetch(url, {
        headers: { Accept: "application/json" },
        next: { revalidate: 120 },
      });
      if (!res.ok) {
        return null;
      }
      const json = (await res.json()) as ApiEnvelope<WishBoardPublicPayload>;
      const data = json.data;
      if (!data?.boardSlug) {
        return null;
      }
      return data;
    } catch {
      return null;
    }
  },
);

export function displayNameFromBoard(board: WishBoardPublicPayload | null): string {
  if (!board) {
    return "오쩜오";
  }
  const nick = board.nickname?.trim();
  if (nick) {
    return nick;
  }
  const user = board.username?.trim();
  if (user) {
    return user;
  }
  return "회원";
}
