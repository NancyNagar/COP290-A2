import { useState, type FormEvent } from 'react';
import type { CreateProjectPayload } from '../../types/project';
import Spinner from '../common/spinner';

interface Props {
  onSubmit: (payload: CreateProjectPayload) => Promise<void>;
  onCancel: () => void;
}

export default function ProjectForm({ onSubmit, onCancel }: Props) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await onSubmit({ name, description: description || undefined });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <label style={lbl}>Project Name *</label>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          required
          style={inp}
          placeholder="My Project"
        />
      </div>
      <div>
        <label style={lbl}>Description</label>
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          rows={3}
          style={{ ...inp, resize: 'vertical' }}
          placeholder="What is this project about?"
        />
      </div>
      {error && <p style={{ color: '#ef4444', fontSize: '0.875rem', margin: 0 }}>{error}</p>}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button type="button" onClick={onCancel} style={cancelBtnStyle}>Cancel</button>
        <button type="submit" disabled={loading} style={submitBtnStyle}>
          {loading ? <Spinner size={14} /> : 'Create Project'}
        </button>
      </div>
    </form>
  );
}

const lbl: React.CSSProperties = {
  display: 'block', fontSize: '0.8rem', fontWeight: 600,
  color: 'var(--text-secondary)', marginBottom: 6
};
const inp: React.CSSProperties = {
  width: '100%', padding: '8px 12px', borderRadius: 8,
  border: '1px solid var(--border)', background: 'var(--bg)',
  color: 'var(--text-primary)', fontSize: '0.9rem', boxSizing: 'border-box'
};
const cancelBtnStyle: React.CSSProperties = {
  padding: '8px 16px', borderRadius: 8,
  border: '1px solid var(--border)', background: 'transparent',
  cursor: 'pointer', color: 'var(--text-secondary)', fontWeight: 500
};
const submitBtnStyle: React.CSSProperties = {
  padding: '8px 16px', borderRadius: 8, border: 'none',
  background: 'var(--accent)', color: '#fff', cursor: 'pointer',
  fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6
};