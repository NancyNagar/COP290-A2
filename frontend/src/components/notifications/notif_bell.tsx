import { useState } from 'react';
import { useNotifications } from '../../context/notification_context';
import NotificationItem from './notif_item';

export default function NotificationBell() {
  const { notifications, unreadCount } = useNotifications();
  const [open, setOpen] = useState(false);

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          position: 'relative',
          background: 'none',
          border: '1px solid var(--border)',
          borderRadius: 8,
          padding: '6px 10px',
          cursor: 'pointer',
          fontSize: '1.1rem'
        }}
      >
        🔔
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute',
            top: -4, right: -4,
            background: '#ef4444',
            color: '#fff',
            borderRadius: 999,
            fontSize: '0.65rem',
            fontWeight: 700,
            padding: '1px 5px',
            minWidth: 16,
            textAlign: 'center'
          }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div style={{
          position: 'absolute',
          right: 0,
          top: 'calc(100% + 8px)',
          width: 340,
          maxHeight: 420,
          overflowY: 'auto',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 10,
          boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
          zIndex: 200
        }}>
          <div style={{
            padding: '12px 16px',
            borderBottom: '1px solid var(--border)',
            fontWeight: 600,
            fontSize: '0.875rem',
            color: 'var(--text-primary)'
          }}>
            Notifications
          </div>
          {notifications.length === 0
            ? <p style={{ padding: 16, textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                All caught up!
              </p>
            : notifications.map(n => <NotificationItem key={n.id} notification={n} />)
          }
        </div>
      )}
    </div>
  );
}