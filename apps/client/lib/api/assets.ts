import { apiClient } from "@/lib/api/client";

export type BackgroundAssetDto = {
  id: number;
  assetKey: string;
};

type BackgroundsApiResponse = {
  success: boolean;
  message: string;
  data: {
    backgrounds: BackgroundAssetDto[];
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

  return res.data.backgrounds;
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
