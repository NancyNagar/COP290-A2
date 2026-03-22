import type { Task } from '../../types/task';
import Badge from '../common/badge';
import Avatar from '../common/avatar';
import { useNavigate } from 'react-router-dom';
import type { TaskPriority, TaskType } from '../../types/task';

interface Props {
  task: Task;
  onDragStart: () => void;
  onRefresh: () => void;
}

export default function TaskCard({ task, onDragStart }: Props) {
  const navigate = useNavigate();

  function handleDragStart(e: React.DragEvent) {
    e.stopPropagation();
    onDragStart();
  }

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onClick={() => navigate(`/tasks/${task.id}`)}
      style={{
        background: 'var(--bg)',
        border: '1px solid var(--border)',
        borderRadius: 8,
        padding: '10px 12px',
        cursor: 'pointer',
        transition: 'box-shadow 0.15s',
        userSelect: 'none'
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
      }}
    >
      <div style={{ display: 'flex', gap: 6, marginBottom: 6, flexWrap: 'wrap' }}>
        <Badge label={task.type} variant={task.type as TaskType} />
        <Badge label={task.priority} variant={task.priority as TaskPriority} />
      </div>
      <p style={{
        margin: '0 0 8px', fontSize: '0.875rem',
        fontWeight: 500, color: 'var(--text-primary)', lineHeight: 1.4
      }}>
        {task.title}
      </p>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {task.dueDate && (
          <span style={{
            fontSize: '0.72rem',
            color: new Date(task.dueDate) < new Date() ? '#ef4444' : 'var(--text-muted)'
          }}>
            📅 {new Date(task.dueDate).toLocaleDateString()}
          </span>
        )}
        {task.assignee && <Avatar user={task.assignee} size={22} />}
      </div>
      {task.children && task.children.length > 0 && (
        <p style={{ margin: '6px 0 0', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
          📋 {task.children.length} subtask{task.children.length > 1 ? 's' : ''}
        </p>
      )}
    </div>
  );
}