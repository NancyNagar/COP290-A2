import { UserSummary } from './user';

export interface Comment {
  id: string;
  content: string;
  createdAt: string;
  taskId: string;
  userId: string;
  user: UserSummary;
}

export interface CreateCommentPayload {
  content: string;
}

export interface UpdateCommentPayload {
  newContent: string;
}