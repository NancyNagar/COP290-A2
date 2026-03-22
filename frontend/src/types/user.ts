export type GlobalRole = 'admin' | 'member';
export type ProjectRole = 'project_admin' | 'project_member' | 'project_viewer';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: GlobalRole;
  createdAt: string;
}

// Lightweight version embedded inside Task, Comment etc.
export interface UserSummary {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

export interface ProjectMember {
  id: string;
  userId: string;
  projectId: string;
  role: ProjectRole;
  user: UserSummary;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}