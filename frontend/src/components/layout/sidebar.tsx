import { NavLink } from 'react-router-dom';

const links = [
  { to: '/dashboard', label: '⊞  Projects' },
  { to: '/profile', label: '👤  Profile' },
];

export default function Sidebar() {
  return (
    <aside style={{
      width: 220,
      borderRight: '1px solid var(--border)',
      background: 'var(--surface)',
      display: 'flex',
      flexDirection: 'column',
      padding: '16px 0',
      flexShrink: 0
    }}>
      <div style={{
        padding: '0 16px 16px',
        borderBottom: '1px solid var(--border)',
        marginBottom: 8
      }}>
        <span style={{
          fontSize: '0.7rem',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: 'var(--text-muted)'
        }}>
          Navigation
        </span>
      </div>
      {links.map(l => (
        <NavLink
          key={l.to}
          to={l.to}
          style={({ isActive }) => ({
            display: 'block',
            padding: '8px 16px',
            margin: '2px 8px',
            borderRadius: 6,
            textDecoration: 'none',
            fontSize: '0.875rem',
            fontWeight: 500,
            color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
            background: isActive ? 'var(--accent-subtle)' : 'transparent',
          })}
        >
          {l.label}
        </NavLink>
      ))}
    </aside>
  );
}