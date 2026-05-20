/** 신규 스펙: `status` · 레거시: `success` */
export type PasswordResetApiResponse = {
  status?: "SUCCESS" | "ERROR";
  success?: boolean;
  message: string;
  data?: null | unknown;
};

export type PasswordResetStep = "username" | "otp" | "password";

export type PasswordResetFormValues = {
  username: string;
  otp: string;
  newPassword: string;
  newPasswordConfirm: string;
};

export type PasswordResetFormErrors = Partial<
  Record<keyof PasswordResetFormValues, string>
>;
