import type { ProjectMember, ProjectRole } from '../../types/user';
import Avatar from '../common/avatar';
import Badge from '../common/badge';
import { removeProjectMember, upsertProjectMember } from '../../services/project_service';

interface Props {
  projectId: string;
  members: ProjectMember[];
  canManage: boolean;
  onRefresh: () => void;
}

export default function MemberList({ projectId, members, canManage, onRefresh }: Props) {
  async function handleRemove(userId: string) {
    if (!confirm('Remove this member?')) return;
    try {
      await removeProjectMember(projectId, userId);
      onRefresh();
    } catch (err) { alert((err as Error).message); }
  }

  async function handleRoleChange(userId: string, role: ProjectRole) {
    try {
      await upsertProjectMember(projectId, { userId, role });
      onRefresh();
    } catch (err) { alert((err as Error).message); }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {members.map(m => (
        <div
          key={m.id}
          style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '10px 14px',
            background: 'var(--bg)',
            borderRadius: 8,
            border: '1px solid var(--border)'
          }}
        >
          <Avatar user={m.user} size={36} />
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
              {m.user.name}
            </p>
            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {m.user.email}
            </p>
          </div>
          {canManage ? (
            <select
              value={m.role}
              onChange={e => void handleRoleChange(m.userId, e.target.value as ProjectRole)}
              style={{
                padding: '4px 8px', borderRadius: 6,
                border: '1px solid var(--border)',
                background: 'var(--surface)',
                fontSize: '0.8rem', cursor: 'pointer'
              }}
            >
              <option value="project_admin">Admin</option>
              <option value="project_member">Member</option>
              <option value="project_viewer">Viewer</option>
            </select>
          ) : (
            <Badge label={m.role.replace('project_', '')} variant={m.role} />
          )}
          {canManage && (
            <button
              onClick={() => void handleRemove(m.userId)}
              style={{
                background: 'none', border: 'none',
                color: '#ef4444', cursor: 'pointer',
                fontSize: '0.8rem', padding: '4px 8px'
              }}
            >
              Remove
            </button>
          )}
        </div>
      ))}
    </div>
  );
}