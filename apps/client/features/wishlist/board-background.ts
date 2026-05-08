import type { BoardAssetData } from "@/features/wishlist/types";
import { getAssetImageUrl } from "@/lib/asset-url";

function findBackgroundAssetRow(assets: BoardAssetData[]) {
  return assets.find((a) => {
    const t = String(a.assetType ?? "").toUpperCase();
    if (t !== "BACKGROUND") return false;
    return (a.assetKey?.trim()?.length ?? 0) > 0;
  });
}

/** 배경 에셋 키 — 없으면 빈 문자열(기본 배경) */
export function resolveBoardBackgroundAssetKey(assets: BoardAssetData[]): string {
  return findBackgroundAssetRow(assets)?.assetKey?.trim() ?? "";
}

/** 보드 소유자가 저장한 배경 에셋 → 이미지 URL (`assetType`·JSON 표기 차이 허용) */
export function resolveBoardBackgroundImageUrl(assets: BoardAssetData[]): string | null {
  const key = resolveBoardBackgroundAssetKey(assets);
  return key ? getAssetImageUrl(key) : null;
}
