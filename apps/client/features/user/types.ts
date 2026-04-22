export type GenderType = "MALE" | "FEMALE" | "OTHER" | "";

export type GradeType =
  | "ELEM_1"
  | "ELEM_2"
  | "ELEM_3"
  | "ELEM_4"
  | "ELEM_5"
  | "ELEM_6"
  | "MIDDLE_1"
  | "MIDDLE_2"
  | "MIDDLE_3"
  | "HIGH_1"
  | "HIGH_2"
  | "HIGH_3"
  | "";

export type MyProfile = {
  username: string;
  email: string;
  nickname: string;
  school: string;
  gender: GenderType;
  grade: GradeType;
};

export type MyProfileResponse = {
  success: boolean;
  message: string;
  data?: {
    username?: string;
    email?: string;
    nickname?: string;
    school?: string;
    gender?: GenderType;
    grade?: GradeType;
  };
};

export type UpdateMyProfileRequest = {
  nickname: string;
  school?: string;
  gender?: Exclude<GenderType, "">;
  grade?: Exclude<GradeType, "">;
};

export type UpdateMyProfileResponse = {
  success: boolean;
  message: string;
};

export type ChangePasswordRequest = {
  currentPassword: string;
  newPassword: string;
};

export type ChangePasswordResponse = {
  success?: boolean;
  message?: string;
  id?: number;
};

export type MyPageFormValues = {
  username: string;
  email: string;
  nickname: string;
  schoolName: string;
  gender: GenderType;
  grade: GradeType;
};

export type PasswordFormValues = {
  currentPassword: string;
  newPassword: string;
};

export type PasswordFormErrors = Partial<
  Record<keyof PasswordFormValues, string>
>;

export type NicknameCheckStatus = "idle" | "checking" | "success" | "error";