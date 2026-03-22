import { useAuth } from '../../context/auth_context';
import { useNavigate } from 'react-router-dom';
import NotificationBell from '../notifications/notif_bell';
import Avatar from '../common/avatar';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  return (
    <header style={{
      height: 56,
      borderBottom: '1px solid var(--border)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 24px',
      background: 'var(--surface)',
      flexShrink: 0
    }}>
      <span style={{
        fontWeight: 700,
        fontSize: '1.1rem',
        color: 'var(--text-primary)',
        letterSpacing: '-0.02em'
      }}>
        TaskBoard
      </span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <NotificationBell />
        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Avatar user={user} size={32} />
            <span style={{
              fontSize: '0.875rem',
              color: 'var(--text-secondary)',
              fontWeight: 500
            }}>
              {user.name}
            </span>
            <button
              onClick={handleLogout}
              style={{
                background: 'none',
                border: '1px solid var(--border)',
                borderRadius: 6,
                padding: '4px 10px',
                fontSize: '0.8rem',
                cursor: 'pointer',
                color: 'var(--text-muted)'
              }}
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
}