import { apiFetch } from './api';
import type { Column, CreateColumnPayload } from '../types/board';

export const getColumns = (boardId: string): Promise<Column[]> =>
  apiFetch(`/boards/${boardId}/columns`);

export const createColumn = (boardId: string, payload: CreateColumnPayload): Promise<Column> =>
  apiFetch(`/boards/${boardId}/columns`, { method: 'POST', body: JSON.stringify(payload) });

export const updateColumn = (columnId: string, name: string): Promise<Column> =>
  apiFetch(`/columns/${columnId}`, { method: 'PUT', body: JSON.stringify({ name }) });

export const deleteColumn = (columnId: string): Promise<void> =>
  apiFetch(`/columns/${columnId}`, { method: 'DELETE' });

export const reorderColumns = (boardId: string, orderedIds: string[]): Promise<Column[]> =>
  apiFetch(`/boards/${boardId}/columns/reorder`, { method: 'PATCH', body: JSON.stringify({ orderedIds }) });

export const updateWipLimit = (columnId: string, wipLimit: number | null): Promise<Column> =>
  apiFetch(`/columns/${columnId}/wip-limit`, { method: 'PATCH', body: JSON.stringify({ wipLimit }) });