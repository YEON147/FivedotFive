import { apiClient } from "@/lib/api/client";
import { resolveBaseballStickerTeamApiSegment } from "@/lib/baseball-sticker-api-path";

export type BackgroundAssetDto = {
  id: number;
  assetKey: string;
  /** GET `/api/assets/backgrounds` — 카드 아래 제목용 (없으면 파일명에서 유도) */
  displayName?: string | null;
};

function fileNameFromAssetKey(assetKey: string): string {
  const i = assetKey.lastIndexOf("/");
  return i >= 0 ? assetKey.slice(i + 1) : assetKey;
}

function coerceTrimmedDisplayString(value: unknown): string | null {
  if (typeof value === "string") {
    const t = value.trim();
    return t.length ? t : null;
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }
  return null;
}

/**
 * GET `/api/assets/backgrounds` 항목에서 화면 표시명 후보 필드를 순서대로 읽습니다.
 * (Jackson `display_name`, 프록시 `name` 등 호환)
 */
export function pickBackgroundDisplayNameFromApiItem(
  raw: Record<string, unknown>,
): string | null {
  const keys = [
    "displayName",
    "display_name",
    "name",
    "label",
    "title",
  ] as const;
  for (const k of keys) {
    const s = coerceTrimmedDisplayString(raw[k]);
    if (s) {
      return s;
    }
  }
  return null;
}

function normalizeBackgroundAssetKeyFromApiItem(raw: Record<string, unknown>): string {
  const v = raw.assetKey ?? raw.asset_key ?? raw.key;
  if (typeof v !== "string") {
    return "";
  }
  return v.trim();
}

/** 배경 카드 제목 — API에서 온 표시명 우선, 없으면 확장자 뺀 파일명 */
export function resolveBackgroundDisplayLabel(
  assetKey: string,
  displayName?: string | null,
): string {
  const api = coerceTrimmedDisplayString(displayName);
  if (api) {
    return api;
  }
  const file = fileNameFromAssetKey(assetKey.trim());
  return file.replace(/\.[^.]+$/, "") || file || `배경`;
}

type BackgroundsApiResponse = {
  success: boolean;
  message: string;
  data: Record<string, unknown> | null | undefined;
};

function backgroundsListFromApiData(data: unknown): Record<string, unknown>[] | null {
  if (!data || typeof data !== "object") {
    return null;
  }
  const d = data as Record<string, unknown>;
  const list =
    d.backgrounds ??
    d.Backgrounds ??
    (d as { background_list?: unknown }).background_list;
  if (!Array.isArray(list)) {
    return null;
  }
  return list.filter(
    (row): row is Record<string, unknown> =>
      row != null && typeof row === "object" && !Array.isArray(row),
  );
}

/** GET /api/assets/backgrounds?boardSlug= — 구단 보드면 야구 전용 배경 포함 (Anyone) */
export async function fetchBackgroundAssets(
  boardSlug?: string | null,
): Promise<BackgroundAssetDto[]> {
  const qs =
    boardSlug != null && String(boardSlug).trim() !== ""
      ? `?boardSlug=${encodeURIComponent(String(boardSlug).trim())}`
      : "";
  const res = await apiClient<BackgroundsApiResponse>(
    `/api/assets/backgrounds${qs}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    },
  );

  const rows = backgroundsListFromApiData(res.data);
  if (!res.success || !rows) {
    return [];
  }

  return rows.map((raw) => {
    const id = Number(raw.id);
    const assetKey = normalizeBackgroundAssetKeyFromApiItem(raw);
    const displayName = pickBackgroundDisplayNameFromApiItem(raw);
    return {
      id: Number.isFinite(id) ? id : 0,
      assetKey,
      displayName,
    };
  });
}

export type StickerAssetDto = {
  id: number;
  assetKey: string;
};

type StickersApiResponse = {
  success: boolean;
  message: string;
  data: {
    stickers: StickerAssetDto[];
  };
};

type StickerFoldersApiResponse = {
  success: boolean;
  message: string;
  data: {
    folders: string[];
  };
};

/** GET /api/assets/stickers/folders — 스티커 폴더 목록 (Anyone) */
export async function fetchStickerFolders(
  boardSlug?: string | null,
): Promise<string[]> {
  const qs =
    boardSlug != null && String(boardSlug).trim() !== ""
      ? `?boardSlug=${encodeURIComponent(String(boardSlug).trim())}`
      : "";
  try {
    const res = await apiClient<StickerFoldersApiResponse>(
      `/api/assets/stickers/folders${qs}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      },
      { silentFailure: true },
    );

    if (!res.success || !Array.isArray(res.data?.folders)) {
      return [];
    }

    return res.data.folders;
  } catch {
    /** 500·HTML 에러 본문 등 — 호출부는 폴백 폴더로 계속 */
    return [];
  }
}

/** GET /api/assets/stickers?boardSlug= — 구단 보드면 야구 스티커 포함 (Anyone) */
export async function fetchStickerAssets(
  boardSlug?: string | null,
): Promise<StickerAssetDto[]> {
  const qs =
    boardSlug != null && String(boardSlug).trim() !== ""
      ? `?boardSlug=${encodeURIComponent(String(boardSlug).trim())}`
      : "";
  const res = await apiClient<StickersApiResponse>(`/api/assets/stickers${qs}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!res.success || !Array.isArray(res.data?.stickers)) {
    return [];
  }

  return res.data.stickers;
}

type StickerFolderApiResponse = {
  success: boolean;
  message: string;
  data: {
    folder: string;
    stickers: StickerAssetDto[];
  };
};

/** GET /api/assets/stickers/folders/{folder}?boardSlug={slug} — 권한 anyone
 * `baseball/{팀}` 폴더는 경로에 `/`가 있어 `.../folders/baseball%2Fgiants` 로내면 Tomcat 400이 나므로
 * 서버 전용 매핑 `GET .../folders/baseball/{team}` 을 사용합니다.
 */
export async function fetchStickersByFolder(
  folder: string,
  boardSlug?: string | null,
): Promise<StickerAssetDto[]> {
  const trimmed = folder.trim();
  const qs =
    boardSlug && boardSlug.trim()
      ? `?boardSlug=${encodeURIComponent(boardSlug.trim())}`
      : "";

  let path: string;
  const baseballLower = "baseball/";
  if (trimmed.toLowerCase().startsWith(baseballLower)) {
    const after = trimmed.slice(baseballLower.length).trim();
    const teamSegRaw = after.split("/").filter(Boolean)[0] ?? "";
    if (teamSegRaw) {
      const teamSeg = resolveBaseballStickerTeamApiSegment(
        teamSegRaw,
        boardSlug,
      );
      path = `/api/assets/stickers/folders/baseball/${encodeURIComponent(teamSeg)}${qs}`;
    } else {
      path = `/api/assets/stickers/folders/${encodeURIComponent("baseball")}${qs}`;
    }
  } else {
    path = `/api/assets/stickers/folders/${encodeURIComponent(trimmed)}${qs}`;
  }

  const res = await apiClient<StickerFolderApiResponse>(path, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!res.success || !Array.isArray(res.data?.stickers)) {
    return [];
  }

  return res.data.stickers;
}

export type GiftIconDto = {
  id: number;
  assetKey: string;
};

type GiftIconsApiResponse = {
  success: boolean;
  message: string;
  data: {
    giftIcons: GiftIconDto[];
  };
};

/**
 * 선물 아이콘 카탈로그 — 백 GET `/api/assets/gift-icons?boardSlug={slug}`.
 * 각 `assetKey`는 S3 기준 `icons/{카테고리}/{카테고리}-NNN.png` 등(예: `icons/food/food-001.png`) 형태입니다.
 * `boardSlug`가 구단 보드이면 야구 아이콘도 포함됩니다.
 */
export async function fetchGiftIcons(
  boardSlug?: string | null,
): Promise<GiftIconDto[]> {
  const qs =
    boardSlug && boardSlug.trim()
      ? `?boardSlug=${encodeURIComponent(boardSlug.trim())}`
      : "";
  const res = await apiClient<GiftIconsApiResponse>(
    `/api/assets/gift-icons${qs}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    },
  );

  if (!res.success || !Array.isArray(res.data?.giftIcons)) {
    return [];
  }

  return res.data.giftIcons;
}

/**
 * `GiftIconDto[]` 에서 유효하지 않은 항목(id 비정수, assetKey 비문자열·공백) 을 제거합니다.
 * sessionStorage 캐시에서 꺼낸 데이터의 무결성 검증에 사용합니다.
 */
export function sanitizeGiftIconDtos(list: GiftIconDto[]): GiftIconDto[] {
  if (!Array.isArray(list)) return [];
  return list.filter(
    (item) =>
      item != null &&
      typeof item === "object" &&
      Number.isFinite((item as GiftIconDto).id) &&
      typeof (item as GiftIconDto).assetKey === "string" &&
      (item as GiftIconDto).assetKey.trim().length > 0,
  );
}

type AssetsSyncApiResponse = {
  success: boolean;
  message: string;
  data: {
    addedCount: number;
  };
};

/** POST /api/admin/assets/sync — S3 에셋을 DB와 동기화 (서버: ADMIN + JWT) */
export async function postAdminAssetsSync(): Promise<AssetsSyncApiResponse> {
  return apiClient<AssetsSyncApiResponse>("/api/admin/assets/sync", {
    method: "POST",
  });
}

/** POST /api/admin/assets/reset-sync — DB 에셋 전부 삭제 후 S3 기준 재동기화 (ADMIN + JWT) */
export async function postAdminAssetsResetSync(): Promise<AssetsSyncApiResponse> {
  return apiClient<AssetsSyncApiResponse>("/api/admin/assets/reset-sync", {
    method: "POST",
  });
}

/** `WishlistMyBoardScreen` 등 — 브라우저 탭당 1회만 reset-sync 시도 */
export const ADMIN_ASSETS_RESET_SYNC_SESSION_KEY =
  "oh_jjeom_oh_admin_assets_reset_sync_once";

let adminResetSyncSessionPromise: Promise<void> | null = null;

/**
 * ADMIN이 위시 보드 화면에 들어올 때 자동 호출용.
 * - 성공 시 sessionStorage `"1"`, 실패 시 `"fail"`을 저장해 **실패 후에도** 같은 탭에서 POST를 반복하지 않음.
 * - React Strict Mode 등으로 `load()`가 동시에 여러 번 돌아도 **요청은 1번**만 나가도록 in-flight 공유.
 * 재시도하려면 개발자 도구에서 `ADMIN_ASSETS_RESET_SYNC_SESSION_KEY` 항목을 지우면 됩니다.
 */
export function ensureAdminAssetsResetSyncOnce(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();

  const k = ADMIN_ASSETS_RESET_SYNC_SESSION_KEY;
  const flag = sessionStorage.getItem(k);
  if (flag === "1" || flag === "fail") {
    return Promise.resolve();
  }

  if (!adminResetSyncSessionPromise) {
    adminResetSyncSessionPromise = postAdminAssetsResetSync()
      .then(() => {
        sessionStorage.setItem(k, "1");
      })
      .catch(() => {
        sessionStorage.setItem(k, "fail");
      })
      .finally(() => {
        adminResetSyncSessionPromise = null;
      });
  }

  return adminResetSyncSessionPromise;
}
