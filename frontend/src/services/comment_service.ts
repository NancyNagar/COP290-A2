import { apiFetch } from './api';
import type { Comment, CreateCommentPayload, UpdateCommentPayload } from '../types/comment';

export const getComments = (taskId: string): Promise<Comment[]> =>
  apiFetch(`/comments/tasks/${taskId}`);

export const createComment = (taskId: string, payload: CreateCommentPayload): Promise<Comment> =>
  apiFetch(`/comments/tasks/${taskId}`, { method: 'POST', body: JSON.stringify(payload) });

export const updateComment = (commentId: string, payload: UpdateCommentPayload): Promise<Comment> =>
  apiFetch(`/comments/${commentId}`, { method: 'PUT', body: JSON.stringify(payload) });

export const deleteComment = (commentId: string): Promise<void> =>
  apiFetch(`/comments/${commentId}`, { method: 'DELETE' });