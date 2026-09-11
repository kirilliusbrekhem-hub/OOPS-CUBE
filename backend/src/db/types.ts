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
  created_at: Date;
  last_seen_at: Date;
}
