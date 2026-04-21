import { apiClient } from "@/lib/api/client";
import { LOGIN_API_PATH } from "@/lib/constants/login";
import type { LoginRequest, LoginResponse } from "@/features/login/types";

export async function login(payload: LoginRequest): Promise<LoginResponse> {
  return apiClient<LoginResponse>(LOGIN_API_PATH, {
    method: "POST",
    credentials: "include",
    body: JSON.stringify(payload),
  });
}
