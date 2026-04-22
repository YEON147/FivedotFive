import { authApiClient } from "@/lib/api/client";
import { searchSchools, checkNickname } from "@/features/signup/api";
import type {
  ChangePasswordRequest,
  ChangePasswordResponse,
  MyProfile,
  MyProfileResponse,
  UpdateMyProfileRequest,
  UpdateMyProfileResponse,
} from "@/features/user/types";
import type { SchoolOption } from "@/features/signup/types";

const MY_PROFILE_API_PATH = "/api/users/me";
const MY_PASSWORD_API_PATH = "/api/users/me/password";

function mapProfileResponseToProfile(response: MyProfileResponse): MyProfile {
  return {
    username: response.data?.username ?? "",
    email: response.data?.email ?? "",
    nickname: response.data?.nickname ?? "",
    school: response.data?.school ?? null,
    schoolcode: response.data?.schoolcode ?? null,
    gender: response.data?.gender ?? null,
    grade: response.data?.grade ?? null,
  };
}

export async function getMyProfile(): Promise<MyProfile> {
  const response = await authApiClient<MyProfileResponse>(MY_PROFILE_API_PATH, {
    method: "GET",
  });

  return mapProfileResponseToProfile(response);
}

export async function updateMyProfile(
  payload: UpdateMyProfileRequest
): Promise<UpdateMyProfileResponse> {
  return authApiClient<UpdateMyProfileResponse>(MY_PROFILE_API_PATH, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function changeMyPassword(
  payload: ChangePasswordRequest
): Promise<ChangePasswordResponse> {
  return authApiClient<ChangePasswordResponse>(MY_PASSWORD_API_PATH, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function searchSchoolsForMyPage(
  keyword: string
): Promise<SchoolOption[]> {
  return searchSchools(keyword);
}

export async function checkNicknameForMyPage(
  nickname: string
): Promise<{ available: boolean; message: string }> {
  try {
    const result = await checkNickname(nickname);

    return {
      available: result.data?.available ?? false,
      message: result.message ?? "사용 가능한 닉네임입니다.",
    };
  } catch (error) {
    if (error instanceof Error) {
      return {
        available: false,
        message: error.message,
      };
    }

    return {
      available: false,
      message: "닉네임 중복 확인 중 오류가 발생했습니다.",
    };
  }
}