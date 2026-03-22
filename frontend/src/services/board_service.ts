import { apiFetch } from './api';
import type { Board, CreateBoardPayload } from '../types/board';

export const getBoards = (projectId: string): Promise<Board[]> =>
  apiFetch(`/projects/${projectId}/boards`);

export const getBoardById = (boardId: string): Promise<Board> =>
  apiFetch(`/boards/${boardId}`);

export const createBoard = (projectId: string, payload: CreateBoardPayload): Promise<Board> =>
  apiFetch(`/projects/${projectId}/boards`, { method: 'POST', body: JSON.stringify(payload) });

export const updateBoard = (projectId: string, boardId: string, name: string): Promise<Board> =>
  apiFetch(`/projects/${projectId}/boards/${boardId}`, { method: 'PUT', body: JSON.stringify({ name }) });

export const deleteBoard = (projectId: string, boardId: string): Promise<void> =>
  apiFetch(`/projects/${projectId}/boards/${boardId}`, { method: 'DELETE' });