import { useState, useEffect } from 'react';
import type { Project, CreateProjectPayload } from '../types/project';
import { getProjects, createProject } from '../services/project_service';
import ProjectCard from '../components/projects/project_card';
import ProjectForm from '../components/projects/project_form';
import Modal from '../components/common/modal';
import Spinner from '../components/common/spinner';
import { useAuth } from '../context/auth_context';

export default function DashboardPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);

  async function load() {
    try {
      const data = await getProjects();
      setProjects(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  async function handleCreate(payload: CreateProjectPayload) {
    await createProject(payload);
    setShowForm(false);
    await load();
  }

  const active = projects.filter(p => !p.isArchived);
  const archived = projects.filter(p => p.isArchived);

  return (
    <div>
      <div style={{
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', marginBottom: 28
      }}>
        <div>
          <h1 style={{ margin: '0 0 4px', fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            Projects
          </h1>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Welcome back, {user?.name}
          </p>
        </div>
        {user?.role === 'admin' && (
          <button
            onClick={() => setShowForm(true)}
            style={{
              padding: '9px 18px', borderRadius: 8, border: 'none',
              background: 'var(--accent)', color: '#fff',
              fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem'
            }}
          >
            + New Project
          </button>
        )}
      </div>

      {loading && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
          <Spinner size={32} />
        </div>
      )}
      {error && <p style={{ color: '#ef4444' }}>{error}</p>}

      {!loading && active.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
          <p style={{ fontSize: '1.1rem', marginBottom: 8 }}>No projects yet</p>
          {user?.role === 'admin' && (
            <p style={{ fontSize: '0.875rem' }}>Create your first project to get started.</p>
          )}
        </div>
      )}

      {active.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: 16, marginBottom: 32
        }}>
          {active.map(p => <ProjectCard key={p.id} project={p} />)}
        </div>
      )}

      {archived.length > 0 && (
        <div>
          <h2 style={{ margin: '0 0 16px', fontSize: '1rem', fontWeight: 600, color: 'var(--text-muted)' }}>
            Archived ({archived.length})
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 16, opacity: 0.6
          }}>
            {archived.map(p => <ProjectCard key={p.id} project={p} />)}
          </div>
        </div>
      )}

      {showForm && (
        <Modal title="New Project" onClose={() => setShowForm(false)}>
          <ProjectForm onSubmit={handleCreate} onCancel={() => setShowForm(false)} />
        </Modal>
      )}
    </div>
  );
}