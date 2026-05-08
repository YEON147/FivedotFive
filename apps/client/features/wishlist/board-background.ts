import type { BoardAssetData } from "@/features/wishlist/types";
import { getAssetImageUrl } from "@/lib/asset-url";

/** 보드 소유자가 저장한 배경 에셋 → 이미지 URL (`assetType`·JSON 표기 차이 허용) */
export function resolveBoardBackgroundImageUrl(assets: BoardAssetData[]): string | null {
  const row = assets.find((a) => {
    const t = String(a.assetType ?? "").toUpperCase();
    if (t !== "BACKGROUND") return false;
    return (a.assetKey?.trim()?.length ?? 0) > 0;
  });
  const key = row?.assetKey?.trim();
  return key ? getAssetImageUrl(key) : null;
}
