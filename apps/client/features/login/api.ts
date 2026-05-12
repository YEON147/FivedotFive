import { apiClient, publicApiClient } from "@/lib/api/client";
import { LOGIN_API_PATH, LOGOUT_API_PATH } from "@/lib/constants/login";
import { clearAccessToken } from "@/lib/api/token-store";
import type { LoginRequest, LoginResponse } from "@/features/login/types";

/**
 * POST /api/auth/login — `Authorization` 미부착·토큰 재발급 없음.
 * 반드시 만료 JWT 없이 호출해야 하므로 `publicApiClient` 사용.
 */
export async function login(payload: LoginRequest): Promise<LoginResponse> {
  return publicApiClient<LoginResponse>(LOGIN_API_PATH, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/**
 * POST /api/auth/logout — Bearer 액세스 토큰 + 서버에서 refresh 무효화.
 * `apiClient`: 액세스 만료 시 리프레시 후 재시도 가능.
 * 성공·실패와 관계없이 로컬 액세스 토큰 제거.
 */
export async function logoutSession(): Promise<void> {
  try {
    await apiClient<{ success?: boolean; message?: string }>(LOGOUT_API_PATH, {
      method: "POST",
      body: "{}",
    });
  } catch {
    /* 네트워크·401 등 */
  } finally {
    clearAccessToken();
  }
}
