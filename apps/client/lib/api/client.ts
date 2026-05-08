import { sanitizeInternalReturnPath } from "@/features/login/post-login-destination";
import { devError } from "@/lib/dev-log";
import {
  clearAccessToken,
  getAccessToken,
  setAccessToken,
} from "@/lib/api/token-store";

const REFRESH_API_PATH = "/api/auth/refresh";
type ApiMessage = {
  code?: string;
  message?: string;
  errorCode?: string;
  data?: {
    accessToken?: string;
    code?: string;
    errorCode?: string;
  };
  errors?: {
    code?: string;
    errorCode?: string;
  };
};

let refreshPromise: Promise<string> | null = null;

function toPath(input: RequestInfo | URL): string {
  if (typeof input === "string") return input;
  if (input instanceof URL) return input.href;
  return input.url;
}

/**
 * `localhost:3000` → `http://127.0.0.1:8080` 처럼 origin이 다르면 `include` 쿠키는
 * CORS·프리플라이트와 맞물려 이상 동작할 수 있음. API는 JWT(Authorization)만 쓰므로
 * cross-origin일 때는 `omit`이 안전하다.
 */
function credentialsForApiRequest(input: RequestInfo | URL): RequestCredentials {
  if (typeof window === "undefined") return "include";
  let href: string;
  if (typeof input === "string") {
    href = input;
  } else if (input instanceof URL) {
    href = input.href;
  } else if (input instanceof Request) {
    href = input.url;
  } else {
    return "include";
  }
  try {
    const resolved = new URL(href, window.location.href);
    return resolved.origin === window.location.origin ? "include" : "omit";
  } catch {
    return "include";
  }
}

/** 콘솔 디버그용 — FormData 등은 직렬화되지 않아 `{}`로 보이므로 요약한다 */
function describeRequestBodyForLog(body: RequestInit["body"]): unknown {
  if (body == null || body === undefined) return null;
  if (typeof body === "string") {
    return body.length > 800 ? `${body.slice(0, 800)}… (${body.length} chars)` : body;
  }
  if (body instanceof FormData) {
    const out: Record<string, string[]> = {};
    for (const [key, value] of body.entries()) {
      if (!out[key]) out[key] = [];
      const v: unknown = value;
      if (v instanceof File) {
        out[key].push(`File(${v.name}, ${v.size}b)`);
      } else if (v instanceof Blob) {
        out[key].push(`Blob(${v.type || "?"}, ${v.size}b)`);
      } else {
        out[key].push(String(v).slice(0, 400));
      }
    }
    return out;
  }
  if (body instanceof URLSearchParams) {
    const s = body.toString();
    return s.length > 800 ? `${s.slice(0, 800)}…` : s;
  }
  return Object.prototype.toString.call(body);
}

function summarizeResponseBodyForLog(rawText: string): string {
  if (!rawText) return "(empty)";
  if (rawText.length > 2000) return `${rawText.slice(0, 2000)}… (${rawText.length} chars)`;
  return rawText;
}

async function parseResponseData(response: Response): Promise<unknown> {
  const rawText = await response.text();
  try {
    return rawText ? JSON.parse(rawText) : null;
  } catch {
    return null;
  }
}

function buildHeaders(init?: RequestInit, accessToken?: string): HeadersInit {
  const headers = new Headers(init?.headers);

  // FormData → multipart: 브라우저가 boundary 포함 Content-Type을 붙여야 함.
  // `Content-Type: application/json` 등이 남으면 "JSON처럼" 보내는 것과 같아 서버가 깨짐.
  if (init?.body instanceof FormData) {
    headers.delete("Content-Type");
  }

  const hasJsonBody =
    typeof init?.body === "string" &&
    !headers.has("Content-Type") &&
    init.body.trim().startsWith("{");

  if (hasJsonBody) {
    headers.set("Content-Type", "application/json");
  }

  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  return headers;
}

function getErrorCode(data: unknown): string | null {
  const body = data as ApiMessage | null;
  if (!body) return null;

  return (
    body.code ??
    body.errorCode ??
    body.data?.code ??
    body.data?.errorCode ??
    body.errors?.code ??
    body.errors?.errorCode ??
    null
  );
}

function shouldAttemptRefresh(response: Response, data: unknown): boolean {
  if (response.status !== 401) {
    return false;
  }

  const code = getErrorCode(data);
  return !code || code === "TOKEN_EXPIRED" || code === "ACCESS_TOKEN_EXPIRED";
}

function runSessionExpiredFlow() {
  clearAccessToken();

  if (typeof window === "undefined") return;

  window.dispatchEvent(new CustomEvent("auth:session-expired"));

  if (window.location.pathname !== "/login") {
    const full =
      window.location.pathname + window.location.search + window.location.hash;
    const next = sanitizeInternalReturnPath(full);
    window.location.href = next
      ? `/login?next=${encodeURIComponent(next)}`
      : "/login";
  }
}

async function refreshAccessToken(): Promise<string> {
  const response = await fetch(REFRESH_API_PATH, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    cache: "no-store",
  });

  const data = (await parseResponseData(response)) as ApiMessage | null;

  if (!response.ok) {
    const message =
      data?.message ?? `토큰 재발급 중 오류가 발생했습니다. (${response.status})`;
    throw new Error(message);
  }

  const accessToken = data?.data?.accessToken?.trim();

  if (!accessToken) {
    throw new Error("재발급 응답에 accessToken이 없습니다.");
  }

  setAccessToken(accessToken);
  return accessToken;
}

async function getRefreshedTokenSingleFlight(): Promise<string> {
  if (!refreshPromise) {
    refreshPromise = refreshAccessToken().finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise;
}

async function requestWithAuth(
  input: RequestInfo | URL,
  init?: RequestInit,
  isRetried = false
): Promise<Response> {
  const currentToken = getAccessToken();

  const response = await fetch(input, {
    ...init,
    headers: buildHeaders(init, currentToken ?? undefined),
    credentials: credentialsForApiRequest(input),
    cache: "no-store",
  });

  if (isRetried) {
    return response;
  }

  const responseData = await parseResponseData(response.clone());
  const isRefreshEndpoint = toPath(input).includes(REFRESH_API_PATH);

  if (!isRefreshEndpoint && shouldAttemptRefresh(response, responseData)) {
    try {
      const refreshedToken = await getRefreshedTokenSingleFlight();

      return fetch(input, {
        ...init,
        headers: buildHeaders(init, refreshedToken),
        credentials: credentialsForApiRequest(input),
        cache: "no-store",
      });
    } catch (error) {
      runSessionExpiredFlow();
      const message =
        error instanceof Error
          ? error.message
          : "세션이 만료되었습니다. 다시 로그인해주세요.";
      throw new Error(message);
    }
  }

  return response;
}

/** `silentFailure`: 응답 실패 시 devError 생략 — 404 등 ‘없음’이 정상인 호출용 */
export type ApiClientOptions = {
  silentFailure?: boolean;
};

export async function apiClient<T>(
  input: RequestInfo | URL,
  init?: RequestInit,
  options?: ApiClientOptions,
): Promise<T> {
  const response = await requestWithAuth(input, init);

  const rawText = await response.text();
  let data: unknown = null;

  try {
    data = rawText ? JSON.parse(rawText) : null;
  } catch {
    data = null;
  }

  if (!response.ok) {
    if (!options?.silentFailure) {
      devError("API 요청 실패", {
        url: typeof input === "string" ? input : input.toString(),
        method: init?.method ?? "GET",
        status: response.status,
        statusText: response.statusText,
        requestBody: describeRequestBodyForLog(init?.body),
        responseBody: summarizeResponseBodyForLog(rawText),
      });
    }

    const message =
      (data as ApiMessage | null)?.message ??
      `요청 처리 중 오류가 발생했습니다. (${response.status})`;

    throw new Error(message);
  }

  if (!data) {
    throw new Error("서버 응답이 비어 있거나 JSON 형식이 아닙니다.");
  }

  return data as T;
}

/**
 * Authorization 헤더·토큰 재발급 없이 호출합니다.
 * 회원가입 중복 검사 등 로그인 없이 사용해야 하는 API에 사용합니다.
 */
export async function publicApiClient<T>(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(input, {
    ...init,
    headers: buildHeaders(init, undefined),
    credentials: "include",
    cache: "no-store",
  });

  const rawText = await response.text();
  let data: unknown = null;

  try {
    data = rawText ? JSON.parse(rawText) : null;
  } catch {
    data = null;
  }

  if (!response.ok) {
    devError("API 요청 실패 (public)", {
      url: typeof input === "string" ? input : input.toString(),
      method: init?.method ?? "GET",
      status: response.status,
      statusText: response.statusText,
      requestBody: describeRequestBodyForLog(init?.body),
      responseBody: summarizeResponseBodyForLog(rawText),
    });

    const message =
      (data as ApiMessage | null)?.message ??
      `요청 처리 중 오류가 발생했습니다. (${response.status})`;

    throw new Error(message);
  }

  if (!data) {
    throw new Error("서버 응답이 비어 있거나 JSON 형식이 아닙니다.");
  }

  return data as T;
}

export async function authApiClient<T>(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<T> {
  const accessToken = getAccessToken();

  const response = await fetch(input, {
    ...init,
    headers: buildHeaders(init, accessToken ?? undefined),
    credentials: "include",
    cache: "no-store",
  });

  const rawText = await response.text();
  let data: unknown = null;

  try {
    data = rawText ? JSON.parse(rawText) : null;
  } catch {
    data = null;
  }

  if (!response.ok) {
    devError("인증 API 실패", {
      url: input,
      status: response.status,
      statusText: response.statusText,
      hasAccessToken: Boolean(accessToken),
      rawText,
    });

    const message =
      (data as { message?: string } | null)?.message ??
      `인증 요청 처리 중 오류가 발생했습니다. (${response.status})`;

    throw new Error(message);
  }

  if (!data) {
    throw new Error("서버 응답이 비어 있거나 JSON 형식이 아닙니다.");
  }

  return data as T;
}
