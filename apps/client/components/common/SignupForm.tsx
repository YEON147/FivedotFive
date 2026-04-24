"use client";

import { useEffect, useState } from "react";
import { SelectField } from "@/components/ui/SelectField";
import { TextField } from "@/components/ui/TextField";
import { GENDER_OPTIONS, GRADE_OPTIONS } from "@/lib/constants/signup";
import type {
  CheckStatus,
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
  usernameCheckStatus: CheckStatus;
  usernameCheckMessage: string | null;
  userEmailCheckStatus: CheckStatus;
  userEmailCheckMessage: string | null;
  nicknameCheckStatus: CheckStatus;
  nicknameCheckMessage: string | null;
  onChange: (name: keyof SignupFormValues, value: string) => void;
  onRefetchNickname: () => Promise<void>;
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
  usernameCheckStatus,
  usernameCheckMessage,
  userEmailCheckStatus,
  userEmailCheckMessage,
  nicknameCheckStatus,
  nicknameCheckMessage,
  onChange,
  onRefetchNickname,
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
      className="flex w-full flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        void onSubmit();
      }}
    >
      <div className="flex flex-col gap-3.5">
        <StepSection>
          <div className="flex flex-col gap-0.5">
            <TextField
              id="username"
              label="아이디"
              requiredMark
              maxLength={12}
              placeholder="2~12자 입력 후 잠시 기다려주세요"
              value={values.username}
              error={errors.username}
              hint="2~12자입니다. 입력을 마치면 아이디 중복 여부를 확인합니다."
              hintDisplay="tooltip"
              scrollIntoViewOnFocus
              onChange={(event) => onChange("username", event.target.value)}
            />

            {usernameCheckMessage ? (
              <p className={`text-xs ${usernameStatusClass}`}>{usernameCheckMessage}</p>
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
              hint="영문과 숫자를 모두 포함한 8~12자입니다."
              hintDisplay="tooltip"
              scrollIntoViewOnFocus
              onChange={(event) => onChange("password", event.target.value)}
            />
          </StepSection>
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
              hint="위에서 입력한 비밀번호와 동일하게 입력해 주세요."
              hintDisplay="tooltip"
              scrollIntoViewOnFocus
              onChange={(event) =>
                onChange("passwordConfirm", event.target.value)
              }
            />
          </StepSection>
        ) : null}

        {showEmail ? (
          <StepSection>
            <div className="flex flex-col gap-0.5">
              <TextField
                id="email"
                type="email"
                label="이메일"
                requiredMark
                placeholder="example@email.com"
                value={values.email}
                error={errors.email}
                hint="비밀번호 찾기에 사용됩니다."
                hintDisplay="tooltip"
                scrollIntoViewOnFocus
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
                placeholder={
                  isNicknameLoading
                    ? "추천 닉네임 불러오는 중…"
                    : "추천 닉네임 · 마음에 안 들면 랜덤 또는 수정"
                }
                value={values.nickname}
                error={errors.nickname}
                disabled={isNicknameLoading}
                hint="서비스에 표시되는 이름입니다. 입력 후 자동으로 중복 여부를 확인합니다."
                hintDisplay="tooltip"
                scrollIntoViewOnFocus
                onChange={(event) => onChange("nickname", event.target.value)}
              />

              <div className="flex min-w-0 flex-wrap items-center justify-between gap-x-3 gap-y-2">
                {nicknameCheckMessage ? (
                  <p className={`min-w-0 flex-[1_1_0%] text-xs ${nicknameStatusClass}`}>
                    {nicknameCheckMessage}
                  </p>
                ) : (
                  <p className="min-w-0 flex-[1_1_0%] text-xs text-slate-500">
                    입력 후 자동으로 중복 여부를 확인합니다.
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => void onRefetchNickname()}
                  disabled={isNicknameLoading}
                  className="shrink-0 whitespace-nowrap rounded-lg border border-[#7B61FF]/40 bg-white px-3 py-2 text-xs font-semibold text-[#7B61FF] shadow-sm transition hover:bg-violet-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isNicknameLoading ? "불러오는 중…" : "랜덤 닉네임"}
                </button>
              </div>
            </div>
          </StepSection>
        ) : null}

        {showOptionalSection ? (
          <StepSection>
            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-subtle)] p-3">
              <div className="mb-2">
                <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">추가 정보</h2>
                <p className="mt-0.5 text-xs text-[var(--color-text-secondary)]">
                  아래 항목은 선택 입력입니다.
                </p>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="md:col-span-2">
                  <TextField
                    id="school"
                    label="학교"
                    placeholder="학교명 (선택)"
                    value={values.schoolName}
                    hint="선택 사항입니다."
                    hintDisplay="tooltip"
                    scrollIntoViewOnFocus
                    onChange={(event) => onChange("schoolName", event.target.value)}
                  />
                </div>

                <SelectField
                  id="gender"
                  label="성별"
                  options={GENDER_OPTIONS}
                  value={values.gender}
                  scrollIntoViewOnFocus
                  onChange={(event) => onChange("gender", event.target.value)}
                />

                <SelectField
                  id="grade"
                  label="학년"
                  options={GRADE_OPTIONS}
                  value={values.grade}
                  scrollIntoViewOnFocus
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
            className="h-12 w-full rounded-xl bg-[#7B61FF] px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#6A52E0] active:bg-[#6A52E0] disabled:cursor-not-allowed disabled:bg-[var(--color-text-disabled)]"
          >
            {isSubmitting || isNicknameLoading
              ? "처리 중..."
              : "회원가입"}
          </button>
        </StepSection>
      ) : null}
    </form>
  );
}
