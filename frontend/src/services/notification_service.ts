import { apiFetch } from './api';
import type { Notification } from '../types/notification';

export const getNotifications = (): Promise<Notification[]> =>
  apiFetch('/notifications');

export const markAsRead = (notificationId: string): Promise<Notification> =>
  apiFetch(`/notifications/${notificationId}/read`, { method: 'PATCH' });