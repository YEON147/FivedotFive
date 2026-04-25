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
    /** 위시보드가 이미 있으면 true — 클라이언트에서 위시리스트로 바로 이동할 때 사용 */
    hasWishBoard?: boolean;
  };
  errors?: Record<string, string>;
};

export type LoginFormValues = {
  username: string;
  password: string;
};

export type LoginFormErrors = Partial<Record<keyof LoginFormValues, string>>;
