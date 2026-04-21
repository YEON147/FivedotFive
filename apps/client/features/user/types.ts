import type { GenderType, GradeType, SchoolOption } from "@/features/signup/types";

export type MyProfile = {
  username: string;
  email: string;
  school: string;
  gender: GenderType;
  grade: GradeType;
};

export type MyProfileResponse = {
  success: boolean;
  message: string;
  data: {
    username: string;
    email: string;
    school: string;
    gender: GenderType;
    grade: GradeType;
  };
};

export type UpdateMyProfileRequest = {
  school?: string;
  gender?: Exclude<GenderType, "">;
  grade?: Exclude<GradeType, "">;
};

export type UpdateMyProfileResponse = {
  success: boolean;
  message: string;
};

export type MyPageFormValues = {
  username: string;
  email: string;
  schoolName: string;
  schoolCode: string;
  gender: GenderType;
  grade: GradeType;
};

export type MyPageFormErrors = Partial<Record<"schoolName" | "gender" | "grade", string>>;

export type MyPageSchoolState = {
  keyword: string;
  results: SchoolOption[];
  isSearching: boolean;
  isDropdownOpen: boolean;
  hasSelectedSchool: boolean;
};
