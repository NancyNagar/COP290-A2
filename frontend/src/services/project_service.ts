import { apiFetch } from './api';
import type { Project, CreateProjectPayload, UpdateProjectPayload, UpsertMemberPayload } from '../types/project';
import type { ProjectMember } from '../types/user';

export const getProjects = (): Promise<Project[]> => 
  apiFetch('/projects');

export const createProject = (payload: CreateProjectPayload): Promise<Project> =>
  apiFetch('/projects', { method: 'POST', body: JSON.stringify(payload) });

export const updateProject = (projectId: string, payload: UpdateProjectPayload): Promise<Project> =>
  apiFetch(`/projects/${projectId}`, { method: 'PUT', body: JSON.stringify(payload) });

export const archiveProject = (projectId: string): Promise<Project> =>
  apiFetch(`/projects/${projectId}/archive`, { method: 'PATCH' });

export const deleteProject = (projectId: string): Promise<void> =>
  apiFetch(`/projects/${projectId}`, { method: 'DELETE' });

export const getProjectMembers = (projectId: string): Promise<ProjectMember[]> =>
  apiFetch(`/projects/${projectId}/members`);

export const upsertProjectMember = (projectId: string, payload: UpsertMemberPayload): Promise<ProjectMember> =>
  apiFetch(`/projects/${projectId}/members`, { method: 'PUT', body: JSON.stringify(payload) });

export const removeProjectMember = (projectId: string, targetUserId: string): Promise<void> =>
  apiFetch(`/projects/${projectId}/members/${targetUserId}`, { method: 'DELETE' });