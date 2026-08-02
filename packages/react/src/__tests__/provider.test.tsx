import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import { BolkAuthProvider, useAuthContext } from '../provider';

const TestConsumer = () => {
  const auth = useAuthContext();
  return (
    <div>
      <span data-testid="isLoaded">{auth.isLoaded ? 'true' : 'false'}</span>
      <span data-testid="isSignedIn">{auth.isSignedIn ? 'true' : 'false'}</span>
      <span data-testid="userId">{auth.userId || 'null'}</span>
      <span data-testid="sessionId">{auth.sessionId || 'null'}</span>
      <button data-testid="reload-btn" onClick={() => auth.reload()}>
        Reload
      </button>
    </div>
  );
};

describe('BolkAuthProvider', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders children correctly', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({}),
    } as Response);

    render(
      <BolkAuthProvider>
        <div data-testid="child">Hello World</div>
      </BolkAuthProvider>
    );

    expect(screen.getByTestId('child')).toBeDefined();
    expect(screen.getByTestId('child').textContent).toBe('Hello World');
  });

  it('fetches session on mount and sets initial state (isLoaded: true, isSignedIn: true) when authenticated', async () => {
    const mockUser = { id: 'user_123', email: 'test@example.com' };
    const mockSession = { id: 'sess_123' };

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({ user: mockUser, session: mockSession }),
    } as Response);

    render(
      <BolkAuthProvider>
        <TestConsumer />
      </BolkAuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('isLoaded').textContent).toBe('true');
    });

    expect(screen.getByTestId('isSignedIn').textContent).toBe('true');
    expect(screen.getByTestId('userId').textContent).toBe('user_123');
    expect(screen.getByTestId('sessionId').textContent).toBe('sess_123');
    expect(globalThis.fetch).toHaveBeenCalledWith('/api/auth/session');
  });

  it('sets isLoaded: true and isSignedIn: false when fetch returns 401 or empty session', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({}),
    } as Response);

    render(
      <BolkAuthProvider>
        <TestConsumer />
      </BolkAuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('isLoaded').textContent).toBe('true');
    });

    expect(screen.getByTestId('isSignedIn').textContent).toBe('false');
    expect(screen.getByTestId('userId').textContent).toBe('null');
    expect(screen.getByTestId('sessionId').textContent).toBe('null');
  });

  it('uses custom baseURL from config prop', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: false,
      json: async () => ({}),
    } as Response);

    render(
      <BolkAuthProvider config={{ baseURL: 'https://api.custom.com/auth' }}>
        <TestConsumer />
      </BolkAuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('isLoaded').textContent).toBe('true');
    });

    expect(globalThis.fetch).toHaveBeenCalledWith('https://api.custom.com/auth/session');
  });

  it('handles fetchSession error recovery cleanly without crashing', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('Network error'));

    render(
      <BolkAuthProvider>
        <TestConsumer />
      </BolkAuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('isLoaded').textContent).toBe('true');
    });

    expect(screen.getByTestId('isSignedIn').textContent).toBe('false');
    expect(screen.getByTestId('userId').textContent).toBe('null');
  });

  it('re-fetches session and updates state when reload() is called', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: false,
      json: async () => ({}),
    } as Response);

    render(
      <BolkAuthProvider>
        <TestConsumer />
      </BolkAuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('isLoaded').textContent).toBe('true');
    });
    expect(screen.getByTestId('isSignedIn').textContent).toBe('false');

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        user: { id: 'user_456', email: 'reload@example.com' },
        session: { id: 'sess_456' },
      }),
    } as Response);

    await act(async () => {
      screen.getByTestId('reload-btn').click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('userId').textContent).toBe('user_456');
    });
    expect(screen.getByTestId('isSignedIn').textContent).toBe('true');
    expect(screen.getByTestId('sessionId').textContent).toBe('sess_456');
  });

  it('handles BroadcastChannel("bolkauth_sync") event sync_session', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: false,
      json: async () => ({}),
    } as Response);

    render(
      <BolkAuthProvider>
        <TestConsumer />
      </BolkAuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('isLoaded').textContent).toBe('true');
    });
    expect(screen.getByTestId('isSignedIn').textContent).toBe('false');

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        user: { id: 'user_sync', email: 'sync@example.com' },
        session: { id: 'sess_sync' },
      }),
    } as Response);

    await act(async () => {
      const channel = new BroadcastChannel('bolkauth_sync');
      channel.postMessage('sync_session');
      channel.close();
    });

    await waitFor(() => {
      expect(screen.getByTestId('isSignedIn').textContent).toBe('true');
    });
    expect(screen.getByTestId('userId').textContent).toBe('user_sync');
  });

  it('ignores BroadcastChannel events with data other than "sync_session"', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: false,
      json: async () => ({}),
    } as Response);

    render(
      <BolkAuthProvider>
        <TestConsumer />
      </BolkAuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('isLoaded').textContent).toBe('true');
    });

    const fetchSpy = vi.spyOn(globalThis, 'fetch');

    await act(async () => {
      const channel = new BroadcastChannel('bolkauth_sync');
      channel.postMessage('other_event');
      channel.close();
    });

    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('throws an error when useAuthContext is used outside of BolkAuthProvider', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => render(<TestConsumer />)).toThrow(
      'useAuthContext must be used within a BolkAuthProvider'
    );

    consoleSpy.mockRestore();
  });
});
