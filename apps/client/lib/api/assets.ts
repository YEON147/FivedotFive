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

/** 배경 카드 제목 — API `displayName`, 없으면 확장자 뺀 파일명 */
export function resolveBackgroundDisplayLabel(
  assetKey: string,
  displayName?: string | null,
): string {
  const api = displayName?.trim();
  if (api) {
    return api;
  }
  const file = fileNameFromAssetKey(assetKey.trim());
  return file.replace(/\.[^.]+$/, "") || file || `배경`;
}

type BackgroundsApiResponse = {
  success: boolean;
  message: string;
  data: {
    backgrounds: Record<string, unknown>[];
  };
};

/** GET /api/assets/backgrounds — 권한 anyone */
export async function fetchBackgroundAssets(): Promise<BackgroundAssetDto[]> {
  const res = await apiClient<BackgroundsApiResponse>("/api/assets/backgrounds", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!res.success || !Array.isArray(res.data?.backgrounds)) {
    return [];
  }

  return res.data.backgrounds.map((raw) => {
    const id = Number(raw.id);
    const assetKey = String(raw.assetKey ?? raw.asset_key ?? "");
    const displayName = (raw.displayName ?? raw.display_name) as string | null | undefined;
    return {
      id: Number.isFinite(id) ? id : 0,
      assetKey,
      displayName: displayName ?? null,
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
 * 각 `assetKey`는 CDN/S3 객체 키와 동일하게 `assets/icons/` 아래 파일을 가리킵니다.
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
