import type { Task } from '../../types/task';
import type { Comment } from '../../types/comment';
import type { AuditLog, ActivityItem } from '../../types/audit';
import CommentThread from '../comments/comment_thread';
import Avatar from '../common/avatar';

interface Props { task: Task; onRefresh: () => void; }

function formatAction(log: AuditLog): string {
  switch (log.action) {
    case 'STATUS_CHANGE': return `changed status from "${log.oldValue}" to "${log.newValue}"`;
    case 'ASSIGNEE_CHANGE': return `changed assignee from ${log.oldValue} to ${log.newValue}`;
    case 'COMMENT_CREATED': return 'added a comment';
    case 'COMMENT_UPDATED': return 'edited a comment';
    case 'COMMENT_DELETED': return 'deleted a comment';
    case 'TASK_CREATED': return 'created this task';
    default: return log.action.toLowerCase().replace(/_/g, ' ');
  }
}

export default function ActivityTimeline({ task, onRefresh }: Props) {
  const audits: ActivityItem[] = (task.audits ?? []).map(a => ({ kind: 'audit' as const, data: a }));
  const comments: ActivityItem[] = (task.comments ?? []).map(c => ({ kind: 'comment' as const, data: c }));
  const items = [...audits, ...comments].sort(
    (a, b) => new Date(a.data.createdAt).getTime() - new Date(b.data.createdAt).getTime()
  );

  return (
    <div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
        {items.map(item => (
          <div key={item.data.id} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <div style={{
              width: 2, background: 'var(--border)',
              alignSelf: 'stretch', marginLeft: 11, flexShrink: 0
            }} />
            {item.kind === 'audit' ? (
              <div style={{
                padding: '8px 12px', background: 'var(--bg)',
                borderRadius: 8, border: '1px solid var(--border)',
                fontSize: '0.8rem', color: 'var(--text-secondary)', flex: 1
              }}>
                <span style={{ fontWeight: 500 }}>System</span>{' '}
                {formatAction(item.data)}{' · '}
                <span style={{ color: 'var(--text-muted)' }}>
                  {new Date(item.data.createdAt).toLocaleString()}
                </span>
              </div>
            ) : (
              <div style={{
                flex: 1, padding: '10px 12px',
                background: 'var(--surface)',
                border: '1px solid var(--border)', borderRadius: 8
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <Avatar user={(item.data as Comment).user} size={22} />
                  <span style={{ fontWeight: 600, fontSize: '0.8rem' }}>
                    {(item.data as Comment).user.name}
                  </span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    {new Date(item.data.createdAt).toLocaleString()}
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: '0.875rem', lineHeight: 1.5 }}>
                  {(item.data as Comment).content}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
      <CommentThread taskId={task.id} onRefresh={onRefresh} />
    </div>
  );
}