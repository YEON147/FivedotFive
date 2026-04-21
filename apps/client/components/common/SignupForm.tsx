"use client";

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

  const nicknameStatusClass =
    nicknameCheckStatus === "available"
      ? "text-emerald-600"
      : nicknameCheckStatus === "unavailable"
      ? "text-rose-600"
      : "text-slate-500";

  return (
    <form
      className="flex w-full flex-col gap-6"
      onSubmit={(event) => {
        event.preventDefault();
        void onSubmit();
      }}
    >
      <div className="grid gap-5 md:grid-cols-2">
        <div className="flex flex-col gap-1">
          <TextField
            id="username"
            label="아이디"
            requiredMark
            maxLength={12}
            placeholder="최대 12자"
            value={values.username}
            error={errors.username}
            hint="로그인 아이디로 사용됩니다."
            onChange={(event) => onChange("username", event.target.value)}
          />

          {usernameCheckMessage ? (
            <p className={`text-xs ${usernameStatusClass}`}>
              {usernameCheckMessage}
            </p>
          ) : null}
        </div>

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

        <TextField
          id="password"
          type="password"
          label="비밀번호"
          requiredMark
          minLength={8}
          maxLength={12}
          placeholder="8~12자 영문+숫자"
          value={values.password}
          error={errors.password}
          hint="영문과 숫자를 모두 포함해야 합니다."
          onChange={(event) => onChange("password", event.target.value)}
        />

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
          onChange={(event) => onChange("passwordConfirm", event.target.value)}
        />

        <div className="flex flex-col gap-2">
          <TextField
            id="nickname"
            label="닉네임"
            requiredMark
            maxLength={8}
            placeholder={isNicknameLoading ? "랜덤 닉네임 불러오는 중" : "최대 8자"}
            value={values.nickname}
            error={errors.nickname}
            hint="수정하지 않으면 자동 발급된 닉네임이 그대로 사용됩니다."
            disabled={isNicknameLoading}
            onChange={(event) => onChange("nickname", event.target.value)}
          />

          <div className="flex items-center justify-between gap-3">
            {isNicknameDirty && nicknameCheckMessage ? (
              <p className={`text-xs ${nicknameStatusClass}`}>
                {nicknameCheckMessage}
              </p>
            ) : (
              <p className="text-xs text-slate-500">
                자동 생성 닉네임을 사용할 수도 있습니다.
              </p>
            )}

            <button
              type="button"
              onClick={() => void onRefetchNickname()}
              disabled={isNicknameLoading || isSubmitting}
              className="shrink-0 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isNicknameLoading ? "생성 중..." : "다시 생성하기"}
            </button>
          </div>
        </div>

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
            onChange={(event) => onSchoolKeywordChange(event.target.value)}
            hint="학교 검색 결과에서 선택해주세요."
          />

          {isSchoolDropdownOpen ? (
            <div className="absolute z-20 mt-2 max-h-64 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg">
              {isSchoolSearching ? (
                <div className="px-4 py-3 text-sm text-slate-500">검색 중...</div>
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

      <button
        type="submit"
        disabled={!canSubmit}
        className="h-12 rounded-xl bg-slate-900 px-5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
      >
        {isSubmitting ? "회원가입 처리 중..." : "회원가입"}
      </button>
    </form>
  );
}