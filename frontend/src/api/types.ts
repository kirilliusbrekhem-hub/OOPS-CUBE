export interface PlayerDTO {
  id: string;
  isGuest: boolean;
  username: string | null;
  displayName: string;
  balance: number;
  bestScore: number;
  bestDistance: number;
  runsCount: number;
  equippedSkinId: string | null;
  tonWalletAddress: string | null;
  createdAt: string;
}

export interface CubeSkinDTO {
  id: string;
  code: string;
  name: string;
  priceCubes: number;
  topColor: string;
  leftColor: string;
  rightColor: string;
  owned: boolean;
}

export interface StartSessionResponse {
  sessionId: string;
  startedAt: string;
}

export interface CheckpointResponse {
  serverScore: number;
  serverDistance: number;
}

export interface EndSessionResponse {
  serverScore: number;
  serverDistance: number;
  rewardAmount: number;
  player: PlayerDTO;
}

export interface LeaderboardEntry {
  rank: number;
  id: string;
  displayName: string;
  bestScore: number;
  isGuest: boolean;
}

export interface LeaderboardPage {
  entries: LeaderboardEntry[];
  totalPlayers: number;
}

export interface MyRank {
  rank: number;
  displayName: string;
  bestScore: number;
}

export interface QuestDTO {
  id: string;
  code: string;
  title: string;
  metric: string;
  target: number;
  rewardAmount: number;
  paysIn: 'cubes' | 'future_token';
  progress: number;
  completed: boolean;
  claimed: boolean;
  currentRank: number | null;
}

export interface DailyTaskDTO {
  id: string;
  code: string;
  title: string;
  metric: string;
  target: number;
  rewardAmount: number;
  progress: number;
  completed: boolean;
  claimed: boolean;
}

export interface StreakDTO {
  currentStreak: number;
  bestStreak: number;
  bonusMultiplier: number;
}

export interface DailiesResponse {
  tasks: DailyTaskDTO[];
  streak: StreakDTO;
}

export interface TopupPaymentInfo {
  sbpPhoneNumber: string;
}

export interface TopupPackage {
  code: string;
  label: string;
  cubesAmount: number;
  bonusPercent: number;
  priceRub: number;
  priceUsd: number;
  featured: boolean;
}

export interface TopupOrderDTO {
  id: string;
  packageCode: string;
  cubesAmount: number;
  priceAmount: number;
  priceCurrency: 'RUB' | 'USD';
  status: 'pending' | 'completed' | 'failed';
  createdAt: string;
  completedAt: string | null;
}

export interface FutureTokenHistoryEntry {
  amount: number;
  source: string;
  referenceId: string | null;
  accruedAt: string;
  converted: boolean;
}

export interface FutureTokenResponse {
  balance: number;
  history: FutureTokenHistoryEntry[];
}

export interface TokenInfoResponse {
  contractAddress: string;
}

export interface PayoutRequestDTO {
  id: string;
  amount: number;
  tonWalletAddress: string;
  status: 'pending' | 'paid';
  requestedAt: string;
  paidAt: string | null;
}
