import { ProjectMember } from './user';

export interface Project {
  id: string;
  name: string;
  description?: string;
  isArchived: boolean;
  archivedAt?: string;
  createdAt: string;
}

export interface CreateProjectPayload {
  name: string;
  description?: string;
}

export interface UpdateProjectPayload {
  name?: string;
  description?: string;
}

export interface UpsertMemberPayload {
  userId: string;
  role: 'project_admin' | 'project_member' | 'project_viewer';
}