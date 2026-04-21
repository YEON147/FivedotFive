import { authApiClient } from "@/lib/api/client";
import { getAccessToken } from "@/lib/api/token-store";
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

export const MY_PROFILE_PREVIEW_DATA: MyProfile = {
  username: "미리보기 사용자",
  email: "preview@email.com",
  nickname: "우와",
  school: "미리보기 초등학교",
  gender: "FEMALE",
  grade: "ELEM_3",
};

export async function getMyProfile(): Promise<MyProfile> {
  const accessToken = getAccessToken();

  if (!accessToken) {
    return MY_PROFILE_PREVIEW_DATA;
  }

  try {
    const response = await authApiClient<MyProfileResponse>(MY_PROFILE_API_PATH, {
      method: "GET",
    });

    return {
      username: response.data?.username ?? MY_PROFILE_PREVIEW_DATA.username,
      email: response.data?.email ?? MY_PROFILE_PREVIEW_DATA.email,
      nickname: response.data?.nickname ?? MY_PROFILE_PREVIEW_DATA.nickname,
      school: response.data?.school ?? MY_PROFILE_PREVIEW_DATA.school,
      gender: response.data?.gender ?? MY_PROFILE_PREVIEW_DATA.gender,
      grade: response.data?.grade ?? MY_PROFILE_PREVIEW_DATA.grade,
    };
  } catch (error) {
    console.warn("[mypage] getMyProfile fallback to preview data", error);
    return MY_PROFILE_PREVIEW_DATA;
  }
}

export async function updateMyProfile(
  payload: UpdateMyProfileRequest
): Promise<UpdateMyProfileResponse> {
  const accessToken = getAccessToken();

  if (!accessToken) {
    return {
      success: true,
      message: "백엔드 미연결 상태이므로 화면에서만 수정 내용을 반영했습니다.",
    };
  }

  return authApiClient<UpdateMyProfileResponse>(MY_PROFILE_API_PATH, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function changeMyPassword(
  payload: ChangePasswordRequest
): Promise<ChangePasswordResponse> {
  const accessToken = getAccessToken();

  if (!accessToken) {
    return {
      success: true,
      message: "백엔드 미연결 상태이므로 비밀번호 변경은 실제 반영되지 않았습니다.",
    };
  }

  return authApiClient<ChangePasswordResponse>(MY_PASSWORD_API_PATH, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function searchSchoolsForMyPage(
  keyword: string
): Promise<SchoolOption[]> {
  try {
    return await searchSchools(keyword);
  } catch (error) {
    console.warn("[mypage] school search failed", error);
    return [];
  }
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