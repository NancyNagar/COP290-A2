import { apiFetch } from './api';
import type { Task, CreateTaskPayload, UpdateTaskPayload } from '../types/task';

export const getTasksByColumn = (columnId: string): Promise<Task[]> =>
  apiFetch(`/tasks/column/${columnId}`);

export const getTaskById = (taskId: string): Promise<Task> =>
  apiFetch(`/tasks/${taskId}`);

export const createTask = (payload: CreateTaskPayload): Promise<Task> =>
  apiFetch('/tasks', { method: 'POST', body: JSON.stringify(payload) });

export const updateTask = (taskId: string, payload: UpdateTaskPayload): Promise<Task> =>
  apiFetch(`/tasks/${taskId}`, { method: 'PATCH', body: JSON.stringify(payload) });

export const deleteTask = (taskId: string): Promise<void> =>
  apiFetch(`/tasks/${taskId}`, { method: 'DELETE' });

// newStatus removed — backend derives it from column name
export const moveTask = (taskId: string, newColumnId: string): Promise<Task> =>
  apiFetch(`/tasks/move/${taskId}`, { method: 'PATCH', body: JSON.stringify({ newColumnId }) });