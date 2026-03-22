import type { UserSummary } from './user';
import type { Comment } from './comment';
import type { AuditLog } from './audit';

export type TaskType = 'story' | 'task' | 'bug';
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';

export interface Task {
  id: string;
  title: string;
  description?: string | null;
  type: TaskType;
  priority: TaskPriority;
  status: string;
  dueDate?: string | null;
  createdAt: string;
  resolvedAt?: string | null;
  closedAt?: string | null;
  columnId: string;
  reporterId: string;
  assigneeId?: string | null;
  parentId?: string | null;
  reporter: UserSummary;
  assignee?: UserSummary | null;
  children?: Task[];
  parent?: Task | null;
  comments?: Comment[];
  audits?: AuditLog[];
}

export interface CreateTaskPayload {
  title: string;
  description?: string;
  columnId?: string;   // required for task/bug
  boardId?: string;    // required for story
  priority: TaskPriority;
  type: TaskType;
  dueDate?: string;
  assigneeId?: string;
  reporterId: string;
  parentId?: string;
}

export interface UpdateTaskPayload {
  title?: string;
  description?: string;
  priority?: TaskPriority;
  assigneeId?: string | null;
  dueDate?: string | null;
}

