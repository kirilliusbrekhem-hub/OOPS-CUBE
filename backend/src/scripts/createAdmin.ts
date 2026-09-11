import bcrypt from 'bcryptjs';
import { pool } from '../db/pool';

async function main() {
  const [username, password] = process.argv.slice(2);
  if (!username || !password) {
    console.error('Usage: npm run create-admin -- <username> <password>');
    process.exit(1);
  }
  if (password.length < 8) {
    console.error('Password must be at least 8 characters');
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await pool.query(
    `INSERT INTO admin_users (username, password_hash) VALUES ($1, $2)
     ON CONFLICT (username) DO UPDATE SET password_hash = $2`,
    [username, passwordHash],
  );
  console.log(`Admin user "${username}" is ready.`);
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
