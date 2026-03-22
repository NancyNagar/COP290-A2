import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Task } from '../../types/task';
import { getStoriesByBoard } from '../../services/board_service';
import { createTask } from '../../services/task_service';
import Badge from '../common/badge';
import Spinner from '../common/spinner';
import { useAuth } from '../../context/auth_context';

interface Props {
  projectId: string;
  boardId: string;
  canManage: boolean;
}

export default function StoriesPanel({ projectId, boardId, canManage }: Props) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stories, setStories] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    try {
      const data = await getStoriesByBoard(projectId, boardId);
      setStories(data);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, [boardId]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim() || !user) return;
    setCreating(true);
    setError('');
    try {
      await createTask({
        title: newTitle,
        boardId,
        priority: 'medium',
        type: 'story',
        reporterId: user.id,
      });
      setNewTitle('');
      setShowForm(false);
      void load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setCreating(false);
    }
  }

  return (
    <div style={{
      marginBottom: 20,
      border: '1px solid var(--border)',
      borderRadius: 10,
      background: 'var(--surface)',
      overflow: 'hidden',
    }}>
      {/* Panel header */}
      <div style={{
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 16px',
        borderBottom: collapsed ? 'none' : '1px solid var(--border)',
        background: 'var(--accent-subtle)',
        cursor: 'pointer',
      }}
        onClick={() => setCollapsed(c => !c)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent)' }}>
            {collapsed ? '▶' : '▼'}
          </span>
          <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
            Stories
          </span>
          <span style={{
            background: 'var(--accent)', color: '#fff',
            borderRadius: 99, fontSize: '0.7rem',
            fontWeight: 700, padding: '1px 7px'
          }}>
            {stories.length}
          </span>
        </div>
        {canManage && !collapsed && (
          <button
            onClick={e => { e.stopPropagation(); setShowForm(s => !s); }}
            style={{
              padding: '4px 10px', borderRadius: 6, border: 'none',
              background: 'var(--accent)', color: '#fff',
              fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer'
            }}
          >
            + Story
          </button>
        )}
      </div>

      {!collapsed && (
        <div style={{ padding: '12px 16px' }}>

          {/* Create story form */}
          {showForm && (
            <form onSubmit={handleCreate} style={{
              display: 'flex', gap: 8, marginBottom: 12, alignItems: 'center'
            }}>
              <input
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                placeholder="Story title..."
                autoFocus
                required
                style={{
                  flex: 1, padding: '6px 10px', borderRadius: 6,
                  border: '1px solid var(--accent)', background: 'var(--bg)',
                  color: 'var(--text-primary)', fontSize: '0.875rem'
                }}
              />
              <button type="submit" disabled={creating} style={{
                padding: '6px 14px', borderRadius: 6, border: 'none',
                background: 'var(--accent)', color: '#fff',
                fontWeight: 600, cursor: 'pointer', fontSize: '0.8rem'
              }}>
                {creating ? <Spinner size={12} /> : 'Add'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} style={{
                padding: '6px 10px', borderRadius: 6,
                border: '1px solid var(--border)', background: 'transparent',
                cursor: 'pointer', fontSize: '0.8rem', color: 'var(--text-muted)'
              }}>
                Cancel
              </button>
            </form>
          )}
          {error && <p style={{ color: '#ef4444', fontSize: '0.8rem', margin: '0 0 8px' }}>{error}</p>}

          {/* Stories list */}
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 16 }}>
              <Spinner size={20} />
            </div>
          ) : stories.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0 }}>
              No stories yet.{canManage ? ' Click "+ Story" to create one.' : ''}
            </p>
          ) : (
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {stories.map(story => (
                <div
                  key={story.id}
                  onClick={() => navigate(`/tasks/${story.id}`)}
                  style={{
                    background: 'var(--bg)', border: '1px solid var(--border)',
                    borderRadius: 8, padding: '10px 14px',
                    cursor: 'pointer', minWidth: 200, maxWidth: 280,
                    transition: 'box-shadow 0.15s'
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
                  }}
                >
                  {/* Story title + status */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                    <Badge label="story" variant="story" />
                    <span style={{
                      fontSize: '0.75rem', color: 'var(--text-muted)',
                      border: '1px solid var(--border)',
                      borderRadius: 99, padding: '1px 6px'
                    }}>
                      {story.status}
                    </span>
                  </div>
                  <p style={{
                    margin: '0 0 8px', fontWeight: 600,
                    fontSize: '0.875rem', color: 'var(--text-primary)',
                    lineHeight: 1.4
                  }}>
                    {story.title}
                  </p>

                  {/* Children */}
                  {story.children && story.children.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {story.children.map(child => (
                        <div key={child.id} style={{
                          display: 'flex', alignItems: 'center', gap: 6,
                          fontSize: '0.75rem', color: 'var(--text-secondary)'
                        }}>
                          <Badge label={child.type} variant={child.type} />
                          <span style={{
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                          }}>
                            {child.title}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      No subtasks yet
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}