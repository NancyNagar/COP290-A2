import { useState,type DragEvent } from 'react';
import type { Column as ColumnType} from '../../types/board';
import type { Task } from '../../types/task';
import TaskCard from './task_card';
import TaskForm from '../tasks/task_form';
import Modal from '../common/modal';
import { deleteColumn, updateColumn, updateWipLimit } from '../../services/column_service';
import { useAuth } from '../../context/auth_context';

interface Props {
  column: ColumnType;
  tasks: Task[];
  canManage: boolean;
  isDraggingTask: boolean;
  onTaskDragStart: (taskId: string) => void;
  onTaskDrop: (colId: string, colName: string) => Promise<void>;
  isDraggingColumn: boolean;
  onColumnDragStart: (colId: string) => void;
  onColumnDrop: (colId: string) => Promise<void>;
  onRefresh: () => void;
}

export default function Column({
  column, tasks, canManage,
  isDraggingTask, onTaskDragStart, onTaskDrop,
  isDraggingColumn, onColumnDragStart, onColumnDrop,
  onRefresh
}: Props) {
  const { user } = useAuth();
  const [isDragOver, setIsDragOver] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState(column.name);
  const wipFull = column.wipLimit != null && tasks.length >= column.wipLimit;

  function handleDragOver(e: DragEvent) {
    e.preventDefault();
    setIsDragOver(true);
  }

  function handleDragLeave() { setIsDragOver(false); }

  async function handleDrop(e: DragEvent) {
    e.preventDefault();
    setIsDragOver(false);
    if (isDraggingTask) await onTaskDrop(column.id, column.name);
    else await onColumnDrop(column.id);
  }

  async function handleRename() {
    if (!newName.trim() || newName === column.name) {
      setEditingName(false);
      return;
    }
    try {
      await updateColumn(column.id, newName);
      onRefresh();
    } catch (err) { alert((err as Error).message); }
    setEditingName(false);
  }

  async function handleDelete() {
    if (!confirm('Delete this column and all its tasks?')) return;
    try {
      await deleteColumn(column.id);
      onRefresh();
    } catch (err) { alert((err as Error).message); }
  }

  async function handleWipLimit() {
    const input = prompt('Set WIP limit (leave blank to remove):', column.wipLimit?.toString() ?? '');
    if (input === null) return;
    const val = input === '' ? null : parseInt(input);
    if (val !== null && (isNaN(val) || val < 1)) {
      alert('WIP limit must be a positive number');
      return;
    }
    try {
      await updateWipLimit(column.id, val);
      onRefresh();
    } catch (err) { alert((err as Error).message); }
  }

  return (
    <div
      draggable={canManage}
      onDragStart={() => onColumnDragStart(column.id)}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      style={{
        width: 280,
        flexShrink: 0,
        background: isDragOver ? 'var(--accent-subtle)' : 'var(--surface)',
        border: `1px solid ${isDragOver ? 'var(--accent)' : 'var(--border)'}`,
        borderRadius: 10,
        display: 'flex',
        flexDirection: 'column',
        transition: 'all 0.15s',
        opacity: isDraggingColumn ? 0.7 : 1,
      }}
    >
      {/* Column header */}
      <div style={{
        padding: '12px 14px',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        gap: 8
      }}>
        {editingName && canManage ? (
          <input
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onBlur={() => void handleRename()}
            onKeyDown={e => {
              if (e.key === 'Enter') void handleRename();
              if (e.key === 'Escape') setEditingName(false);
            }}
            autoFocus
            style={{
              flex: 1, padding: '2px 6px', borderRadius: 4,
              border: '1px solid var(--accent)', background: 'var(--bg)',
              color: 'var(--text-primary)', fontSize: '0.875rem', fontWeight: 600
            }}
          />
        ) : (
          <span
            onDoubleClick={() => canManage && setEditingName(true)}
            style={{
              flex: 1, fontWeight: 600, fontSize: '0.875rem',
              color: 'var(--text-primary)',
              cursor: canManage ? 'pointer' : 'default'
            }}
            title={canManage ? 'Double-click to rename' : undefined}
          >
            {column.name}
          </span>
        )}
        <span style={{
          background: wipFull ? '#fee2e2' : 'var(--bg)',
          color: wipFull ? '#991b1b' : 'var(--text-muted)',
          borderRadius: 99, padding: '1px 7px',
          fontSize: '0.72rem', fontWeight: 700
        }}>
          {tasks.length}{column.wipLimit != null ? `/${column.wipLimit}` : ''}
        </span>
        {canManage && (
          <div style={{ display: 'flex', gap: 4 }}>
            <button onClick={handleWipLimit} title="Set WIP limit" style={iconBtnStyle}>⚙</button>
            <button onClick={handleDelete} title="Delete column" style={{ ...iconBtnStyle, color: '#ef4444' }}>✕</button>
          </div>
        )}
      </div>

      {/* Tasks */}
      <div style={{
        flex: 1, padding: '10px',
        display: 'flex', flexDirection: 'column', gap: 8,
        overflowY: 'auto', minHeight: 80
      }}>
        {tasks.filter(t => t.type !== 'story').map(task => (
          <TaskCard
            key={task.id}
            task={task}
            onDragStart={() => onTaskDragStart(task.id)}
            onRefresh={onRefresh}
          />
        ))}
      </div>

      {/* Add task footer */}
      {!wipFull && user && (
        <div style={{ padding: '8px 10px', borderTop: '1px solid var(--border)' }}>
          <button
            onClick={() => setShowTaskForm(true)}
            style={{
              width: '100%', padding: '6px', borderRadius: 6,
              border: '1px dashed var(--border)', background: 'transparent',
              color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.8rem'
            }}
          >
            + Add Task
          </button>
        </div>
      )}
      {wipFull && (
        <p style={{
          padding: '8px 14px', fontSize: '0.75rem',
          color: '#991b1b', margin: 0, borderTop: '1px solid var(--border)'
        }}>
          WIP limit reached
        </p>
      )}

      {showTaskForm && user && (
        <Modal title="Create Task" onClose={() => setShowTaskForm(false)}>
          <TaskForm
            columnId={column.id}
            boardId={column.boardId}
            reporterId={user.id}
            onSuccess={() => { setShowTaskForm(false); onRefresh(); }}
            onCancel={() => setShowTaskForm(false)}
          />
        </Modal>
      )}
    </div>
  );
}

const iconBtnStyle: React.CSSProperties = {
  background: 'none', border: 'none', cursor: 'pointer',
  color: 'var(--text-muted)', padding: '2px 4px', borderRadius: 4, fontSize: '0.8rem'
};