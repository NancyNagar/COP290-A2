import { useState } from 'react';
import { useAuth } from '../context/auth_context';
import Avatar from '../components/common/avatar';
import Spinner from '../components/common/spinner';
import { apiFetch } from '../services/api';
import type { User } from '../types/user';

export default function ProfilePage() {
  const { user } = useAuth();
  const [name, setName] = useState(user?.name ?? '');
  const [avatarInput, setAvatarInput] = useState(user?.avatar ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (!user) return null;

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setAvatarInput(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function handleSave() {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      if (!user) return;
      const updated = await apiFetch<{ user: User }>('/auth/profile', {
        method: 'PATCH',
        body: JSON.stringify({
          name: name !== user.name ? name : undefined,
          avatar: avatarInput !== user.avatar ? avatarInput : undefined,
        }),
      });
      localStorage.setItem('user', JSON.stringify(updated.user));
      window.location.reload(); // reload to update navbar avatar
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 500, margin: '0 auto' }}>
      <h1 style={{ margin: '0 0 24px', fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>
        My Profile
      </h1>

      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 28 }}>
        {/* Avatar section */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 28 }}>
          <Avatar user={{ ...user, avatar: avatarInput || user.avatar }} size={72} />
          <div>
            <p style={{ margin: '0 0 8px', fontWeight: 600, color: 'var(--text-primary)' }}>{user.name}</p>
            <p style={{ margin: '0 0 8px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{user.email}</p>
            <span style={{
              display: 'inline-flex', alignItems: 'center', padding: '2px 8px',
              borderRadius: 100, fontSize: '0.72rem', fontWeight: 600,
              textTransform: 'uppercase',
              background: user.role === 'admin' ? '#fef3c7' : '#dbeafe',
              color: user.role === 'admin' ? '#92400e' : '#1e40af',
            }}>
              {user.role === 'admin' ? 'Global Admin' : 'Member'}
            </span>
          </div>
        </div>

        {/* Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={lbl}>Name</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              style={inp}
              placeholder="Your name"
            />
          </div>

          <div>
            <label style={lbl}>Avatar</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {/* File upload */}
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}
              />
              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>or paste an image URL:</p>
              <input
                value={avatarInput}
                onChange={e => setAvatarInput(e.target.value)}
                style={inp}
                placeholder="https://example.com/avatar.jpg"
              />
              {avatarInput && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Preview:</span>
                  <Avatar user={{ ...user, avatar: avatarInput }} size={40} />
                </div>
              )}
            </div>
          </div>

          {error && <p style={{ color: '#ef4444', margin: 0, fontSize: '0.875rem' }}>{error}</p>}
          {success && <p style={{ color: '#22c55e', margin: 0, fontSize: '0.875rem' }}>{success}</p>}

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
            <button
              onClick={handleSave}
              disabled={loading}
              style={{
                padding: '9px 20px', borderRadius: 8, border: 'none',
                background: 'var(--accent)', color: '#fff', fontWeight: 600,
                cursor: 'pointer', fontSize: '0.875rem',
                display: 'flex', alignItems: 'center', gap: 6
              }}
            >
              {loading ? <Spinner size={14} /> : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const lbl: React.CSSProperties = {
  display: 'block', fontSize: '0.8rem', fontWeight: 600,
  color: 'var(--text-secondary)', marginBottom: 6
};
const inp: React.CSSProperties = {
  width: '100%', padding: '8px 12px', borderRadius: 8,
  border: '1px solid var(--border)', background: 'var(--bg)',
  color: 'var(--text-primary)', fontSize: '0.875rem', boxSizing: 'border-box'
};