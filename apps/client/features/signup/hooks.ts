"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  checkNickname,
  checkUsername,
  getRandomNickname,
  searchSchools,
  signup,
} from "@/features/signup/api";
import type {
  CheckStatus,
  SchoolOption,
  SignupFormErrors,
  SignupFormValues,
  SignupRequest,
} from "@/features/signup/types";

const INITIAL_VALUES: SignupFormValues = {
  username: "",
  password: "",
  passwordConfirm: "",
  nickname: "",
  email: "",
  schoolName: "",
  schoolCode: "",
  schoolOfficeCode: "",
  gender: "",
  grade: "",
};

const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,12}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateSignupForm(values: SignupFormValues): SignupFormErrors {
  const errors: SignupFormErrors = {};

  if (!values.username.trim()) {
    errors.username = "아이디를 입력해주세요.";
  } else if (values.username.length > 12) {
    errors.username = "아이디는 최대 12자까지 입력 가능합니다.";
  }

  if (!values.password.trim()) {
    errors.password = "비밀번호를 입력해주세요.";
  } else if (!PASSWORD_REGEX.test(values.password)) {
    errors.password = "비밀번호는 8~12자, 영문과 숫자를 모두 포함해야 합니다.";
  }

  if (!values.passwordConfirm.trim()) {
    errors.passwordConfirm = "비밀번호를 한 번 더 입력해주세요.";
  } else if (values.password !== values.passwordConfirm) {
    errors.passwordConfirm = "비밀번호가 일치하지 않습니다.";
  }

  if (!values.nickname.trim()) {
    errors.nickname = "닉네임을 입력해주세요.";
  } else if (values.nickname.length > 8) {
    errors.nickname = "닉네임은 최대 8자까지 입력 가능합니다.";
  }

  if (!values.email.trim()) {
    errors.email = "이메일을 입력해주세요.";
  } else if (!EMAIL_REGEX.test(values.email)) {
    errors.email = "올바른 이메일 형식을 입력해주세요.";
  }

  return errors;
}

function toSignupRequest(values: SignupFormValues): SignupRequest {
  return {
    username: values.username.trim(),
    password: values.password,
    nickname: values.nickname.trim(),
    email: values.email.trim(),
    school: values.schoolName.trim() || undefined,
    schoolCode: values.schoolCode.trim() || undefined,
    schoolOfficeCode: values.schoolOfficeCode.trim() || undefined,
    gender: values.gender || undefined,
    grade: values.grade || undefined,
  };
}

export function useSignupForm() {
  const [values, setValues] = useState<SignupFormValues>(INITIAL_VALUES);
  const [errors, setErrors] = useState<SignupFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isNicknameLoading, setIsNicknameLoading] = useState(true);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<boolean | null>(null);

  const [schoolKeyword, setSchoolKeyword] = useState("");
  const [schoolResults, setSchoolResults] = useState<SchoolOption[]>([]);
  const [isSchoolSearching, setIsSchoolSearching] = useState(false);
  const [isSchoolDropdownOpen, setIsSchoolDropdownOpen] = useState(false);
  const [hasSelectedSchool, setHasSelectedSchool] = useState(false);
  const [ignoreNextSchoolFocus, setIgnoreNextSchoolFocus] = useState(false);

  const [isNicknameDirty, setIsNicknameDirty] = useState(false);
  const [nicknameCheckStatus, setNicknameCheckStatus] =
    useState<CheckStatus>("idle");
  const [nicknameCheckMessage, setNicknameCheckMessage] = useState<string | null>(
    null
  );

  const [usernameCheckStatus, setUsernameCheckStatus] =
    useState<CheckStatus>("idle");
  const [usernameCheckMessage, setUsernameCheckMessage] = useState<string | null>(
    null
  );

  const loadRandomNickname = useCallback(async () => {
    setIsNicknameLoading(true);

    try {
      const nickname = await getRandomNickname();

      setValues((prev) => ({
        ...prev,
        nickname,
      }));

      setErrors((prev) => ({
        ...prev,
        nickname: undefined,
      }));

      setIsNicknameDirty(false);
      setNicknameCheckStatus("idle");
      setNicknameCheckMessage(null);
    } catch (error) {
      console.error("랜덤 닉네임 로드 실패:", error);
      setSubmitMessage("랜덤 닉네임을 불러오지 못했습니다. 직접 입력해주세요.");
      setSubmitSuccess(false);
    } finally {
      setIsNicknameLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadRandomNickname();
  }, [loadRandomNickname]);

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
        const result = await searchSchools(trimmed);
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

  useEffect(() => {
    const trimmedUsername = values.username.trim();

    if (!trimmedUsername) {
      setUsernameCheckStatus("idle");
      setUsernameCheckMessage(null);
      return;
    }

    if (trimmedUsername.length > 12) {
      setUsernameCheckStatus("unavailable");
      setUsernameCheckMessage("아이디는 최대 12자까지 입력 가능합니다.");
      return;
    }

    if (trimmedUsername.length < 2) {
      setUsernameCheckStatus("idle");
      setUsernameCheckMessage("아이디를 2자 이상 입력해주세요.");
      return;
    }

    const timer = setTimeout(async () => {
      const requestUsername = trimmedUsername;

      setUsernameCheckStatus("checking");
      setUsernameCheckMessage("아이디 확인 중입니다.");

      try {
        const response = await checkUsername(requestUsername);

        if (values.username.trim() !== requestUsername) return;

        const available = !!response.data?.available;

        setUsernameCheckStatus(available ? "available" : "unavailable");
        setUsernameCheckMessage(
          response.message ||
            (available
              ? "사용 가능한 아이디입니다."
              : "이미 사용 중인 아이디입니다.")
        );
      } catch (error) {
        if (values.username.trim() !== requestUsername) return;

        const message =
          error instanceof Error
            ? error.message
            : "아이디 확인 중 오류가 발생했습니다.";

        setUsernameCheckStatus("unavailable");
        setUsernameCheckMessage(message);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [values.username]);

  useEffect(() => {
    const trimmedNickname = values.nickname.trim();

    if (!isNicknameDirty) {
      setNicknameCheckStatus("idle");
      setNicknameCheckMessage(null);
      return;
    }

    if (!trimmedNickname) {
      setNicknameCheckStatus("idle");
      setNicknameCheckMessage(null);
      return;
    }

    if (trimmedNickname.length > 8) {
      setNicknameCheckStatus("unavailable");
      setNicknameCheckMessage("닉네임은 최대 8자까지 입력 가능합니다.");
      return;
    }

    if (trimmedNickname.length < 2) {
      setNicknameCheckStatus("idle");
      setNicknameCheckMessage("닉네임을 2자 이상 입력해주세요.");
      return;
    }

    const timer = setTimeout(async () => {
      const requestNickname = trimmedNickname;

      setNicknameCheckStatus("checking");
      setNicknameCheckMessage("닉네임 확인 중입니다.");

      try {
        const response = await checkNickname(requestNickname);

        if (values.nickname.trim() !== requestNickname) return;

        const available = !!response.data?.available;

        setNicknameCheckStatus(available ? "available" : "unavailable");
        setNicknameCheckMessage(
          response.message ||
            (available
              ? "사용 가능한 닉네임입니다."
              : "이미 사용 중인 닉네임입니다.")
        );
      } catch (error) {
        if (values.nickname.trim() !== requestNickname) return;

        const message =
          error instanceof Error
            ? error.message
            : "닉네임 확인 중 오류가 발생했습니다.";

        setNicknameCheckStatus("unavailable");
        setNicknameCheckMessage(message);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [values.nickname, isNicknameDirty]);

  const onChange = useCallback(
    (name: keyof SignupFormValues, value: string) => {
      setValues((prev) => ({
        ...prev,
        [name]: value,
      }));

      if (name === "nickname") {
        setIsNicknameDirty(true);
        setNicknameCheckStatus("idle");
        setNicknameCheckMessage(null);
      }

      if (name === "username") {
        setUsernameCheckStatus("idle");
        setUsernameCheckMessage(null);
      }

      setErrors((prev) => {
        if (!prev[name as keyof SignupFormErrors]) return prev;
        return {
          ...prev,
          [name]: undefined,
        };
      });

      if (submitMessage) {
        setSubmitMessage(null);
        setSubmitSuccess(null);
      }
    },
    [submitMessage]
  );

  const onRefetchNickname = useCallback(async () => {
    await loadRandomNickname();
  }, [loadRandomNickname]);

  const onSchoolKeywordChange = useCallback((value: string) => {
    setHasSelectedSchool(false);
    setIgnoreNextSchoolFocus(false);
    setSchoolKeyword(value);

    setValues((prev) => ({
      ...prev,
      schoolName: value,
      schoolCode: "",
      schoolOfficeCode: "",
    }));
  }, []);

  const onSelectSchool = useCallback((school: SchoolOption) => {
    setValues((prev) => ({
      ...prev,
      schoolName: school.schoolName,
      schoolCode: school.schoolCode,
      schoolOfficeCode: school.officeCode,
    }));

    setSchoolKeyword(school.schoolName);
    setSchoolResults([]);
    setIsSchoolDropdownOpen(false);
    setHasSelectedSchool(true);
    setIgnoreNextSchoolFocus(true);
  }, []);

  const canSubmit = useMemo(() => {
    const hasRequiredFields =
      !!values.username.trim() &&
      !!values.password.trim() &&
      !!values.passwordConfirm.trim() &&
      !!values.nickname.trim() &&
      !!values.email.trim();

    const usernamePassed = usernameCheckStatus === "available";
    const nicknamePassed =
      !isNicknameDirty || nicknameCheckStatus === "available";

    return (
      hasRequiredFields &&
      usernamePassed &&
      nicknamePassed &&
      !isSubmitting &&
      !isNicknameLoading
    );
  }, [
    values,
    usernameCheckStatus,
    isNicknameDirty,
    nicknameCheckStatus,
    isSubmitting,
    isNicknameLoading,
  ]);

  const onSubmit = useCallback(async () => {
    const nextErrors = validateSignupForm(values);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      setSubmitMessage("입력값을 다시 확인해주세요.");
      setSubmitSuccess(false);
      return;
    }

    if (usernameCheckStatus !== "available") {
      setSubmitMessage("아이디 중복 확인을 통과한 뒤 회원가입이 가능합니다.");
      setSubmitSuccess(false);
      return;
    }

    if (isNicknameDirty && nicknameCheckStatus !== "available") {
      setSubmitMessage("닉네임 중복 확인을 통과한 뒤 회원가입이 가능합니다.");
      setSubmitSuccess(false);
      return;
    }

    setIsSubmitting(true);
    setSubmitMessage(null);
    setSubmitSuccess(null);

    try {
      const payload = toSignupRequest(values);
      const response = await signup(payload);

      setSubmitMessage(response.message ?? "회원가입이 완료되었습니다.");
      setSubmitSuccess(true);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "회원가입 중 오류가 발생했습니다.";

      setSubmitMessage(message);
      setSubmitSuccess(false);
    } finally {
      setIsSubmitting(false);
    }
  }, [values, usernameCheckStatus, isNicknameDirty, nicknameCheckStatus]);

  return {
    values,
    errors,
    isSubmitting,
    isNicknameLoading,
    canSubmit,
    submitMessage,
    submitSuccess,
    onChange,
    onSubmit,
    onRefetchNickname,
    schoolKeyword,
    schoolResults,
    isSchoolSearching,
    isSchoolDropdownOpen,
    hasSelectedSchool,
    ignoreNextSchoolFocus,
    onSchoolKeywordChange,
    onSelectSchool,
    setIsSchoolDropdownOpen,
    setIgnoreNextSchoolFocus,
    nicknameCheckStatus,
    nicknameCheckMessage,
    isNicknameDirty,
    usernameCheckStatus,
    usernameCheckMessage,
  };
}