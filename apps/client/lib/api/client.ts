import { sanitizeInternalReturnPath } from "@/features/login/post-login-destination";
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
  if (input instanceof URL) return input.toString();
  return input.url;
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
    credentials: "include",
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
        credentials: "include",
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

export async function apiClient<T>(
  input: RequestInfo | URL,
  init?: RequestInit
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
    console.error("API 요청 실패", {
      url: typeof input === "string" ? input : input.toString(),
      method: init?.method ?? "GET",
      status: response.status,
      statusText: response.statusText,
      requestBody: init?.body ?? null,
      responseBody: rawText,
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
    console.error("API 요청 실패", {
      url: typeof input === "string" ? input : input.toString(),
      method: init?.method ?? "GET",
      status: response.status,
      statusText: response.statusText,
      requestBody: init?.body ?? null,
      responseBody: rawText,
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
    console.error("인증 API 실패", {
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
