import { useState } from 'react';
import type { Board as BoardType, Column } from '../../types/board';
import ColumnComponent from './column';
import { moveTask } from '../../services/task_service';
import { reorderColumns } from '../../services/column_service';

interface Props {
  projectId: string;
  board: BoardType;
  canManage: boolean;
  onRefresh: () => void;
}

export default function Board({ board: initialBoard, projectId, canManage, onRefresh }: Props) {
  const [board, setBoard] = useState<BoardType>(initialBoard);
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);
  const [draggingColumnId, setDraggingColumnId] = useState<string | null>(null);

  function handleTaskDragStart(taskId: string) {
    setDraggingTaskId(taskId);
  }

  async function handleTaskDrop(targetColumnId: string, targetColumnName: string) {
    if (!draggingTaskId || !board) return;
    const sourceCol = board.columns.find(c => c.tasks?.some(t => t.id === draggingTaskId));
    if (!sourceCol || sourceCol.id === targetColumnId) {
      setDraggingTaskId(null);
      return;
    }

    // Optimistic update
    setBoard(prev => {
      if (!prev) return prev;
      const task = prev.columns.flatMap(c => c.tasks ?? []).find(t => t.id === draggingTaskId);
      if (!task) return prev;
      return {
        ...prev,
        columns: prev.columns.map(col => {
          if (col.id === sourceCol.id) return { ...col, tasks: (col.tasks ?? []).filter(t => t.id !== draggingTaskId) };
          if (col.id === targetColumnId) return { ...col, tasks: [...(col.tasks ?? []), { ...task, columnId: targetColumnId, status: targetColumnName }] };
          return col;
        }),
      };
    });

    try {
      await moveTask(draggingTaskId, targetColumnId);
    } catch (err) {
      alert((err as Error).message);
      onRefresh();
    } finally {
      setDraggingTaskId(null);
    }
  }

  function handleColumnDragStart(columnId: string) {
    setDraggingColumnId(columnId);
  }

  async function handleColumnDrop(targetColumnId: string) {
    if (!draggingColumnId || !board || draggingColumnId === targetColumnId) {
      setDraggingColumnId(null);
      return;
    }
    const cols = [...board.columns];
    const fromIdx = cols.findIndex(c => c.id === draggingColumnId);
    const toIdx = cols.findIndex(c => c.id === targetColumnId);
    cols.splice(toIdx, 0, cols.splice(fromIdx, 1)[0] as Column);
    setBoard(prev => prev ? { ...prev, columns: cols.map((c, i) => ({ ...c, order: i })) } : prev);
    try {
      await reorderColumns(initialBoard.id, cols.map(c => c.id));
    } catch (err) {
      alert((err as Error).message);
      onRefresh();
    } finally {
      setDraggingColumnId(null);
    }
  }

  if (!board) return null;

  return (
    <div style={{
      display: 'flex', gap: 16,
      overflowX: 'auto', paddingBottom: 16,
      minHeight: 'calc(100vh - 180px)'
    }}>
      {board.columns.map(col => (
        <ColumnComponent
          projectId={projectId}
          key={col.id}
          column={col}
          tasks={col.tasks ?? []}
          canManage={canManage}
          isDraggingTask={!!draggingTaskId}
          onTaskDragStart={handleTaskDragStart}
          onTaskDrop={handleTaskDrop}
          isDraggingColumn={!!draggingColumnId}
          onColumnDragStart={handleColumnDragStart}
          onColumnDrop={handleColumnDrop}
          onRefresh={onRefresh}
        />
      ))}
    </div>
  );
}