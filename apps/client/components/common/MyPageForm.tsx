"use client";

import { X } from "@phosphor-icons/react";
import { SelectField } from "@/components/ui/SelectField";
import { TextField } from "@/components/ui/TextField";
import { GENDER_OPTIONS, GRADE_OPTIONS } from "@/lib/constants/signup";
import type {
  MyPageFormValues,
  PasswordFormErrors,
  PasswordFormValues,
  NicknameCheckStatus,
} from "@/features/user/types";
import type { SchoolOption } from "@/features/signup/types";

type MyPageFormProps = {
  values: MyPageFormValues;
  errors: Partial<Record<"nickname" | "schoolName" | "gender" | "grade", string>>;
  isLoading: boolean;
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
  passwordErrors: PasswordFormErrors;
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
  isLoading,
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
  const greetName =
    values.nickname?.trim() ||
    values.username?.trim() ||
    "회원";

  if (isLoading && !isLoaded) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center px-2 py-10">
        <p className="text-body-sm text-[var(--color-text-secondary)]">
          불러오는 중…
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="flex w-full flex-col gap-2.5">
        <div className="w-full text-center" aria-label="환영 인사">
          <p className="text-[clamp(15px,4.2vw,19px)] font-extrabold leading-tight text-slate-900">
            <span className="text-[#7B61FF]">{greetName}</span>
            님, 안녕하세요!
          </p>
          <p className="text-wish-body mt-1.5 text-center text-[12px] font-medium leading-snug text-slate-600">
            위시리스트가 꼭 이루어질 거예요.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <TextField
            id="mypage-username"
            label="아이디"
            value={values.username}
            disabled
            readOnly
            className="h-10 cursor-not-allowed bg-slate-100 text-sm text-slate-500"
            hint="변경할 수 없습니다."
            hintDisplay="label-inline"
          />

          <TextField
            id="mypage-email"
            type="email"
            label="이메일"
            value={values.email}
            disabled
            readOnly
            className="h-10 cursor-not-allowed bg-slate-100 text-sm text-slate-500"
            hint="변경할 수 없습니다."
            hintDisplay="label-inline"
          />

          <div className="flex flex-col gap-1 scroll-mt-8">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-slate-800">닉네임</span>
              <span className="tabular-nums text-[11px] text-[var(--color-text-secondary)]">
                {values.nickname.length}/8
              </span>
            </div>

            <div className="flex min-w-0 items-stretch gap-1.5 sm:gap-2">
              <input
                id="mypage-nickname"
                type="text"
                value={values.nickname}
                disabled={!isLoaded || isSaving}
                onChange={(event) => onChange("nickname", event.target.value)}
                className={`h-10 min-w-0 flex-1 rounded-xl border bg-white px-3 text-sm outline-none transition focus:ring-2 ${
                  errors.nickname
                    ? "border-rose-300 focus:ring-rose-200"
                    : "border-slate-200 focus:ring-[#7B61FF]/25"
                } ${
                  !isLoaded || isSaving
                    ? "cursor-not-allowed bg-slate-50 text-slate-400"
                    : ""
                }`}
                maxLength={8}
                placeholder="2~8자 · 저장 전 중복확인"
                autoComplete="nickname"
              />

              <button
                type="button"
                onClick={() => void onCheckNickname()}
                disabled={!isLoaded || isSaving || nicknameCheckStatus === "checking"}
                className="h-10 shrink-0 whitespace-nowrap rounded-xl border border-slate-300 bg-white px-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 sm:px-4 sm:text-sm disabled:cursor-not-allowed disabled:opacity-60"
              >
                {nicknameCheckStatus === "checking" ? "확인 중…" : "중복확인"}
              </button>
            </div>

            {errors.nickname ? (
              <p className="text-xs text-rose-600">{errors.nickname}</p>
            ) : null}

            {nicknameCheckMessage ? (
              <p
                className={`text-xs ${
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
              placeholder="학교명 검색 (선택)"
              value={schoolKeyword}
              error={errors.schoolName}
              disabled={!isLoaded || isSaving}
              hint="선택 항목 · 검색 후 목록에서 선택"
              hintDisplay="label-inline"
              className="!h-10 text-[13px]"
              scrollIntoViewOnFocus
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

          <SelectField
            id="mypage-gender"
            label="성별"
            value={values.gender}
            options={GENDER_OPTIONS}
            error={errors.gender}
            disabled={!isLoaded || isSaving}
            scrollIntoViewOnFocus
            className="!h-10 bg-[length:0.875rem_0.875rem] pl-3 pr-9 text-[13px]"
            onChange={(event) => onChange("gender", event.target.value)}
          />

          <SelectField
            id="mypage-grade"
            label="학년"
            value={values.grade}
            options={GRADE_OPTIONS}
            error={errors.grade}
            disabled={!isLoaded || isSaving}
            scrollIntoViewOnFocus
            className="!h-10 bg-[length:0.875rem_0.875rem] pl-3 pr-9 text-[13px]"
            onChange={(event) => onChange("grade", event.target.value)}
          />
        </div>

        {saveMessage ? (
          <div
            className={`rounded-lg px-2.5 py-2 text-[13px] ${
              saveSuccess
                ? "bg-emerald-50 text-emerald-700"
                : "bg-rose-50 text-rose-700"
            }`}
          >
            {saveMessage}
          </div>
        ) : null}

        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={onOpenPasswordModal}
            className="h-9 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-[13px] font-semibold text-[var(--color-text-primary)] shadow-sm transition hover:bg-[var(--color-bg-subtle)]"
          >
            비밀번호 변경
          </button>

          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={onReset}
              disabled={!isDirty || isSaving}
              className="h-9 flex-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 text-[13px] font-semibold text-[var(--color-text-primary)] transition hover:bg-[var(--color-bg-subtle)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              취소
            </button>

            <button
              type="button"
              onClick={() => void onSubmit()}
              disabled={!canSubmit}
              className="h-9 flex-[1.2] rounded-lg bg-[#7B61FF] px-2.5 text-[13px] font-semibold text-white shadow-sm transition hover:bg-[#6A52E0] disabled:cursor-not-allowed disabled:bg-[var(--color-text-disabled)]"
            >
              {isSaving ? "저장 중…" : "저장"}
            </button>
          </div>
        </div>
      </div>

      {isPasswordModalOpen ? (
        <div className="fixed inset-0 z-[200] flex items-end justify-center bg-black/40 px-3 pb-[env(safe-area-inset-bottom,0px)] pt-10 sm:items-center sm:p-4">
          <div
            className="w-full max-w-[372px] rounded-t-[18px] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[0_8px_40px_rgba(0,0,0,0.12)] sm:rounded-[18px]"
            role="dialog"
            aria-modal="true"
            aria-labelledby="mypage-password-title"
          >
            <div className="flex items-start justify-between gap-2">
              <h3
                id="mypage-password-title"
                className="text-lg font-extrabold leading-snug text-[var(--color-text-primary)]"
              >
                비밀번호 변경
              </h3>

              <button
                type="button"
                onClick={onClosePasswordModal}
                disabled={isPasswordSaving}
                className="inline-flex size-8 shrink-0 items-center justify-center rounded-full text-slate-800 transition hover:opacity-70 active:opacity-50 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="비밀번호 변경 창 닫기"
              >
                <X size={18} weight="bold" aria-hidden />
              </button>
            </div>

            <div className="mt-3 flex flex-col gap-2">
              <TextField
                id="mypage-current-password"
                type="password"
                label="현재 비밀번호"
                placeholder="입력"
                value={passwordValues.currentPassword}
                error={passwordErrors.currentPassword}
                disabled={isPasswordSaving}
                className="!h-10 text-[13px]"
                scrollIntoViewOnFocus
                onChange={(event) =>
                  onChangePasswordField("currentPassword", event.target.value)
                }
              />

              <TextField
                id="mypage-new-password"
                type="password"
                label="새 비밀번호"
                placeholder="영문+숫자 8~12자"
                minLength={8}
                maxLength={12}
                value={passwordValues.newPassword}
                error={passwordErrors.newPassword}
                disabled={isPasswordSaving}
                hint="영문과 숫자를 모두 포함한 8~12자입니다."
                hintDisplay="tooltip"
                className="!h-10 text-[13px]"
                scrollIntoViewOnFocus
                onChange={(event) =>
                  onChangePasswordField("newPassword", event.target.value)
                }
              />

              <TextField
                id="mypage-new-password-confirm"
                type="password"
                label="새 비밀번호 확인"
                placeholder="새 비밀번호 재입력"
                minLength={8}
                maxLength={12}
                value={passwordValues.newPasswordConfirm}
                error={passwordErrors.newPasswordConfirm}
                disabled={isPasswordSaving}
                hint="위에서 입력한 새 비밀번호와 동일하게 입력해 주세요."
                hintDisplay="tooltip"
                className="!h-10 text-[13px]"
                scrollIntoViewOnFocus
                onChange={(event) =>
                  onChangePasswordField("newPasswordConfirm", event.target.value)
                }
              />
            </div>

            {passwordMessage ? (
              <div
                className={`mt-2 rounded-lg px-2.5 py-2 text-[13px] ${
                  passwordSuccess
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-rose-50 text-rose-700"
                }`}
              >
                {passwordMessage}
              </div>
            ) : null}

            <div className="mt-4 flex gap-1.5">
              <button
                type="button"
                onClick={onClosePasswordModal}
                disabled={isPasswordSaving}
                className="h-9 flex-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[13px] font-semibold text-[var(--color-text-primary)] transition hover:bg-[var(--color-bg-subtle)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                취소
              </button>

              <button
                type="button"
                onClick={() => void onSubmitPasswordChange()}
                disabled={isPasswordSaving}
                className="h-9 flex-[1.2] rounded-lg bg-[#7B61FF] text-[13px] font-semibold text-white shadow-sm transition hover:bg-[#6A52E0] disabled:cursor-not-allowed disabled:bg-[var(--color-text-disabled)]"
              >
                {isPasswordSaving ? "변경 중…" : "변경"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
