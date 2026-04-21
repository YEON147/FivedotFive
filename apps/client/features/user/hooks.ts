"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getMyProfile,
  MY_PROFILE_PREVIEW_DATA,
  searchSchoolsForMyPage,
  updateMyProfile,
} from "@/features/user/api";
import type {
  GenderType,
  GradeType,
  MyPageFormValues,
  MyProfile,
  UpdateMyProfileRequest,
} from "@/features/user/types";
import type { SchoolOption } from "@/features/signup/types";

type FieldName = "schoolName" | "gender" | "grade";
type FormErrors = Partial<Record<FieldName, string>>;

const INITIAL_VALUES: MyPageFormValues = {
  username: "",
  email: "",
  schoolName: "",
  gender: "",
  grade: "",
};

function validateForm(values: MyPageFormValues): FormErrors {
  const nextErrors: FormErrors = {};

  if (!values.schoolName.trim()) {
    nextErrors.schoolName = "학교를 선택해주세요.";
  }

  if (!values.gender) {
    nextErrors.gender = "성별을 선택해주세요.";
  }

  if (!values.grade) {
    nextErrors.grade = "학년을 선택해주세요.";
  }

  return nextErrors;
}

function mapProfileToValues(profile: MyProfile): MyPageFormValues {
  return {
    username: profile.username ?? "",
    email: profile.email ?? "",
    schoolName: profile.school ?? "",
    gender: profile.gender ?? "",
    grade: profile.grade ?? "",
  };
}

export function useMyPageForm() {
  const [originalProfile, setOriginalProfile] = useState<MyProfile | null>(null);
  const [values, setValues] = useState<MyPageFormValues>(INITIAL_VALUES);
  const [errors, setErrors] = useState<FormErrors>({});

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

  const reload = useCallback(async () => {
    setIsLoading(true);
    setLoadMessage(null);
    setLoadSuccess(null);

    try {
      const profile = await getMyProfile();
      const nextValues = mapProfileToValues(profile);

      setOriginalProfile(profile);
      setValues(nextValues);
      setErrors({});
      setSchoolKeyword(nextValues.schoolName);
      setSchoolResults([]);
      setIsSchoolDropdownOpen(false);
      setHasSelectedSchool(true);
      setIgnoreNextSchoolFocus(false);

      const preview =
        profile.username === MY_PROFILE_PREVIEW_DATA.username &&
        profile.email === MY_PROFILE_PREVIEW_DATA.email &&
        profile.school === MY_PROFILE_PREVIEW_DATA.school &&
        profile.gender === MY_PROFILE_PREVIEW_DATA.gender &&
        profile.grade === MY_PROFILE_PREVIEW_DATA.grade;

      setIsPreviewMode(preview);
      setIsLoaded(true);

      if (preview) {
        setLoadMessage("백엔드 미연결 상태이므로 임시 데이터로 표시 중입니다.");
        setLoadSuccess(true);
      } else {
        setLoadMessage("회원 정보를 불러왔습니다.");
        setLoadSuccess(true);
      }
    } catch (error) {
      console.error("[mypage] reload failed", error);

      const fallbackValues = mapProfileToValues(MY_PROFILE_PREVIEW_DATA);

      setOriginalProfile(MY_PROFILE_PREVIEW_DATA);
      setValues(fallbackValues);
      setErrors({});
      setSchoolKeyword(fallbackValues.schoolName);
      setSchoolResults([]);
      setIsSchoolDropdownOpen(false);
      setHasSelectedSchool(true);
      setIgnoreNextSchoolFocus(false);
      setIsPreviewMode(true);
      setIsLoaded(true);
      setLoadMessage("백엔드 연결에 실패하여 임시 데이터로 표시 중입니다.");
      setLoadSuccess(false);
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
        setIsSchoolDropdownOpen(true);
      } catch (error) {
        console.error("[mypage] school search failed", error);
        setSchoolResults([]);
        setIsSchoolDropdownOpen(false);
      } finally {
        setIsSchoolSearching(false);
      }
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [schoolKeyword, hasSelectedSchool, isLoaded]);

  const updateField = useCallback((field: FieldName, value: string) => {
    setValues((prev) => ({
      ...prev,
      [field]: value,
    }));

    setErrors((prev) => ({
      ...prev,
      [field]: undefined,
    }));

    setSaveMessage(null);
    setSaveSuccess(null);

    if (field === "schoolName") {
      setSchoolKeyword(value);
      setHasSelectedSchool(false);
      if (!value.trim()) {
        setSchoolResults([]);
        setIsSchoolDropdownOpen(false);
      }
    }
  }, []);

  const selectSchool = useCallback((school: SchoolOption) => {
    setValues((prev) => ({
      ...prev,
      schoolName: school.schoolName,
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
    setHasSelectedSchool(true);
    setIsSchoolDropdownOpen(false);
    setIgnoreNextSchoolFocus(false);
    setSaveMessage(null);
    setSaveSuccess(null);
  }, [originalProfile]);

  const submit = useCallback(async () => {
    const nextErrors = validateForm(values);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      setSaveMessage("입력값을 다시 확인해주세요.");
      setSaveSuccess(false);
      return;
    }

    const payload: UpdateMyProfileRequest = {
      school: values.schoolName.trim(),
      gender: values.gender as GenderType,
      grade: values.grade as GradeType,
    };

    setIsSaving(true);
    setSaveMessage(null);
    setSaveSuccess(null);

    try {
      const response = await updateMyProfile(payload);

      const updatedProfile: MyProfile = {
        username: values.username,
        email: values.email,
        school: values.schoolName.trim(),
        gender: values.gender as GenderType,
        grade: values.grade as GradeType,
      };

      setOriginalProfile(updatedProfile);
      setValues(mapProfileToValues(updatedProfile));
      setSchoolKeyword(updatedProfile.school);
      setHasSelectedSchool(true);
      setIsSchoolDropdownOpen(false);
      setSchoolResults([]);
      setSaveMessage(response.message || "회원 정보가 수정되었습니다.");
      setSaveSuccess(true);
    } catch (error) {
      console.error("[mypage] submit failed", error);
      setSaveMessage("회원 정보 수정 중 오류가 발생했습니다.");
      setSaveSuccess(false);
    } finally {
      setIsSaving(false);
    }
  }, [values]);

  const isDirty = useMemo(() => {
    if (!originalProfile) return false;

    return (
      values.schoolName !== (originalProfile.school ?? "") ||
      values.gender !== (originalProfile.gender ?? "") ||
      values.grade !== (originalProfile.grade ?? "")
    );
  }, [originalProfile, values]);

  const canSubmit = useMemo(() => {
    return (
      Boolean(values.schoolName.trim()) &&
      Boolean(values.gender) &&
      Boolean(values.grade) &&
      !isSaving
    );
  }, [values, isSaving]);

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
    reload,
  };
}