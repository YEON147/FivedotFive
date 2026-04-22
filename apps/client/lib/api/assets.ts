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
