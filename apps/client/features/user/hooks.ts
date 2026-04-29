"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  changeMyPassword,
  checkNicknameForMyPage,
  deleteMyAccount,
  getMyProfile,
  searchSchoolsForMyPage,
  updateMyProfile,
} from "@/features/user/api";
import { clearAccessToken } from "@/lib/api/token-store";
import { devError } from "@/lib/dev-log";
import { deriveBandFromGrade } from "@/lib/constants/signup";
import type {
  GenderType,
  GradeType,
  MyPageFormValues,
  MyProfile,
  NicknameCheckStatus,
  PasswordFormErrors,
  PasswordFormValues,
  UpdateMyProfileRequest,
} from "@/features/user/types";
import type { SchoolOption } from "@/features/signup/types";

type FieldName =
  | "nickname"
  | "schoolName"
  | "gender"
  | "grade"
  | "gradeBand";
type FormErrors = Partial<Record<FieldName, string>>;

const INITIAL_VALUES: MyPageFormValues = {
  username: "",
  email: "",
  nickname: "",
  schoolName: "",
  schoolCode: "",
  gender: "",
  gradeBand: "",
  grade: "",
};

const INITIAL_PASSWORD_VALUES: PasswordFormValues = {
  currentPassword: "",
  newPassword: "",
  newPasswordConfirm: "",
};

const NEW_PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,12}$/;

function validateForm(
  values: MyPageFormValues,
  originalProfile: MyProfile | null,
): FormErrors {
  const nextErrors: FormErrors = {};

  if (!values.nickname.trim()) {
    nextErrors.nickname = "닉네임을 입력해주세요.";
  } else if (values.nickname.trim().length > 8) {
    nextErrors.nickname = "닉네임은 최대 8자까지 입력할 수 있습니다.";
  }

  const schoolTrim = values.schoolName.trim();
  const schoolCodeTrim = values.schoolCode.trim();
  if (schoolTrim !== "" && schoolCodeTrim === "") {
    const legacyNameOnlyOk =
      originalProfile != null &&
      schoolTrim === (originalProfile.school ?? "").trim() &&
      !(originalProfile.schoolcode?.trim());
    if (!legacyNameOnlyOk) {
      nextErrors.schoolName =
        "검색 결과 목록에서 학교를 선택해 주세요. 검색되지 않는 학교는 등록할 수 없습니다.";
    }
  }

  return nextErrors;
}

function validatePasswordForm(
  values: PasswordFormValues
): PasswordFormErrors {
  const nextErrors: PasswordFormErrors = {};

  if (!values.currentPassword.trim()) {
    nextErrors.currentPassword = "현재 비밀번호를 입력해주세요.";
  }

  if (!values.newPassword.trim()) {
    nextErrors.newPassword = "새 비밀번호를 입력해주세요.";
  } else if (!NEW_PASSWORD_REGEX.test(values.newPassword)) {
    nextErrors.newPassword =
      "새 비밀번호는 8~12자이며 영문과 숫자를 모두 포함해야 합니다.";
  } else if (
    values.currentPassword &&
    values.currentPassword === values.newPassword
  ) {
    nextErrors.newPassword = "새 비밀번호는 현재 비밀번호와 달라야 합니다.";
  }

  if (!values.newPasswordConfirm.trim()) {
    nextErrors.newPasswordConfirm = "새 비밀번호 확인을 입력해주세요.";
  } else if (values.newPassword !== values.newPasswordConfirm) {
    nextErrors.newPasswordConfirm = "새 비밀번호가 일치하지 않습니다.";
  }

  return nextErrors;
}

function mapProfileToValues(profile: MyProfile): MyPageFormValues {
  return {
    username: profile.username ?? "",
    email: profile.email ?? "",
    nickname: profile.nickname ?? "",
    schoolName: profile.school ?? "",
    schoolCode: profile.schoolcode ?? "",
    gender: profile.gender ?? "",
    gradeBand: deriveBandFromGrade(profile.grade ?? ""),
    grade: profile.grade ?? "",
  };
}

export function useMyPageForm() {
  const router = useRouter();
  const [originalProfile, setOriginalProfile] = useState<MyProfile | null>(null);
  const [values, setValues] = useState<MyPageFormValues>(INITIAL_VALUES);
  const [errors, setErrors] = useState<FormErrors>({});

  const [isLoading, setIsLoading] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);

  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<boolean | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [schoolKeyword, setSchoolKeyword] = useState("");
  const [schoolResults, setSchoolResults] = useState<SchoolOption[]>([]);
  const [isSchoolSearching, setIsSchoolSearching] = useState(false);
  const [isSchoolDropdownOpen, setIsSchoolDropdownOpen] = useState(false);
  const [hasSelectedSchool, setHasSelectedSchool] = useState(false);
  const [ignoreNextSchoolFocus, setIgnoreNextSchoolFocus] = useState(false);

  const [nicknameCheckStatus, setNicknameCheckStatus] =
    useState<NicknameCheckStatus>("idle");
  const [nicknameCheckedValue, setNicknameCheckedValue] = useState("");
  const [nicknameCheckMessage, setNicknameCheckMessage] = useState<string | null>(
    null
  );

  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordValues, setPasswordValues] =
    useState<PasswordFormValues>(INITIAL_PASSWORD_VALUES);
  const [passwordErrors, setPasswordErrors] = useState<PasswordFormErrors>({});
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<boolean | null>(null);
  const [isPasswordSaving, setIsPasswordSaving] = useState(false);

  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [withdrawStep, setWithdrawStep] = useState<1 | 2>(1);
  const [withdrawPassword, setWithdrawPassword] = useState("");
  const [withdrawMessage, setWithdrawMessage] = useState<string | null>(null);
  const [isWithdrawSubmitting, setIsWithdrawSubmitting] = useState(false);

  const reload = useCallback(async () => {
    setIsLoading(true);

    try {
      const profile = await getMyProfile();
      const nextValues = mapProfileToValues(profile);

      setOriginalProfile(profile);
      setValues(nextValues);
      setErrors({});
      setSchoolKeyword(nextValues.schoolName);
      setSchoolResults([]);
      setIsSchoolDropdownOpen(false);
      setHasSelectedSchool(Boolean(nextValues.schoolName));
      setIgnoreNextSchoolFocus(false);

      setNicknameCheckStatus("success");
      setNicknameCheckedValue(nextValues.nickname);
      setNicknameCheckMessage(null);

      setIsLoaded(true);
    } catch (error) {
      devError("[mypage] reload failed", error);
      setSaveMessage(
        error instanceof Error
          ? error.message
          : "회원 정보를 불러오지 못했습니다."
      );
      setSaveSuccess(false);
      setIsLoaded(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(() => {
    if (!isLoaded) return;

    const trimmedKeyword = schoolKeyword.trim();

    if (!trimmedKeyword || hasSelectedSchool) {
      if (!trimmedKeyword) {
        setSchoolResults([]);
        setIsSchoolDropdownOpen(false);
      }
      return;
    }

    const timeout = window.setTimeout(async () => {
      setIsSchoolSearching(true);

      try {
        const schools = await searchSchoolsForMyPage(trimmedKeyword);
        setSchoolResults(schools);
        setIsSchoolDropdownOpen(schools.length > 0);
      } catch (error) {
        devError("[mypage] school search failed", error);
        setSchoolResults([]);
        setIsSchoolDropdownOpen(false);
      } finally {
        setIsSchoolSearching(false);
      }
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [schoolKeyword, hasSelectedSchool, isLoaded]);

  const updateField = useCallback((field: FieldName, value: string) => {
    const nextValue = field === "nickname" ? value.slice(0, 8) : value;

    setValues((prev) => {
      const base: MyPageFormValues = {
        ...prev,
        [field]: nextValue as MyPageFormValues[typeof field],
        ...(field === "schoolName" ? { schoolCode: "" } : {}),
        ...(field === "gradeBand" ? { grade: "" } : {}),
      };
      if (field === "grade") {
        return {
          ...base,
          gradeBand:
            nextValue === ""
              ? prev.gradeBand
              : deriveBandFromGrade(nextValue),
        };
      }
      return base;
    });

    setErrors((prev) => ({
      ...prev,
      [field]: undefined,
      ...(field === "gradeBand" ? { grade: undefined } : {}),
    }));

    setSaveMessage(null);
    setSaveSuccess(null);

    if (field === "nickname") {
      setNicknameCheckStatus("idle");
      setNicknameCheckedValue("");
      setNicknameCheckMessage(null);
    }

    if (field === "schoolName") {
      setSchoolKeyword(nextValue);
      setHasSelectedSchool(false);
      setIgnoreNextSchoolFocus(false);
    }
  }, []);

  const checkNickname = useCallback(async () => {
    const nickname = values.nickname.trim();

    if (!nickname) {
      setErrors((prev) => ({
        ...prev,
        nickname: "닉네임을 입력해주세요.",
      }));
      setNicknameCheckStatus("error");
      setNicknameCheckMessage(null);
      return;
    }

    if (nickname.length > 8) {
      setErrors((prev) => ({
        ...prev,
        nickname: "닉네임은 최대 8자까지 입력할 수 있습니다.",
      }));
      setNicknameCheckStatus("error");
      setNicknameCheckMessage(null);
      return;
    }

    if (nickname === (originalProfile?.nickname ?? "")) {
      setNicknameCheckStatus("success");
      setNicknameCheckedValue(nickname);
      setNicknameCheckMessage("현재 사용 중인 닉네임입니다.");
      setErrors((prev) => ({
        ...prev,
        nickname: undefined,
      }));
      return;
    }

    setNicknameCheckStatus("checking");
    setNicknameCheckMessage(null);

    const result = await checkNicknameForMyPage(nickname);

    if (result.available) {
      setNicknameCheckStatus("success");
      setNicknameCheckedValue(nickname);
      setNicknameCheckMessage(result.message || "사용 가능한 닉네임입니다.");
      setErrors((prev) => ({
        ...prev,
        nickname: undefined,
      }));
    } else {
      setNicknameCheckStatus("error");
      setNicknameCheckedValue("");
      setNicknameCheckMessage(result.message || "이미 사용 중인 닉네임입니다.");
    }
  }, [values.nickname, originalProfile]);

  const selectSchool = useCallback((school: SchoolOption) => {
    setValues((prev) => ({
      ...prev,
      schoolName: school.schoolName,
      schoolCode: school.schoolCode,
    }));
    setSchoolKeyword(school.schoolName);
    setSchoolResults([]);
    setHasSelectedSchool(true);
    setIsSchoolDropdownOpen(false);
    setIgnoreNextSchoolFocus(true);

    setErrors((prev) => ({
      ...prev,
      schoolName: undefined,
    }));
  }, []);

  const resetChanges = useCallback(() => {
    if (!originalProfile) return;

    const nextValues = mapProfileToValues(originalProfile);
    setValues(nextValues);
    setErrors({});
    setSchoolKeyword(nextValues.schoolName);
    setSchoolResults([]);
    setHasSelectedSchool(
      Boolean(originalProfile.schoolcode?.trim()) ||
        (!!originalProfile.school?.trim() &&
          !originalProfile.schoolcode?.trim()),
    );
    setIsSchoolDropdownOpen(false);
    setIgnoreNextSchoolFocus(false);
    setSaveMessage(null);
    setSaveSuccess(null);

    setNicknameCheckStatus("success");
    setNicknameCheckedValue(nextValues.nickname);
    setNicknameCheckMessage(null);
  }, [originalProfile]);

  const submit = useCallback(async () => {
    const nextErrors = validateForm(values, originalProfile);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      setSaveMessage("입력값을 다시 확인해주세요.");
      setSaveSuccess(false);
      return;
    }

    const nicknameChanged =
      values.nickname.trim() !== (originalProfile?.nickname ?? "");

    if (nicknameChanged && nicknameCheckedValue !== values.nickname.trim()) {
      setErrors((prev) => ({
        ...prev,
        nickname: "닉네임 중복확인을 완료해주세요.",
      }));
      setSaveMessage("닉네임 중복확인을 완료해주세요.");
      setSaveSuccess(false);
      return;
    }

    const schoolName = values.schoolName.trim();
    const schoolCode = values.schoolCode.trim();

    const payload: UpdateMyProfileRequest = {
      nickname: values.nickname.trim(),
      school: schoolName === "" ? null : schoolName,
      schoolcode: schoolCode === "" ? null : schoolCode,
      gender: values.gender === "" ? null : (values.gender as Exclude<GenderType, "">),
      grade: values.grade === "" ? null : (values.grade as Exclude<GradeType, "">),
    };

    setIsSaving(true);
    setSaveMessage(null);
    setSaveSuccess(null);

    try {
      const response = await updateMyProfile(payload);

      const updatedProfile: MyProfile = {
        username: response.data?.username ?? values.username,
        email: response.data?.email ?? values.email,
        nickname: response.data?.nickname ?? values.nickname.trim(),
        school: response.data?.school ?? payload.school,
        schoolcode: response.data?.schoolcode ?? payload.schoolcode,
        gender: response.data?.gender ?? payload.gender,
        grade: response.data?.grade ?? payload.grade,
        hasWishBoard: originalProfile?.hasWishBoard ?? false,
        role: originalProfile?.role ?? null,
        provider: originalProfile?.provider ?? null,
      };

      setOriginalProfile(updatedProfile);
      setValues(mapProfileToValues(updatedProfile));
      setSchoolKeyword(updatedProfile.school ?? "");
      setHasSelectedSchool(
        Boolean(updatedProfile.schoolcode?.trim()) ||
          (!!updatedProfile.school?.trim() &&
            !updatedProfile.schoolcode?.trim()),
      );
      setIsSchoolDropdownOpen(false);
      setSchoolResults([]);

      setNicknameCheckStatus("success");
      setNicknameCheckedValue(updatedProfile.nickname);
      setNicknameCheckMessage(null);

      setSaveMessage(response.message || "회원 정보가 수정되었습니다.");
      setSaveSuccess(true);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "회원 정보 수정 중 오류가 발생했습니다.";
      setSaveMessage(message);
      setSaveSuccess(false);
    } finally {
      setIsSaving(false);
    }
  }, [values, originalProfile, nicknameCheckedValue]);

  const openPasswordModal = useCallback(() => {
    setPasswordValues(INITIAL_PASSWORD_VALUES);
    setPasswordErrors({});
    setPasswordMessage(null);
    setPasswordSuccess(null);
    setIsPasswordModalOpen(true);
  }, []);

  const closePasswordModal = useCallback(() => {
    if (isPasswordSaving) return;
    setIsPasswordModalOpen(false);
    setPasswordValues(INITIAL_PASSWORD_VALUES);
    setPasswordErrors({});
    setPasswordMessage(null);
    setPasswordSuccess(null);
  }, [isPasswordSaving]);

  const updatePasswordField = useCallback(
    (field: keyof PasswordFormValues, value: string) => {
      setPasswordValues((prev) => ({ ...prev, [field]: value }));
      setPasswordErrors((prev) => ({ ...prev, [field]: undefined }));
      setPasswordMessage(null);
      setPasswordSuccess(null);
    },
    []
  );

  const canWithdrawAccount = originalProfile?.role === "CHILD";
  /** 카카오는 DB 비밀번호 없음 — 탈퇴 API·UI에서 비밀번호 생략 */
  const withdrawRequiresPassword = originalProfile?.provider !== "KAKAO";

  const openWithdrawModal = useCallback(() => {
    setWithdrawStep(1);
    setWithdrawPassword("");
    setWithdrawMessage(null);
    setIsWithdrawModalOpen(true);
  }, []);

  const closeWithdrawModal = useCallback(() => {
    if (isWithdrawSubmitting) return;
    setIsWithdrawModalOpen(false);
    setWithdrawStep(1);
    setWithdrawPassword("");
    setWithdrawMessage(null);
  }, [isWithdrawSubmitting]);

  const goWithdrawConfirmNext = useCallback(() => {
    setWithdrawStep(2);
    setWithdrawMessage(null);
  }, []);

  const goWithdrawConfirmBack = useCallback(() => {
    setWithdrawStep(1);
    setWithdrawPassword("");
    setWithdrawMessage(null);
  }, []);

  const updateWithdrawPassword = useCallback((value: string) => {
    setWithdrawPassword(value);
    setWithdrawMessage(null);
  }, []);

  const submitWithdrawAccount = useCallback(async () => {
    const needsPassword = originalProfile?.provider !== "KAKAO";
    if (needsPassword) {
      const trimmed = withdrawPassword.trim();
      if (!trimmed) {
        setWithdrawMessage("비밀번호를 입력해 주세요.");
        return;
      }
    }

    setIsWithdrawSubmitting(true);
    setWithdrawMessage(null);

    try {
      const response = await deleteMyAccount({
        password: needsPassword ? withdrawPassword.trim() : "",
      });

      if (response.success) {
        clearAccessToken();
        router.push("/login");
        return;
      }

      setWithdrawMessage(response.message ?? "회원 탈퇴에 실패했습니다.");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "회원 탈퇴 처리 중 오류가 발생했습니다.";
      setWithdrawMessage(message);
    } finally {
      setIsWithdrawSubmitting(false);
    }
  }, [withdrawPassword, router, originalProfile?.provider]);

  const submitPasswordChange = useCallback(async () => {
    const nextErrors = validatePasswordForm(passwordValues);
    setPasswordErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      setPasswordSuccess(false);
      setPasswordMessage("비밀번호 입력값을 다시 확인해주세요.");
      return;
    }

    setIsPasswordSaving(true);
    setPasswordMessage(null);
    setPasswordSuccess(null);

    try {
      const response = await changeMyPassword({
        currentPassword: passwordValues.currentPassword,
        newPassword: passwordValues.newPassword,
      });

      setPasswordSuccess(true);
      setPasswordMessage(response.message || "비밀번호가 변경되었습니다.");
      setPasswordValues(INITIAL_PASSWORD_VALUES);

      window.setTimeout(() => {
        setIsPasswordModalOpen(false);
        setPasswordMessage(null);
        setPasswordSuccess(null);
      }, 1000);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "비밀번호 변경 중 오류가 발생했습니다.";
      setPasswordSuccess(false);
      setPasswordMessage(message);
    } finally {
      setIsPasswordSaving(false);
    }
  }, [passwordValues]);

  const isDirty = useMemo(() => {
    if (!originalProfile) return false;

    return (
      values.nickname !== (originalProfile.nickname ?? "") ||
      values.schoolName !== (originalProfile.school ?? "") ||
      values.schoolCode !== (originalProfile.schoolcode ?? "") ||
      values.gender !== (originalProfile.gender ?? "") ||
      values.grade !== (originalProfile.grade ?? "") ||
      values.gradeBand !==
        deriveBandFromGrade(originalProfile.grade ?? "")
    );
  }, [originalProfile, values]);

  const canSubmit = useMemo(() => {
    const nicknameChanged =
      values.nickname.trim() !== (originalProfile?.nickname ?? "");
    const nicknameReady =
      !nicknameChanged || nicknameCheckedValue === values.nickname.trim();

    return (
      Boolean(values.nickname.trim()) &&
      values.nickname.trim().length <= 8 &&
      nicknameReady &&
      !isSaving
    );
  }, [values, originalProfile, nicknameCheckedValue, isSaving]);

  return {
    values,
    errors,
    isLoading,
    isLoaded,
    saveMessage,
    saveSuccess,
    isSaving,
    schoolKeyword,
    schoolResults,
    isSchoolSearching,
    isSchoolDropdownOpen,
    hasSelectedSchool,
    ignoreNextSchoolFocus,
    isDirty,
    canSubmit,
    setIgnoreNextSchoolFocus,
    setIsSchoolDropdownOpen,
    updateField,
    selectSchool,
    submit,
    resetChanges,

    nicknameCheckStatus,
    nicknameCheckMessage,
    checkNickname,

    isPasswordModalOpen,
    passwordValues,
    passwordErrors,
    passwordMessage,
    passwordSuccess,
    isPasswordSaving,
    openPasswordModal,
    closePasswordModal,
    updatePasswordField,
    submitPasswordChange,

    canWithdrawAccount,
    withdrawRequiresPassword,
    isWithdrawModalOpen,
    withdrawStep,
    withdrawPassword,
    withdrawMessage,
    isWithdrawSubmitting,
    openWithdrawModal,
    closeWithdrawModal,
    goWithdrawConfirmNext,
    goWithdrawConfirmBack,
    updateWithdrawPassword,
    submitWithdrawAccount,
  };
}