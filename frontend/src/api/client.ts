import type {
  ChestDTO,
  ChestOpenResult,
  CubeSkinDTO,
  DailiesResponse,
  EndSessionResponse,
  FutureTokenResponse,
  LeaderboardPage,
  MyRank,
  PayoutRequestDTO,
  PlayerDTO,
  QuestDTO,
  StartSessionResponse,
  TokenInfoResponse,
  TopupOrderDTO,
  TopupPackage,
  TopupPaymentInfo,
} from './types';

const API_URL = import.meta.env.VITE_API_URL ?? '';
const TOKEN_KEY = 'oops_cube_token';

export class ApiError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // ignore (private browsing etc.) — session just won't persist across reloads
  }
}

export function clearToken(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    // ignore
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers = new Headers(options.headers);
  if (options.body) headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new ApiError(res.status, data?.error?.code ?? 'unknown_error', data?.error?.message ?? res.statusText);
  }
  return data as T;
}

export const api = {
  bootstrapGuest: () => request<{ token: string; player: PlayerDTO }>('/api/auth/guest', { method: 'POST' }),

  claim: (body: { username: string; password: string; email?: string }) =>
    request<{ token: string; player: PlayerDTO }>('/api/auth/claim', { method: 'POST', body: JSON.stringify(body) }),

  login: (body: { username: string; password: string }) =>
    request<{ token: string; player: PlayerDTO }>('/api/auth/login', { method: 'POST', body: JSON.stringify(body) }),

  me: () => request<{ player: PlayerDTO }>('/api/players/me'),

  updateMe: (body: { displayName: string }) =>
    request<{ player: PlayerDTO }>('/api/players/me', { method: 'PATCH', body: JSON.stringify(body) }),

  startSession: () => request<StartSessionResponse>('/api/game/sessions', { method: 'POST' }),

  checkpoint: (sessionId: string, body: { scoreDelta: number; distanceDelta: number }) =>
    request<{ serverScore: number; serverDistance: number }>(`/api/game/sessions/${sessionId}/checkpoint`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  endSession: (sessionId: string, idempotencyKey: string) =>
    request<EndSessionResponse>(`/api/game/sessions/${sessionId}/end`, {
      method: 'POST',
      headers: { 'Idempotency-Key': idempotencyKey },
    }),

  leaderboard: (limit = 50, offset = 0) =>
    request<LeaderboardPage>(`/api/leaderboard?limit=${limit}&offset=${offset}`),

  myRank: () => request<MyRank>('/api/leaderboard/me'),

  quests: () => request<{ quests: QuestDTO[] }>('/api/quests'),

  claimQuest: (id: string) => request<{ quest: QuestDTO; player: PlayerDTO }>(`/api/quests/${id}/claim`, { method: 'POST' }),

  dailies: () => request<DailiesResponse>('/api/dailies'),

  claimDaily: (id: string) =>
    request<{ task: unknown; player: PlayerDTO }>(`/api/dailies/${id}/claim`, { method: 'POST' }),

  topupPackages: () => request<{ packages: TopupPackage[] }>('/api/topup/packages'),

  topupPaymentInfo: () => request<TopupPaymentInfo>('/api/topup/payment-info'),

  createTopupOrder: (body: { packageCode: string; currency: 'RUB' | 'USD' }) =>
    request<{ order: TopupOrderDTO; note: string }>('/api/topup/orders', { method: 'POST', body: JSON.stringify(body) }),

  topupOrders: () => request<{ orders: TopupOrderDTO[] }>('/api/topup/orders'),

  futureToken: () => request<FutureTokenResponse>('/api/wallet/future-token'),

  skins: () => request<{ skins: CubeSkinDTO[] }>('/api/skins'),

  purchaseSkin: (id: string) =>
    request<{ skin: CubeSkinDTO; player: PlayerDTO }>(`/api/skins/${id}/purchase`, { method: 'POST' }),

  equipSkin: (id: string) => request<{ player: PlayerDTO }>(`/api/skins/${id}/equip`, { method: 'POST' }),

  chests: () => request<{ chests: ChestDTO[] }>('/api/shop/chests'),

  openChest: (code: string) => request<ChestOpenResult>(`/api/shop/chests/${code}/open`, { method: 'POST' }),

  tokenInfo: () => request<TokenInfoResponse>('/api/wallet/token-info'),

  connectTonWallet: (address: string) =>
    request<{ player: PlayerDTO }>('/api/wallet/ton-connect', { method: 'POST', body: JSON.stringify({ address }) }),

  requestPayout: () =>
    request<{ request: PayoutRequestDTO }>('/api/wallet/payout-request', { method: 'POST' }),
};
