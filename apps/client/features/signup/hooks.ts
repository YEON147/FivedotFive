"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  checkNickname,
  checkUserEmail,
  checkUsername,
  getRandomNickname,
  signup,
} from "@/features/signup/api";
import type {
  CheckStatus,
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
  const school = values.schoolName.trim();
  const schoolcode = values.schoolCode.trim();

  return {
    username: values.username.trim(),
    password: values.password,
    nickname: values.nickname.trim(),
    email: values.email.trim(),
    school: school === "" ? null : school,
    schoolcode: schoolcode === "" ? null : schoolcode,
    gender: values.gender === "" ? null : values.gender,
    grade: values.grade === "" ? null : values.grade,
  };
}

export function useSignupForm() {
  const router = useRouter();
  const [values, setValues] = useState<SignupFormValues>(INITIAL_VALUES);
  const [errors, setErrors] = useState<SignupFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isNicknameLoading, setIsNicknameLoading] = useState(false);
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
      setUserEmailCheckMessage("올바른 이메일 형식을 입력해주세요.");
      return;
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

  const onChange = useCallback(
    (name: keyof SignupFormValues, value: string) => {
      setValues((prev) => ({
        ...prev,
        [name]: value,
      }));

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
      setSubmitMessage("아이디·이메일·닉네임 중복 확인을 완료해주세요.");
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
  };
}
