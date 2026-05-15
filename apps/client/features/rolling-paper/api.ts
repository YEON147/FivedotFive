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
  /** 서버 계산 — 타인 댓글 마스킹 해제 여부 */
  commentsRevealed?: boolean;
  /** 전체 댓글 수 — 물방울 즉시 표시용 */
  commentCount?: number;
  commentToken?: string | null;
  viewToken?: string | null;
};

/** GET /api/rolling-papers/me/list */
export type RollingPaperSummaryItem = {
  slug: string;
  title: string;
  recipientName: string;
  targetDate: string;
  createdAt: string;
  imageKey?: string | null;
};

export type RollingPaperMyListData = {
  success?: boolean;
  message?: string;
  data: RollingPaperSummaryItem[];
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

/** POST /api/rolling-papers/{slug}/share/comment — 소유자(JWT) 또는 commentToken(`X-Rolling-Token`), 댓글 작성용 단축 링크 */
export type RollingPaperShareCommentLinkEnvelope = {
  success?: boolean;
  message?: string;
  data?: {
    shortUrl?: string;
  };
};

export async function postRollingPaperShareCommentLink(
  slug: string,
  rollingToken?: string | null,
): Promise<RollingPaperShareCommentLinkEnvelope> {
  const enc = encodeRollingSlug(slug);
  return apiClient<RollingPaperShareCommentLinkEnvelope>(
    `/api/rolling-papers/${enc}/share/comment`,
    {
      method: "POST",
      headers: mergeRollingPaperHeaders(rollingToken, {
        "Content-Type": "application/json",
      }),
      body: JSON.stringify({}),
    },
  );
}

/** POST /api/rolling-papers/{slug}/share/view — 소유자(JWT) 또는 viewToken(`X-Rolling-Token`), 저장·열람용 단축 링크 */
export async function postRollingPaperShareViewLink(
  slug: string,
  rollingToken?: string | null,
): Promise<RollingPaperShareCommentLinkEnvelope> {
  const enc = encodeRollingSlug(slug);
  return apiClient<RollingPaperShareCommentLinkEnvelope>(
    `/api/rolling-papers/${enc}/share/view`,
    {
      method: "POST",
      headers: mergeRollingPaperHeaders(rollingToken, {
        "Content-Type": "application/json",
      }),
      body: JSON.stringify({}),
    },
  );
}

/** POST /api/rolling-papers/{slug}/save — JWT 필수, view 링크 수신 시 `X-Rolling-Token` */
export type RollingPaperSavePayload = {
  slug: string;
  source: "CREATED" | "RECEIVED" | string;
  savedAt: string;
};

export type RollingPaperSaveResponse = {
  success?: boolean;
  message?: string;
  data: RollingPaperSavePayload;
};

export async function postRollingPaperSave(
  slug: string,
  rollingToken?: string | null,
): Promise<RollingPaperSaveResponse> {
  const enc = encodeRollingSlug(slug);
  return apiClient<RollingPaperSaveResponse>(
    `/api/rolling-papers/${enc}/save`,
    {
      method: "POST",
      headers: mergeRollingPaperHeaders(rollingToken, {
        "Content-Type": "application/json",
      }),
      body: JSON.stringify({}),
    },
  );
}

/** GET /api/rolling-papers/me/list — 로그인 회원만 */
export async function getMyRollingPapersList(): Promise<RollingPaperMyListData> {
  return apiClient<RollingPaperMyListData>("/api/rolling-papers/me/list");
}

/** GET /api/rolling-papers/me/saved — 저장·복사본 목록 (CREATED / RECEIVED) */
export type SavedRollingPaperItem = {
  slug: string;
  title: string;
  source: "CREATED" | "RECEIVED" | string;
  savedAt: string;
};

export type RollingPaperMySavedData = {
  success?: boolean;
  message?: string;
  data?: {
    saved?: SavedRollingPaperItem[];
  };
};

export async function getMySavedRollingPapers(): Promise<RollingPaperMySavedData> {
  return apiClient<RollingPaperMySavedData>("/api/rolling-papers/me/saved");
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

/** POST /api/rolling-papers/{slug}/comments — 회원은 JWT(`apiClient`), 비회원은 guest 필드·`publicApiClient`, 공유 링크는 `X-Rolling-Token` */
export async function createRollingPaperComment(
  slug: string,
  body: CreateRollingPaperCommentBodyMember | CreateRollingPaperCommentBodyGuest,
  rollingToken?: string | null,
): Promise<RollingPaperCommentCreateData> {
  const enc = encodeRollingSlug(slug);
  const headers = mergeRollingPaperHeaders(rollingToken, {
    "Content-Type": "application/json",
  });
  const isGuest =
    "guestNickname" in body && "guestPassword" in body;
  if (isGuest) {
    return publicApiClient<RollingPaperCommentCreateData>(
      `/api/rolling-papers/${enc}/comments`,
      {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      },
    );
  }
  return apiClient<RollingPaperCommentCreateData>(
    `/api/rolling-papers/${enc}/comments`,
    {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    },
  );
}

/** POST /api/rolling-papers/{slug}/comments/{commentId}/verify — 비회원 비밀번호 검증 → 단기 verifyToken + 편집용 본문 */
export type RollingPaperCommentVerifyEnvelope = {
  success?: boolean;
  message?: string;
  data?: { verifyToken?: string; content?: string | null };
};

export async function verifyRollingPaperGuestCommentPassword(
  slug: string,
  commentId: number,
  guestPassword: string,
  rollingToken?: string | null,
): Promise<{ verifyToken: string; content: string }> {
  const enc = encodeRollingSlug(slug);
  const res = await publicApiClient<RollingPaperCommentVerifyEnvelope>(
    `/api/rolling-papers/${enc}/comments/${commentId}/verify`,
    {
      method: "POST",
      headers: mergeRollingPaperHeaders(rollingToken, {
        "Content-Type": "application/json",
      }),
      body: JSON.stringify({ guestPassword: guestPassword.trim() }),
    },
  );
  const token = res.data?.verifyToken?.trim();
  if (!token) {
    throw new Error(res.message ?? "인증 토큰을 받지 못했습니다.");
  }
  const raw = res.data?.content;
  const content = typeof raw === "string" ? raw : "";
  return { verifyToken: token, content };
}

export type UpdateRollingPaperCommentPayload = {
  content: string;
  verifyToken?: string;
  rollingToken?: string | null;
};

/**
 * PATCH /api/rolling-papers/{slug}/comments/{commentId}
 * - 회원: JWT + `{ content }` (`apiClient`)
 * - 비회원: `{ content, verifyToken }` (`publicApiClient`)
 */
export async function updateRollingPaperComment(
  slug: string,
  commentId: number,
  payload: UpdateRollingPaperCommentPayload,
): Promise<{ success?: boolean; message?: string }> {
  const enc = encodeRollingSlug(slug);
  const path = `/api/rolling-papers/${enc}/comments/${commentId}`;
  const body: Record<string, unknown> = {
    content: payload.content.trim(),
  };
  const vt = payload.verifyToken?.trim();
  if (vt) {
    body.verifyToken = vt;
    return publicApiClient<{ success?: boolean; message?: string }>(path, {
      method: "PATCH",
      headers: mergeRollingPaperHeaders(payload.rollingToken, {
        "Content-Type": "application/json",
      }),
      body: JSON.stringify(body),
    });
  }
  return apiClient<{ success?: boolean; message?: string }>(path, {
    method: "PATCH",
    headers: mergeRollingPaperHeaders(payload.rollingToken, {
      "Content-Type": "application/json",
    }),
    body: JSON.stringify(body),
  });
}

/** DELETE — 회원: JWT. 비회원: `{ verifyToken }` */
export async function deleteRollingPaperComment(
  slug: string,
  commentId: number,
  opts:
    | { mode: "member"; rollingToken?: string | null }
    | { mode: "guest"; verifyToken: string; rollingToken?: string | null },
): Promise<{ success?: boolean; message?: string }> {
  const enc = encodeRollingSlug(slug);
  const path = `/api/rolling-papers/${enc}/comments/${commentId}`;

  if (opts.mode === "guest") {
    const vt = opts.verifyToken.trim();
    return publicApiClient<{ success?: boolean; message?: string }>(path, {
      method: "DELETE",
      headers: mergeRollingPaperHeaders(opts.rollingToken, {
        "Content-Type": "application/json",
      }),
      body: JSON.stringify({ verifyToken: vt }),
    });
  }

  return apiClient<{ success?: boolean; message?: string }>(path, {
    method: "DELETE",
    headers: mergeRollingPaperHeaders(opts.rollingToken),
  });
}
