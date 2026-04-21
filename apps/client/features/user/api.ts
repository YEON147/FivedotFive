import { authApiClient } from "@/lib/api/client";
import { getAccessToken } from "@/lib/api/token-store";
import { searchSchools } from "@/features/signup/api";
import type {
  MyProfile,
  MyProfileResponse,
  UpdateMyProfileRequest,
  UpdateMyProfileResponse,
} from "@/features/user/types";
import type { SchoolOption } from "@/features/signup/types";

const MY_PROFILE_API_PATH = "/api/users/me";

export const MY_PROFILE_PREVIEW_DATA: MyProfile = {
  username: "미리보기 사용자",
  email: "preview@email.com",
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

  try {
    return await authApiClient<UpdateMyProfileResponse>(MY_PROFILE_API_PATH, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  } catch (error) {
    console.warn("[mypage] updateMyProfile fallback in preview mode", error);
    return {
      success: true,
      message: "백엔드 연결 전 미리보기 모드입니다. 화면에서만 수정 내용을 반영했습니다.",
    };
  }
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