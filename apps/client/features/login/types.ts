export type LoginRequest = {
  username: string;
  password: string;
};

export type LoginResponse = {
  success: boolean;
  message: string;
  data?: {
    accessToken: string;
    username: string;
  };
  errors?: Record<string, string>;
};

export type LoginFormValues = {
  username: string;
  password: string;
};

export type LoginFormErrors = Partial<Record<keyof LoginFormValues, string>>;
