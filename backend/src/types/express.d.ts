export interface AuthContext {
  playerId: string;
}

export interface AdminAuthContext {
  adminId: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      auth?: AuthContext;
      adminAuth?: AdminAuthContext;
    }
  }
}

export {};
