import { useState, type FormEvent } from 'react';
import { useAuth } from '../../context/auth_context';
import { useNavigate, Link } from 'react-router-dom';
import Spinner from '../common/spinner';

export default function RegisterForm() {
  const { register, error, loading } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    try {
      await register({ name, email, password });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 1500);
    } catch { /* error shown via context */ }
  }

  if (success) {
    return (
      <p style={{ textAlign: 'center', color: '#22c55e', fontWeight: 600 }}>
        Account created! Redirecting...
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <label style={labelStyle}>Name</label>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          required
          style={inputStyle}
          placeholder="Your name"
        />
      </div>
      <div>
        <label style={labelStyle}>Email</label>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          style={inputStyle}
          placeholder="you@example.com"
        />
      </div>
      <div>
        <label style={labelStyle}>Password</label>
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          style={inputStyle}
          placeholder="••••••••"
        />
      </div>
      {error && <p style={{ color: '#ef4444', fontSize: '0.875rem', margin: 0 }}>{error}</p>}
      <button type="submit" disabled={loading} style={btnStyle}>
        {loading ? <Spinner size={16} /> : 'Create Account'}
      </button>
      <p style={{ textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-muted)', margin: 0 }}>
        Have an account? <Link to="/login" style={{ color: 'var(--accent)' }}>Sign In</Link>
      </p>
    </form>
  );
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: '0.8rem', fontWeight: 600,
  color: 'var(--text-secondary)', marginBottom: 6
};
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '8px 12px', borderRadius: 8,
  border: '1px solid var(--border)', background: 'var(--bg)',
  color: 'var(--text-primary)', fontSize: '0.9rem', boxSizing: 'border-box'
};
const btnStyle: React.CSSProperties = {
  padding: '10px', borderRadius: 8, border: 'none',
  background: 'var(--accent)', color: '#fff', fontWeight: 600,
  fontSize: '0.9rem', cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
};