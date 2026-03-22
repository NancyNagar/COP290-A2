import { createContext, useContext, useReducer, useEffect, useCallback, type ReactNode } from 'react';
import type { Notification } from '../types/notification';
import { getNotifications, markAsRead } from '../services/notification_service';
import { useAuth } from './auth_context';

interface State { notifications: Notification[]; unreadCount: number; }
type Action = { type: 'SET'; payload: Notification[] } | { type: 'READ'; payload: string };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET': return { notifications: action.payload, unreadCount: action.payload.filter(n => !n.read).length };
    case 'READ': {
      const updated = state.notifications.map(n => n.id === action.payload ? { ...n, read: true } : n);
      return { notifications: updated, unreadCount: updated.filter(n => !n.read).length };
    }
    default: return state;
  }
}

interface CtxValue extends State {
  markNotificationRead: (id: string) => Promise<void>;
  refetch: () => Promise<void>;
}

const NotificationContext = createContext<CtxValue | null>(null);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [state, dispatch] = useReducer(reducer, { notifications: [], unreadCount: 0 });

  const refetch = useCallback(async () => {
    if (!user) return;
    try {
      const data = await getNotifications();
      dispatch({ type: 'SET', payload: data });
    } catch { /* silently fail */ }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    void refetch();
    const interval = setInterval(() => void refetch(), 30_000);
    return () => clearInterval(interval);
  }, [user, refetch]);

  async function markNotificationRead(id: string) {
    try {
      await markAsRead(id);
      dispatch({ type: 'READ', payload: id });
    } catch { /* ignore */ }
  }

  return (
    <NotificationContext.Provider value={{ ...state, markNotificationRead, refetch }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications(): CtxValue {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
}