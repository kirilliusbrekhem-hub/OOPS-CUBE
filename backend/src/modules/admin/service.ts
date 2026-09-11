import bcrypt from 'bcryptjs';
import { Pool } from 'pg';
import { ApiError } from '../../middleware/errorHandler';
import { signAdminToken } from '../../lib/jwt';
import * as repo from './repository';

export async function login(pool: Pool, username: string, password: string): Promise<{ token: string }> {
  const admin = await repo.findAdminByUsername(pool, username);
  if (!admin) {
    throw new ApiError(401, 'invalid_credentials', 'Invalid admin credentials');
  }
  const valid = await bcrypt.compare(password, admin.password_hash);
  if (!valid) {
    throw new ApiError(401, 'invalid_credentials', 'Invalid admin credentials');
  }
  return { token: signAdminToken(admin.id) };
}
