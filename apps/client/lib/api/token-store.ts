export const ACCESS_TOKEN_STORAGE_KEY = "accessToken";

let accessTokenMemory: string | null = null;

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function getAccessToken(): string | null {
  if (accessTokenMemory) {
    return accessTokenMemory;
  }

  if (!canUseStorage()) {
    return null;
  }

  const storedToken = window.localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);
  accessTokenMemory = storedToken;
  return storedToken;
}

export function setAccessToken(token: string) {
  accessTokenMemory = token;

  if (canUseStorage()) {
    window.localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, token);
  }

  if (typeof window !== "undefined") {
    queueMicrotask(() => {
      void import("@/lib/api/client").then((m) => {
        m.scheduleProactiveAccessTokenRefresh();
      });
    });
  }
}

export function clearAccessToken() {
  accessTokenMemory = null;

  if (canUseStorage()) {
    window.localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
  }

  if (typeof window !== "undefined") {
    queueMicrotask(() => {
      void import("@/lib/api/client").then((m) => {
        m.cancelProactiveAccessTokenRefresh();
      });
    });
  }
}
