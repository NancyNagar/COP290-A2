import type { UserSummary } from './user';
import type { Comment } from './comment';

export interface AuditLog {
  id: string;
  action: string;
  oldValue?: string | null;
  newValue?: string | null;
  createdAt: string;
  taskId: string;
  userId: string;
  user?: UserSummary;
}

export type ActivityItem =
  | { kind: 'comment'; data: Comment }
  | { kind: 'audit'; data: AuditLog };