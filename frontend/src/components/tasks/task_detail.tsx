import { useState, useEffect } from 'react';
import type{ Task, UpdateTaskPayload, TaskPriority } from '../../types/task';
import { getTaskById, updateTask, deleteTask } from '../../services/task_service';
import Badge from '../common/badge';
import Avatar from '../common/avatar';
import ActivityTimeline from './activity_timeline';
import Spinner from '../common/spinner';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/auth_context';

export default function TaskDetail({ taskId }: { taskId: string }) {
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editPriority, setEditPriority] = useState<TaskPriority>('medium');
  const navigate = useNavigate();
  const { user } = useAuth();
  const [editAssigneeId, setEditAssigneeId] = useState('');

  async function load() {
    try {
      const data = await getTaskById(taskId);
      setTask(data);
      setEditTitle(data.title);
      setEditDesc(data.description ?? '');
      setEditPriority(data.priority);
      setEditAssigneeId(data.assigneeId ?? '');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, [taskId]);

  async function handleSave() {
    if (!task) return;
    const updates: UpdateTaskPayload = {};
    if (editTitle !== task.title) updates.title = editTitle;
    if (editDesc !== (task.description ?? '')) updates.description = editDesc;
    if (editPriority !== task.priority) updates.priority = editPriority;
    if (Object.keys(updates).length === 0) { setEditing(false); return; }
    if (editAssigneeId !== (task.assigneeId ?? '')) updates.assigneeId = editAssigneeId || null;
    try {
      const updated = await updateTask(taskId, updates);
      setTask(updated);
      setEditing(false);
    } catch (err) { alert((err as Error).message); }
  }

  async function handleDelete() {
    if (!confirm('Delete this task?')) return;
    try {
      await deleteTask(taskId);
      navigate(-1);
    } catch (err) { alert((err as Error).message); }
  }

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
      <Spinner size={32} />
    </div>
  );
  if (!task) return <p>Task not found.</p>;

  const canEdit = user?.role === 'admin'
    || user?.id === task.reporterId
    || user?.id === task.assigneeId;

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'flex-start',
        justifyContent: 'space-between', marginBottom: 20, gap: 16
      }}>
        <div style={{ flex: 1 }}>
          {editing ? (
            <input
              value={editTitle}
              onChange={e => setEditTitle(e.target.value)}
              style={{
                width: '100%', fontSize: '1.4rem', fontWeight: 700,
                padding: '4px 8px', border: '1px solid var(--accent)',
                borderRadius: 6, background: 'var(--bg)',
                color: 'var(--text-primary)', boxSizing: 'border-box'
              }}
            />
          ) : (
            <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {task.title}
            </h1>
          )}
          <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
            <Badge label={task.type} variant={task.type} />
            {editing ? (
              <select
                value={editPriority}
                onChange={e => setEditPriority(e.target.value as TaskPriority)}
                style={{ padding: '1px 6px', borderRadius: 6, border: '1px solid var(--border)', fontSize: '0.8rem' }}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            ) : (
              <Badge label={task.priority} variant={task.priority} />
            )}
            <span style={{
              fontSize: '0.8rem', color: 'var(--text-muted)',
              padding: '2px 8px', background: 'var(--bg)',
              borderRadius: 100, border: '1px solid var(--border)'
            }}>
              {task.status}
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {canEdit && !editing && (
            <button onClick={() => setEditing(true)} style={editBtn}>Edit</button>
          )}
          {editing && (
            <>
              <button
                onClick={() => void handleSave()}
                style={{ ...editBtn, background: 'var(--accent)', color: '#fff', border: 'none' }}
              >
                Save
              </button>
              <button onClick={() => setEditing(false)} style={editBtn}>Cancel</button>
            </>
          )}
          {canEdit && (
            <button
              onClick={() => void handleDelete()}
              style={{ ...editBtn, color: '#ef4444', borderColor: '#ef4444' }}
            >
              Delete
            </button>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 260px', gap: 24 }}>
        {/* Main content */}
        <div>
          <section style={{ marginBottom: 24 }}>
            <h3 style={sectionTitle}>Description</h3>
            {editing ? (
              <textarea
                value={editDesc}
                onChange={e => setEditDesc(e.target.value)}
                rows={5}
                style={{
                  width: '100%', padding: '8px 10px', borderRadius: 8,
                  border: '1px solid var(--border)', background: 'var(--bg)',
                  color: 'var(--text-primary)', fontSize: '0.875rem',
                  resize: 'vertical', boxSizing: 'border-box'
                }}
              />
            ) : (
              <p style={{
                color: task.description ? 'var(--text-primary)' : 'var(--text-muted)',
                fontSize: '0.9rem', lineHeight: 1.6, margin: 0
              }}>
                {task.description || 'No description provided.'}
              </p>
            )}
          </section>

          {task.children && task.children.length > 0 && (
            <section style={{ marginBottom: 24 }}>
              <h3 style={sectionTitle}>Subtasks ({task.children.length})</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {task.children.map(child => (
                  <div
                    key={child.id}
                    onClick={() => navigate(`/tasks/${child.id}`)}
                    style={{
                      padding: '8px 12px', border: '1px solid var(--border)',
                      borderRadius: 8, cursor: 'pointer',
                      display: 'flex', gap: 8, alignItems: 'center'
                    }}
                  >
                    <Badge label={child.type} variant={child.type} />
                    <span style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                      {child.title}
                    </span>
                    <span style={{ marginLeft: 'auto', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {child.status}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section>
            <h3 style={sectionTitle}>Activity</h3>
            <ActivityTimeline task={task} onRefresh={load} />
          </section>
        </div>

        {/* Right sidebar metadata */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={metaCard}>
            <p style={metaLabel}>Reporter</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Avatar user={task.reporter} size={28} />
              <span style={{ fontSize: '0.875rem' }}>{task.reporter.name}</span>
            </div>
          </div>
          <div style={metaCard}>
            <p style={metaLabel}>Assignee</p>
            {editing ? (
              <input
                value={editAssigneeId}
                onChange={e => setEditAssigneeId(e.target.value)}
                placeholder="User ID"
                style={{
                  width: '100%', padding: '6px 8px', borderRadius: 6,
                  border: '1px solid var(--border)', fontSize: '0.8rem',
                  background: 'var(--bg)', color: 'var(--text-primary)',
                  boxSizing: 'border-box'
                }}
              />
            ) : task.assignee ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Avatar user={task.assignee} size={28} />
                <span style={{ fontSize: '0.875rem' }}>{task.assignee.name}</span>
              </div>
            ) : (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0 }}>Unassigned</p>
            )}
          </div>
          {task.dueDate && (
            <div style={metaCard}>
              <p style={metaLabel}>Due Date</p>
              <p style={{
                margin: 0, fontSize: '0.875rem',
                color: new Date(task.dueDate) < new Date() ? '#ef4444' : 'var(--text-primary)'
              }}>
                {new Date(task.dueDate).toLocaleDateString()}
              </p>
            </div>
          )}
          <div style={metaCard}>
            <p style={metaLabel}>Created</p>
            <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              {new Date(task.createdAt).toLocaleString()}
            </p>
          </div>
          {task.resolvedAt && (
            <div style={metaCard}>
              <p style={metaLabel}>Resolved</p>
              <p style={{ margin: 0, fontSize: '0.875rem' }}>
                {new Date(task.resolvedAt).toLocaleString()}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const sectionTitle: React.CSSProperties = {
  margin: '0 0 12px', fontSize: '0.875rem', fontWeight: 600,
  color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em'
};
const metaCard: React.CSSProperties = {
  background: 'var(--surface)', border: '1px solid var(--border)',
  borderRadius: 8, padding: '12px 14px'
};
const metaLabel: React.CSSProperties = {
  margin: '0 0 6px', fontSize: '0.72rem', fontWeight: 600,
  color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em'
};
const editBtn: React.CSSProperties = {
  padding: '6px 12px', borderRadius: 6,
  border: '1px solid var(--border)', background: 'transparent',
  cursor: 'pointer', fontSize: '0.8rem', color: 'var(--text-secondary)'
};