"use client";

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
      <div className="flex w-full flex-col gap-4">
        <section
          className="rounded-2xl border border-dashed border-[#7B61FF]/50 bg-gradient-to-br from-[#F6F3FF] via-white to-[#EEF6FF] px-4 py-3.5 text-center shadow-sm"
          aria-label="환영 인사"
        >
          <h2 className="flex justify-center">
            <span className="inline-flex max-w-full flex-nowrap items-baseline justify-center gap-[0.12em] text-[clamp(16px,4.8vw,22px)] leading-tight tracking-wide">
              <span className="shrink-0 whitespace-nowrap font-bold text-[#7B61FF]">
                {greetName}
              </span>
              <span className="shrink-0 whitespace-nowrap font-light text-slate-900">
                님, 안녕하세요!
              </span>
            </span>
          </h2>
          <p className="text-wish-body mt-2.5 text-center text-[13px] font-medium leading-snug text-[#7B61FF]">
            위시리스트가 꼭 이루어질 거예요.
          </p>
        </section>

        <div className="flex flex-col gap-3.5">
          <TextField
            id="mypage-username"
            label="아이디"
            value={values.username}
            disabled
            readOnly
            className="cursor-not-allowed bg-slate-100 text-slate-500"
            hint="변경할 수 없습니다."
            hintDisplay="tooltip"
          />

          <TextField
            id="mypage-email"
            type="email"
            label="이메일"
            value={values.email}
            disabled
            readOnly
            className="cursor-not-allowed bg-slate-100 text-slate-500"
            hint="변경할 수 없습니다."
            hintDisplay="tooltip"
          />

          <div className="flex flex-col gap-1.5 scroll-mt-8">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-semibold text-slate-800">닉네임</span>
              <span className="tabular-nums text-xs text-[var(--color-text-secondary)]">
                {values.nickname.length}/8
              </span>
            </div>

            <div className="flex items-stretch gap-2">
              <input
                id="mypage-nickname"
                type="text"
                value={values.nickname}
                disabled={!isLoaded || isSaving}
                onChange={(event) => onChange("nickname", event.target.value)}
                className={`h-11 min-w-0 flex-1 rounded-xl border bg-white px-3.5 text-sm outline-none transition focus:ring-2 ${
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
                className="shrink-0 rounded-xl border border-[#7B61FF]/40 bg-white px-3 py-1.5 text-xs font-semibold text-[#7B61FF] shadow-sm transition hover:bg-violet-50 disabled:cursor-not-allowed disabled:opacity-60"
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
              hintDisplay="tooltip"
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
              <div className="absolute z-30 mt-1 max-h-52 w-full overflow-y-auto rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-lg">
                {isSchoolSearching ? (
                  <div className="px-3 py-2.5 text-xs text-[var(--color-text-secondary)]">
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
                      className="flex w-full flex-col items-start gap-0.5 border-b border-[var(--color-border)] px-3 py-2.5 text-left last:border-b-0 hover:bg-[var(--color-bg-subtle)]"
                    >
                      <span className="text-sm font-semibold text-[var(--color-text-primary)]">
                        {school.schoolName}
                      </span>
                      {school.address ? (
                        <span className="text-xs text-[var(--color-text-secondary)]">
                          {school.address}
                        </span>
                      ) : null}
                    </button>
                  ))
                ) : (
                  <div className="px-3 py-2.5 text-xs text-[var(--color-text-secondary)]">
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
            onChange={(event) => onChange("grade", event.target.value)}
          />
        </div>

        {saveMessage ? (
          <div
            className={`rounded-xl px-3 py-2.5 text-sm ${
              saveSuccess
                ? "bg-emerald-50 text-emerald-700"
                : "bg-rose-50 text-rose-700"
            }`}
          >
            {saveMessage}
          </div>
        ) : null}

        <div className="flex flex-col gap-2.5">
          <button
            type="button"
            onClick={onOpenPasswordModal}
            className="h-11 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-sm font-semibold text-[var(--color-text-primary)] shadow-sm transition hover:bg-[var(--color-bg-subtle)]"
          >
            비밀번호 변경
          </button>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onReset}
              disabled={!isDirty || isSaving}
              className="h-11 flex-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm font-semibold text-[var(--color-text-primary)] transition hover:bg-[var(--color-bg-subtle)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              취소
            </button>

            <button
              type="button"
              onClick={() => void onSubmit()}
              disabled={!canSubmit}
              className="h-11 flex-[1.2] rounded-xl bg-[#7B61FF] px-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#6A52E0] disabled:cursor-not-allowed disabled:bg-[var(--color-text-disabled)]"
            >
              {isSaving ? "저장 중…" : "저장"}
            </button>
          </div>
        </div>
      </div>

      {isPasswordModalOpen ? (
        <div className="fixed inset-0 z-[200] flex items-end justify-center bg-black/40 px-3 pb-[env(safe-area-inset-bottom,0px)] pt-10 sm:items-center sm:p-4">
          <div
            className="w-full max-w-[372px] rounded-t-[18px] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[0_8px_40px_rgba(0,0,0,0.12)] sm:rounded-[18px]"
            role="dialog"
            aria-modal="true"
            aria-labelledby="mypage-password-title"
          >
            <div className="flex items-start justify-between gap-3">
              <h3
                id="mypage-password-title"
                className="text-h3 text-[var(--color-text-primary)]"
              >
                비밀번호 변경
              </h3>

              <button
                type="button"
                onClick={onClosePasswordModal}
                disabled={isPasswordSaving}
                className="rounded-full px-2 py-1 text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-subtle)]"
              >
                닫기
              </button>
            </div>

            <div className="mt-4 flex flex-col gap-3">
              <TextField
                id="mypage-current-password"
                type="password"
                label="현재 비밀번호"
                placeholder="입력"
                value={passwordValues.currentPassword}
                error={passwordErrors.currentPassword}
                disabled={isPasswordSaving}
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
                scrollIntoViewOnFocus
                onChange={(event) =>
                  onChangePasswordField("newPasswordConfirm", event.target.value)
                }
              />
            </div>

            {passwordMessage ? (
              <div
                className={`mt-3 rounded-xl px-3 py-2.5 text-sm ${
                  passwordSuccess
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-rose-50 text-rose-700"
                }`}
              >
                {passwordMessage}
              </div>
            ) : null}

            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={onClosePasswordModal}
                disabled={isPasswordSaving}
                className="h-11 flex-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-sm font-semibold text-[var(--color-text-primary)] transition hover:bg-[var(--color-bg-subtle)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                취소
              </button>

              <button
                type="button"
                onClick={() => void onSubmitPasswordChange()}
                disabled={isPasswordSaving}
                className="h-11 flex-[1.2] rounded-xl bg-[#7B61FF] text-sm font-semibold text-white shadow-sm transition hover:bg-[#6A52E0] disabled:cursor-not-allowed disabled:bg-[var(--color-text-disabled)]"
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
