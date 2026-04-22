import {
  NICKNAME_CHECK_API_PATH,
  RANDOM_NICKNAME_API_PATH,
  SCHOOL_SEARCH_API_PATH,
  SIGNUP_API_PATH,
  USEREMAIL_CHECK_API_PATH,
  USERNAME_CHECK_API_PATH,
} from "@/lib/constants/signup";
import type {
  NicknameCheckResponse,
  RandomNicknameResponse,
  SchoolOption,
  SchoolSearchResponse,
  SignupRequest,
  SignupResponse,
  UserEmailCheckResponse,
  UsernameCheckResponse,
} from "@/features/signup/types";
import { apiClient } from "@/lib/api/client";

export async function getRandomNickname(): Promise<string> {
  const response = await apiClient<RandomNicknameResponse>(
    RANDOM_NICKNAME_API_PATH,
    {
      method: "GET",
    }
  );

  const nickname = response.data?.nickname?.trim();

  if (!nickname) {
    throw new Error("랜덤 닉네임 응답이 올바르지 않습니다.");
  }

  return nickname;
}

export async function checkUsername(
  username: string
): Promise<UsernameCheckResponse> {
  const query = new URLSearchParams({
    username: username.trim(),
  }).toString();

  return apiClient<UsernameCheckResponse>(
    `${USERNAME_CHECK_API_PATH}?${query}`,
    {
      method: "GET",
    }
  );
}

export async function checkNickname(
  nickname: string
): Promise<NicknameCheckResponse> {
  const query = new URLSearchParams({
    nickname: nickname.trim(),
  }).toString();

  return apiClient<NicknameCheckResponse>(
    `${NICKNAME_CHECK_API_PATH}?${query}`,
    {
      method: "GET",
    }
  );
}

export async function checkUserEmail(
  useremail: string
): Promise<UserEmailCheckResponse> {
  const query = new URLSearchParams({
    useremail: useremail.trim(),
  }).toString();

  return apiClient<UserEmailCheckResponse>(
    `${USEREMAIL_CHECK_API_PATH}?${query}`,
    {
      method: "GET",
    }
  );
}

export async function searchSchools(keyword: string): Promise<SchoolOption[]> {
  const query = new URLSearchParams({
    keyword: keyword.trim(),
  }).toString();

  const response = await apiClient<SchoolSearchResponse>(
    `${SCHOOL_SEARCH_API_PATH}?${query}`,
    {
      method: "GET",
    }
  );

  return response.data ?? [];
}

export async function signup(payload: SignupRequest): Promise<SignupResponse> {
  return apiClient<SignupResponse>(SIGNUP_API_PATH, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}