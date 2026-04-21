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

export type SchoolOption = {
  schoolName: string;
  schoolCode: string;
  officeCode: string;
  address?: string;
};

export type SignupFormValues = {
  username: string;
  password: string;
  passwordConfirm: string;
  nickname: string;
  email: string;
  schoolName: string;
  schoolCode: string;
  gender: GenderType;
  grade: GradeType;
};

export type SignupFormErrors = Partial<
  Record<
    | "username"
    | "password"
    | "passwordConfirm"
    | "nickname"
    | "email"
    | "schoolName"
    | "gender"
    | "grade",
    string
  >
>;

export type SignupRequest = {
  username: string;
  password: string;
  nickname: string;
  email: string;
  school?: string;
  schoolcode?: string;
  gender?: Exclude<GenderType, "">;
  grade?: Exclude<GradeType, "">;
};

export type SignupResponse = {
  success: boolean;
  message: string;
  data?: {
    id: number;
  };
};

export type RandomNicknameResponse = {
  success: boolean;
  message?: string;
  data?: {
    nickname: string;
  };
};

export type SchoolSearchResponse = {
  success: boolean;
  message?: string;
  data: SchoolOption[];
};

export type NicknameCheckResponse = {
  success: boolean;
  message: string;
  data?: {
    available: boolean;
  };
};

export type UsernameCheckResponse = {
  success: boolean;
  message: string;
  data?: {
    available: boolean;
  };
};

export type CheckStatus =
  | "idle"
  | "checking"
  | "available"
  | "unavailable";