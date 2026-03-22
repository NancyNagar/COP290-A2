import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { Board } from '../types/board';
import { getBoardById } from '../services/board_service';
import { getProjectMembers } from '../services/project_service';
import type { ProjectMember } from '../types/user';
import BoardComponent from '../components/board/board';
import AddColumnModal from '../components/board/add_column_modal';
import Modal from '../components/common/modal';
import Spinner from '../components/common/spinner';
import { useAuth } from '../context/auth_context';
import StoriesPanel from '../components/board/stories_panel';

export default function BoardPage() {
  const { projectId, boardId } = useParams<{ projectId: string; boardId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [board, setBoard] = useState<Board | null>(null);
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddColumn, setShowAddColumn] = useState(false);
  const [boardKey, setBoardKey] = useState(0);
  
  const myMembership = members.find(m => m.userId === user?.id);
  const canManage = user?.role === 'admin' || myMembership?.role === 'project_admin';

  async function load() {
    if (!boardId || !projectId) return;
    try {
      const [boardData, memberData] = await Promise.all([
        getBoardById(boardId),
        getProjectMembers(projectId),
      ]);
      setBoard(boardData);
      setMembers(memberData);
      setBoardKey(k => k + 1);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, [boardId, projectId]);

  const nextOrder = board?.columns.length ?? 0;

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
      <Spinner size={36} />
    </div>
  );
  if (!board) return <p>Board not found.</p>;

  return (
    <div>
      <div style={{
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', marginBottom: 20
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={() => navigate(`/projects/${projectId}`)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--text-muted)', fontSize: '0.875rem', padding: 0
            }}
          >
            ← Project
          </button>
          <h1 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            {board.name}
          </h1>
        </div>
        {canManage && (
          <button
            onClick={() => setShowAddColumn(true)}
            style={{
              padding: '7px 14px', borderRadius: 8, border: 'none',
              background: 'var(--accent)', color: '#fff',
              fontWeight: 600, cursor: 'pointer', fontSize: '0.8rem'
            }}
          >
            + Add Column
          </button>
        )}
      </div>

      <StoriesPanel projectId={projectId!} boardId={board.id} canManage={canManage} />
      <BoardComponent key={boardKey} projectId={projectId!} board={board} canManage={canManage} onRefresh={load} />

      {showAddColumn && (
        <Modal title="Add Column" onClose={() => setShowAddColumn(false)}>
          <AddColumnModal
            boardId={board.id}
            nextOrder={nextOrder}
            onSuccess={() => { setShowAddColumn(false); void load(); }}
            onCancel={() => setShowAddColumn(false)}
          />
        </Modal>
      )}
    </div>
  );
}
