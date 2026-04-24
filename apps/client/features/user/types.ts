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
  school: string | null;
  schoolcode: string | null;
  gender: Exclude<GenderType, ""> | null;
  grade: Exclude<GradeType, ""> | null;
  /** 내정보 API `data.hasWishBoard` */
  hasWishBoard: boolean;
  role: "CHILD" | "PARENT" | null;
};

export type MyProfileResponse = {
  success: boolean;
  message: string;
  data?: {
    username?: string;
    email?: string;
    nickname?: string;
    school?: string | null;
    schoolcode?: string | null;
    gender?: Exclude<GenderType, ""> | null;
    grade?: Exclude<GradeType, ""> | null;
    hasWishBoard?: boolean;
    role?: string | null;
  };
};

export type UpdateMyProfileRequest = {
  nickname: string;
  school: string | null;
  schoolcode: string | null;
  gender: Exclude<GenderType, ""> | null;
  grade: Exclude<GradeType, ""> | null;
};

export type UpdateMyProfileResponse = {
  success: boolean;
  message: string;
  data?: {
    username?: string;
    email?: string;
    nickname?: string;
    school?: string | null;
    schoolcode?: string | null;
    gender?: Exclude<GenderType, ""> | null;
    grade?: Exclude<GradeType, ""> | null;
  };
};

export type ChangePasswordRequest = {
  currentPassword: string;
  newPassword: string;
};

export type ChangePasswordResponse = {
  success?: boolean;
  message?: string;
};

export type MyPageFormValues = {
  username: string;
  email: string;
  nickname: string;
  schoolName: string;
  schoolCode: string;
  gender: GenderType;
  grade: GradeType;
};

export type PasswordFormValues = {
  currentPassword: string;
  newPassword: string;
  newPasswordConfirm: string;
};

export type PasswordFormErrors = Partial<
  Record<keyof PasswordFormValues, string>
>;

export type NicknameCheckStatus = "idle" | "checking" | "success" | "error";