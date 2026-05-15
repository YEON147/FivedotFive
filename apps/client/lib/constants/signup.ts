import type { GradeBandType, GradeType } from "@/features/signup/types";

export const SIGNUP_API_PATH = "/api/auth/signup";
export const USERNAME_CHECK_API_PATH = "/api/auth/check/username";
export const NICKNAME_CHECK_API_PATH = "/api/auth/check/nickname";
export const USEREMAIL_CHECK_API_PATH = "/api/auth/check/useremail";
export const RANDOM_NICKNAME_API_PATH = "/api/auth/nickname/random";
/** Next Route Handler 전용 — `next.config`의 `/api`→백엔드 프록시와 충돌하지 않도록 `/front-api` 사용 */
export const SCHOOL_SEARCH_API_PATH = "/front-api/schools/search";

export const GENDER_OPTIONS = [
  { label: "선택 안 함", value: "" },
  { label: "남성", value: "MALE" },
  { label: "여성", value: "FEMALE" },
  { label: "기타", value: "OTHER" },
];

/** 단일 목록 (레거시·참고). 폼은 `GRADE_BAND_OPTIONS` + `getGradeDetailOptions` 사용 */
export const GRADE_OPTIONS = [
  { label: "선택 안 함", value: "" },
  { label: "초등 1학년", value: "ELEM_1" },
  { label: "초등 2학년", value: "ELEM_2" },
  { label: "초등 3학년", value: "ELEM_3" },
  { label: "초등 4학년", value: "ELEM_4" },
  { label: "초등 5학년", value: "ELEM_5" },
  { label: "초등 6학년", value: "ELEM_6" },
  { label: "중등 1학년", value: "MIDDLE_1" },
  { label: "중등 2학년", value: "MIDDLE_2" },
  { label: "중등 3학년", value: "MIDDLE_3" },
  { label: "고등 1학년", value: "HIGH_1" },
  { label: "고등 2학년", value: "HIGH_2" },
  { label: "고등 3학년", value: "HIGH_3" },
  { label: "20대", value: "ADULT_20S" },
  { label: "30대", value: "ADULT_30S" },
  { label: "40대", value: "ADULT_40S" },
  { label: "50대", value: "ADULT_50S" },
  { label: "60대 이상", value: "ADULT_60_PLUS" },
];

export const GRADE_BAND_OPTIONS: Array<{ label: string; value: GradeBandType }> =
  [
    { label: "선택 안 함", value: "" },
    { label: "초등학생", value: "ELEM" },
    { label: "중학생", value: "MIDDLE" },
    { label: "고등학생", value: "HIGH" },
    { label: "어른이 (20세 이상)", value: "ADULT" },
  ];

export function deriveBandFromGrade(grade: string): GradeBandType {
  if (!grade) return "";
  if (grade.startsWith("ELEM_")) return "ELEM";
  if (grade.startsWith("MIDDLE_")) return "MIDDLE";
  if (grade.startsWith("HIGH_")) return "HIGH";
  if (grade.startsWith("ADULT_")) return "ADULT";
  return "";
}

export function getGradeDetailOptions(
  band: GradeBandType
): Array<{ label: string; value: GradeType }> {
  const empty: { label: string; value: GradeType } = {
    label: "선택 안 함",
    value: "",
  };

  switch (band) {
    case "ELEM":
      return [
        empty,
        { label: "초등 1학년", value: "ELEM_1" },
        { label: "초등 2학년", value: "ELEM_2" },
        { label: "초등 3학년", value: "ELEM_3" },
        { label: "초등 4학년", value: "ELEM_4" },
        { label: "초등 5학년", value: "ELEM_5" },
        { label: "초등 6학년", value: "ELEM_6" },
      ];
    case "MIDDLE":
      return [
        empty,
        { label: "중등 1학년", value: "MIDDLE_1" },
        { label: "중등 2학년", value: "MIDDLE_2" },
        { label: "중등 3학년", value: "MIDDLE_3" },
      ];
    case "HIGH":
      return [
        empty,
        { label: "고등 1학년", value: "HIGH_1" },
        { label: "고등 2학년", value: "HIGH_2" },
        { label: "고등 3학년", value: "HIGH_3" },
      ];
    case "ADULT":
      return [
        empty,
        { label: "20대", value: "ADULT_20S" },
        { label: "30대", value: "ADULT_30S" },
        { label: "40대", value: "ADULT_40S" },
        { label: "50대", value: "ADULT_50S" },
        { label: "60대 이상", value: "ADULT_60_PLUS" },
      ];
    default:
      return [empty];
  }
}
