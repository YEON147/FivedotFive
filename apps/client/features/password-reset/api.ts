import { publicApiClient } from "@/lib/api/client";
import {
  PASSWORD_RESET_CONFIRM_PATH,
  PASSWORD_RESET_OTP_REQUEST_PATH,
  PASSWORD_RESET_OTP_VERIFY_PATH,
} from "@/lib/constants/password-reset";
import type { PasswordResetApiResponse } from "@/features/password-reset/types";

function assertPasswordResetSuccess(response: PasswordResetApiResponse): void {
  if (response.status === "ERROR" || response.success === false) {
    throw new Error(response.message || "요청에 실패했습니다.");
  }
  if (response.status === "SUCCESS" || response.success === true) {
    return;
  }
  if (response.status === undefined && response.success === undefined) {
    return;
  }
  throw new Error(response.message || "요청에 실패했습니다.");
}

export async function requestPasswordResetOtp(
  username: string,
): Promise<PasswordResetApiResponse> {
  const response = await publicApiClient<PasswordResetApiResponse>(
    PASSWORD_RESET_OTP_REQUEST_PATH,
    {
      method: "POST",
      body: JSON.stringify({ username: username.trim() }),
    },
  );
  assertPasswordResetSuccess(response);
  return response;
}

export async function verifyPasswordResetOtp(
  username: string,
  otp: string,
): Promise<PasswordResetApiResponse> {
  const response = await publicApiClient<PasswordResetApiResponse>(
    PASSWORD_RESET_OTP_VERIFY_PATH,
    {
      method: "POST",
      body: JSON.stringify({ username: username.trim(), otp: otp.trim() }),
    },
  );
  assertPasswordResetSuccess(response);
  return response;
}

export async function confirmPasswordReset(
  username: string,
  newPassword: string,
): Promise<PasswordResetApiResponse> {
  const response = await publicApiClient<PasswordResetApiResponse>(
    PASSWORD_RESET_CONFIRM_PATH,
    {
      method: "POST",
      body: JSON.stringify({
        username: username.trim(),
        newPassword,
      }),
    },
  );
  assertPasswordResetSuccess(response);
  return response;
}
