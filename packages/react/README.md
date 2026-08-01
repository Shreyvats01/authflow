# @bolkauth/react

[![npm version](https://img.shields.io/npm/v/@bolkauth/react.svg?style=flat-square)](https://www.npmjs.com/package/@bolkauth/react)
[![license](https://img.shields.io/npm/l/@bolkauth/react.svg?style=flat-square)](LICENSE)

**@bolkauth/react** provides modern, headless React hooks and context provider for BolkAuth. Build fully custom authentication UI with zero styling opinion, automated cross-tab state synchronization, and simple hooks for sessions, email OTP, OAuth, and onboarding state machines.

---

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Provider Setup](#provider-setup)
- [Cross-Tab Synchronization](#cross-tab-synchronization)
- [Hooks API Reference](#hooks-api-reference)
  - [`useAuth`](#useauth)
  - [`useUser`](#useuser)
  - [`useSignIn`](#usesignin)
  - [`useSignUp`](#usesignup)
  - [`useOAuth`](#useoauth)
  - [`useOTP`](#useotp)
  - [`useOnboarding`](#useonboarding)
  - [Additional Utility Hooks (`useSession`, `useUserMetadata`, `useMagicLink`)](#additional-utility-hooks)
- [Complete Component Examples](#complete-component-examples)
  - [1. User Profile & Header (`useAuth`, `useUser`)](#1-user-profile--header-useauth-useuser)
  - [2. Email & Password Sign-In Form (`useSignIn`)](#2-email--password-sign-in-form-usesignin)
  - [3. Registration / Sign-Up Form (`useSignUp`)](#3-registration--sign-up-form-usesignup)
  - [4. Social Login Buttons (`useOAuth`)](#4-social-login-buttons-useoauth)
  - [5. Email OTP Authentication (`useOTP`)](#5-email-otp-authentication-useotp)
  - [6. Multi-Step Onboarding Wizard (`useOnboarding`)](#6-multi-step-onboarding-wizard-useonboarding)
- [License](#license)

---

## Features

- ⚛️ **Headless React Hooks**: Complete control over rendering, styling, animations, and UI frameworks (Tailwind, Shadcn UI, Material UI, Chakra, etc.).
- 🔄 **Automatic Cross-Tab Synchronization**: Native `BroadcastChannel` browser synchronization — signing in or out in one tab instantly updates all open tabs.
- 🔐 **Comprehensive Auth Support**: Password sign-in, sign-up, passwordless Magic Links, Email OTP verification, and OAuth (GitHub, Google, etc.).
- 🧙‍♂️ **Built-in Onboarding FSM Hook**: Multi-step wizard state management with automatic progress saving and completion hooks.
- ⚡ **Optimistic & Fast**: Instant local state updates backed by asynchronous background API reloading.

---

## Installation

```bash
# npm
npm install @bolkauth/react @bolkauth/core

# pnpm
pnpm add @bolkauth/react @bolkauth/core

# yarn
yarn add @bolkauth/react @bolkauth/core
```

*Note: Requires `react` and `react-dom` version 18 or higher.*

---

## Provider Setup

Wrap your application root with `BolkAuthProvider` (or its alias `AuthFlowProvider`).

### Next.js (App Router - `app/providers.tsx`)

```tsx
'use client';

import { BolkAuthProvider } from '@bolkauth/react';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <BolkAuthProvider config={{ baseURL: '/api/auth' }}>
      {children}
    </BolkAuthProvider>
  );
}
```

### Vite / React SPA (`src/main.tsx`)

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BolkAuthProvider } from '@bolkauth/react';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BolkAuthProvider config={{ baseURL: 'https://api.yourdomain.com/auth' }}>
      <App />
    </BolkAuthProvider>
  </React.StrictMode>
);
```

---

## Cross-Tab Synchronization

`@bolkauth/react` automatically creates a `BroadcastChannel('bolkauth_sync')` listener inside `BolkAuthProvider`. 

When a user signs in, verifies an OTP code, signs up, or logs out in **Tab A**:
1. A sync message is broadcasted across the browser instance.
2. **Tab B**, **Tab C**, and all open browser windows immediately re-fetch the session and re-render the UI state seamlessly without needing a page refresh.

---

## Hooks API Reference

### `useAuth`

Access core authentication session state (loading status, signed-in state, user ID, session ID).

```tsx
const { isLoaded, isSignedIn, userId, sessionId } = useAuth();
```

| Return Property | Type | Description |
| :--- | :--- | :--- |
| `isLoaded` | `boolean` | `true` once initial session check completes. |
| `isSignedIn` | `boolean` | `true` if valid active session exists. |
| `userId` | `string \| null` | Authenticated user's unique ID. |
| `sessionId` | `string \| null` | Active session token ID. |

---

### `useUser`

Access full authenticated user object and a `reload()` function to refresh state.

```tsx
const { isLoaded, isSignedIn, user, reload } = useUser();
```

| Return Property | Type | Description |
| :--- | :--- | :--- |
| `isLoaded` | `boolean` | `true` once initial session request finishes. |
| `isSignedIn` | `boolean` | `true` if user is logged in. |
| `user` | `User \| null` | User object (id, email, name, image, emailVerified, etc.). |
| `reload` | `() => Promise<void>` | Re-fetches user and session data from `/session`. |

---

### `useSignIn`

Hook for email and password authentication.

```tsx
const { signIn, isLoading, error, fieldErrors } = useSignIn();
```

| Return Property | Type | Description |
| :--- | :--- | :--- |
| `signIn` | `(credentials: { email: string; password: string }) => Promise<HookResponse>` | Triggers sign-in request. |
| `isLoading` | `boolean` | `true` while request is in flight. |
| `error` | `BolkAuthError \| null` | High-level error object (`code`, `message`). |
| `fieldErrors` | `Record<string, string>` | Field-level validation errors (e.g. `{ email: 'Invalid email' }`). |

---

### `useSignUp`

Hook for user registration.

```tsx
const { signUp, isLoading, error, fieldErrors } = useSignUp();
```

| Return Property | Type | Description |
| :--- | :--- | :--- |
| `signUp` | `(data: { email: string; password: string; name?: string }) => Promise<HookResponse>` | Triggers account creation. |
| `isLoading` | `boolean` | `true` while request is in flight. |
| `error` | `BolkAuthError \| null` | High-level error object (`code`, `message`). |
| `fieldErrors` | `Record<string, string>` | Field-level validation errors. |

---

### `useOAuth`

Initiates OAuth 2.0 social login flow redirects.

```tsx
const { signInWithOAuth } = useOAuth();
```

| Return Method | Signature | Description |
| :--- | :--- | :--- |
| `signInWithOAuth` | `(provider: 'github' \| 'google' \| string) => void` | Redirects browser to `/oauth/:provider`. |

---

### `useOTP`

Complete state machine hook for passwordless Email OTP verification.

```tsx
const { step, email, expiresAt, sendCode, verifyCode, reset, isLoading, error } = useOTP();
```

| Return Property | Type | Description |
| :--- | :--- | :--- |
| `step` | `'idle' \| 'code_sent' \| 'verified'` | Current state of the OTP workflow. |
| `email` | `string \| null` | Target email address the OTP was dispatched to. |
| `expiresAt` | `Date \| null` | Expiration timestamp of the generated OTP code. |
| `sendCode` | `(email: string) => Promise<HookResponse>` | Requests OTP code dispatch to target email address. |
| `verifyCode` | `(code: string) => Promise<HookResponse>` | Verifies submitted numeric code and logs user in. |
| `reset` | `() => void` | Resets state back to `'idle'`. |
| `isLoading` | `boolean` | `true` while sending or verifying code. |
| `error` | `BolkAuthError \| null` | Error object if dispatch or verification fails. |

---

### `useOnboarding`

Finite State Machine hook for step-by-step onboarding flows.

```tsx
const {
  currentStep,
  completedSteps,
  onboardingData,
  isCompleted,
  isLoading,
  error,
  goToNextStep,
  goToPrevStep,
  saveStep,
  completeOnboarding
} = useOnboarding(totalSteps);
```

| Return Property | Type | Description |
| :--- | :--- | :--- |
| `currentStep` | `number` | Active 0-indexed step number. |
| `completedSteps` | `number[]` | Array of completed step indices. |
| `onboardingData` | `Record<string, any>` | Accumulated data collected across onboarding steps. |
| `isCompleted` | `boolean` | `true` if onboarding is marked complete. |
| `goToNextStep` | `() => void` | Advances to the next step. |
| `goToPrevStep` | `() => void` | Returns to the previous step. |
| `saveStep` | `(stepIndex: number, data: Record<string, any>) => Promise<HookResponse>` | Saves current step payload to user metadata. |
| `completeOnboarding` | `() => Promise<HookResponse>` | Marks onboarding workflow as complete. |

---

### Additional Utility Hooks

- `useSession()`: Returns `{ isLoaded, session }`.
- `useUserMetadata()`: Returns `{ metadata, updateMetadata, getMetadata }`.
- `useMagicLink()`: Returns `{ sendMagicLink, isLoading, error }`.

---

## Complete Component Examples

### 1. User Profile & Header (`useAuth`, `useUser`)

```tsx
import React from 'react';
import { useAuth, useUser } from '@bolkauth/react';

export function Header() {
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();

  if (!isLoaded) {
    return <header className="p-4 border-b">Loading session...</header>;
  }

  return (
    <header className="p-4 border-b flex justify-between items-center">
      <h1 className="text-xl font-bold">MyApp</h1>
      <div>
        {isSignedIn ? (
          <div className="flex items-center gap-3">
            {user?.image && (
              <img src={user.image} alt={user.name || 'User'} className="w-8 h-8 rounded-full" />
            )}
            <span>Welcome, <strong>{user?.name || user?.email}</strong></span>
          </div>
        ) : (
          <a href="/login" className="px-4 py-2 bg-blue-600 text-white rounded">Sign In</a>
        )}
      </div>
    </header>
  );
}
```

---

### 2. Email & Password Sign-In Form (`useSignIn`)

```tsx
import React, { useState } from 'react';
import { useSignIn } from '@bolkauth/react';

export function SignInForm() {
  const { signIn, isLoading, error, fieldErrors } = useSignIn();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await signIn({ email, password });
    if (!result.error) {
      window.location.href = '/dashboard';
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto p-6 bg-white rounded shadow">
      <h2 className="text-2xl font-bold mb-4">Sign In</h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
          {error.message}
        </div>
      )}

      <div className="mb-4">
        <label className="block mb-1 font-medium">Email Address</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full border p-2 rounded"
        />
        {fieldErrors.email && <span className="text-red-500 text-sm">{fieldErrors.email}</span>}
      </div>

      <div className="mb-4">
        <label className="block mb-1 font-medium">Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full border p-2 rounded"
        />
        {fieldErrors.password && <span className="text-red-500 text-sm">{fieldErrors.password}</span>}
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-2 bg-indigo-600 text-white rounded font-semibold disabled:opacity-50"
      >
        {isLoading ? 'Signing In...' : 'Sign In'}
      </button>
    </form>
  );
}
```

---

### 3. Registration / Sign-Up Form (`useSignUp`)

```tsx
import React, { useState } from 'react';
import { useSignUp } from '@bolkauth/react';

export function SignUpForm() {
  const { signUp, isLoading, error, fieldErrors } = useSignUp();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await signUp({ name, email, password });
    if (!res.error) {
      window.location.href = '/onboarding';
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto p-6 bg-white rounded shadow">
      <h2 className="text-2xl font-bold mb-4">Create Account</h2>

      {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{error.message}</div>}

      <div className="mb-3">
        <label className="block mb-1">Full Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border p-2 rounded"
        />
      </div>

      <div className="mb-3">
        <label className="block mb-1">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border p-2 rounded"
        />
        {fieldErrors.email && <span className="text-red-500 text-sm">{fieldErrors.email}</span>}
      </div>

      <div className="mb-4">
        <label className="block mb-1">Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border p-2 rounded"
        />
        {fieldErrors.password && <span className="text-red-500 text-sm">{fieldErrors.password}</span>}
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-2 bg-green-600 text-white rounded font-bold"
      >
        {isLoading ? 'Creating Account...' : 'Sign Up'}
      </button>
    </form>
  );
}
```

---

### 4. Social Login Buttons (`useOAuth`)

```tsx
import React from 'react';
import { useOAuth } from '@bolkauth/react';

export function SocialButtons() {
  const { signInWithOAuth } = useOAuth();

  return (
    <div className="flex flex-col gap-3 max-w-xs mx-auto">
      <button
        onClick={() => signInWithOAuth('github')}
        className="flex items-center justify-center gap-2 p-2 bg-gray-900 text-white rounded font-medium"
      >
        Continue with GitHub
      </button>
      
      <button
        onClick={() => signInWithOAuth('google')}
        className="flex items-center justify-center gap-2 p-2 bg-white border border-gray-300 text-gray-700 rounded font-medium"
      >
        Continue with Google
      </button>
    </div>
  );
}
```

---

### 5. Email OTP Authentication (`useOTP`)

```tsx
import React, { useState } from 'react';
import { useOTP } from '@bolkauth/react';

export function OTPAuthScreen() {
  const { step, email, sendCode, verifyCode, reset, isLoading, error } = useOTP();
  const [inputEmail, setInputEmail] = useState('');
  const [code, setCode] = useState('');

  if (step === 'verified') {
    return (
      <div className="p-6 bg-green-50 text-green-800 rounded max-w-md mx-auto text-center">
        <h3 className="text-xl font-bold">Successfully Verified!</h3>
        <p>Redirecting to application...</p>
      </div>
    );
  }

  if (step === 'code_sent') {
    return (
      <div className="max-w-md mx-auto p-6 bg-white rounded shadow">
        <h3 className="text-xl font-bold mb-2">Enter Verification Code</h3>
        <p className="text-gray-600 mb-4">We sent a 6-digit code to <strong>{email}</strong></p>

        {error && <div className="p-3 bg-red-100 text-red-700 mb-4 rounded">{error.message}</div>}

        <input
          type="text"
          maxLength={6}
          placeholder="123456"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="w-full text-center tracking-widest text-2xl border p-3 rounded mb-4"
        />

        <div className="flex gap-2">
          <button
            onClick={() => verifyCode(code)}
            disabled={isLoading || code.length < 4}
            className="flex-1 py-2 bg-blue-600 text-white rounded font-semibold"
          >
            {isLoading ? 'Verifying...' : 'Verify & Sign In'}
          </button>
          <button
            onClick={reset}
            className="px-4 py-2 border border-gray-300 text-gray-600 rounded"
          >
            Change Email
          </button>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        sendCode(inputEmail);
      }}
      className="max-w-md mx-auto p-6 bg-white rounded shadow"
    >
      <h3 className="text-xl font-bold mb-4">Sign In with Email OTP</h3>

      {error && <div className="p-3 bg-red-100 text-red-700 mb-4 rounded">{error.message}</div>}

      <div className="mb-4">
        <label className="block mb-1">Email Address</label>
        <input
          type="email"
          value={inputEmail}
          onChange={(e) => setInputEmail(e.target.value)}
          required
          className="w-full border p-2 rounded"
        />
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-2 bg-blue-600 text-white rounded font-semibold"
      >
        {isLoading ? 'Sending Code...' : 'Send Verification Code'}
      </button>
    </form>
  );
}
```

---

### 6. Multi-Step Onboarding Wizard (`useOnboarding`)

```tsx
import React, { useState } from 'react';
import { useOnboarding } from '@bolkauth/react';

export function OnboardingWizard() {
  const {
    currentStep,
    isCompleted,
    isLoading,
    error,
    goToNextStep,
    goToPrevStep,
    saveStep,
    completeOnboarding
  } = useOnboarding(3);

  const [role, setRole] = useState('');
  const [company, setCompany] = useState('');

  if (isCompleted) {
    return (
      <div className="p-8 text-center max-w-md mx-auto">
        <h2 className="text-2xl font-bold text-green-600 mb-2">Setup Complete!</h2>
        <p className="text-gray-600 mb-4">Your account is ready to use.</p>
        <a href="/dashboard" className="px-6 py-2 bg-blue-600 text-white rounded inline-block font-semibold">
          Go to Dashboard
        </a>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto p-6 bg-white rounded shadow">
      <div className="mb-6 flex justify-between text-sm text-gray-500">
        <span>Step {currentStep + 1} of 3</span>
        <span>{Math.round(((currentStep + 1) / 3) * 100)}% Completed</span>
      </div>

      {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{error.message}</div>}

      {currentStep === 0 && (
        <div>
          <h3 className="text-lg font-bold mb-3">Select Your Role</h3>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full border p-2 rounded mb-4"
          >
            <option value="">-- Choose Role --</option>
            <option value="developer">Developer</option>
            <option value="designer">Designer</option>
            <option value="manager">Product Manager</option>
          </select>
          <button
            onClick={async () => {
              await saveStep(0, { role });
              goToNextStep();
            }}
            disabled={!role || isLoading}
            className="w-full py-2 bg-indigo-600 text-white rounded font-semibold"
          >
            Continue
          </button>
        </div>
      )}

      {currentStep === 1 && (
        <div>
          <h3 className="text-lg font-bold mb-3">Company Details</h3>
          <input
            type="text"
            placeholder="Company Name"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            className="w-full border p-2 rounded mb-4"
          />
          <div className="flex gap-2">
            <button onClick={goToPrevStep} className="px-4 py-2 border rounded">Back</button>
            <button
              onClick={async () => {
                await saveStep(1, { company });
                goToNextStep();
              }}
              disabled={!company || isLoading}
              className="flex-1 py-2 bg-indigo-600 text-white rounded font-semibold"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {currentStep === 2 && (
        <div>
          <h3 className="text-lg font-bold mb-3">Final Confirmation</h3>
          <p className="text-gray-600 mb-4">Confirm your settings to finish onboarding.</p>
          <div className="flex gap-2">
            <button onClick={goToPrevStep} className="px-4 py-2 border rounded">Back</button>
            <button
              onClick={completeOnboarding}
              disabled={isLoading}
              className="flex-1 py-2 bg-green-600 text-white rounded font-semibold"
            >
              {isLoading ? 'Finishing...' : 'Complete Onboarding'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
```

---

## License

[MIT](LICENSE) © BolkAuth
