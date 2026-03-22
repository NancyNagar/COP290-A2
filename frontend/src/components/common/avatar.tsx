import type { UserSummary } from '../../types/user';

interface AvatarProps { user: UserSummary; size?: number; }

export default function Avatar({ user, size = 32 }: AvatarProps) {
  const initials = user.name
    .split(' ')
    .map((w: string) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const colors = ['#4f8ef7','#e95c7b','#f7a94f','#4fcc89','#a78bfa'];
  const color = colors[user.name.charCodeAt(0) % colors.length];

  if (user.avatar) {
    return (
      <img
        src={user.avatar}
        alt={user.name}
        title={user.name}
        style={{
          width: size, height: size,
          borderRadius: '50%',
          objectFit: 'cover'
        }}
      />
    );
  }

  return (
    <div
      title={user.name}
      style={{
        width: size, height: size,
        borderRadius: '50%',
        background: color,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: size * 0.38,
        fontWeight: 700,
        color: '#fff',
        flexShrink: 0,
        userSelect: 'none',
      }}
    >
      {initials}
    </div>
  );
}