import { useState } from 'react';
import { createComment } from '../../services/comment_service';
import Spinner from '../common/spinner';
import { useAuth } from '../../context/auth_context';

interface Props {
  taskId: string;
  onRefresh: () => void;
}

export default function CommentThread({ taskId, onRefresh }: Props) {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { user } = useAuth();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    setLoading(true);
    setError('');
    try {
      await createComment(taskId, { content });
      setContent('');
      onRefresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  if (!user) return null;

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <label style={{
        fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)'
      }}>
        Add Comment
      </label>
      <textarea
        value={content}
        onChange={e => setContent(e.target.value)}
        placeholder="Write a comment... Use @username to mention someone"
        rows={3}
        style={{
          width: '100%', padding: '10px 12px', borderRadius: 8,
          border: '1px solid var(--border)', background: 'var(--bg)',
          color: 'var(--text-primary)', fontSize: '0.875rem',
          resize: 'vertical', boxSizing: 'border-box', lineHeight: 1.5
        }}
      />
      {error && <p style={{ color: '#ef4444', margin: 0, fontSize: '0.8rem' }}>{error}</p>}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          type="submit"
          disabled={loading || !content.trim()}
          style={{
            padding: '8px 16px', borderRadius: 8, border: 'none',
            background: 'var(--accent)', color: '#fff', cursor: 'pointer',
            fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6,
            opacity: !content.trim() ? 0.5 : 1
          }}
        >
          {loading ? <Spinner size={14} /> : 'Comment'}
        </button>
      </div>
    </form>
  );
}
