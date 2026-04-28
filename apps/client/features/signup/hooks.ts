"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  checkNickname,
  checkUserEmail,
  checkUsername,
  getRandomNickname,
  searchSchools,
  signup,
} from "@/features/signup/api";
import { trackSignUpComplete } from "@/lib/analytics/conversion";
import { devError } from "@/lib/dev-log";
import { deriveBandFromGrade } from "@/lib/constants/signup";
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
  gender: "",
  gradeBand: "",
  grade: "",
};

const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,12}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
/** 형식 오류 문구는 입력이 잠시 멈춘 뒤에만 표시 (글자 단위 즉시 노출 방지) */
const EMAIL_FORMAT_MESSAGE_DEBOUNCE_MS = 500;

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

  const schoolTrim = values.schoolName.trim();
  const schoolCodeTrim = values.schoolCode.trim();
  if (schoolTrim !== "" && schoolCodeTrim === "") {
    errors.schoolName =
      "검색 결과 목록에서 학교를 선택해 주세요. 검색되지 않는 학교는 등록할 수 없습니다.";
  }

  return errors;
}

function toSignupRequest(values: SignupFormValues): SignupRequest {
  const schoolTrim = values.schoolName.trim();
  const schoolcodeTrim = values.schoolCode.trim();
  const schoolVerified = schoolTrim !== "" && schoolcodeTrim !== "";

  return {
    username: values.username.trim(),
    password: values.password,
    nickname: values.nickname.trim(),
    email: values.email.trim(),
    school: schoolVerified ? schoolTrim : null,
    schoolcode: schoolVerified ? schoolcodeTrim : null,
    gender: values.gender === "" ? null : values.gender,
    grade: values.grade === "" ? null : values.grade,
  };
}

export function useSignupForm() {
  const router = useRouter();
  const [values, setValues] = useState<SignupFormValues>(INITIAL_VALUES);
  const [errors, setErrors] = useState<SignupFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  /** 최초 진입 시 추천 닉네임 API 호출까지 true */
  const [isNicknameLoading, setIsNicknameLoading] = useState(true);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<boolean | null>(null);

  const [isNicknameDirty, setIsNicknameDirty] = useState(false);
  const [nicknameCheckStatus, setNicknameCheckStatus] =
    useState<CheckStatus>("idle");
  const [nicknameCheckMessage, setNicknameCheckMessage] = useState<string | null>(
    null,
  );

  const [usernameCheckStatus, setUsernameCheckStatus] =
    useState<CheckStatus>("idle");
  const [usernameCheckMessage, setUsernameCheckMessage] = useState<string | null>(
    null,
  );

  const [userEmailCheckStatus, setUserEmailCheckStatus] =
    useState<CheckStatus>("idle");
  const [userEmailCheckMessage, setUserEmailCheckMessage] = useState<string | null>(
    null,
  );

  const [schoolKeyword, setSchoolKeyword] = useState("");
  const [schoolResults, setSchoolResults] = useState<SchoolOption[]>([]);
  const [isSchoolSearching, setIsSchoolSearching] = useState(false);
  const [isSchoolDropdownOpen, setIsSchoolDropdownOpen] = useState(false);
  const [hasSelectedSchool, setHasSelectedSchool] = useState(false);
  const [ignoreNextSchoolFocus, setIgnoreNextSchoolFocus] = useState(false);

  const signupEmailRef = useRef(values.email);
  signupEmailRef.current = values.email;

  /** 가입 화면 진입 시 추천 닉네임을 미리 채움 — 실패 시 빈 값으로 두고 직접 입력 */
  useEffect(() => {
    let cancelled = false;

    setIsNicknameLoading(true);

    void (async () => {
      try {
        const nickname = await getRandomNickname();
        if (cancelled) return;
        setValues((prev) => ({ ...prev, nickname }));
        setIsNicknameDirty(true);
        setNicknameCheckStatus("idle");
        setNicknameCheckMessage(null);
      } catch {
        if (cancelled) return;
        setIsNicknameDirty(false);
        setNicknameCheckStatus("idle");
        setNicknameCheckMessage(null);
      } finally {
        if (!cancelled) {
          setIsNicknameLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
      setIsNicknameLoading(false);
    };
  }, []);

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
              : "이미 사용 중인 아이디입니다."),
        );
      } catch (error) {
        if (values.username.trim() !== requestUsername) return;

        const message =
          error instanceof Error
            ? error.message
            : "아이디 중복 확인 중 오류가 발생했습니다.";

        setUsernameCheckStatus("unavailable");
        setUsernameCheckMessage(message);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [values.username]);

  useEffect(() => {
    const trimmedEmail = values.email.trim();

    if (!trimmedEmail) {
      setUserEmailCheckStatus("idle");
      setUserEmailCheckMessage(null);
      return;
    }

    if (!EMAIL_REGEX.test(trimmedEmail)) {
      setUserEmailCheckStatus("idle");
      setUserEmailCheckMessage(null);

      const formatTimer = window.setTimeout(() => {
        const latest = signupEmailRef.current.trim();
        if (!latest) {
          setUserEmailCheckStatus("idle");
          setUserEmailCheckMessage(null);
          return;
        }
        if (EMAIL_REGEX.test(latest)) return;
        setUserEmailCheckStatus("idle");
        setUserEmailCheckMessage("올바른 이메일 형식을 입력해주세요.");
      }, EMAIL_FORMAT_MESSAGE_DEBOUNCE_MS);

      return () => window.clearTimeout(formatTimer);
    }

    const timer = setTimeout(async () => {
      const requestEmail = trimmedEmail;

      setUserEmailCheckStatus("checking");
      setUserEmailCheckMessage("이메일 확인 중입니다.");

      try {
        const response = await checkUserEmail(requestEmail);

        if (values.email.trim() !== requestEmail) return;

        const available = !!response.data?.available;

        setUserEmailCheckStatus(available ? "available" : "unavailable");
        setUserEmailCheckMessage(
          response.message ||
            (available
              ? "사용 가능한 이메일입니다."
              : "이미 사용 중인 이메일입니다."),
        );
      } catch (error) {
        if (values.email.trim() !== requestEmail) return;

        const message =
          error instanceof Error
            ? error.message
            : "이메일 중복 확인 중 오류가 발생했습니다.";

        setUserEmailCheckStatus("unavailable");
        setUserEmailCheckMessage(message);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [values.email]);

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
              : "이미 사용 중인 닉네임입니다."),
        );
      } catch (error) {
        if (values.nickname.trim() !== requestNickname) return;

        const message =
          error instanceof Error
            ? error.message
            : "닉네임 중복 확인 중 오류가 발생했습니다.";

        setNicknameCheckStatus("unavailable");
        setNicknameCheckMessage(message);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [values.nickname, isNicknameDirty]);

  useEffect(() => {
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
        const schools = await searchSchools(trimmedKeyword);
        setSchoolResults(schools);
        setIsSchoolDropdownOpen(schools.length > 0);
      } catch (error) {
        devError("[signup] school search failed", error);
        setSchoolResults([]);
        setIsSchoolDropdownOpen(false);
      } finally {
        setIsSchoolSearching(false);
      }
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [schoolKeyword, hasSelectedSchool]);

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

  const onChange = useCallback(
    (name: keyof SignupFormValues, value: string) => {
      setValues((prev) => {
        const base: SignupFormValues = {
          ...prev,
          [name]: value as SignupFormValues[typeof name],
          ...(name === "schoolName" ? { schoolCode: "" } : {}),
          ...(name === "gradeBand" ? { grade: "" } : {}),
        };
        if (name === "grade") {
          return {
            ...base,
            gradeBand:
              value === "" ? prev.gradeBand : deriveBandFromGrade(value),
          };
        }
        return base;
      });

      if (name === "schoolName") {
        setSchoolKeyword(value);
        setHasSelectedSchool(false);
        setIgnoreNextSchoolFocus(false);
      }

      if (name === "username") {
        setUsernameCheckStatus("idle");
        setUsernameCheckMessage(null);
      }

      if (name === "email") {
        setUserEmailCheckStatus("idle");
        setUserEmailCheckMessage(null);
      }

      if (name === "nickname") {
        setIsNicknameDirty(true);
        setNicknameCheckStatus("idle");
        setNicknameCheckMessage(null);
      }

      setErrors((prev) => {
        if (name === "gradeBand") {
          return { ...prev, grade: undefined };
        }
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
    [submitMessage],
  );

  const onRefetchNickname = useCallback(async () => {
    setIsNicknameLoading(true);
    try {
      const nickname = await getRandomNickname();
      setValues((prev) => ({ ...prev, nickname }));
      setIsNicknameDirty(true);
      setNicknameCheckStatus("idle");
      setNicknameCheckMessage(null);
      setSubmitMessage(null);
      setSubmitSuccess(null);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "랜덤 닉네임을 불러오지 못했습니다.";
      setSubmitMessage(message);
      setSubmitSuccess(false);
    } finally {
      setIsNicknameLoading(false);
    }
  }, []);

  const canSubmit = useMemo(() => {
    const hasRequiredFields =
      !!values.username.trim() &&
      !!values.password.trim() &&
      !!values.passwordConfirm.trim() &&
      !!values.nickname.trim() &&
      !!values.email.trim();

    const usernamePassed =
      values.username.trim().length >= 2 &&
      values.username.trim().length <= 12;

    const passwordPassed = PASSWORD_REGEX.test(values.password);

    const passwordConfirmPassed =
      !!values.passwordConfirm.trim() &&
      values.password === values.passwordConfirm;

    const emailPassed = EMAIL_REGEX.test(values.email.trim());

    const nicknamePassed =
      values.nickname.trim().length >= 2 &&
      values.nickname.trim().length <= 8;

    const duplicateChecksOk =
      usernameCheckStatus === "available" &&
      userEmailCheckStatus === "available" &&
      nicknameCheckStatus === "available";

    return (
      hasRequiredFields &&
      usernamePassed &&
      passwordPassed &&
      passwordConfirmPassed &&
      emailPassed &&
      nicknamePassed &&
      duplicateChecksOk &&
      !isSubmitting &&
      !isNicknameLoading
    );
  }, [
    values,
    isSubmitting,
    isNicknameLoading,
    usernameCheckStatus,
    userEmailCheckStatus,
    nicknameCheckStatus,
  ]);

  const onSubmit = useCallback(async () => {
    const nextErrors = validateSignupForm(values);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      setSubmitMessage("입력값을 다시 확인해주세요.");
      setSubmitSuccess(false);
      return;
    }

    if (
      usernameCheckStatus !== "available" ||
      userEmailCheckStatus !== "available" ||
      nicknameCheckStatus !== "available"
    ) {
      setSubmitMessage("중복 확인 후 다시 시도해 주세요.");
      setSubmitSuccess(false);
      return;
    }

    setIsSubmitting(true);
    setSubmitMessage(null);
    setSubmitSuccess(null);

    try {
      const payload = toSignupRequest(values);
      const response = await signup(payload);

      trackSignUpComplete("email");

      setSubmitMessage(response.message ?? "회원가입이 완료되었습니다.");
      setSubmitSuccess(true);
      router.push("/login");
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
  }, [router, values, usernameCheckStatus, userEmailCheckStatus, nicknameCheckStatus]);

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
    usernameCheckStatus,
    usernameCheckMessage,
    userEmailCheckStatus,
    userEmailCheckMessage,
    nicknameCheckStatus,
    nicknameCheckMessage,
    isNicknameDirty,

    schoolKeyword,
    schoolResults,
    isSchoolSearching,
    isSchoolDropdownOpen,
    hasSelectedSchool,
    ignoreNextSchoolFocus,
    selectSchool,
    setIsSchoolDropdownOpen,
    setIgnoreNextSchoolFocus,
  };
}
