let accessTokenMemory: string | null = null;

export function getAccessToken(): string | null {
  return accessTokenMemory;
}

export function setAccessToken(token: string) {
  accessTokenMemory = token;
}

export function clearAccessToken() {
  accessTokenMemory = null;
}
