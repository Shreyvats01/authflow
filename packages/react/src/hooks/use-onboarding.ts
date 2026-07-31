import { useState, useCallback } from 'react';
import { useAuthContext } from '../provider';
import { AuthFlowError, HookResponse } from '../types';

interface OnboardingState {
  currentStep: number;
  completedSteps: number[];
  onboardingData: Record<string, any>;
  isCompleted: boolean;
}

export const useOnboarding = (initialSteps = 3) => {
  const { config, reload } = useAuthContext();
  const baseURL = config?.baseURL ?? '/api/auth';

  const [state, setState] = useState<OnboardingState>({
    currentStep: 0,
    completedSteps: [],
    onboardingData: {},
    isCompleted: false,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<AuthFlowError | null>(null);

  const goToNextStep = useCallback(() => {
    setState((prev) => ({
      ...prev,
      currentStep: Math.min(prev.currentStep + 1, initialSteps - 1),
    }));
  }, [initialSteps]);

  const goToPrevStep = useCallback(() => {
    setState((prev) => ({
      ...prev,
      currentStep: Math.max(prev.currentStep - 1, 0),
    }));
  }, []);

  const saveStep = useCallback(async (stepIndex: number, data: Record<string, any>): Promise<HookResponse> => {
    setIsLoading(true);
    setError(null);
    
    setState((prev) => ({
      ...prev,
      completedSteps: Array.from(new Set([...prev.completedSteps, stepIndex])),
      onboardingData: { ...prev.onboardingData, ...data },
    }));

    try {
      const res = await fetch(`${baseURL}/onboarding/step`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step: stepIndex, data }),
      });
      
      const resData = await res.json();
      
      if (res.ok) {
        setIsLoading(false);
        return { isLoading: false, error: null, data: resData };
      } else {
        setIsLoading(false);
        const hookError: AuthFlowError = {
          code: resData.error?.code || 'unknown_error',
          message: resData.error?.message || 'Failed to save step',
        };
        setError(hookError);
        return { isLoading: false, error: hookError };
      }
    } catch (e) {
      setIsLoading(false);
      const hookError: AuthFlowError = {
        code: 'network_error',
        message: 'Network error occurred',
      };
      setError(hookError);
      return { isLoading: false, error: hookError };
    }
  }, [baseURL]);

  const completeOnboarding = useCallback(async (): Promise<HookResponse> => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`${baseURL}/onboarding/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      
      const resData = await res.json();
      
      if (res.ok) {
        setState((prev) => ({ ...prev, isCompleted: true }));
        await reload();
        setIsLoading(false);
        return { isLoading: false, error: null, data: resData };
      } else {
        setIsLoading(false);
        const hookError: AuthFlowError = {
          code: resData.error?.code || 'unknown_error',
          message: resData.error?.message || 'Failed to complete onboarding',
        };
        setError(hookError);
        return { isLoading: false, error: hookError };
      }
    } catch (e) {
      setIsLoading(false);
      const hookError: AuthFlowError = {
        code: 'network_error',
        message: 'Network error occurred',
      };
      setError(hookError);
      return { isLoading: false, error: hookError };
    }
  }, [baseURL, reload]);

  return {
    ...state,
    isLoading,
    error,
    goToNextStep,
    goToPrevStep,
    saveStep,
    completeOnboarding,
  };
};
