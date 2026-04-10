/**
 * 🔐 Unified Auth Type Definitions
 */

export type AuthProvider = 'jwt' | 'clerk';

export type AuthFailureReason = 
  | 'INVALID_TOKEN' 
  | 'USER_NOT_FOUND' 
  | 'UNVERIFIED_EMAIL' 
  | 'IDENTITY_CONFLICT'
  | 'RATE_LIMIT_EXCEEDED'
  | 'EXPIRED_TOKEN'
  | 'INVALID_ISSUER'
  | 'INVALID_FORMAT'
  | 'BANNED_USER'
  | 'SYSTEM_FAILURE';

export interface AuthUser {
  userId: string; // Supabase UUID
  email: string;
  provider: AuthProvider;
}

export type AuthResult = 
  | { ok: true; user: AuthUser; requestId: string }
  | { ok: false; reason: AuthFailureReason; message: string; requestId: string };

export interface ResolveUserOptions {
  mode: 'protected' | 'optional';
}
