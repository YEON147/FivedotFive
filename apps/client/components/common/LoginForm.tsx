"use client";

import Link from "next/link";
import { trackSignupButtonClick } from "@/lib/analytics/conversion";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import type {
  LoginFormErrors,
  LoginFormValues,
} from "@/features/login/types";

type LoginFormProps = {
  values: LoginFormValues;
  errors: LoginFormErrors;
  isSubmitting: boolean;
  canSubmit: boolean;
  submitMessage: string | null;
  submitSuccess: boolean | null;
  onChange: (name: keyof LoginFormValues, value: string) => void;
  onSubmit: () => Promise<unknown>;
  onKakaoLogin: () => void;
};

export function LoginForm({
  values,
  errors,
  isSubmitting,
  canSubmit,
  submitMessage,
  submitSuccess,
  onChange,
  onSubmit,
  onKakaoLogin,
}: LoginFormProps) {
  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={(event) => {
        event.preventDefault();
        void onSubmit();
      }}
    >
      <TextField
        id="username"
        name="username"
        autoComplete="username"
        label="아이디"
        value={values.username}
        placeholder="아이디를 입력해주세요"
        error={errors.username}
        onChange={(event) => onChange("username", event.target.value)}
      />

      <TextField
        id="password"
        name="password"
        type="password"
        autoComplete="current-password"
        label="비밀번호"
        value={values.password}
        placeholder="비밀번호를 입력해주세요"
        error={errors.password}
        filledMinLength={8}
        onChange={(event) => onChange("password", event.target.value)}
      />

      {submitMessage ? (
        <div
          className={`rounded-xl px-4 py-3 text-sm ${
            submitSuccess ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
          }`}
        >
          {submitMessage}
        </div>
      ) : null}

      <div className="mt-2 flex flex-col gap-3">
        <Button type="submit" variant="brand" disabled={!canSubmit}>
          {isSubmitting ? "로그인 중..." : "로그인"}
        </Button>
        <Button type="button" variant="kakao" onClick={onKakaoLogin}>
          카카오 로그인
        </Button>
      </div>

      <div className="mt-3 text-center">
        <p className="text-body-sm text-[#8b8b8b]">계정이 없으신가요 ?</p>
        <Link
          href="/signup"
          className="text-body-sm text-[#6e6e6e] inline-block rounded-sm outline-none focus:outline-none focus:ring-2 focus:ring-[#7B61FF]/25 focus:ring-offset-0"
          onClick={() => trackSignupButtonClick({ signup_entry: "login" })}
        >
          회원가입
        </Link>
      </div>
    </form>
  );
}
