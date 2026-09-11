import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';

const GUEST_RESPONSE = {
  token: 'test-token',
  player: {
    id: 'p1',
    isGuest: true,
    username: null,
    displayName: 'Guest #1',
    balance: 0,
    bestScore: 0,
    bestDistance: 0,
    runsCount: 0,
    createdAt: new Date().toISOString(),
  },
};

describe('App', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => GUEST_RESPONSE,
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('bootstraps a guest session and renders the home route', async () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>,
    );

    await waitFor(() => expect(screen.getByText('Home screen')).toBeInTheDocument());
    expect(localStorage.getItem('oops_cube_token')).toBe('test-token');
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/auth/guest'),
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('reuses a stored token via /api/players/me instead of bootstrapping a new guest', async () => {
    localStorage.setItem('oops_cube_token', 'existing-token');

    render(
      <MemoryRouter initialEntries={['/leaderboard']}>
        <App />
      </MemoryRouter>,
    );

    await waitFor(() => expect(screen.getByText('Leaderboard screen')).toBeInTheDocument());
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/api/players/me'), expect.anything());
  });
});
