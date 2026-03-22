import { apiFetch } from './api';
import type { User, LoginPayload, RegisterPayload, UserSummary } from '../types/user';

export const register = (payload: RegisterPayload): Promise<{ message: string; userId: string }> =>
  apiFetch('/auth/register', { method: 'POST', body: JSON.stringify(payload) });

export const login = (payload: LoginPayload): Promise<{ message: string; user: User }> =>
  apiFetch('/auth/login', { method: 'POST', body: JSON.stringify(payload) });

export const logout = (): Promise<void> =>
  apiFetch('/auth/logout', { method: 'POST' });

export const refreshToken = (): Promise<void> =>
  apiFetch('/auth/refresh', { method: 'POST' });

export const getUserByEmail = (email: string): Promise<{ user: UserSummary }> =>
  apiFetch(`/auth/users?email=${encodeURIComponent(email)}`);