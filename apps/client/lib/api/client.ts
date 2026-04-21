const ACCESS_TOKEN_STORAGE_CANDIDATES = [
  "accessToken",
  "access_token",
  "token",
  "authToken",
  "jwt",
];

function buildHeaders(init?: RequestInit, accessToken?: string): HeadersInit {
  return {
    "Content-Type": "application/json",
    ...(accessToken
      ? {
          Authorization: `Bearer ${accessToken}`,
        }
      : {}),
    ...(init?.headers ?? {}),
  };
}

export function getStoredAccessToken(): string | null {
  if (typeof window === "undefined") return null;

  for (const key of ACCESS_TOKEN_STORAGE_CANDIDATES) {
    const localValue = window.localStorage.getItem(key)?.trim();
    if (localValue) return localValue;

    const sessionValue = window.sessionStorage.getItem(key)?.trim();
    if (sessionValue) return sessionValue;
  }

  return null;
}

export async function apiClient<T>(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<T> {
  const response = await fetch(input, {
    ...init,
    headers: buildHeaders(init),
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
    console.error("API 실패", {
      url: input,
      status: response.status,
      statusText: response.statusText,
      rawText,
    });

    const message =
      (data as { message?: string } | null)?.message ??
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
  const accessToken = getStoredAccessToken();

  const response = await fetch(input, {
    ...init,
    headers: buildHeaders(init, accessToken ?? undefined),
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
