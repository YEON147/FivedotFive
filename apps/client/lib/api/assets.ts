import { apiClient } from "@/lib/api/client";

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

/** GET /api/assets/backgrounds — 권한 anyone */
export async function fetchBackgroundAssets(): Promise<BackgroundAssetDto[]> {
  const res = await apiClient<BackgroundsApiResponse>("/api/assets/backgrounds", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

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
export async function fetchStickerFolders(): Promise<string[]> {
  const res = await apiClient<StickerFoldersApiResponse>("/api/assets/stickers/folders", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!res.success || !Array.isArray(res.data?.folders)) {
    return [];
  }

  return res.data.folders;
}

/** GET /api/assets/stickers — 권한 anyone */
export async function fetchStickerAssets(): Promise<StickerAssetDto[]> {
  const res = await apiClient<StickersApiResponse>("/api/assets/stickers", {
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

/** GET /api/assets/stickers/folders/{folder} — 권한 anyone */
export async function fetchStickersByFolder(
  folder: string,
): Promise<StickerAssetDto[]> {
  const encoded = encodeURIComponent(folder.trim());
  const res = await apiClient<StickerFolderApiResponse>(
    `/api/assets/stickers/folders/${encoded}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    },
  );

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
 * 선물 아이콘 카탈로그 — 백 GET `/api/assets/gift-icons`.
 * 각 `assetKey`는 S3 기준 `icons/{카테고리}/{카테고리}-NNN.png` 등(예: `icons/food/food-001.png`) 형태입니다.
 */
export async function fetchGiftIcons(): Promise<GiftIconDto[]> {
  const res = await apiClient<GiftIconsApiResponse>("/api/assets/gift-icons", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!res.success || !Array.isArray(res.data?.giftIcons)) {
    return [];
  }

  return res.data.giftIcons;
}

type AssetsSyncApiResponse = {
  success: boolean;
  message: string;
  data: {
    addedCount: number;
  };
};

/** POST /api/admin/assets/sync — S3 에셋을 DB와 동기화 (권한 스펙: 공개 호출) */
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
