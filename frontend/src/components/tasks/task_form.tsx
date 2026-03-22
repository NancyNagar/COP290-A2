import { useState, type FormEvent } from 'react';
import type { CreateTaskPayload, TaskPriority, TaskType } from '../../types/task';
import { createTask } from '../../services/task_service';
import Spinner from '../common/spinner';
import type { Task } from '../../types/task';

interface Props {
  columnId: string;
  reporterId: string;
  boardId: string; 
  stories?: Task[];
  onSuccess: () => void;
  onCancel: () => void;
}

export default function TaskForm({ columnId, boardId, stories = [], reporterId, onSuccess, onCancel }: Props) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [type, setType] = useState<TaskType>('task');
  const [assigneeId, setAssigneeId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [parentId, setParentId] = useState('');
  

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const payload: CreateTaskPayload = {
      title,
      columnId: type === 'story' ? undefined : columnId,
      boardId: type === 'story' ? boardId : undefined,
      priority, type, reporterId,
      description: description || undefined,
      assigneeId: assigneeId || undefined,
      dueDate: dueDate || undefined,
      parentId: parentId || undefined,
    };
    try {
      await createTask(payload);
      onSuccess();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div>
        <label style={lbl}>Title *</label>
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          required
          style={inp}
          placeholder="Task title"
        />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label style={lbl}>Type</label>
          <select value={type} onChange={e => setType(e.target.value as TaskType)} style={inp}>
            <option value="task">Task</option>
            <option value="bug">Bug</option>
            <option value="story">Story</option>
          </select>
        </div>
        <div>
          <label style={lbl}>Priority</label>
          <select value={priority} onChange={e => setPriority(e.target.value as TaskPriority)} style={inp}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>
      </div>
      {stories.length > 0 && type !== 'story' && (
        <div>
          <label style={lbl}>Link to Story (optional)</label>
          <select
            value={parentId}
            onChange={e => setParentId(e.target.value)}
            style={inp}
          >
            <option value="">— None —</option>
            {stories.map(s => (
              <option key={s.id} value={s.id}>{s.title}</option>
            ))}
          </select>
        </div>
      )}
      <div>
        <label style={lbl}>Description</label>
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          rows={3}
          style={{ ...inp, resize: 'vertical' }}
        />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label style={lbl}>Assignee ID</label>
          <input
            value={assigneeId}
            onChange={e => setAssigneeId(e.target.value)}
            style={inp}
            placeholder="User ID"
          />
        </div>
        <div>
          <label style={lbl}>Due Date</label>
          <input
            type="date"
            value={dueDate}
            onChange={e => setDueDate(e.target.value)}
            style={inp}
          />
        </div>
      </div>
      {error && <p style={{ color: '#ef4444', margin: 0, fontSize: '0.875rem' }}>{error}</p>}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button type="button" onClick={onCancel} style={cancelBtn}>Cancel</button>
        <button type="submit" disabled={loading} style={submitBtn}>
          {loading ? <Spinner size={14} /> : 'Create Task'}
        </button>
      </div>
    </form>
  );
}

const lbl: React.CSSProperties = {
  display: 'block', fontSize: '0.8rem',
  fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 5
};
const inp: React.CSSProperties = {
  width: '100%', padding: '8px 10px', borderRadius: 8,
  border: '1px solid var(--border)', background: 'var(--bg)',
  color: 'var(--text-primary)', fontSize: '0.875rem', boxSizing: 'border-box'
};
const cancelBtn: React.CSSProperties = {
  padding: '8px 16px', borderRadius: 8,
  border: '1px solid var(--border)', background: 'transparent',
  cursor: 'pointer', color: 'var(--text-secondary)'
};
const submitBtn: React.CSSProperties = {
  padding: '8px 16px', borderRadius: 8, border: 'none',
  background: 'var(--accent)', color: '#fff', cursor: 'pointer',
  fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6
};