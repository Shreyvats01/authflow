export interface BolkAuthError {
  code: BolkAuthErrorCode;
  message: string;
}

export type BolkAuthErrorCode = 
  | 'invalid_credentials'
  | 'user_exists'
  | 'weak_password'
  | 'invalid_email'
  | 'network_error'
  | 'unknown_error';

export interface HookResponse<T = any> {
  isLoading: boolean;
  error: BolkAuthError | null;
  fieldErrors?: Record<string, string>;
  data?: T;
}

export type AuthFlowError = BolkAuthError;
export type AuthFlowErrorCode = BolkAuthErrorCode;
