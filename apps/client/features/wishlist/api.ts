import { apiClient, publicApiClient } from "@/lib/api/client";
import { isRollingPaperListType } from "@/lib/board-entry-path";
import type {
  BoardAssetData,
  CommentCreateData,
  CommentListData,
  MyBoardData,
  MyBoardMeApiResponse,
  MyBoardsAllApiResponse,
  MyLatestBoardSummaryPayload,
  MyWishBoardListApiResponse,
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

/** GET /api/boards/me — 위시·롤링 중 최근 생성 1건 (items/assets 없음) */
export async function getMyBoard(): Promise<MyBoardMeApiResponse> {
  return apiClient<MyBoardMeApiResponse>("/api/boards/me");
}

/** GET /api/boards/me/list — 내 위시보드 목록 (슬러그만 필요할 때) */
export async function getMyWishBoardList(): Promise<MyWishBoardListApiResponse> {
  return apiClient<MyWishBoardListApiResponse>("/api/boards/me/list");
}

/**
 * 소유 위시보드 에디터용 스냅샷 — GET /me 요약에 없는 items·assets 병합.
 */
export async function fetchMyWishBoardEditorSnapshot(
  slug: string,
  meta?: { isPublic?: boolean; targetDate?: string },
): Promise<MyBoardData> {
  const enc = encodeBoardSlug(slug);
  const [itemsRes, bgRes, stickerRes] = await Promise.all([
    apiClient<MyWishItemsData>(`/api/boards/${enc}/items`),
    apiClient<{ data: { assetKey: string | null } }>(`/api/boards/${enc}/assets/background`),
    apiClient<{
      data: { stickers: { slotIndex: number; assetKey: string | null }[] };
    }>(`/api/boards/${enc}/assets/stickers`),
  ]);

  const items = itemsRes.data.items;
  const assets = buildBoardAssetsFromStickerApis(bgRes, stickerRes);

  return {
    data: {
      boardSlug: slug,
      isPublic: meta?.isPublic ?? false,
      targetDate: meta?.targetDate ?? "",
      items,
      assets,
    },
  };
}

function buildBoardAssetsFromStickerApis(
  bgRes: { data: { assetKey: string | null } },
  stickerRes: {
    data: { stickers: { slotIndex: number; assetKey: string | null }[] };
  },
): BoardAssetData[] {
  const assets: BoardAssetData[] = [];
  const bgKey = bgRes.data?.assetKey?.trim();
  if (bgKey) {
    assets.push({ assetType: "BACKGROUND", assetKey: bgKey, slotIndex: null });
  }
  for (const s of stickerRes.data?.stickers ?? []) {
    const ak = s.assetKey?.trim();
    if (ak) {
      assets.push({ assetType: "STICKER", assetKey: ak, slotIndex: s.slotIndex });
    }
  }
  return assets;
}

/** 최근 원본이 롤링이어도, 목록에서 첫 위시보드 슬러그를 고름 */
export async function resolveWishBoardSlugForEditor(): Promise<{
  slug: string | null;
  meta?: { isPublic: boolean; targetDate: string };
}> {
  const me = await getMyBoard();
  const row = me.data;
  if (row.type === "WISH_BOARD") {
    const slug = row.slug?.trim();
    if (!slug) return { slug: null };
    return {
      slug,
      meta: { isPublic: row.isPublic, targetDate: row.targetDate },
    };
  }
  const list = await getMyWishBoardList();
  const first = list.data?.[0];
  const slug = first?.boardSlug?.trim();
  if (!slug) return { slug: null };
  return {
    slug,
    meta: {
      isPublic: first.isPublic,
      targetDate: first.targetDate,
    },
  };
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
        isCommentPublic: d.isCommentPublic,
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
    ...(typeof o.isCommentPublic === "boolean"
      ? { isCommentPublic: o.isCommentPublic }
      : {}),
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

/**
 * 편집용 풀 위시보드.
 * - 소유 위시보드: 목록(`/api/me/boards-all` 또는 `/api/boards/me/list`)에서 슬러그 확인 후
 *   로그인 상태에서 `GET .../items`·에셋 API로 조립(비공개 보드 포함).
 * - 보조: 공개 보드만 익명 `GET /api/boards/{slug}`.
 */
const inflightWishBoardDetail = new Map<string, Promise<MyBoardData>>();

async function loadMyWishBoardDetailOnce(slug: string): Promise<MyBoardData> {
  const trimmed = slug.trim();

  try {
    const listRes = await getMyBoardsAll();
    const rows = Array.isArray(listRes.data) ? listRes.data : [];
    for (const row of rows) {
      if (!row || typeof row !== "object") continue;
      const r = row as Record<string, unknown>;
      const rowSlug = typeof r.slug === "string" ? r.slug.trim() : "";
      if (rowSlug !== trimmed) continue;
      if (isRollingPaperListType(String(r.type ?? ""))) continue;
      const meta = {
        isPublic: typeof r.isPublic === "boolean" ? r.isPublic : true,
        targetDate:
          r.targetDate == null || r.targetDate === ""
            ? ""
            : String(r.targetDate).slice(0, 10),
      };
      return fetchMyWishBoardEditorSnapshot(trimmed, meta);
    }
  } catch {
    /* ignore */
  }

  try {
    const raw = await apiClient<unknown>("/api/boards/me/list", undefined, {
      silentFailure: true,
    });
    const data = (raw as { data?: unknown }).data;
    if (Array.isArray(data)) {
      for (const row of data) {
        if (!row || typeof row !== "object") continue;
        const o = row as Record<string, unknown>;
        const boardSlug = typeof o.boardSlug === "string" ? o.boardSlug.trim() : "";
        if (boardSlug !== trimmed) continue;
        const meta = {
          isPublic: typeof o.isPublic === "boolean" ? o.isPublic : true,
          targetDate:
            o.targetDate == null || o.targetDate === ""
              ? ""
              : String(o.targetDate).slice(0, 10),
        };
        return fetchMyWishBoardEditorSnapshot(trimmed, meta);
      }
    }
  } catch {
    /* ignore */
  }

  try {
    const raw = await apiClient<unknown>(`/api/boards/${encodeBoardSlug(trimmed)}`, undefined, {
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

export async function getMyWishBoardDetail(boardSlug: string): Promise<MyBoardData> {
  const slug = boardSlug.trim();
  if (!slug) {
    throw new Error("boardSlug가 비어 있습니다.");
  }

  let inflight = inflightWishBoardDetail.get(slug);
  if (!inflight) {
    inflight = loadMyWishBoardDetailOnce(slug).finally(() => {
      inflightWishBoardDetail.delete(slug);
    });
    inflightWishBoardDetail.set(slug, inflight);
  }
  return inflight;
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
  patch: Partial<{
    title: string | null;
    isPublic: boolean;
    isCommentPublic: boolean;
    targetDate: string | null;
  }>,
): Promise<void> {
  const payload: Record<string, unknown> = {};
  if ("title" in patch) payload.title = patch.title;
  if ("isPublic" in patch) payload.isPublic = patch.isPublic;
  if ("isCommentPublic" in patch) payload.isCommentPublic = patch.isCommentPublic;
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
    isCommentPublic: boolean;
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
  if ("isCommentPublic" in patch)
    payload.isCommentPublic = patch.isCommentPublic;
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

/** POST /api/boards/{slug}/save — JWT 필수, 타인 공개 위시보드만 독립 복사본으로 저장 */
export type WishBoardSavePayload = {
  slug: string;
  savedAt: string;
};

export type WishBoardSaveResponse = {
  success?: boolean;
  message?: string;
  data: WishBoardSavePayload;
};

export async function postWishBoardSave(slug: string): Promise<WishBoardSaveResponse> {
  const enc = encodeBoardSlug(slug);
  return apiClient<WishBoardSaveResponse>(`/api/boards/${enc}/save`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({}),
  });
}

/** GET /api/boards/me/saved — 내가 저장한 위시보드 복사본 목록 (JWT 필수) */
export type SavedWishBoardItem = {
  slug: string;
  title?: string | null;
  savedAt?: string;
};

export type MySavedWishBoardsApiResponse = {
  success?: boolean;
  message?: string;
  data?: {
    saved?: SavedWishBoardItem[];
  };
};

export async function getMySavedWishBoards(): Promise<MySavedWishBoardsApiResponse> {
  return apiClient<MySavedWishBoardsApiResponse>("/api/boards/me/saved");
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

/** DELETE /api/rolling-papers/saved/{slug} — 저장한 본인만 */
export async function deleteSavedRollingPaper(slug: string): Promise<void> {
  await apiClient(`/api/rolling-papers/saved/${encodeBoardSlug(slug)}`, {
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

/** POST /api/boards 요청 — title 선택(null 가능), targetDate·보드 공개·댓글 공개 선택 */
export type CreateWishBoardBody = {
  title?: string | null;
  targetDate?: string | null;
  /** 다른 사용자가 링크·목록으로 보드를 볼 수 있는지 (본인은 항상 조회 가능) */
  isPublic?: boolean | null;
  /** 공개 기준일 전에 타인이 작성한 댓글을 볼 수 있는지 */
  isCommentPublic?: boolean | null;
};

/** POST /api/boards — 위시보드 생성 (서버: WishBoardCreateRequest, 제목 최대 8자) */
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
  if (body.isCommentPublic !== undefined && body.isCommentPublic !== null) {
    payload.isCommentPublic = body.isCommentPublic;
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

/** POST /api/rolling-papers — RollingPaperCreateRequest (제목·받는 사람·기준일, imageKey·isCommentPublic) */
export type CreateRollingPaperBody = {
  title: string;
  /** 받는 사람 이름 — 서버 `@Size(max = 100)`, 비우면 생략 */
  recipientName?: string | null;
  targetDate: string;
  imageKey?: string | null;
  /** 댓글 즉시 공개 여부 · 서버 기본 false와 맞추려면 명시 전달 권장 */
  isCommentPublic: boolean;
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
    targetDate: body.targetDate.trim(),
    isCommentPublic: body.isCommentPublic,
  };
  const rn = body.recipientName?.trim();
  if (rn) {
    payload.recipientName = rn;
  }
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

const inflightPublicBoard = new Map<string, Promise<PublicBoardData | null>>();

/**
 * 공개 보드 단건. 슬러그에 해당하는 보드가 없거나(404) 비공개 등이면 `null`.
 * 로컬에 구단 시드가 없을 때도 UI가 깨지지 않게 한다.
 */
export async function getPublicBoard(slug: string): Promise<PublicBoardData | null> {
  const key = slug.trim();
  let p = inflightPublicBoard.get(key);
  if (p) return p;
  p = (async () => {
    try {
      return await apiClient<PublicBoardData>(
        `/api/boards/${encodeBoardSlug(key)}`,
        undefined,
        { silentFailure: true },
      );
    } catch {
      return null;
    }
  })().finally(() => {
    inflightPublicBoard.delete(key);
  });
  inflightPublicBoard.set(key, p);
  return p;
}

/** 보드 없음·네트워크 실패 시 댓글 그리드용 빈 페이지 */
function emptyCommentListData(page: number): CommentListData {
  return {
    success: true,
    data: {
      comments: [],
      currentPage: page,
      totalPages: 1,
      totalCount: 0,
      hasNext: false,
      isLastPageFull: false,
    },
  };
}

/** Spring `page`는 0부터 — `commentPageIdx`와 동일 */
const inflightCommentsBySlugPage = new Map<string, Promise<CommentListData>>();

export async function getComments(slug: string, page: number): Promise<CommentListData> {
  const key = `${encodeBoardSlug(slug)}|${page}`;
  let p = inflightCommentsBySlugPage.get(key);
  if (p) return p;
  p = (async () => {
    try {
      return await apiClient<CommentListData>(
        `/api/boards/${encodeBoardSlug(slug)}/comments?page=${page}&size=6`,
        undefined,
        { silentFailure: true },
      );
    } catch {
      return emptyCommentListData(page);
    }
  })().finally(() => {
    inflightCommentsBySlugPage.delete(key);
  });
  inflightCommentsBySlugPage.set(key, p);
  return p;
}

/** POST /api/boards/:slug/comments — 비회원 시 guestNickname·guestPassword 필수 */
export type CreateCommentPayload = {
  content: string;
  stickerKey: string;
  slotIndex: number;
  guestNickname?: string;
  guestPassword?: string;
};

export async function createComment(
  slug: string,
  payload: CreateCommentPayload,
): Promise<CommentCreateData> {
  const body: Record<string, unknown> = {
    content: payload.content,
    stickerKey: payload.stickerKey,
    slotIndex: payload.slotIndex,
  };
  const gn = payload.guestNickname?.trim();
  const gp = payload.guestPassword;
  if (gn !== undefined && gn !== "" && gp !== undefined && gp !== "") {
    body.guestNickname = gn;
    body.guestPassword = gp;
  }
  return apiClient<CommentCreateData>(
    `/api/boards/${encodeBoardSlug(slug)}/comments`,
    {
      method: "POST",
      body: JSON.stringify(body),
    },
  );
}

/** POST /api/boards/:slug/comments/:commentId/verify — 비회원 비밀번호 검증 → 단기 verifyToken */
export type CommentVerifyEnvelope = {
  success?: boolean;
  message?: string;
  data?: { verifyToken?: string };
};

export async function verifyGuestCommentPassword(
  slug: string,
  commentId: number,
  guestPassword: string,
): Promise<string> {
  const res = await publicApiClient<CommentVerifyEnvelope>(
    `/api/boards/${encodeBoardSlug(slug)}/comments/${commentId}/verify`,
    {
      method: "POST",
      body: JSON.stringify({ guestPassword: guestPassword.trim() }),
    },
  );
  const token = res.data?.verifyToken?.trim();
  if (!token) {
    throw new Error(res.message ?? "인증 토큰을 받지 못했습니다.");
  }
  return token;
}

/** PATCH /api/boards/:slug/comments/:id — 회원: JWT + `{ content }`. 비회원: `{ content, verifyToken }` */
export type UpdateCommentPayload = {
  content: string;
  verifyToken?: string;
};

export async function updateComment(
  slug: string,
  commentId: number,
  payload: UpdateCommentPayload,
): Promise<void> {
  const path = `/api/boards/${encodeBoardSlug(slug)}/comments/${commentId}`;
  const body: Record<string, unknown> = {
    content: payload.content,
  };
  const vt = payload.verifyToken?.trim();
  if (vt) {
    body.verifyToken = vt;
    await publicApiClient(path, {
      method: "PATCH",
      body: JSON.stringify(body),
    });
    return;
  }
  await apiClient(path, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

/** DELETE /api/boards/:slug/comments/:id — 회원: JWT. 비회원: `{ verifyToken }` */
export async function deleteComment(
  slug: string,
  commentId: number,
  options?: { verifyToken?: string },
): Promise<void> {
  const path = `/api/boards/${encodeBoardSlug(slug)}/comments/${commentId}`;
  const vt = options?.verifyToken?.trim();
  if (vt) {
    await publicApiClient(path, {
      method: "DELETE",
      body: JSON.stringify({ verifyToken: vt }),
    });
    return;
  }
  await apiClient(path, {
    method: "DELETE",
  });
}
