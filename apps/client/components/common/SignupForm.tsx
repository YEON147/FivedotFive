"use client";

import { useEffect, useMemo, useState } from "react";
import { GenderToggle } from "@/components/ui/GenderToggle";
import { SelectField } from "@/components/ui/SelectField";
import { TextField } from "@/components/ui/TextField";
import {
  COMPACT_FIELD_INPUT_CLASS,
  FIELD_SURFACE_FRAME,
  fieldSurfaceState,
} from "@/components/ui/fieldSurface";
import {
  buildSignupEmail,
  EMAIL_DOMAIN_OPTIONS,
  GRADE_BAND_OPTIONS,
  getGradeDetailOptions,
} from "@/lib/constants/signup";
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
  usernameCheckStatus: CheckStatus;
  usernameCheckMessage: string | null;
  userEmailCheckStatus: CheckStatus;
  userEmailCheckMessage: string | null;
  nicknameCheckStatus: CheckStatus;
  nicknameCheckMessage: string | null;
  schoolKeyword: string;
  schoolResults: SchoolOption[];
  isSchoolSearching: boolean;
  isSchoolDropdownOpen: boolean;
  hasSelectedSchool: boolean;
  ignoreNextSchoolFocus: boolean;
  onChange: (name: keyof SignupFormValues, value: string) => void;
  onRefetchNickname: () => Promise<void>;
  onSubmit: () => Promise<unknown>;
  onSelectSchool: (school: SchoolOption) => void;
  onSetSchoolDropdownOpen: (open: boolean) => void;
  onSetIgnoreNextSchoolFocus: (ignore: boolean) => void;
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
  schoolKeyword,
  schoolResults,
  isSchoolSearching,
  isSchoolDropdownOpen,
  hasSelectedSchool,
  ignoreNextSchoolFocus,
  onChange,
  onRefetchNickname,
  onSubmit,
  onSelectSchool,
  onSetSchoolDropdownOpen,
  onSetIgnoreNextSchoolFocus,
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

  const gradeDetailOptions = useMemo(
    () => getGradeDetailOptions(values.gradeBand),
    [values.gradeBand],
  );

  const [debouncedUsername, setDebouncedUsername] = useState(values.username);
  const [debouncedPassword, setDebouncedPassword] = useState(values.password);
  const [debouncedPasswordConfirm, setDebouncedPasswordConfirm] = useState(
    values.passwordConfirm,
  );

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

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedPasswordConfirm(values.passwordConfirm);
    }, 500);

    return () => clearTimeout(timer);
  }, [values.passwordConfirm]);

  const isUsernameReady =
    debouncedUsername.trim().length >= 2 &&
    debouncedUsername.trim().length <= 12;

  const isPasswordReady = PASSWORD_REGEX.test(debouncedPassword);

  const isPasswordConfirmReady =
    !!values.passwordConfirm.trim() &&
    values.password === values.passwordConfirm &&
    PASSWORD_REGEX.test(values.password);

  const signupEmailCombined = useMemo(
    () => buildSignupEmail(values.emailLocal, values.emailDomain).trim(),
    [values.emailLocal, values.emailDomain],
  );

  const isEmailReady = EMAIL_REGEX.test(signupEmailCombined);

  const isNicknameReady =
    values.nickname.trim().length >= 2 &&
    values.nickname.trim().length <= 8;

  const passwordStatusMessage = (() => {
    if (!debouncedPassword.trim() || isPasswordReady) return null;
    return {
      text: "영문과 숫자를 모두 포함한 8~12자로 입력해 주세요.",
      className: "text-slate-500",
    };
  })();

  const showPassword = isUsernameReady;
  const showPasswordConfirm = showPassword && isPasswordReady;
  const showEmail = showPasswordConfirm && isPasswordConfirmReady;
  const showNickname = showEmail && isEmailReady;
  const showOptionalSection = showNickname && isNicknameReady;
  const showSubmit = showNickname && isNicknameReady;

  const passwordConfirmStatusMessage = (() => {
    if (!showPasswordConfirm || !debouncedPasswordConfirm.trim()) return null;
    if (debouncedPassword !== debouncedPasswordConfirm) {
      return {
        text: "비밀번호가 일치하지 않습니다.",
        className: "text-slate-500",
      };
    }
    return null;
  })();

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
              placeholder="2~12자, 영문·한글"
              value={values.username}
              error={errors.username}
              hint="2~12자이며, 영문과 한글 입력이 모두 가능합니다."
              hintDisplay="label-inline"
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
            <div className="flex flex-col gap-0.5">
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
                hintDisplay="label-inline"
                scrollIntoViewOnFocus
                onChange={(event) => onChange("password", event.target.value)}
              />

              {passwordStatusMessage && !errors.password ? (
                <p className={`text-xs ${passwordStatusMessage.className}`}>
                  {passwordStatusMessage.text}
                </p>
              ) : null}
            </div>
          </StepSection>
        ) : null}

        {showPasswordConfirm ? (
          <StepSection>
            <div className="flex flex-col gap-0.5">
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
                hintDisplay="label-inline"
                scrollIntoViewOnFocus
                onChange={(event) =>
                  onChange("passwordConfirm", event.target.value)
                }
              />

              {passwordConfirmStatusMessage && !errors.passwordConfirm ? (
                <p
                  className={`text-xs ${passwordConfirmStatusMessage.className}`}
                >
                  {passwordConfirmStatusMessage.text}
                </p>
              ) : null}
            </div>
          </StepSection>
        ) : null}

        {showEmail ? (
          <StepSection>
            <fieldset className="min-w-0 scroll-mt-8 border-0 p-0">
              <legend className="mb-1 flex min-h-[22px] flex-wrap items-center gap-x-1 gap-y-0.5 text-sm font-semibold text-slate-800">
                이메일
                <span className="text-rose-500">*</span>
              </legend>
              <p className="mb-1.5 text-xs text-slate-500">
                아이디와 도메인을 선택하세요. 비밀번호 찾기에 사용됩니다.
              </p>
              <div className="flex min-w-0 flex-row items-stretch gap-2">
                <input
                  id="signup-email-local"
                  type="text"
                  inputMode="email"
                  autoComplete="username"
                  placeholder="아이디"
                  value={values.emailLocal}
                  aria-invalid={Boolean(errors.email)}
                  aria-describedby={
                    errors.email || userEmailCheckMessage
                      ? "signup-email-feedback"
                      : undefined
                  }
                  className={`h-11 min-w-0 flex-1 rounded-xl border px-3.5 text-sm outline-none transition focus:ring-2 ${FIELD_SURFACE_FRAME} ${fieldSurfaceState(
                    Boolean(errors.email),
                    values.emailLocal.trim().length > 0,
                  )}`}
                  onChange={(event) => {
                    const next = event.target.value.replace(/@/g, "");
                    onChange("emailLocal", next);
                  }}
                />
                <span
                  className="shrink-0 select-none self-center px-0.5 text-sm text-slate-500"
                  aria-hidden
                >
                  @
                </span>
                <div className="min-w-0 flex-1 sm:max-w-[13rem]">
                  <SelectField
                    id="signup-email-domain"
                    label=""
                    hideLabel
                    aria-label="이메일 도메인"
                    options={EMAIL_DOMAIN_OPTIONS}
                    value={values.emailDomain}
                    scrollIntoViewOnFocus
                    onChange={(event) =>
                      onChange("emailDomain", event.target.value)
                    }
                  />
                </div>
              </div>
              {errors.email || userEmailCheckMessage ? (
                <div id="signup-email-feedback" className="mt-1 space-y-1">
                  {errors.email ? (
                    <p className="text-xs text-rose-600">{errors.email}</p>
                  ) : null}
                  {!errors.email && userEmailCheckMessage ? (
                    <p className={`text-xs ${userEmailStatusClass}`}>
                      {userEmailCheckMessage}
                    </p>
                  ) : null}
                </div>
              ) : null}
            </fieldset>
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
                hint="서비스에 표시되는 이름입니다."
                hintDisplay="label-inline"
                scrollIntoViewOnFocus
                onChange={(event) => onChange("nickname", event.target.value)}
              />

              <div className="flex min-w-0 flex-wrap items-center justify-between gap-x-3 gap-y-1">
                {nicknameCheckMessage ? (
                  <p
                    className={`min-w-0 flex-[1_1_0%] text-xs ${nicknameStatusClass}`}
                  >
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
            <div className="rounded-xl border border-[var(--color-border)] bg-white/30 p-3">
              <div className="mb-1.5">
                <h2 className="text-xs font-semibold text-[var(--color-text-primary)]">
                  추가 정보
                </h2>
                <p className="mt-0 text-[11px] leading-snug text-[var(--color-text-secondary)]">
                  아래 항목은 선택 입력입니다.
                </p>
              </div>

              <div className="grid gap-2 md:grid-cols-2 [&_label]:gap-1 [&_label]:scroll-mt-6 [&_label>span]:min-h-0 [&_label>span]:text-xs">
                <div className="relative md:col-span-2">
                  <TextField
                    id="school"
                    label="학교"
                    placeholder="학교명 검색 (선택)"
                    value={schoolKeyword}
                    error={errors.schoolName}
                    hint="선택 항목 · 검색 후 목록에서 탭해야 등록됩니다 (검색 안 되는 학교는 선택 불가)"
                    hintDisplay="label-inline"
                    scrollIntoViewOnFocus
                    disabled={isSubmitting || isNicknameLoading}
                    className={COMPACT_FIELD_INPUT_CLASS}
                    onFocus={() => {
                      if (ignoreNextSchoolFocus) {
                        onSetIgnoreNextSchoolFocus(false);
                        return;
                      }

                      if (!hasSelectedSchool && schoolResults.length > 0) {
                        onSetSchoolDropdownOpen(true);
                      }
                    }}
                    onChange={(event) => onChange("schoolName", event.target.value)}
                  />

                  {isSchoolDropdownOpen ? (
                    <div className="scrollbar-hidden absolute z-30 mt-1 max-h-44 w-full overflow-y-auto rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] shadow-lg">
                      {isSchoolSearching ? (
                        <div className="px-2.5 py-2 text-xs text-[var(--color-text-secondary)]">
                          검색 중…
                        </div>
                      ) : schoolResults.length > 0 ? (
                        schoolResults.map((school) => (
                          <button
                            key={`${school.schoolCode}-${school.officeCode}`}
                            type="button"
                            onMouseDown={(event) => {
                              event.preventDefault();
                              onSelectSchool(school);
                            }}
                            className="flex w-full flex-col items-start gap-0.5 border-b border-[var(--color-border)] px-2.5 py-2 text-left last:border-b-0 hover:bg-[var(--color-bg-subtle)]"
                          >
                            <span className="text-[13px] font-semibold text-[var(--color-text-primary)]">
                              {school.schoolName}
                            </span>
                            {school.address ? (
                              <span className="text-[11px] text-[var(--color-text-secondary)]">
                                {school.address}
                              </span>
                            ) : null}
                          </button>
                        ))
                      ) : (
                        <div className="px-2.5 py-2 text-xs text-[var(--color-text-secondary)]">
                          결과 없음
                        </div>
                      )}
                    </div>
                  ) : null}
                </div>

                <GenderToggle
                  id="signup-gender"
                  label="성별"
                  value={values.gender}
                  error={errors.gender}
                  scrollIntoViewOnFocus
                  className="w-full min-w-0 md:col-span-2"
                  onChange={(next) => onChange("gender", next)}
                />

                <div className="flex min-w-0 flex-col gap-1 md:col-span-2">
                  <span className="flex min-h-[22px] flex-wrap items-center gap-x-1 gap-y-0.5 text-xs font-semibold text-slate-800">
                    학년, 연령대
                  </span>
                  <div className="flex min-w-0 flex-row items-start gap-1">
                    <SelectField
                      id="grade-band"
                      label=""
                      hideLabel
                      aria-label="초·중·고·어른이 구분"
                      options={GRADE_BAND_OPTIONS}
                      value={values.gradeBand}
                      variant="compact"
                      scrollIntoViewOnFocus
                      className="min-w-0 flex-1"
                      onChange={(event) =>
                        onChange("gradeBand", event.target.value)
                      }
                    />
                    <SelectField
                      id="grade"
                      label=""
                      hideLabel
                      aria-label="학년 또는 연령대"
                      options={gradeDetailOptions}
                      value={values.grade}
                      error={errors.grade}
                      disabled={!values.gradeBand}
                      variant="compact"
                      scrollIntoViewOnFocus
                      className="min-w-0 flex-1"
                      onChange={(event) =>
                        onChange("grade", event.target.value)
                      }
                    />
                  </div>
                </div>
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
