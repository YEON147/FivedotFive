import { authApiClient, getStoredAccessToken } from "@/lib/api/client";
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
  username: "preview_user",
  email: "preview@email.com",
  school: "미리보기 초등학교",
  gender: "FEMALE",
  grade: "ELEM_3",
};

export async function getMyProfile(): Promise<MyProfile> {
  const accessToken = getStoredAccessToken();

  if (!accessToken) {
    return MY_PROFILE_PREVIEW_DATA;
  }

  const response = await authApiClient<MyProfileResponse>(MY_PROFILE_API_PATH, {
    method: "GET",
  });

  return {
    username: response.data?.username ?? "",
    email: response.data?.email ?? "",
    school: response.data?.school ?? "",
    gender: response.data?.gender ?? "",
    grade: response.data?.grade ?? "",
  };
}

export async function updateMyProfile(
  payload: UpdateMyProfileRequest
): Promise<UpdateMyProfileResponse> {
  const accessToken = getStoredAccessToken();

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

export async function searchSchoolsForMyPage(
  keyword: string
): Promise<SchoolOption[]> {
  return searchSchools(keyword);
}
