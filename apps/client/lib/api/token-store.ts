const ACCESS_TOKEN_STORAGE_KEY = "accessToken";

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

  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, token);
}

export function clearAccessToken() {
  accessTokenMemory = null;

  if (!canUseStorage()) {
    return;
  }

  window.localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
}
