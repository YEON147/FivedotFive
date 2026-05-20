"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { UI_FOCUS_RING } from "@/components/ui/focus-ring";
import { TextField } from "@/components/ui/TextField";
import type {
  PasswordResetFormErrors,
  PasswordResetFormValues,
  PasswordResetStep,
} from "@/features/password-reset/types";

type PasswordResetFormProps = {
  step: PasswordResetStep;
  values: PasswordResetFormValues;
  errors: PasswordResetFormErrors;
  isSubmitting: boolean;
  canSubmit: boolean;
  submitMessage: string | null;
  submitSuccess: boolean | null;
  onChange: (name: keyof PasswordResetFormValues, value: string) => void;
  onSubmit: () => Promise<unknown>;
  onPreviousStep: () => void;
  onResendOtp: () => Promise<unknown>;
};

const STEP_TITLE: Record<PasswordResetStep, string> = {
  username: "비밀번호 찾기",
  otp: "인증번호 확인",
  password: "새 비밀번호 설정",
};

const STEP_DESCRIPTION: Record<PasswordResetStep, string> = {
  username:
    "아이디를 입력하면, 가입 시 등록한 이메일로 인증번호를 보내 드립니다.",
  otp: "이메일로 받은 인증번호 6자리를 입력해 주세요. (5분 이내 유효)",
  password: "새 비밀번호를 입력한 뒤 변경을 완료해 주세요.",
};

const SUBMIT_LABEL: Record<PasswordResetStep, string> = {
  username: "인증번호 받기",
  otp: "인증 확인",
  password: "비밀번호 변경",
};

export function PasswordResetForm({
  step,
  values,
  errors,
  isSubmitting,
  canSubmit,
  submitMessage,
  submitSuccess,
  onChange,
  onSubmit,
  onPreviousStep,
  onResendOtp,
}: PasswordResetFormProps) {
  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={(event) => {
        event.preventDefault();
        void onSubmit();
      }}
    >
      <div className="flex flex-col gap-1" aria-live="polite">
        <p className="text-body-sm text-[#6e6e6e]">{STEP_DESCRIPTION[step]}</p>
        {step !== "username" ? (
          <p className="text-body-sm font-medium text-slate-800">
            아이디: {values.username.trim()}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-3">
        {step === "username" ? (
          <TextField
            id="reset-username"
            name="username"
            autoComplete="username"
            label="아이디"
            value={values.username}
            placeholder="아이디를 입력해 주세요"
            error={errors.username}
            onChange={(event) => onChange("username", event.target.value)}
          />
        ) : null}

        {step === "otp" ? (
          <TextField
            id="reset-otp"
            name="otp"
            inputMode="numeric"
            autoComplete="one-time-code"
            label="인증번호"
            value={values.otp}
            placeholder="6자리 숫자"
            maxLength={6}
            error={errors.otp}
            onChange={(event) =>
              onChange("otp", event.target.value.replace(/\D/g, "").slice(0, 6))
            }
          />
        ) : null}

        {step === "password" ? (
          <>
            <TextField
              id="reset-new-password"
              name="newPassword"
              type="password"
              autoComplete="new-password"
              label="새 비밀번호"
              minLength={8}
              maxLength={12}
              value={values.newPassword}
              placeholder="8~12자 영문+숫자"
              error={errors.newPassword}
              hint="영문과 숫자를 모두 포함한 8~12자입니다."
              hintDisplay="label-inline"
              filledMinLength={8}
              onChange={(event) => onChange("newPassword", event.target.value)}
            />
            <TextField
              id="reset-new-password-confirm"
              name="newPasswordConfirm"
              type="password"
              autoComplete="new-password"
              label="새 비밀번호 확인"
              minLength={8}
              maxLength={12}
              value={values.newPasswordConfirm}
              placeholder="비밀번호를 다시 입력해 주세요"
              error={errors.newPasswordConfirm}
              hint="위에서 입력한 비밀번호와 동일하게 입력해 주세요."
              hintDisplay="label-inline"
              filledMinLength={8}
              onChange={(event) =>
                onChange("newPasswordConfirm", event.target.value)
              }
            />
          </>
        ) : null}
      </div>

      {submitMessage ? (
        <div
          className={`rounded-xl px-4 py-3 text-sm ${
            submitSuccess
              ? "bg-emerald-50 text-emerald-700"
              : "bg-rose-50 text-rose-700"
          }`}
          role={submitSuccess ? "status" : "alert"}
        >
          {submitMessage}
        </div>
      ) : null}

      <div className="mt-2 flex flex-col gap-3">
        <Button type="submit" variant="brand" disabled={!canSubmit}>
          {isSubmitting ? "처리 중..." : SUBMIT_LABEL[step]}
        </Button>

        {step === "otp" ? (
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => void onResendOtp()}
            className={`text-body-sm text-[#6e6e6e] disabled:opacity-50 ${UI_FOCUS_RING} rounded-sm px-1 py-2`}
          >
            인증번호 다시 받기
          </button>
        ) : null}

        {step !== "username" ? (
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onPreviousStep}
            className={`text-body-sm text-[#6e6e6e] disabled:opacity-50 ${UI_FOCUS_RING} rounded-sm px-1 py-2`}
          >
            이전
          </button>
        ) : null}
      </div>

      <div className="mt-3 text-center">
        <Link
          href="/login"
          className={`text-body-sm text-[#6e6e6e] inline-block rounded-sm focus:ring-offset-0 ${UI_FOCUS_RING}`}
        >
          로그인으로 돌아가기
        </Link>
      </div>
    </form>
  );
}

export function passwordResetStepTitle(step: PasswordResetStep): string {
  return STEP_TITLE[step];
}
