export interface AuthFlowError {
  code: AuthFlowErrorCode;
  message: string;
}

export type AuthFlowErrorCode = 
  | 'invalid_credentials'
  | 'user_exists'
  | 'weak_password'
  | 'invalid_email'
  | 'network_error'
  | 'unknown_error';

export interface HookResponse<T = any> {
  isLoading: boolean;
  error: AuthFlowError | null;
  fieldErrors?: Record<string, string>;
  data?: T;
}
