import { apiClient } from "@/lib/api/client";
import type {
  CommentCreateData,
  CommentListData,
  MyBoardData,
  MyBoardsAllApiResponse,
  MyLatestBoardSummaryPayload,
  MyWishItemsData,
  PublicBoardData,
} from "./types";

function isWishBoardFullPayload(d: unknown): d is MyBoardData["data"] {
  if (!d || typeof d !== "object") return false;
  const o = d as Record<string, unknown>;
  return (
    typeof o.boardSlug === "string" &&
    Array.isArray(o.items) &&
    Array.isArray(o.assets)
  );
}

function isLatestSummaryPayload(d: unknown): d is MyLatestBoardSummaryPayload {
  if (!d || typeof d !== "object") return false;
  const o = d as Record<string, unknown>;
  /** 구 풀 위시보드는 `boardSlug`·`items`가 있고 신규 요약은 `type`·`slug` 중심 */
  if ("items" in o && Array.isArray((o as { items?: unknown }).items)) {
    return false;
  }
  return typeof o.type === "string" && typeof o.slug === "string";
}

/** 원본 JSON에서 `data`만 해석 — 신규 요약 / 구 풀 위시보드 */
function parseBoardsMeEnvelope(raw: unknown): {
  summary: MyLatestBoardSummaryPayload | null;
  fullWishBoard: MyBoardData | null;
} {
  if (!raw || typeof raw !== "object") {
    return { summary: null, fullWishBoard: null };
  }
  const envelope = raw as { data?: unknown };
  const d = envelope.data;
  if (isLatestSummaryPayload(d)) {
    return {
      summary: {
        type: d.type,
        slug: d.slug.trim(),
        title: d.title ?? null,
        targetDate: d.targetDate ?? null,
        createdAt: String(d.createdAt ?? ""),
        isPublic: d.isPublic,
        recipientName: d.recipientName,
        imageKey: d.imageKey ?? null,
      },
      fullWishBoard: null,
    };
  }
  if (isWishBoardFullPayload(d)) {
    const slug = d.boardSlug.trim();
    return {
      summary: {
        type: "WISHBOARD",
        slug,
        title: null,
        targetDate: d.targetDate != null ? String(d.targetDate) : null,
        createdAt: "",
        isPublic: Boolean(d.isPublic),
      },
      fullWishBoard: { data: d },
    };
  }
  return { summary: null, fullWishBoard: null };
}

/**
 * `GET /api/boards/me` — 최신 1건 메타.
 * 구 서버(풀 위시보드만)면 요약을 합성해 반환. 없거나 형식 불명이면 null.
 */
export async function getMyLatestBoardSummary(): Promise<MyLatestBoardSummaryPayload | null> {
  try {
    const raw = await apiClient<unknown>("/api/boards/me");
    const { summary } = parseBoardsMeEnvelope(raw);
    return summary?.slug ? summary : null;
  } catch {
    return null;
  }
}

/**
 * 편집용 풀 위시보드. `GET /api/boards/me/detail?slug=` 우선, 없으면 구 `GET /api/boards/me`가
 * 동일 슬러그의 풀 응답일 때만 사용.
 */
export async function getMyWishBoardDetail(boardSlug: string): Promise<MyBoardData> {
  const slug = boardSlug.trim();
  if (!slug) {
    throw new Error("boardSlug가 비어 있습니다.");
  }

  const detailPath = `/api/boards/me/detail?slug=${encodeURIComponent(slug)}`;

  try {
    const raw = await apiClient<unknown>(detailPath);
    const { fullWishBoard } = parseBoardsMeEnvelope(raw);
    if (fullWishBoard) {
      return fullWishBoard;
    }
  } catch {
    /* detail 미구축·404 */
  }

  try {
    const raw = await apiClient<unknown>("/api/boards/me");
    const { fullWishBoard } = parseBoardsMeEnvelope(raw);
    if (fullWishBoard && fullWishBoard.data.boardSlug.trim() === slug) {
      return fullWishBoard;
    }
  } catch {
    /* ignore */
  }

  throw new Error("위시보드를 불러오지 못했습니다.");
}

/** GET /api/me/boards-all — 위시보드·롤링페이퍼 합산 최대 5건, 생성일 내림차순 */
export async function getMyBoardsAll(): Promise<MyBoardsAllApiResponse> {
  return apiClient<MyBoardsAllApiResponse>("/api/me/boards-all", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });
}

/** POST /api/boards 응답 — 슬롯·에셋은 GET /api/boards/me 로 조회 */
export type CreateBoardApiResponse = {
  success: boolean;
  message: string;
  data: {
    boardSlug: string;
  };
};

/** POST /api/boards 요청 본문 — 필드는 서버 스펙에 맞게 선택 전송 */
export type CreateWishBoardBody = {
  /** 미입력 시 null */
  title?: string | null;
  targetDate?: string | null;
  isPublic?: boolean | null;
};

/** POST /api/boards — 위시보드 생성 */
export async function createWishBoard(
  body: CreateWishBoardBody = {},
): Promise<CreateBoardApiResponse> {
  const payload: Record<string, unknown> = {};
  if ("title" in body) {
    const raw = body.title;
    const t = raw == null || raw === "" ? "" : String(raw).trim();
    payload.title = t ? t : null;
  }
  if (body.targetDate != null && String(body.targetDate).trim() !== "") {
    payload.targetDate = String(body.targetDate).trim();
  }
  if (body.isPublic !== undefined && body.isPublic !== null) {
    payload.isPublic = body.isPublic;
  }

  return apiClient<CreateBoardApiResponse>("/api/boards", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/** POST /api/boards — 본문 없이 생성(호환) */
export async function createMyBoard(): Promise<CreateBoardApiResponse> {
  return createWishBoard({});
}

/** POST /api/rolling-papers */
export type CreateRollingPaperBody = {
  title: string;
  recipientName: string;
  targetDate: string;
  imageKey?: string | null;
};

export type CreateRollingPaperApiResponse = {
  success: boolean;
  message: string;
  data: {
    slug: string;
    commentShareUrl: string;
    viewShareUrl: string;
  };
};

export async function createRollingPaper(
  body: CreateRollingPaperBody,
): Promise<CreateRollingPaperApiResponse> {
  const payload: Record<string, unknown> = {
    title: body.title.trim(),
    recipientName: body.recipientName.trim(),
    targetDate: body.targetDate.trim(),
  };
  const ik = body.imageKey?.trim();
  if (ik) {
    payload.imageKey = ik;
  }

  return apiClient<CreateRollingPaperApiResponse>("/api/rolling-papers", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/** GET /api/boards/me/items — CHILD, 슬롯 3개 고정 */
export async function getMyWishItems(): Promise<MyWishItemsData> {
  return apiClient<MyWishItemsData>("/api/boards/me/items", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });
}

export type PatchMyWishItemBody = {
  itemName: string;
  iconKey?: string;
  /** 서버가 빈 `iconKey`로 아이콘 제거를 허용할 때 */
  clearIcon?: boolean;
};

export type PatchMyWishItemResponse = {
  success: boolean;
  message: string;
};

export type PutMyBoardStickerSlotResponse = {
  success: boolean;
  message: string;
};

/** PUT /api/boards/me/assets/stickers/:slotIndex — 스티커 슬롯 1~6 */
export async function putMyBoardStickerSlot(
  slotIndex: number,
  assetKey: string,
): Promise<PutMyBoardStickerSlotResponse> {
  return apiClient<PutMyBoardStickerSlotResponse>(
    `/api/boards/me/assets/stickers/${slotIndex}`,
    {
      method: "PUT",
      body: JSON.stringify({ assetKey: assetKey.trim() }),
    },
  );
}

export type DeleteMyBoardStickerSlotResponse = {
  success: boolean;
  message: string;
};

/** DELETE /api/boards/me/assets/stickers/:slotIndex — 해당 슬롯 스티커 제거 */
export async function deleteMyBoardStickerSlot(
  slotIndex: number,
): Promise<DeleteMyBoardStickerSlotResponse> {
  return apiClient<DeleteMyBoardStickerSlotResponse>(
    `/api/boards/me/assets/stickers/${slotIndex}`,
    {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    },
  );
}

export type PutMyBoardBackgroundResponse = {
  success: boolean;
  message: string;
};

/** PUT /api/boards/me/assets/background — 보드 배경 설정 */
export async function putMyBoardBackground(
  assetKey: string,
): Promise<PutMyBoardBackgroundResponse> {
  return apiClient<PutMyBoardBackgroundResponse>("/api/boards/me/assets/background", {
    method: "PUT",
    body: JSON.stringify({ assetKey: assetKey.trim() }),
  });
}

export type DeleteMyBoardBackgroundResponse = {
  success: boolean;
  message: string;
};

/** DELETE /api/boards/me/assets/background — 보드 배경 제거 */
export async function deleteMyBoardBackground(): Promise<DeleteMyBoardBackgroundResponse> {
  return apiClient<DeleteMyBoardBackgroundResponse>("/api/boards/me/assets/background", {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
  });
}

/** PATCH /api/boards/me/items/:slotIndex — CHILD, slotIndex 1~3 */
export async function patchMyWishItem(
  slotIndex: number,
  body: PatchMyWishItemBody,
): Promise<PatchMyWishItemResponse> {
  const payload: Record<string, string> = {
    itemName: body.itemName,
  };
  if (body.clearIcon) {
    payload.iconKey = "";
  } else if (body.iconKey != null && body.iconKey.trim() !== "") {
    payload.iconKey = body.iconKey.trim();
  }

  return apiClient<PatchMyWishItemResponse>(`/api/boards/me/items/${slotIndex}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export type DeleteMyWishItemResponse = {
  success: boolean;
  message: string;
};

/** DELETE /api/boards/me/items/:slotIndex — CHILD, 슬롯 비우기 (slotIndex 1~3) */
export async function deleteMyWishItem(slotIndex: number): Promise<DeleteMyWishItemResponse> {
  return apiClient<DeleteMyWishItemResponse>(`/api/boards/me/items/${slotIndex}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
  });
}

export async function getPublicBoard(slug: string): Promise<PublicBoardData> {
  return apiClient<PublicBoardData>(`/api/boards/${slug}`);
}

/** Spring `page`는 0부터 — `commentPageIdx`와 동일 */
export async function getComments(slug: string, page: number): Promise<CommentListData> {
  return apiClient<CommentListData>(`/api/boards/${slug}/comments?page=${page}&size=6`);
}

/**
 * POST /api/boards/:slug/comments — CHILD
 * 서버 `CommentCreateRequest`: `slotIndex` 필수(`@NotNull`), `stickerKey` 선택
 */
export async function createComment(
  slug: string,
  content: string,
  stickerKey: string,
  slotIndex: number,
): Promise<CommentCreateData> {
  return apiClient<CommentCreateData>(`/api/boards/${slug}/comments`, {
    method: "POST",
    body: JSON.stringify({ content, stickerKey, slotIndex }),
  });
}

export async function updateComment(
  slug: string,
  commentId: number,
  content: string,
): Promise<void> {
  await apiClient(`/api/boards/${slug}/comments/${commentId}`, {
    method: "PATCH",
    body: JSON.stringify({ content }),
  });
}

export async function deleteComment(slug: string, commentId: number): Promise<void> {
  await apiClient(`/api/boards/${slug}/comments/${commentId}`, {
    method: "DELETE",
  });
}
