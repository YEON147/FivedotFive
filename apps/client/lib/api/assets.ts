import { apiClient } from "@/lib/api/client";

export type BackgroundAssetDto = {
  id: number;
  assetKey: string;
  /** GET `/api/assets/backgrounds` — 카드 아래 제목용 (없으면 파일명에서 유도) */
  displayName?: string | null;
};

/**
 * 서버 `WallpaperDisplayNames`와 동일 — API 필드 누락·snake_case·파일명 fallback 대비.
 * 신규 배경은 서버 `displayName`이 오면 그대로 쓰고, 여기 없으면 API 값 → 파일명 순.
 */
const WALLPAPER_FILE_TO_LABEL: Record<string, string> = {
  "wallpaper-01.png": "별은하",
  "wallpaper-02.png": "보라우주",
  "wallpaper-03.png": "파란별",
  "wallpaper-04.png": "오로라",
  "wallpaper-05.png": "모눈종이",
  "wallpaper-06.png": "잔디꽃밭",
  "wallpaper-07.png": "공룡친구들",
  "wallpaper-08.png": "알록달록친구들",
  "wallpaper-09.png": "과일동산",
  "wallpaper-10.png": "마스킹테이프",
  "wallpaper-11.png": "달콤한하루",
  "wallpaper-12.png": "놀이공원",
  "wallpaper-13.png": "동화속숲",
  "wallpaper-14.png": "풍선파티",
  "wallpaper-15.png": "냥냥",
  "wallpaper-16.png": "토끼토끼",
};

function fileNameFromAssetKey(assetKey: string): string {
  const i = assetKey.lastIndexOf("/");
  return i >= 0 ? assetKey.slice(i + 1) : assetKey;
}

function wallpaperLabelFromFileName(file: string): string | null {
  if (WALLPAPER_FILE_TO_LABEL[file]) {
    return WALLPAPER_FILE_TO_LABEL[file];
  }
  if (!file.endsWith(".png")) {
    const withPng = `${file}.png`;
    if (WALLPAPER_FILE_TO_LABEL[withPng]) {
      return WALLPAPER_FILE_TO_LABEL[withPng];
    }
  }
  return null;
}

/** 배경 카드 제목 — 알려진 월페이퍼는 한글 고정명 우선, 그다음 API `displayName` */
export function resolveBackgroundDisplayLabel(
  assetKey: string,
  displayName?: string | null,
): string {
  const file = fileNameFromAssetKey(assetKey.trim());
  const mapped = wallpaperLabelFromFileName(file);
  if (mapped) {
    return mapped;
  }
  const api = displayName?.trim();
  if (api) {
    return api;
  }
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
