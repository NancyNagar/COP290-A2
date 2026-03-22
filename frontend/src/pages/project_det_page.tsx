import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { Project } from '../types/project';
import type { ProjectMember } from '../types/user';
import {
  getProjects, getProjectMembers,
  archiveProject, deleteProject,
  upsertProjectMember
} from '../services/project_service';
import { getBoards, createBoard } from '../services/board_service';
import type { Board } from '../types/board';
import MemberList from '../components/projects/member_list';
import Modal from '../components/common/modal';
import Spinner from '../components/common/spinner';
import Badge from '../components/common/badge';
import { useAuth } from '../context/auth_context';

export default function ProjectDetailPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddMember, setShowAddMember] = useState(false);
  const [addUserId, setAddUserId] = useState('');
  const [addRole, setAddRole] = useState<'project_admin' | 'project_member' | 'project_viewer'>('project_member');
  const [addError, setAddError] = useState('');

  const myMembership = members.find(m => m.userId === user?.id);
  const canManage = user?.role === 'admin' || myMembership?.role === 'project_admin';

  async function load() {
    if (!projectId) return;
    try {
      const [allProjects, memberData, boardData] = await Promise.all([
        getProjects(),
        getProjectMembers(projectId),
        getBoards(projectId),
      ]);
      setProject(allProjects.find(p => p.id === projectId) ?? null);
      setMembers(memberData);
      setBoards(boardData);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, [projectId]);

  async function handleAddMember(e: React.FormEvent) {
    e.preventDefault();
    setAddError('');
    try {
      await upsertProjectMember(projectId!, { userId: addUserId, role: addRole });
      setShowAddMember(false);
      setAddUserId('');
      void load();
    } catch (err) { setAddError((err as Error).message); }
  }

  async function handleCreateBoard() {
    const name = prompt('Board name:');
    if (!name) return;
    try {
      const board = await createBoard(projectId!, { name });
      navigate(`/projects/${projectId}/boards/${board.id}`);
    } catch (err) { alert((err as Error).message); }
  }

  async function handleArchive() {
    if (!confirm('Archive this project?')) return;
    try { await archiveProject(projectId!); void load(); }
    catch (err) { alert((err as Error).message); }
  }

  async function handleDelete() {
    if (!confirm('Permanently delete this project? This cannot be undone.')) return;
    try { await deleteProject(projectId!); navigate('/dashboard'); }
    catch (err) { alert((err as Error).message); }
  }

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
      <Spinner size={36} />
    </div>
  );
  if (!project) return <p>Project not found.</p>;

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'flex-start',
        justifyContent: 'space-between', marginBottom: 28
      }}>
        <div>
          <button
            onClick={() => navigate('/dashboard')}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--text-muted)', fontSize: '0.875rem',
              padding: 0, marginBottom: 4
            }}
          >
            ← Projects
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {project.name}
            </h1>
            {project.isArchived && <Badge label="Archived" variant="archived" />}
          </div>
          {project.description && (
            <p style={{ margin: '6px 0 0', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              {project.description}
            </p>
          )}
        </div>
        {canManage && (
          <div style={{ display: 'flex', gap: 8 }}>
            {!project.isArchived && (
              <button onClick={() => void handleArchive()} style={actionBtn}>Archive</button>
            )}
            <button
              onClick={() => void handleDelete()}
              style={{ ...actionBtn, color: '#ef4444', borderColor: '#ef4444' }}
            >
              Delete
            </button>
          </div>
        )}
      </div>

      {/* Boards section */}
      <section style={{ marginBottom: 32 }}>
        <div style={{
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', marginBottom: 14
        }}>
          <h2 style={sectionTitle}>Boards</h2>
          {canManage && (
            <button onClick={() => void handleCreateBoard()} style={primaryBtn}>
              + New Board
            </button>
          )}
        </div>
        {boards.length === 0
          ? <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              No boards yet.{canManage ? ' Create one to get started.' : ''}
            </p>
          : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
              gap: 12
            }}>
              {boards.map(b => (
                <div
                  key={b.id}
                  onClick={() => navigate(`/projects/${projectId}/boards/${b.id}`)}
                  style={{
                    background: 'var(--surface)', border: '1px solid var(--border)',
                    borderRadius: 10, padding: '18px', cursor: 'pointer', transition: 'all 0.15s'
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
                  }}
                >
                  <p style={{ margin: '0 0 6px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {b.name}
                  </p>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {b.columns.length} columns
                  </p>
                </div>
              ))}
            </div>
          )
        }
      </section>

      {/* Members section */}
      <section>
        <div style={{
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', marginBottom: 14
        }}>
          <h2 style={sectionTitle}>Members ({members.length})</h2>
          {canManage && (
            <button onClick={() => setShowAddMember(true)} style={primaryBtn}>
              + Add Member
            </button>
          )}
        </div>
        <MemberList
          projectId={projectId!}
          members={members}
          canManage={canManage}
          onRefresh={load}
        />
      </section>

      {/* Add member modal */}
      {showAddMember && (
        <Modal title="Add Member" onClose={() => setShowAddMember(false)}>
          <form onSubmit={handleAddMember} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={lbl}>User ID *</label>
              <input
                value={addUserId}
                onChange={e => setAddUserId(e.target.value)}
                required
                style={inp}
                placeholder="Paste user ID"
              />
            </div>
            <div>
              <label style={lbl}>Role</label>
              <select
                value={addRole}
                onChange={e => setAddRole(e.target.value as typeof addRole)}
                style={inp}
              >
                <option value="project_admin">Admin</option>
                <option value="project_member">Member</option>
                <option value="project_viewer">Viewer</option>
              </select>
            </div>
            {addError && <p style={{ color: '#ef4444', margin: 0, fontSize: '0.875rem' }}>{addError}</p>}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setShowAddMember(false)} style={cancelBtn}>Cancel</button>
              <button type="submit" style={primaryBtn}>Add</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

const sectionTitle: React.CSSProperties = {
  margin: 0, fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)'
};
const primaryBtn: React.CSSProperties = {
  padding: '7px 14px', borderRadius: 8, border: 'none',
  background: 'var(--accent)', color: '#fff', fontWeight: 600,
  cursor: 'pointer', fontSize: '0.8rem'
};
const actionBtn: React.CSSProperties = {
  padding: '7px 14px', borderRadius: 8,
  border: '1px solid var(--border)', background: 'transparent',
  cursor: 'pointer', fontSize: '0.8rem', color: 'var(--text-secondary)'
};
const lbl: React.CSSProperties = {
  display: 'block', fontSize: '0.8rem', fontWeight: 600,
  color: 'var(--text-secondary)', marginBottom: 6
};
const inp: React.CSSProperties = {
  width: '100%', padding: '8px 12px', borderRadius: 8,
  border: '1px solid var(--border)', background: 'var(--bg)',
  color: 'var(--text-primary)', fontSize: '0.875rem', boxSizing: 'border-box'
};
const cancelBtn: React.CSSProperties = {
  padding: '8px 16px', borderRadius: 8,
  border: '1px solid var(--border)', background: 'transparent',
  cursor: 'pointer', color: 'var(--text-secondary)'
};