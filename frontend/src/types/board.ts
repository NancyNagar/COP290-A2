import type { Task } from './task';

export interface Column {
  id: string;
  name: string;
  boardId: string;
  order: number;
  wipLimit?: number | null;
  tasks?: Task[];
}

export interface Board {
  id: string;
  name: string;
  projectId: string;
  columns: Column[];
}

export interface CreateBoardPayload {
  name: string;
}

export interface CreateColumnPayload {
  name: string;
  order: number;
}