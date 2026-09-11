import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';

const PLAYER = {
  id: 'p1',
  isGuest: true,
  username: null,
  displayName: 'Guest #1',
  balance: 0,
  bestScore: 0,
  bestDistance: 0,
  runsCount: 0,
  createdAt: new Date().toISOString(),
};

function jsonResponse(body: unknown, ok = true) {
  return Promise.resolve({ ok, json: async () => body });
}

function installFetchMock() {
  vi.stubGlobal(
    'fetch',
    vi.fn((url: string) => {
      const path = url.replace(/^https?:\/\/[^/]+/, '');
      if (path.startsWith('/api/auth/guest')) return jsonResponse({ token: 'test-token', player: PLAYER });
      if (path.startsWith('/api/players/me')) return jsonResponse({ player: PLAYER });
      if (path.startsWith('/api/leaderboard/me')) return jsonResponse({ error: { code: 'not_found', message: 'no rank yet' } }, false);
      if (path.startsWith('/api/leaderboard')) return jsonResponse({ entries: [], totalPlayers: 0 });
      if (path.startsWith('/api/quests')) return jsonResponse({ quests: [] });
      if (path.startsWith('/api/dailies')) return jsonResponse({ tasks: [], streak: { currentStreak: 0, bestStreak: 0, bonusMultiplier: 1 } });
      if (path.startsWith('/api/topup/packages')) return jsonResponse({ packages: [] });
      if (path.startsWith('/api/topup/orders')) return jsonResponse({ orders: [] });
      if (path.startsWith('/api/wallet/future-token')) return jsonResponse({ balance: 0, history: [] });
      return jsonResponse({}, false);
    }),
  );
}

describe('App', () => {
  beforeEach(() => {
    localStorage.clear();
    installFetchMock();
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

    await waitFor(() => expect(screen.getByText('PLAY')).toBeInTheDocument());
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

    await waitFor(() => expect(screen.getByText('World top')).toBeInTheDocument());
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/api/players/me'), expect.anything());
  });
});
