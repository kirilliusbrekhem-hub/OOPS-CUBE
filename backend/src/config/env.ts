import dotenv from 'dotenv';

dotenv.config();

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: parseInt(process.env.PORT ?? '8080', 10),
  databaseUrl: required('DATABASE_URL', 'postgres://postgres:postgres@localhost:5432/oops_cube'),
  redisUrl: required('REDIS_URL', 'redis://localhost:6379'),
  jwtSecret: required('JWT_SECRET', 'dev-secret-change-me'),
  adminJwtSecret: required('ADMIN_JWT_SECRET', 'dev-admin-secret-change-me'),
  guestSignupsPerIpPerDay: parseInt(process.env.GUEST_SIGNUPS_PER_IP_PER_DAY ?? '3', 10),
  // Public jetton contract address — not a secret. No private key or seed
  // phrase for any wallet is ever stored in this app; see README.
  opTokenContractAddress:
    process.env.OP_TOKEN_CONTRACT_ADDRESS ?? 'EQDkJ7JFweQazs_OFkvgLeGfv7B0Acn87bHbeytk5TbE179T',
  // The project owner's own phone number for manual SBP transfers — not a
  // secret, they chose to publish it for this purpose. No payment
  // processor is involved; see README "top-up" section.
  sbpPhoneNumber: process.env.SBP_PHONE_NUMBER ?? '+79217555637',
};
