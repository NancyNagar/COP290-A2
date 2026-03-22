import type { Project } from '../../types/project';
import { useNavigate } from 'react-router-dom';
import Badge from '../common/badge';

export default function ProjectCard({ project }: { project: Project }) {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate(`/projects/${project.id}`)}
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 10,
        padding: '20px',
        cursor: 'pointer',
        transition: 'box-shadow 0.15s, transform 0.15s'
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 16px rgba(0,0,0,0.1)';
        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-1px)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
        (e.currentTarget as HTMLDivElement).style.transform = 'none';
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
          {project.name}
        </h3>
        {project.isArchived && <Badge label="Archived" variant="archived" />}
      </div>
      {project.description && (
        <p style={{ margin: '0 0 12px', fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
          {project.description}
        </p>
      )}
      <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
        Created {new Date(project.createdAt).toLocaleDateString()}
      </p>
    </div>
  );
}