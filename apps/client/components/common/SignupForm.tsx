"use client";

import { useEffect, useState } from "react";
import { SelectField } from "@/components/ui/SelectField";
import { TextField } from "@/components/ui/TextField";
import { GENDER_OPTIONS, GRADE_OPTIONS } from "@/lib/constants/signup";
import type {
  CheckStatus,
  SchoolOption,
  SignupFormErrors,
  SignupFormValues,
} from "@/features/signup/types";

type SignupFormProps = {
  values: SignupFormValues;
  errors: SignupFormErrors;
  isSubmitting: boolean;
  isNicknameLoading: boolean;
  canSubmit: boolean;
  submitMessage: string | null;
  submitSuccess: boolean | null;
  schoolKeyword: string;
  schoolResults?: SchoolOption[];
  isSchoolSearching: boolean;
  isSchoolDropdownOpen: boolean;
  hasSelectedSchool: boolean;
  ignoreNextSchoolFocus: boolean;
  usernameCheckStatus: CheckStatus;
  usernameCheckMessage: string | null;
  userEmailCheckStatus: CheckStatus;
  userEmailCheckMessage: string | null;
  nicknameCheckStatus: CheckStatus;
  nicknameCheckMessage: string | null;
  isNicknameDirty: boolean;
  onChange: (name: keyof SignupFormValues, value: string) => void;
  onSchoolKeywordChange: (value: string) => void;
  onSelectSchool: (school: SchoolOption) => void;
  onRefetchNickname: () => Promise<void>;
  setIsSchoolDropdownOpen: (open: boolean) => void;
  setIgnoreNextSchoolFocus: (value: boolean) => void;
  onSubmit: () => Promise<unknown>;
};

const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,12}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function StepSection({ children }: { children: React.ReactNode }) {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-1 duration-200">
      {children}
    </div>
  );
}

export function SignupForm({
  values,
  errors,
  isSubmitting,
  isNicknameLoading,
  canSubmit,
  submitMessage,
  submitSuccess,
  schoolKeyword,
  schoolResults = [],
  isSchoolSearching,
  isSchoolDropdownOpen,
  hasSelectedSchool,
  ignoreNextSchoolFocus,
  usernameCheckStatus,
  usernameCheckMessage,
  userEmailCheckStatus,
  userEmailCheckMessage,
  nicknameCheckStatus,
  nicknameCheckMessage,
  isNicknameDirty,
  onChange,
  onSchoolKeywordChange,
  onSelectSchool,
  onRefetchNickname,
  setIsSchoolDropdownOpen,
  setIgnoreNextSchoolFocus,
  onSubmit,
}: SignupFormProps) {
  const usernameStatusClass =
    usernameCheckStatus === "available"
      ? "text-emerald-600"
      : usernameCheckStatus === "unavailable"
      ? "text-rose-600"
      : "text-slate-500";

  const userEmailStatusClass =
    userEmailCheckStatus === "available"
      ? "text-emerald-600"
      : userEmailCheckStatus === "unavailable"
      ? "text-rose-600"
      : "text-slate-500";

  const nicknameStatusClass =
    nicknameCheckStatus === "available"
      ? "text-emerald-600"
      : nicknameCheckStatus === "unavailable"
      ? "text-rose-600"
      : "text-slate-500";

  const [debouncedUsername, setDebouncedUsername] = useState(values.username);
  const [debouncedPassword, setDebouncedPassword] = useState(values.password);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedUsername(values.username);
    }, 500);

    return () => clearTimeout(timer);
  }, [values.username]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedPassword(values.password);
    }, 500);

    return () => clearTimeout(timer);
  }, [values.password]);

  const isUsernameReady =
    debouncedUsername.trim().length >= 2 &&
    debouncedUsername.trim().length <= 12;

  const isPasswordReady = PASSWORD_REGEX.test(debouncedPassword);

  const isPasswordConfirmReady =
    !!values.passwordConfirm.trim() &&
    values.password === values.passwordConfirm &&
    PASSWORD_REGEX.test(values.password);

  const isEmailReady = EMAIL_REGEX.test(values.email.trim());

  const isNicknameReady =
    values.nickname.trim().length >= 2 &&
    values.nickname.trim().length <= 8;

  const showPassword = isUsernameReady;
  const showPasswordConfirm = showPassword && isPasswordReady;
  const showEmail = showPasswordConfirm && isPasswordConfirmReady;
  const showNickname = showEmail && isEmailReady;
  const showOptionalSection = showNickname && isNicknameReady;
  const showSubmit = showNickname && isNicknameReady;

  return (
    <form
      className="flex w-full flex-col gap-6"
      onSubmit={(event) => {
        event.preventDefault();
        void onSubmit();
      }}
    >
      <div className="flex flex-col gap-5">
        <StepSection>
          <div className="flex flex-col gap-1">
            <TextField
              id="username"
              label="아이디"
              requiredMark
              maxLength={12}
              placeholder="2~12자 입력 후 잠시 기다려주세요"
              value={values.username}
              error={errors.username}
              onChange={(event) => onChange("username", event.target.value)}
            />

            {usernameCheckMessage ? (
              <p className={`text-xs ${usernameStatusClass}`}>
                {usernameCheckMessage}
              </p>
            ) : values.username.trim().length > 0 &&
              values.username.trim().length < 2 ? (
              <p className="text-xs text-slate-500">
                아이디를 2자 이상 입력해주세요.
              </p>
            ) : null}
          </div>
        </StepSection>

        {showPassword ? (
          <StepSection>
            <TextField
              id="password"
              type="password"
              label="비밀번호"
              requiredMark
              minLength={8}
              maxLength={12}
              placeholder="8~12자 영문+숫자 입력 후 잠시 기다려주세요"
              value={values.password}
              error={errors.password}
              hint="영문과 숫자를 모두 포함해야 합니다."
              onChange={(event) => onChange("password", event.target.value)}
            />
          </StepSection>
        ) : null}

        {showPassword && values.password.trim().length > 0 && !isPasswordReady ? (
          <p className="text-xs text-slate-500">
            비밀번호는 8~12자이며 영문과 숫자를 모두 포함해야 합니다.
          </p>
        ) : null}

        {showPasswordConfirm ? (
          <StepSection>
            <TextField
              id="passwordConfirm"
              type="password"
              label="비밀번호 확인"
              requiredMark
              minLength={8}
              maxLength={12}
              placeholder="비밀번호를 다시 입력해주세요"
              value={values.passwordConfirm}
              error={errors.passwordConfirm}
              hint="입력한 비밀번호와 동일하게 입력해주세요."
              onChange={(event) =>
                onChange("passwordConfirm", event.target.value)
              }
            />
          </StepSection>
        ) : null}

        {showPasswordConfirm &&
        values.passwordConfirm.trim().length > 0 &&
        !isPasswordConfirmReady ? (
          <p className="text-xs text-slate-500">
            비밀번호 확인이 일치해야 다음 단계로 진행할 수 있습니다.
          </p>
        ) : null}

        {showEmail ? (
          <StepSection>
            <div className="flex flex-col gap-1">
              <TextField
                id="email"
                type="email"
                label="이메일"
                requiredMark
                placeholder="example@email.com"
                value={values.email}
                error={errors.email}
                hint="비밀번호 찾기에 사용됩니다."
                onChange={(event) => onChange("email", event.target.value)}
              />

              {userEmailCheckMessage ? (
                <p className={`text-xs ${userEmailStatusClass}`}>
                  {userEmailCheckMessage}
                </p>
              ) : null}
            </div>
          </StepSection>
        ) : null}

        {showNickname ? (
          <StepSection>
            <div className="flex flex-col gap-2">
              <TextField
                id="nickname"
                label="닉네임"
                requiredMark
                maxLength={8}
                placeholder="2~8자 닉네임을 입력해주세요"
                value={values.nickname}
                error={errors.nickname}
                hint="현재는 백엔드 미연결 상태라 직접 입력 기준으로 진행합니다."
                disabled={false}
                onChange={(event) => onChange("nickname", event.target.value)}
              />

              <div className="flex items-center justify-between gap-3">
                {isNicknameDirty && nicknameCheckMessage ? (
                  <p className={`text-xs ${nicknameStatusClass}`}>
                    {nicknameCheckMessage}
                  </p>
                ) : (
                  <p className="text-xs text-slate-500">
                    현재는 자동 생성 없이 직접 입력으로 진행합니다.
                  </p>
                )}

                <button
                  type="button"
                  onClick={() => void onRefetchNickname()}
                  disabled
                  className="shrink-0 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-400 opacity-60"
                >
                  랜덤 닉네임 준비중
                </button>
              </div>
            </div>
          </StepSection>
        ) : null}

        {showOptionalSection ? (
          <StepSection>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="mb-4">
                <h2 className="text-sm font-semibold text-slate-900">
                  추가 정보
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  아래 항목은 선택 입력입니다.
                </p>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div className="relative md:col-span-2">
                  <TextField
                    id="school"
                    label="학교"
                    placeholder="학교명을 검색해주세요"
                    value={schoolKeyword}
                    onFocus={() => {
                      if (ignoreNextSchoolFocus) {
                        setIgnoreNextSchoolFocus(false);
                        return;
                      }

                      if (!hasSelectedSchool && schoolResults.length > 0) {
                        setIsSchoolDropdownOpen(true);
                      }
                    }}
                    onChange={(event) =>
                      onSchoolKeywordChange(event.target.value)
                    }
                    hint="학교 검색 결과에서 선택해주세요."
                  />

                  {isSchoolDropdownOpen ? (
                    <div className="absolute z-20 mt-2 max-h-64 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg">
                      {isSchoolSearching ? (
                        <div className="px-4 py-3 text-sm text-slate-500">
                          검색 중...
                        </div>
                      ) : schoolResults.length > 0 ? (
                        schoolResults.map((school) => (
                          <button
                            key={`${school.officeCode}-${school.schoolCode}`}
                            type="button"
                            className="flex w-full flex-col px-4 py-3 text-left hover:bg-slate-50"
                            onMouseDown={(event) => {
                              event.preventDefault();
                              onSelectSchool(school);
                            }}
                          >
                            <span className="text-sm font-semibold text-slate-900">
                              {school.schoolName}
                            </span>
                            <span className="text-xs text-slate-500">
                              {school.address || "주소 정보 없음"}
                            </span>
                          </button>
                        ))
                      ) : (
                        <div className="px-4 py-3 text-sm text-slate-500">
                          검색 결과가 없습니다.
                        </div>
                      )}
                    </div>
                  ) : null}
                </div>

                <SelectField
                  id="gender"
                  label="성별"
                  options={GENDER_OPTIONS}
                  value={values.gender}
                  onChange={(event) => onChange("gender", event.target.value)}
                />

                <SelectField
                  id="grade"
                  label="학년"
                  options={GRADE_OPTIONS}
                  value={values.grade}
                  onChange={(event) => onChange("grade", event.target.value)}
                />
              </div>
            </div>
          </StepSection>
        ) : null}
      </div>

      {submitMessage ? (
        <div
          className={`rounded-xl px-4 py-3 text-sm ${
            submitSuccess
              ? "bg-emerald-50 text-emerald-700"
              : "bg-rose-50 text-rose-700"
          }`}
        >
          {submitMessage}
        </div>
      ) : null}

      {showSubmit ? (
        <StepSection>
          <button
            type="submit"
            disabled={!canSubmit}
            className="h-12 w-full rounded-xl bg-slate-900 px-5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {isSubmitting ? "회원가입 처리 중..." : "회원가입"}
          </button>
        </StepSection>
      ) : null}
    </form>
  );
}