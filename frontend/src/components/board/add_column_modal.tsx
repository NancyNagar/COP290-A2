import { useState, type FormEvent }  from 'react';
import { createColumn } from '../../services/column_service';
import Spinner from '../common/spinner';

interface Props {
  boardId: string;
  nextOrder: number;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function AddColumnModal({ boardId, nextOrder, onSuccess, onCancel }: Props) {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await createColumn(boardId, { name, order: nextOrder });
      onSuccess();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <label style={{
          display: 'block', fontSize: '0.8rem',
          fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6
        }}>
          Column Name *
        </label>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          required
          autoFocus
          style={{
            width: '100%', padding: '8px 12px', borderRadius: 8,
            border: '1px solid var(--border)', background: 'var(--bg)',
            color: 'var(--text-primary)', fontSize: '0.9rem', boxSizing: 'border-box'
          }}
        />
      </div>
      {error && <p style={{ color: '#ef4444', margin: 0, fontSize: '0.875rem' }}>{error}</p>}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button type="button" onClick={onCancel} style={{
          padding: '8px 16px', borderRadius: 8,
          border: '1px solid var(--border)', background: 'transparent',
          cursor: 'pointer', color: 'var(--text-secondary)'
        }}>
          Cancel
        </button>
        <button type="submit" disabled={loading} style={{
          padding: '8px 16px', borderRadius: 8, border: 'none',
          background: 'var(--accent)', color: '#fff', cursor: 'pointer',
          fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6
        }}>
          {loading ? <Spinner size={14} /> : 'Add Column'}
        </button>
      </div>
    </form>
  );
}