'use client';

import React, { useState } from 'react';
import { useOnboarding } from '@authflow/react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

export default function OnboardingPage() {
  const router = useRouter();
  const {
    currentStep,
    isLoading,
    error,
    goToNextStep,
    goToPrevStep,
    saveStep,
    completeOnboarding,
  } = useOnboarding(3);

  const [step1Data, setStep1Data] = useState({ displayName: '', role: 'dev' });
  const [step2Data, setStep2Data] = useState({ companyName: '', slug: '' });
  const [step3Data, setStep3Data] = useState({ theme: 'system', newsletter: true });

  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await saveStep(0, step1Data);
    if (!res.error) {
      if (step1Data.role !== 'founder') {
        goToNextStep();
        goToNextStep();
      } else {
        goToNextStep();
      }
    }
  };

  const handleStep2Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await saveStep(1, step2Data);
    if (!res.error) goToNextStep();
  };

  const handleStep3Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await saveStep(2, step3Data);
    if (!res.error) {
      const completeRes = await completeOnboarding();
      if (!completeRes.error) {
        router.push('/dashboard');
      }
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen p-8 bg-slate-900">
      <Card className="w-full max-w-lg bg-slate-800 text-white border-slate-700">
        <CardHeader className="pb-4">
          <div className="mb-4">
            <div className="flex justify-between items-center">
              {[0, 1, 2].map((step) => (
                <div key={step} className="flex-1 flex items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${
                      currentStep === step
                        ? 'bg-blue-600 text-white'
                        : currentStep > step
                        ? 'bg-blue-500/20 text-blue-400'
                        : 'bg-slate-700 text-slate-500'
                    }`}
                  >
                    {step + 1}
                  </div>
                  {step < 2 && (
                    <div
                      className={`flex-1 h-1 mx-2 rounded ${
                        currentStep > step ? 'bg-blue-500/20' : 'bg-slate-700'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error.message}</AlertDescription>
            </Alert>
          )}
        </CardHeader>
        <CardContent>
          {currentStep === 0 && (
            <form id="step1-form" onSubmit={handleStep1Submit} className="space-y-6">
              <div className="text-center mb-6">
                <CardTitle className="text-2xl mb-2">Welcome to AuthFlow</CardTitle>
                <CardDescription className="text-slate-400">Tell us a bit about yourself</CardDescription>
              </div>

              <div className="space-y-2">
                <Label htmlFor="displayName">Full Name</Label>
                <Input
                  id="displayName"
                  type="text"
                  value={step1Data.displayName}
                  onChange={(e) => setStep1Data({ ...step1Data, displayName: e.target.value })}
                  className="bg-slate-900 border-slate-600 focus-visible:ring-blue-500"
                  required
                  placeholder="Jane Doe"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">What is your role?</Label>
                <Select
                  value={step1Data.role}
                  onValueChange={(value) => setStep1Data({ ...step1Data, role: value || 'dev' })}
                >
                  <SelectTrigger className="bg-slate-900 border-slate-600 focus:ring-blue-500">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700 text-white">
                    <SelectItem value="dev">Developer</SelectItem>
                    <SelectItem value="founder">Founder</SelectItem>
                    <SelectItem value="designer">Designer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </form>
          )}

          {currentStep === 1 && (
            <form id="step2-form" onSubmit={handleStep2Submit} className="space-y-6">
              <div className="text-center mb-6">
                <CardTitle className="text-2xl mb-2">Choose Workspace</CardTitle>
                <CardDescription className="text-slate-400">Configure your workspace details</CardDescription>
              </div>

              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name</Label>
                <Input
                  id="companyName"
                  type="text"
                  value={step2Data.companyName}
                  onChange={(e) => setStep2Data({ ...step2Data, companyName: e.target.value })}
                  className="bg-slate-900 border-slate-600 focus-visible:ring-blue-500"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">Workspace Slug</Label>
                <Input
                  id="slug"
                  type="text"
                  value={step2Data.slug}
                  onChange={(e) => setStep2Data({ ...step2Data, slug: e.target.value })}
                  className="bg-slate-900 border-slate-600 focus-visible:ring-blue-500"
                  required
                />
              </div>
            </form>
          )}

          {currentStep === 2 && (
            <form id="step3-form" onSubmit={handleStep3Submit} className="space-y-6">
              <div className="text-center mb-6">
                <CardTitle className="text-2xl mb-2">Preferences</CardTitle>
                <CardDescription className="text-slate-400">Customize your environment</CardDescription>
              </div>

              <div className="space-y-2">
                <Label htmlFor="theme">Theme Preference</Label>
                <Select
                  value={step3Data.theme}
                  onValueChange={(value) => setStep3Data({ ...step3Data, theme: value || 'system' })}
                >
                  <SelectTrigger className="bg-slate-900 border-slate-600 focus:ring-blue-500">
                    <SelectValue placeholder="Select a theme" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700 text-white">
                    <SelectItem value="dark">Dark Mode</SelectItem>
                    <SelectItem value="light">Light Mode</SelectItem>
                    <SelectItem value="system">System Default</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-3 mt-4">
                <Checkbox
                  id="newsletter"
                  checked={step3Data.newsletter}
                  onCheckedChange={(checked) => setStep3Data({ ...step3Data, newsletter: checked === true })}
                  className="border-slate-600 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                />
                <Label htmlFor="newsletter" className="text-sm text-slate-300 font-normal">
                  Subscribe to Product Updates
                </Label>
              </div>
            </form>
          )}
        </CardContent>
        <CardFooter className="flex justify-between gap-4">
          {currentStep === 0 && (
            <Button
              type="submit"
              form="step1-form"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isLoading ? 'Saving...' : 'Continue'}
            </Button>
          )}
          {currentStep === 1 && (
            <>
              <Button
                type="button"
                onClick={goToPrevStep}
                disabled={isLoading}
                variant="outline"
                className="w-1/3 bg-slate-700 hover:bg-slate-600 border-none text-white hover:text-white"
              >
                Back
              </Button>
              <Button
                type="submit"
                form="step2-form"
                disabled={isLoading}
                className="w-2/3 bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isLoading ? 'Saving...' : 'Continue'}
              </Button>
            </>
          )}
          {currentStep === 2 && (
            <>
              <Button
                type="button"
                onClick={() => {
                  if (step1Data.role !== 'founder') {
                    goToPrevStep();
                    goToPrevStep();
                  } else {
                    goToPrevStep();
                  }
                }}
                disabled={isLoading}
                variant="outline"
                className="w-1/3 bg-slate-700 hover:bg-slate-600 border-none text-white hover:text-white"
              >
                Back
              </Button>
              <Button
                type="submit"
                form="step3-form"
                disabled={isLoading}
                className="w-2/3 bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isLoading ? 'Completing...' : 'Complete Onboarding'}
              </Button>
            </>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
