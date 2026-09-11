import { Migration } from '../migrate';

const migration: Migration = {
  id: '0008_seed_quests_and_dailies',
  sql: `
    INSERT INTO quests (code, title, metric, threshold, target, reward_amount, pays_in) VALUES
      ('season_top_1000', 'Break into world top 1,000', 'leaderboard_rank', 1000, 1, 250, 'future_token');

    INSERT INTO daily_tasks (code, title, metric, threshold, target, reward_amount) VALUES
      ('daily_survive_1000m', 'Survive 1,000 m in one run', 'distance_per_run', 1000, 3, 500),
      ('daily_collect_3000_cubes', 'Collect 3,000 CUBES', 'cubes_earned', NULL, 3000, 750),
      ('daily_play_1_run', 'Play 1 run today', 'runs_played', NULL, 1, 100);
  `,
};

export default migration;
