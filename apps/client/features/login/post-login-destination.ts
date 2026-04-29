/**
 * 로그인 성공 후 이동 경로 — 오픈 리다이렉트 방지(동일 출처 상대 경로만).
 */

const RETURN_PATH_STORAGE_KEY = "oh_jjeom_oh_login_return_path";

/** 로그인 후 돌려보내면 안 되는 경로 접두사 */
function isBlockedReturnPath(pathname: string): boolean {
  return (
    pathname.startsWith("/login") ||
    pathname.startsWith("/signup") ||
    pathname.startsWith("/oauth/")
  );
}

/** `/path?query` 형태만 허용 */
export function sanitizeInternalReturnPath(raw: string | null | undefined): string | null {
  if (raw == null || typeof raw !== "string") return null;
  const s = raw.trim();
  if (!s.startsWith("/") || s.startsWith("//")) return null;

  let pathname = s;
  let search = "";
  let hash = "";
  const q = s.indexOf("?");
  const h = s.indexOf("#");
  if (q !== -1) {
    pathname = s.slice(0, q);
    if (h !== -1 && h > q) {
      search = s.slice(q, h);
      hash = s.slice(h);
    } else {
      search = s.slice(q);
    }
  } else if (h !== -1) {
    pathname = s.slice(0, h);
    hash = s.slice(h);
  }

  if (isBlockedReturnPath(pathname)) return null;

  return pathname + search + hash;
}

/**
 * 로그인 페이지 최초 진입 시 — 직전 페이지(`document.referrer`)를 같은 출처면 저장.
 * 카카오 OAuth 등 브라우저를 벗어났다 오는 경우 대비해 sessionStorage 사용.
 */
export function stashLoginReturnFromReferrer(): void {
  if (typeof document === "undefined") return;
  try {
    const ref = document.referrer;
    if (!ref) return;
    const u = new URL(ref);
    if (typeof window !== "undefined" && u.origin !== window.location.origin) return;
    const path = `${u.pathname}${u.search}${u.hash}`;
    const safe = sanitizeInternalReturnPath(path);
    if (!safe) return;
    sessionStorage.setItem(RETURN_PATH_STORAGE_KEY, safe);
  } catch {
    /* ignore */
  }
}

function peekStashedReturnPath(): string | null {
  if (typeof sessionStorage === "undefined") return null;
  try {
    return sanitizeInternalReturnPath(sessionStorage.getItem(RETURN_PATH_STORAGE_KEY));
  } catch {
    return null;
  }
}

export function consumeStashedReturnPath(): string | null {
  const v = peekStashedReturnPath();
  try {
    sessionStorage.removeItem(RETURN_PATH_STORAGE_KEY);
  } catch {
    /* ignore */
  }
  return v;
}

/**
 * OAuth 등 `next` 쿼리가 유실되기 쉬운 흐름 직전에 호출해 sessionStorage에 복귀 경로를 박아 둠.
 * `resolvePostLoginDestination`이 `next`가 없을 때 동일 키로 복구한다.
 */
export function stashLoginReturnPath(path: string | null | undefined): boolean {
  if (typeof sessionStorage === "undefined") return false;
  const safe = sanitizeInternalReturnPath(path ?? null);
  if (!safe) return false;
  try {
    sessionStorage.setItem(RETURN_PATH_STORAGE_KEY, safe);
    return true;
  } catch {
    /* ignore */
  }
  return false;
}

/** 로그인 직후 시점의 referrer (동일 탭에서 비밀번호 로그인 시 간헐적으로 유효) */
function pathFromDocumentReferrer(): string | null {
  if (typeof document === "undefined" || !document.referrer) return null;
  try {
    const u = new URL(document.referrer);
    if (typeof window !== "undefined" && u.origin !== window.location.origin) return null;
    return sanitizeInternalReturnPath(`${u.pathname}${u.search}${u.hash}`);
  } catch {
    return null;
  }
}

/**
 * 우선순위: URL `next` → sessionStorage(로그인 페이지 진입 시 referrer) → 이번 요청 referrer → 기존 웰컴 규칙
 */
/**
 * 현재 페이지를 `next`로 넣어 로그인으로 보냄(SPA에서 `referrer`가 안 바뀔 때 대비).
 * 클라이언트 이벤트 핸들러·`useEffect` 안에서만 사용.
 */
/** `pathname` + `search` 로 고정 URL 생성(링크 `href`용). */
export function loginUrlForPath(pathWithQuery: string): string {
  const safe = sanitizeInternalReturnPath(pathWithQuery.trim());
  if (!safe) return "/login";
  return `/login?next=${encodeURIComponent(safe)}`;
}

export function loginUrlWithCurrentPageAsNext(): string {
  if (typeof window === "undefined") return "/login";
  return loginUrlForPath(
    window.location.pathname + window.location.search + window.location.hash,
  );
}

export function resolvePostLoginDestination(
  nextParam: string | null | undefined,
  hasWishBoard?: boolean,
): string {
  const fromNext = sanitizeInternalReturnPath(nextParam ?? null);
  if (fromNext) {
    consumeStashedReturnPath();
    return fromNext;
  }

  const fromStash = consumeStashedReturnPath();
  if (fromStash) return fromStash;

  const fromRef = pathFromDocumentReferrer();
  if (fromRef) return fromRef;

  return hasWishBoard === true ? "/wishlist" : "/";
}
