import type { Notification } from '../../types/notification';
import { useNotifications } from '../../context/notification_context';

export default function NotificationItem({ notification: n }: { notification: Notification }) {
  const { markNotificationRead } = useNotifications();

  return (
    <div
      onClick={() => { if (!n.read) void markNotificationRead(n.id); }}
      style={{
        padding: '12px 16px',
        borderBottom: '1px solid var(--border)',
        cursor: 'pointer',
        background: n.read ? 'transparent' : 'var(--accent-subtle)',
        display: 'flex',
        gap: 10,
        alignItems: 'flex-start'
      }}
    >
      <div style={{
        width: 8, height: 8,
        borderRadius: '50%',
        background: n.read ? 'transparent' : 'var(--accent)',
        marginTop: 5,
        flexShrink: 0
      }} />
      <div>
        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-primary)' }}>
          {n.message}
        </p>
        <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          {new Date(n.createdAt).toLocaleString()}
        </p>
      </div>
    </div>
  );
}
