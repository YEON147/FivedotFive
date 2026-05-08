import { apiClient } from "@/lib/api/client";
import type {
  BoardAssetData,
  CommentCreateData,
  CommentListData,
  MyBoardData,
  MyBoardsAllApiResponse,
  MyLatestBoardSummaryPayload,
  MyWishItemsData,
  PublicBoardData,
  WishItemData,
} from "./types";

function encodeBoardSlug(slug: string): string {
  return encodeURIComponent(slug.trim());
}

/** `/api/boards/{slug}/…` 경로 접두사 */
function boardsApi(slug: string, path: string): string {
  return `/api/boards/${encodeBoardSlug(slug)}${path.startsWith("/") ? path : `/${path}`}`;
}

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

function wishBoardListRowToMyData(row: unknown): MyBoardData["data"] | null {
  if (!row || typeof row !== "object") return null;
  const o = row as Record<string, unknown>;
  const boardSlug = typeof o.boardSlug === "string" ? o.boardSlug.trim() : "";
  if (!boardSlug || !Array.isArray(o.items) || !Array.isArray(o.assets)) {
    return null;
  }
  const targetRaw = o.targetDate;
  const targetDate =
    targetRaw == null || targetRaw === ""
      ? ""
      : typeof targetRaw === "string"
        ? targetRaw
        : String(targetRaw);
  return {
    boardSlug,
    isPublic: Boolean(o.isPublic),
    targetDate,
    items: o.items as WishItemData[],
    assets: o.assets as BoardAssetData[],
  };
}

/**
 * `GET /api/boards/me` — 최신 1건 메타.
 * 구 서버(풀 위시보드만)면 요약을 합성해 반환. 없거나 형식 불명이면 null.
 */
export async function getMyLatestBoardSummary(): Promise<MyLatestBoardSummaryPayload | null> {
  try {
    /** 보드 없음 404 등은 호출부에서 null 처리 — 콘솔 API 요청 실패 로그 생략 */
    const raw = await apiClient<unknown>("/api/boards/me", undefined, {
      silentFailure: true,
    });
    const { summary } = parseBoardsMeEnvelope(raw);
    return summary?.slug ? summary : null;
  } catch {
    return null;
  }
}

/** 네비게이션용 — 최신 1건 메타에서 슬러그만 필요할 때 (`navigateToMyWishBoard` 등) */
export async function getMyBoard(): Promise<{ data: { boardSlug: string } }> {
  const summary = await getMyLatestBoardSummary();
  const slug = summary?.slug?.trim();
  if (!slug) {
    throw new Error("위시보드를 찾을 수 없습니다.");
  }
  return { data: { boardSlug: slug } };
}

/**
 * 편집용 풀 위시보드.
 * - 소유 보드: `GET /api/boards/me/list`에서 해당 `boardSlug` 행 사용.
 * - 보조: 공개 보드만 `GET /api/boards/{slug}`(비공개 소유 보드는 목록으로만 로드).
 */
export async function getMyWishBoardDetail(boardSlug: string): Promise<MyBoardData> {
  const slug = boardSlug.trim();
  if (!slug) {
    throw new Error("boardSlug가 비어 있습니다.");
  }

  try {
    const raw = await apiClient<unknown>("/api/boards/me/list", undefined, {
      silentFailure: true,
    });
    const data = (raw as { data?: unknown }).data;
    if (Array.isArray(data)) {
      for (const row of data) {
        const parsed = wishBoardListRowToMyData(row);
        if (parsed && parsed.boardSlug === slug) {
          return { data: parsed };
        }
      }
    }
  } catch {
    /* ignore */
  }

  try {
    const raw = await apiClient<unknown>(`/api/boards/${encodeBoardSlug(slug)}`, undefined, {
      silentFailure: true,
    });
    const { fullWishBoard } = parseBoardsMeEnvelope(raw);
    if (fullWishBoard) {
      const d = fullWishBoard.data;
      if (d.isPublic === undefined) {
        return {
          data: {
            ...d,
            isPublic: true,
          },
        };
      }
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

/** PATCH /api/boards/{slug} — 보낸 필드만 갱신 */
export async function patchWishBoard(
  slug: string,
  patch: Partial<{ title: string | null; isPublic: boolean; targetDate: string | null }>,
): Promise<void> {
  const payload: Record<string, unknown> = {};
  if ("title" in patch) payload.title = patch.title;
  if ("isPublic" in patch) payload.isPublic = patch.isPublic;
  if ("targetDate" in patch) {
    const td = patch.targetDate;
    payload.targetDate =
      td === null || td === undefined || String(td).trim() === ""
        ? null
        : String(td).trim().slice(0, 10);
  }
  if (Object.keys(payload).length === 0) return;

  await apiClient(`/api/boards/${encodeBoardSlug(slug)}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

/** PATCH /api/rolling-papers/{slug} — 보낸 필드만 갱신 */
export async function patchRollingPaper(
  slug: string,
  patch: Partial<{
    title: string;
    recipientName: string;
    targetDate: string | null;
    imageKey: string | null;
  }>,
): Promise<void> {
  const payload: Record<string, unknown> = {};
  if ("title" in patch) payload.title = patch.title;
  if ("recipientName" in patch) payload.recipientName = patch.recipientName;
  if ("targetDate" in patch) {
    const td = patch.targetDate;
    payload.targetDate =
      td === null || td === undefined || String(td).trim() === ""
        ? null
        : String(td).trim().slice(0, 10);
  }
  if ("imageKey" in patch) payload.imageKey = patch.imageKey;
  if (Object.keys(payload).length === 0) return;

  await apiClient(`/api/rolling-papers/${encodeBoardSlug(slug)}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

/** DELETE /api/boards/{slug} — 소유자만 */
export async function deleteWishBoard(slug: string): Promise<void> {
  await apiClient(`/api/boards/${encodeBoardSlug(slug)}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
  });
}

/** DELETE /api/rolling-papers/{slug} — 소유자만 */
export async function deleteRollingPaper(slug: string): Promise<void> {
  await apiClient(`/api/rolling-papers/${encodeBoardSlug(slug)}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
  });
}

/** POST /api/boards — 201 CREATED, 한도 초과 시 409(CONFLICT) 등 */
export type CreateBoardApiResponse = {
  success: boolean;
  message: string;
  data: {
    boardSlug: string;
  };
};

/** POST /api/boards 요청 — title 선택(null 가능), targetDate·isPublic 선택 */
export type CreateWishBoardBody = {
  title?: string | null;
  targetDate?: string | null;
  isPublic?: boolean | null;
};

/** POST /api/boards — 위시보드 생성 (서버: WishBoardCreateRequest, 제목 최대 100자) */
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

/** 한도 초과 등 서버 메시지와 스펙 문구 정렬 */
export const COMBINED_BOARD_CREATE_LIMIT_MESSAGE =
  "위시보드와 롤링페이퍼 합산 최대 5개까지 생성할 수 있습니다.";

export function formatCreateBoardLimitError(message: string): string {
  if (
    message.includes("위시보드와 롤링페이퍼 합산") ||
    message.includes("위시보드는 최대 5개") ||
    message.includes("롤링페이퍼는 최대 5개")
  ) {
    return COMBINED_BOARD_CREATE_LIMIT_MESSAGE;
  }
  return message;
}

/** POST /api/rolling-papers — 본문 RollingPaperCreateRequest (제목·수신자명·targetDate 필수, imageKey 선택) */
export type CreateRollingPaperBody = {
  title: string;
  recipientName: string;
  targetDate: string;
  imageKey?: string | null;
};

/** POST /api/rolling-papers — 201 CREATED, data에 댓글용·저장용 공유 URL 포함 */
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

/**
 * POST /api/upload/image — 로그인 회원만, multipart `image`(jpg/jpeg/png/webp).
 * 201 CREATED, 본문 `data.imageKey`(S3·CDN 키).
 */
export type UploadRecipientImageApiResponse = {
  success: boolean;
  message: string;
  data: { imageKey: string };
};

/** 업로드 후 반환된 키를 롤링페이퍼 생성·수정 요청의 `imageKey`로 넘깁니다. */
export async function uploadRollingPaperRecipientImage(
  file: File,
): Promise<string> {
  const formData = new FormData();
  formData.append("image", file);

  const res = await apiClient<UploadRecipientImageApiResponse>("/api/upload/image", {
    method: "POST",
    body: formData,
  });

  const key = res.data?.imageKey?.trim();
  if (!key) {
    throw new Error("이미지 업로드 응답에 imageKey가 없습니다.");
  }
  return key;
}

/** GET /api/boards/{slug}/items — 소유자, 슬롯 3개 고정 */
export async function getMyWishItems(boardSlug: string): Promise<MyWishItemsData> {
  return apiClient<MyWishItemsData>(boardsApi(boardSlug, "/items"), {
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

/** PUT /api/boards/{slug}/assets/stickers/:slotIndex — 스티커 슬롯 1~6 */
export async function putMyBoardStickerSlot(
  boardSlug: string,
  slotIndex: number,
  assetKey: string,
): Promise<PutMyBoardStickerSlotResponse> {
  return apiClient<PutMyBoardStickerSlotResponse>(
    boardsApi(boardSlug, `/assets/stickers/${slotIndex}`),
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

/** DELETE /api/boards/{slug}/assets/stickers/:slotIndex — 해당 슬롯 스티커 제거 */
export async function deleteMyBoardStickerSlot(
  boardSlug: string,
  slotIndex: number,
): Promise<DeleteMyBoardStickerSlotResponse> {
  return apiClient<DeleteMyBoardStickerSlotResponse>(
    boardsApi(boardSlug, `/assets/stickers/${slotIndex}`),
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

/** PUT /api/boards/{slug}/assets/background — 보드 배경 설정 */
export async function putMyBoardBackground(
  boardSlug: string,
  assetKey: string,
): Promise<PutMyBoardBackgroundResponse> {
  return apiClient<PutMyBoardBackgroundResponse>(boardsApi(boardSlug, "/assets/background"), {
    method: "PUT",
    body: JSON.stringify({ assetKey: assetKey.trim() }),
  });
}

export type DeleteMyBoardBackgroundResponse = {
  success: boolean;
  message: string;
};

/** DELETE /api/boards/{slug}/assets/background — 보드 배경 제거 */
export async function deleteMyBoardBackground(
  boardSlug: string,
): Promise<DeleteMyBoardBackgroundResponse> {
  return apiClient<DeleteMyBoardBackgroundResponse>(boardsApi(boardSlug, "/assets/background"), {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
  });
}

/** PATCH /api/boards/{slug}/items/:slotIndex — 소유자, slotIndex 1~3 */
export async function patchMyWishItem(
  boardSlug: string,
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

  return apiClient<PatchMyWishItemResponse>(boardsApi(boardSlug, `/items/${slotIndex}`), {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export type DeleteMyWishItemResponse = {
  success: boolean;
  message: string;
};

/** DELETE /api/boards/{slug}/items/:slotIndex — 소유자, 슬롯 비우기 (slotIndex 1~3) */
export async function deleteMyWishItem(
  boardSlug: string,
  slotIndex: number,
): Promise<DeleteMyWishItemResponse> {
  return apiClient<DeleteMyWishItemResponse>(boardsApi(boardSlug, `/items/${slotIndex}`), {
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
