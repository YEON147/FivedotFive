"use client";

import { SelectField } from "@/components/ui/SelectField";
import { TextField } from "@/components/ui/TextField";
import { GENDER_OPTIONS, GRADE_OPTIONS } from "@/lib/constants/signup";
import type {
  MyPageFormValues,
  PasswordFormValues,
  NicknameCheckStatus,
} from "@/features/user/types";
import type { SchoolOption } from "@/features/signup/types";

type MyPageFormProps = {
  values: MyPageFormValues;
  errors: Partial<Record<"nickname" | "schoolName" | "gender" | "grade", string>>;
  isLoaded: boolean;
  saveMessage: string | null;
  saveSuccess: boolean | null;
  isSaving: boolean;
  schoolKeyword: string;
  schoolResults: SchoolOption[];
  isSchoolSearching: boolean;
  isSchoolDropdownOpen: boolean;
  hasSelectedSchool: boolean;
  ignoreNextSchoolFocus: boolean;
  isDirty: boolean;
  canSubmit: boolean;

  nicknameCheckStatus: NicknameCheckStatus;
  nicknameCheckMessage: string | null;

  onChange: (
    field: "nickname" | "schoolName" | "gender" | "grade",
    value: string
  ) => void;
  onCheckNickname: () => Promise<void> | void;
  onSelectSchool: (school: SchoolOption) => void;
  onSetSchoolDropdownOpen: (open: boolean) => void;
  onSetIgnoreNextSchoolFocus: (ignore: boolean) => void;
  onSubmit: () => Promise<void>;
  onReset: () => void;

  isPasswordModalOpen: boolean;
  passwordValues: PasswordFormValues;
  passwordErrors: Partial<Record<"currentPassword" | "newPassword", string>>;
  passwordMessage: string | null;
  passwordSuccess: boolean | null;
  isPasswordSaving: boolean;
  onOpenPasswordModal: () => void;
  onClosePasswordModal: () => void;
  onChangePasswordField: (
    field: keyof PasswordFormValues,
    value: string
  ) => void;
  onSubmitPasswordChange: () => Promise<void>;
};

export function MyPageForm({
  values,
  errors,
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
  nicknameCheckStatus,
  nicknameCheckMessage,
  onChange,
  onCheckNickname,
  onSelectSchool,
  onSetSchoolDropdownOpen,
  onSetIgnoreNextSchoolFocus,
  onSubmit,
  onReset,
  isPasswordModalOpen,
  passwordValues,
  passwordErrors,
  passwordMessage,
  passwordSuccess,
  isPasswordSaving,
  onOpenPasswordModal,
  onClosePasswordModal,
  onChangePasswordField,
  onSubmitPasswordChange,
}: MyPageFormProps) {
  const displayName = values.username?.trim() || "회원";

  return (
    <>
      <div className="flex w-full flex-col gap-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            {displayName}님 안녕하세요
          </h2>
        </div>

        <div className="flex flex-col gap-5">
          <TextField
            id="mypage-email"
            type="email"
            label="이메일"
            value={values.email}
            disabled
            readOnly
            className="cursor-not-allowed bg-slate-100 text-slate-500"
            hint="이메일은 수정할 수 없습니다."
          />

          <div className="flex flex-col gap-2">
            <label
              htmlFor="mypage-nickname"
              className="text-sm font-semibold text-slate-900"
            >
              닉네임
            </label>

            <div className="flex items-stretch gap-3">
              <input
                id="mypage-nickname"
                type="text"
                value={values.nickname}
                disabled={!isLoaded || isSaving}
                onChange={(event) => onChange("nickname", event.target.value)}
                className={`h-14 flex-1 rounded-2xl border bg-white px-4 text-base outline-none transition ${
                  errors.nickname
                    ? "border-rose-300 focus:border-rose-400"
                    : "border-slate-200 focus:border-slate-400"
                } ${
                  !isLoaded || isSaving
                    ? "cursor-not-allowed bg-slate-50 text-slate-400"
                    : ""
                }`}
                maxLength={8}
                placeholder="닉네임을 입력해주세요"
              />

              <button
                type="button"
                onClick={() => void onCheckNickname()}
                disabled={!isLoaded || isSaving || nicknameCheckStatus === "checking"}
                className="h-14 shrink-0 rounded-2xl border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {nicknameCheckStatus === "checking" ? "확인 중..." : "중복확인"}
              </button>
            </div>

            {errors.nickname ? (
              <p className="text-sm text-rose-600">{errors.nickname}</p>
            ) : (
              <p className="text-sm text-slate-500">{values.nickname.length}/8</p>
            )}

            {nicknameCheckMessage ? (
              <p
                className={`text-sm ${
                  nicknameCheckStatus === "success"
                    ? "text-emerald-600"
                    : "text-rose-600"
                }`}
              >
                {nicknameCheckMessage}
              </p>
            ) : null}
          </div>

          <div className="relative">
            <TextField
              id="mypage-school"
              label="학교"
              placeholder="학교명을 검색해주세요"
              value={schoolKeyword}
              error={errors.schoolName}
              disabled={!isLoaded || isSaving}
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
              <div className="absolute z-20 mt-2 max-h-64 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg">
                {isSchoolSearching ? (
                  <div className="px-4 py-3 text-sm text-slate-500">검색 중...</div>
                ) : schoolResults.length > 0 ? (
                  schoolResults.map((school) => (
                    <button
                      key={`${school.schoolCode}-${school.officeCode}`}
                      type="button"
                      onClick={() => onSelectSchool(school)}
                      className="flex w-full flex-col items-start gap-1 border-b border-slate-100 px-4 py-3 text-left last:border-b-0 hover:bg-slate-50"
                    >
                      <span className="text-sm font-semibold text-slate-800">
                        {school.schoolName}
                      </span>
                      {school.address ? (
                        <span className="text-xs text-slate-500">
                          {school.address}
                        </span>
                      ) : null}
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
            id="mypage-gender"
            label="성별"
            value={values.gender}
            options={GENDER_OPTIONS}
            error={errors.gender}
            disabled={!isLoaded || isSaving}
            onChange={(event) => onChange("gender", event.target.value)}
          />

          <SelectField
            id="mypage-grade"
            label="학년"
            value={values.grade}
            options={GRADE_OPTIONS}
            error={errors.grade}
            disabled={!isLoaded || isSaving}
            onChange={(event) => onChange("grade", event.target.value)}
          />
        </div>

        {saveMessage ? (
          <div
            className={`rounded-2xl border px-4 py-3 text-sm ${
              saveSuccess
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-rose-200 bg-rose-50 text-rose-700"
            }`}
          >
            {saveMessage}
          </div>
        ) : null}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={onOpenPasswordModal}
            className="h-11 rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            비밀번호 변경
          </button>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={onReset}
              disabled={!isDirty || isSaving}
              className="h-11 rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              변경 취소
            </button>

            <button
              type="button"
              onClick={() => void onSubmit()}
              disabled={!canSubmit}
              className="h-11 rounded-xl bg-slate-900 px-5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {isSaving ? "저장 중..." : "변경사항 저장"}
            </button>
          </div>
        </div>
      </div>

      {isPasswordModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">비밀번호 변경</h3>
                <p className="mt-1 text-sm text-slate-500">
                  현재 비밀번호와 새 비밀번호를 입력해주세요.
                </p>
              </div>

              <button
                type="button"
                onClick={onClosePasswordModal}
                disabled={isPasswordSaving}
                className="rounded-lg px-2 py-1 text-slate-500 hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <div className="mt-5 flex flex-col gap-4">
              <TextField
                id="mypage-current-password"
                type="password"
                label="현재 비밀번호"
                value={passwordValues.currentPassword}
                error={passwordErrors.currentPassword}
                disabled={isPasswordSaving}
                onChange={(event) =>
                  onChangePasswordField("currentPassword", event.target.value)
                }
              />

              <TextField
                id="mypage-new-password"
                type="password"
                label="새 비밀번호"
                value={passwordValues.newPassword}
                error={passwordErrors.newPassword}
                disabled={isPasswordSaving}
                onChange={(event) =>
                  onChangePasswordField("newPassword", event.target.value)
                }
                hint="영문과 숫자를 모두 포함해야 합니다."
              />
            </div>

            {passwordMessage ? (
              <div
                className={`mt-4 rounded-xl border px-4 py-3 text-sm ${
                  passwordSuccess
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-rose-200 bg-rose-50 text-rose-700"
                }`}
              >
                {passwordMessage}
              </div>
            ) : null}

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClosePasswordModal}
                disabled={isPasswordSaving}
                className="h-11 rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                취소
              </button>

              <button
                type="button"
                onClick={() => void onSubmitPasswordChange()}
                disabled={isPasswordSaving}
                className="h-11 rounded-xl bg-slate-900 px-5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {isPasswordSaving ? "변경 중..." : "비밀번호 변경"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}