import { apiClient, publicApiClient } from "@/lib/api/client";

function encodeRollingSlug(slug: string): string {
  return encodeURIComponent(slug.trim());
}

/** GET /api/assets/rolling-paper-profiles — 누구나 (JWT 불필요) */
export type RollingPaperProfileAsset = {
  id: number;
  assetKey: string;
};

export type RollingPaperProfileAssetsData = {
  success?: boolean;
  message?: string;
  data: { profiles: RollingPaperProfileAsset[] };
};

export async function getRollingPaperProfileAssets(): Promise<RollingPaperProfileAssetsData> {
  return publicApiClient<RollingPaperProfileAssetsData>(
    "/api/assets/rolling-paper-profiles",
    { method: "GET" },
  );
}

/** 서버 예시와 동일한 기본 스티커 키 — 롤링페이퍼 댓글 본문만 쓰고 스티커 UI는 생략할 때 사용 */
export const DEFAULT_ROLLING_COMMENT_STICKER_KEY =
  "stickers/balloon/sticker_01.png";

export type RollingPaperCommentRow = {
  id: number;
  senderName: string;
  content: string | null;
  stickerKey: string | null;
  isUser: boolean;
  slotIndex: number;
  createdAt: string;
};

export type RollingPaperCommentsPayload = {
  comments: RollingPaperCommentRow[];
  currentPage: number;
  totalPages: number;
  totalCount: number;
  hasNext: boolean;
  isLastPageFull?: boolean;
  lastPageFull?: boolean;
};

export type RollingPaperCommentsData = {
  success?: boolean;
  message?: string;
  data: RollingPaperCommentsPayload;
};

export type RollingPaperDetailPayload = {
  slug: string;
  title: string;
  recipientName: string;
  imageKey: string | null;
  targetDate: string;
  createdAt: string;
  isOwner: boolean;
  canComment: boolean;
  canSave: boolean;
  isCommentPublic: boolean;
  commentToken?: string | null;
  viewToken?: string | null;
};

export type RollingPaperDetailData = {
  success?: boolean;
  message?: string;
  data: RollingPaperDetailPayload;
};

export type RollingPaperCommentCreatePayload = {
  id: number;
  slotIndex: number;
};

export type RollingPaperCommentCreateData = {
  success?: boolean;
  message?: string;
  data: RollingPaperCommentCreatePayload;
};

function mergeRollingPaperHeaders(
  rollingToken: string | undefined | null,
  base?: HeadersInit,
): HeadersInit {
  const headers = new Headers(base ?? undefined);
  const t = rollingToken?.trim();
  if (t) {
    headers.set("X-Rolling-Token", t);
  }
  return headers;
}

/** GET /api/rolling-papers/{slug} — 소유자 JWT 또는 `X-Rolling-Token` */
export async function getRollingPaperDetail(
  slug: string,
  rollingToken?: string | null,
): Promise<RollingPaperDetailData> {
  const enc = encodeRollingSlug(slug);
  return apiClient<RollingPaperDetailData>(`/api/rolling-papers/${enc}`, {
    method: "GET",
    headers: mergeRollingPaperHeaders(rollingToken),
  });
}

/** POST /api/rolling-papers/{slug}/share/comment — 소유자만, 댓글 작성용 단축 링크 (공개일까지 유효) */
export type RollingPaperShareCommentLinkEnvelope = {
  success?: boolean;
  message?: string;
  data?: {
    shortUrl?: string;
    expiresAt?: string;
  };
};

export async function postRollingPaperShareCommentLink(
  slug: string,
): Promise<RollingPaperShareCommentLinkEnvelope> {
  const enc = encodeRollingSlug(slug);
  return apiClient<RollingPaperShareCommentLinkEnvelope>(
    `/api/rolling-papers/${enc}/share/comment`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    },
  );
}

/** GET /api/rolling-papers/{slug}/comments */
export async function getRollingPaperComments(
  slug: string,
  opts?: {
    rollingToken?: string | null;
    page?: number;
    size?: number;
  },
): Promise<RollingPaperCommentsData> {
  const enc = encodeRollingSlug(slug);
  const page = opts?.page ?? 0;
  const size = opts?.size ?? 8;
  const qs = new URLSearchParams({
    page: String(page),
    size: String(size),
  });
  return apiClient<RollingPaperCommentsData>(
    `/api/rolling-papers/${enc}/comments?${qs.toString()}`,
    {
      method: "GET",
      headers: mergeRollingPaperHeaders(opts?.rollingToken),
    },
  );
}

export type CreateRollingPaperCommentBodyMember = {
  content: string;
  stickerKey: string;
  slotIndex: number;
};

export type CreateRollingPaperCommentBodyGuest =
  CreateRollingPaperCommentBodyMember & {
    guestNickname: string;
    guestPassword: string;
  };

/** POST /api/rolling-papers/{slug}/comments — 회원은 JWT, 비회원은 guest 필드 필수, 공유 링크는 `X-Rolling-Token` */
export async function createRollingPaperComment(
  slug: string,
  body: CreateRollingPaperCommentBodyMember | CreateRollingPaperCommentBodyGuest,
  rollingToken?: string | null,
): Promise<RollingPaperCommentCreateData> {
  const enc = encodeRollingSlug(slug);
  return apiClient<RollingPaperCommentCreateData>(
    `/api/rolling-papers/${enc}/comments`,
    {
      method: "POST",
      headers: mergeRollingPaperHeaders(rollingToken, {
        "Content-Type": "application/json",
      }),
      body: JSON.stringify(body),
    },
  );
}

/**
 * PATCH /api/rolling-papers/{slug}/comments/{commentId}
 * - 회원 본인 댓글: `Authorization: Bearer` + 본문 `{ content }` 만 (`apiClient`)
 * - 비회원 댓글: Authorization 없음 + `{ content, guestPassword }` (`publicApiClient`)
 */
export async function updateRollingPaperComment(
  slug: string,
  commentId: number,
  params:
    | {
        mode: "member";
        content: string;
        rollingToken?: string | null;
      }
    | {
        mode: "guest";
        content: string;
        guestPassword: string;
        rollingToken?: string | null;
      },
): Promise<{ success?: boolean; message?: string }> {
  const enc = encodeRollingSlug(slug);
  const path = `/api/rolling-papers/${enc}/comments/${commentId}`;

  if (params.mode === "guest") {
    return publicApiClient<{ success?: boolean; message?: string }>(path, {
      method: "PATCH",
      headers: mergeRollingPaperHeaders(params.rollingToken, {
        "Content-Type": "application/json",
      }),
      body: JSON.stringify({
        content: params.content.trim(),
        guestPassword: params.guestPassword.trim(),
      }),
    });
  }

  return apiClient<{ success?: boolean; message?: string }>(path, {
    method: "PATCH",
    headers: mergeRollingPaperHeaders(params.rollingToken, {
      "Content-Type": "application/json",
    }),
    body: JSON.stringify({ content: params.content.trim() }),
  });
}
