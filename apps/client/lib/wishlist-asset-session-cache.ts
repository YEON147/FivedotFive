import {
  fetchGiftIcons,
  fetchStickersByFolder,
  sanitizeGiftIconDtos,
  type GiftIconDto,
  type StickerAssetDto,
} from "@/lib/api/assets";

const CACHE_PREFIX = "ojjo_wishlist_assets_v1";

/** slug 비어 있어도 API·캐시 키를 일관되게 맞춤 (이전에는 slug 없으면 세션 저장 생략 → 매번 재요청) */
function normalizedBoardSlugKey(boardSlug: string | null | undefined): string {
  const s = boardSlug?.trim();
  return s && s.length > 0 ? s : "__no_slug__";
}

function keyPart(s: string): string {
  return encodeURIComponent(s.trim()).slice(0, 240);
}

function parseIdAssetKeyRows(raw: string): StickerAssetDto[] | null {
  try {
    const v = JSON.parse(raw) as unknown;
    if (!Array.isArray(v)) {
      return null;
    }
    const out: StickerAssetDto[] = [];
    for (const row of v) {
      if (!row || typeof row !== "object") {
        return null;
      }
      const o = row as Record<string, unknown>;
      const id = Number(o.id);
      const assetKey = o.assetKey;
      if (!Number.isFinite(id) || typeof assetKey !== "string") {
        return null;
      }
      const trimmed = assetKey.trim();
      if (!trimmed) {
        continue;
      }
      out.push({ id, assetKey: trimmed });
    }
    return out;
  } catch {
    return null;
  }
}

function stickerStorageKey(
  boardSlug: string | null | undefined,
  folderId: string,
): string {
  return `${CACHE_PREFIX}:stickers:${keyPart(normalizedBoardSlugKey(boardSlug))}:${keyPart(folderId.trim())}`;
}

function giftIconsStorageKey(boardSlug: string | null | undefined): string {
  return `${CACHE_PREFIX}:gift-icons:${keyPart(normalizedBoardSlugKey(boardSlug))}`;
}

export function readStickerFolderSessionCache(
  boardSlug: string | null | undefined,
  folderId: string,
): StickerAssetDto[] | null {
  if (typeof window === "undefined") {
    return null;
  }
  const folder = folderId.trim();
  if (!folder) {
    return null;
  }
  try {
    const raw = sessionStorage.getItem(stickerStorageKey(boardSlug, folder));
    if (raw == null) {
      return null;
    }
    return parseIdAssetKeyRows(raw);
  } catch {
    return null;
  }
}

export function writeStickerFolderSessionCache(
  boardSlug: string | null | undefined,
  folderId: string,
  list: StickerAssetDto[],
): void {
  if (typeof window === "undefined") {
    return;
  }
  const folder = folderId.trim();
  if (!folder) {
    return;
  }
  try {
    sessionStorage.setItem(
      stickerStorageKey(boardSlug, folder),
      JSON.stringify(list),
    );
  } catch {
    /* 할당량 초과 등 — 무시 */
  }
}

export function readGiftIconsSessionCache(
  boardSlug: string | null | undefined,
): GiftIconDto[] | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const raw = sessionStorage.getItem(giftIconsStorageKey(boardSlug));
    if (raw == null) {
      return null;
    }
    return parseIdAssetKeyRows(raw);
  } catch {
    return null;
  }
}

export function writeGiftIconsSessionCache(
  boardSlug: string | null | undefined,
  list: GiftIconDto[],
): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    sessionStorage.setItem(giftIconsStorageKey(boardSlug), JSON.stringify(list));
  } catch {
    /* 할당량 초과 등 — 무시 */
  }
}

/* ── 메모리 + 진행 중 요청 공유: Strict Mode 이중 effect·탭 연타 시 동일 키로 API 1번만 ── */

const stickerMemory = new Map<string, StickerAssetDto[]>();
const stickerInflight = new Map<string, Promise<StickerAssetDto[]>>();

function stickerRuntimeKey(
  boardSlug: string | null | undefined,
  folderId: string,
): string {
  return `${normalizedBoardSlugKey(boardSlug)}::${folderId.trim()}`;
}

/**
 * 스티커 폴더 목록: 메모리 → sessionStorage → API 순.
 * 같은 탭에서 같은 (slug, 폴더)로 동시에 들어오면 한 번의 fetch만 수행합니다.
 */
export function loadStickerFolderWithSessionCache(
  folderId: string,
  boardSlug: string | null | undefined,
): Promise<StickerAssetDto[]> {
  const folder = folderId.trim();
  if (!folder) {
    return Promise.resolve([]);
  }

  const runKey = stickerRuntimeKey(boardSlug, folder);
  const mem = stickerMemory.get(runKey);
  if (mem) {
    return Promise.resolve(mem);
  }

  if (typeof window !== "undefined") {
    const fromSs = readStickerFolderSessionCache(boardSlug, folder);
    if (fromSs != null) {
      stickerMemory.set(runKey, fromSs);
      return Promise.resolve(fromSs);
    }
  }

  let pending = stickerInflight.get(runKey);
  if (!pending) {
    pending = fetchStickersByFolder(folder, boardSlug)
      .then((list) => {
        stickerMemory.set(runKey, list);
        writeStickerFolderSessionCache(boardSlug, folder, list);
        return list;
      })
      .finally(() => {
        stickerInflight.delete(runKey);
      });
    stickerInflight.set(runKey, pending);
  }
  return pending;
}

const giftIconsMemory = new Map<string, GiftIconDto[]>();
const giftIconsInflight = new Map<string, Promise<GiftIconDto[]>>();

/**
 * 선물 아이콘 카탈로그: 메모리 → sessionStorage → API 순.
 */
export function loadGiftIconsWithSessionCache(
  boardSlug: string | null | undefined,
): Promise<GiftIconDto[]> {
  const runKey = normalizedBoardSlugKey(boardSlug);

  const mem = giftIconsMemory.get(runKey);
  if (mem) {
    const clean = sanitizeGiftIconDtos(mem);
    if (clean.length !== mem.length) {
      giftIconsMemory.set(runKey, clean);
    }
    return Promise.resolve(clean);
  }

  if (typeof window !== "undefined") {
    const fromSs = readGiftIconsSessionCache(boardSlug);
    if (fromSs != null) {
      const clean = sanitizeGiftIconDtos(fromSs);
      giftIconsMemory.set(runKey, clean);
      return Promise.resolve(clean);
    }
  }

  let pending = giftIconsInflight.get(runKey);
  if (!pending) {
    pending = fetchGiftIcons(boardSlug)
      .then((list) => {
        giftIconsMemory.set(runKey, list);
        writeGiftIconsSessionCache(boardSlug, list);
        return list;
      })
      .finally(() => {
        giftIconsInflight.delete(runKey);
      });
    giftIconsInflight.set(runKey, pending);
  }
  return pending;
}
