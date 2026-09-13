export interface GameSessionRow {
  id: string;
  player_id: string;
  status: 'active' | 'ended';
  server_score: number;
  server_distance: number;
  reward_amount: number;
  idempotency_key: string | null;
  started_at: Date;
  last_checkpoint_at: Date | null;
  ended_at: Date | null;
}

export type ObjectiveMetric = 'runs_played' | 'cubes_earned' | 'distance_per_run' | 'best_score' | 'leaderboard_rank';

export interface QuestRow {
  id: string;
  code: string;
  title: string;
  metric: ObjectiveMetric;
  threshold: number | null;
  target: number;
  reward_amount: number;
  pays_in: 'cubes' | 'future_token';
  active: boolean;
  created_at: Date;
}

export interface PlayerQuestProgressRow {
  player_id: string;
  quest_id: string;
  progress: number;
  completed_at: Date | null;
  claimed_at: Date | null;
}

export interface DailyTaskRow {
  id: string;
  code: string;
  title: string;
  metric: Exclude<ObjectiveMetric, 'leaderboard_rank'>;
  threshold: number | null;
  target: number;
  reward_amount: number;
  active: boolean;
  created_at: Date;
}

export interface PlayerDailyProgressRow {
  player_id: string;
  daily_task_id: string;
  day: string;
  progress: number;
  completed_at: Date | null;
  claimed_at: Date | null;
}

export interface PlayerStreakRow {
  player_id: string;
  current_streak: number;
  best_streak: number;
  last_completed_date: string | null;
}

export interface TopupOrderRow {
  id: string;
  player_id: string;
  package_code: string;
  cubes_amount: number;
  price_amount: number;
  price_currency: 'RUB' | 'USD';
  provider: 'stub';
  status: 'pending' | 'completed' | 'failed';
  created_at: Date;
  completed_at: Date | null;
}

export interface AdminUserRow {
  id: string;
  username: string;
  password_hash: string;
  created_at: Date;
}

export interface PlayerRow {
  id: string;
  is_guest: boolean;
  username: string | null;
  email: string | null;
  password_hash: string | null;
  display_name: string;
  balance: string; // bigint comes back as string from pg
  best_score: number;
  best_distance: number;
  runs_count: number;
  guest_number: string; // bigserial comes back as string
  equipped_skin_id: string | null;
  created_at: Date;
  last_seen_at: Date;
}

export interface CubeSkinRow {
  id: string;
  code: string;
  name: string;
  price_cubes: number;
  top_color: string;
  left_color: string;
  right_color: string;
  active: boolean;
  created_at: Date;
}
