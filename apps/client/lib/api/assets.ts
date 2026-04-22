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

/** GET /api/assets/gift-icons — 권한 anyone */
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
