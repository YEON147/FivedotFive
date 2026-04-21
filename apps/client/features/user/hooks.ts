"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getMyProfile,
  MY_PROFILE_PREVIEW_DATA,
  searchSchoolsForMyPage,
  updateMyProfile,
} from "@/features/user/api";
import { getStoredAccessToken } from "@/lib/api/client";
import type {
  MyPageFormErrors,
  MyPageFormValues,
  UpdateMyProfileRequest,
} from "@/features/user/types";
import type { SchoolOption } from "@/features/signup/types";

const INITIAL_VALUES: MyPageFormValues = {
  username: "",
  email: "",
  schoolName: "",
  schoolCode: "",
  gender: "",
  grade: "",
};

function isPreviewData(values: MyPageFormValues) {
  return (
    values.username === MY_PROFILE_PREVIEW_DATA.username &&
    values.email === MY_PROFILE_PREVIEW_DATA.email &&
    values.schoolName === MY_PROFILE_PREVIEW_DATA.school &&
    values.gender === MY_PROFILE_PREVIEW_DATA.gender &&
    values.grade === MY_PROFILE_PREVIEW_DATA.grade
  );
}

function validateMyPageForm(values: MyPageFormValues): MyPageFormErrors {
  const errors: MyPageFormErrors = {};

  if (values.schoolName.trim().length > 0 && values.schoolName.trim().length < 2) {
    errors.schoolName = "학교명은 2자 이상 입력하거나 검색 결과에서 선택해주세요.";
  }

  return errors;
}

function toUpdateRequest(values: MyPageFormValues): UpdateMyProfileRequest {
  return {
    school: values.schoolName.trim() || undefined,
    gender: values.gender || undefined,
    grade: values.grade || undefined,
  };
}

export function useMyPageForm() {
  const [values, setValues] = useState<MyPageFormValues>(INITIAL_VALUES);
  const [initialValues, setInitialValues] = useState<MyPageFormValues>(INITIAL_VALUES);
  const [errors, setErrors] = useState<MyPageFormErrors>({});

  const [isLoading, setIsLoading] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [loadMessage, setLoadMessage] = useState<string | null>(null);
  const [loadSuccess, setLoadSuccess] = useState<boolean | null>(null);

  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<boolean | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [schoolKeyword, setSchoolKeyword] = useState("");
  const [schoolResults, setSchoolResults] = useState<SchoolOption[]>([]);
  const [isSchoolSearching, setIsSchoolSearching] = useState(false);
  const [isSchoolDropdownOpen, setIsSchoolDropdownOpen] = useState(false);
  const [hasSelectedSchool, setHasSelectedSchool] = useState(false);
  const [ignoreNextSchoolFocus, setIgnoreNextSchoolFocus] = useState(false);

  const loadMyProfile = useCallback(async () => {
    setIsLoading(true);
    setLoadMessage(null);
    setLoadSuccess(null);

    try {
      const profile = await getMyProfile();
      const nextValues = {
        username: profile.username,
        email: profile.email,
        schoolName: profile.school,
        schoolCode: "",
        gender: profile.gender,
        grade: profile.grade,
      } satisfies MyPageFormValues;
      const hasToken = Boolean(getStoredAccessToken());
      const previewMode = !hasToken || isPreviewData(nextValues);

      setValues(nextValues);
      setInitialValues(nextValues);
      setSchoolKeyword(profile.school ?? "");
      setHasSelectedSchool(Boolean(profile.school));
      setSchoolResults([]);
      setIsSchoolDropdownOpen(false);
      setIsPreviewMode(previewMode);
      setLoadMessage(
        previewMode
          ? "백엔드 미연결 상태를 고려해 임시 미리보기 데이터를 표시합니다."
          : "내 정보를 불러왔습니다."
      );
      setLoadSuccess(true);
      setIsLoaded(true);
    } catch (error) {
      console.warn("내 정보 조회 실패, 미리보기 데이터로 대체합니다.", error);

      const previewValues = {
        username: MY_PROFILE_PREVIEW_DATA.username,
        email: MY_PROFILE_PREVIEW_DATA.email,
        schoolName: MY_PROFILE_PREVIEW_DATA.school,
        schoolCode: "",
        gender: MY_PROFILE_PREVIEW_DATA.gender,
        grade: MY_PROFILE_PREVIEW_DATA.grade,
      } satisfies MyPageFormValues;

      setValues(previewValues);
      setInitialValues(previewValues);
      setSchoolKeyword(MY_PROFILE_PREVIEW_DATA.school);
      setHasSelectedSchool(true);
      setSchoolResults([]);
      setIsSchoolDropdownOpen(false);
      setIsPreviewMode(true);
      setLoadMessage(
        "백엔드 연결 전 상태이므로 로그인 확인 없이 임시 미리보기 데이터를 표시합니다."
      );
      setLoadSuccess(true);
      setIsLoaded(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadMyProfile();
  }, [loadMyProfile]);

  useEffect(() => {
    const trimmed = schoolKeyword.trim();

    if (!trimmed || hasSelectedSchool) {
      setSchoolResults([]);
      setIsSchoolDropdownOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSchoolSearching(true);
      try {
        const result = await searchSchoolsForMyPage(trimmed);
        setSchoolResults(result);
        setIsSchoolDropdownOpen(result.length > 0);
      } catch (error) {
        console.error("학교 검색 실패:", error);
        setSchoolResults([]);
        setIsSchoolDropdownOpen(false);
      } finally {
        setIsSchoolSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [schoolKeyword, hasSelectedSchool]);

  const isDirty = useMemo(() => {
    return (
      values.schoolName !== initialValues.schoolName ||
      values.gender !== initialValues.gender ||
      values.grade !== initialValues.grade
    );
  }, [initialValues, values]);

  const canSubmit = useMemo(() => {
    const nextErrors = validateMyPageForm(values);
    return isDirty && Object.keys(nextErrors).length === 0 && !isSaving;
  }, [isDirty, isSaving, values]);

  const updateField = useCallback(
    (field: keyof Pick<MyPageFormValues, "schoolName" | "gender" | "grade">, value: string) => {
      setValues((prev) => ({ ...prev, [field]: value }));
      setSaveMessage(null);
      setSaveSuccess(null);

      if (field === "schoolName") {
        setSchoolKeyword(value);
        setHasSelectedSchool(false);
      }
    },
    []
  );

  const selectSchool = useCallback((school: SchoolOption) => {
    setValues((prev) => ({
      ...prev,
      schoolName: school.schoolName,
      schoolCode: school.schoolCode,
    }));
    setSchoolKeyword(school.schoolName);
    setHasSelectedSchool(true);
    setIsSchoolDropdownOpen(false);
    setIgnoreNextSchoolFocus(true);
    setErrors((prev) => ({ ...prev, schoolName: undefined }));
  }, []);

  const submit = useCallback(async () => {
    const nextErrors = validateMyPageForm(values);
    setErrors(nextErrors);
    setSaveMessage(null);
    setSaveSuccess(null);

    if (Object.keys(nextErrors).length > 0) {
      setSaveMessage("입력값을 확인해주세요.");
      setSaveSuccess(false);
      return;
    }

    if (!isDirty) {
      setSaveMessage("변경된 내용이 없습니다.");
      setSaveSuccess(false);
      return;
    }

    setIsSaving(true);

    try {
      const payload = toUpdateRequest(values);
      const response = await updateMyProfile(payload);

      setInitialValues(values);
      setHasSelectedSchool(Boolean(values.schoolName.trim()));
      setSaveMessage(response.message || "내 정보가 수정되었습니다.");
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
  }, [isDirty, values]);

  const resetChanges = useCallback(() => {
    setValues(initialValues);
    setSchoolKeyword(initialValues.schoolName);
    setHasSelectedSchool(Boolean(initialValues.schoolName));
    setSchoolResults([]);
    setIsSchoolDropdownOpen(false);
    setErrors({});
    setSaveMessage(null);
    setSaveSuccess(null);
  }, [initialValues]);

  return {
    values,
    errors,
    isLoading,
    isLoaded,
    isPreviewMode,
    loadMessage,
    loadSuccess,
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
    reload: loadMyProfile,
  };
}
