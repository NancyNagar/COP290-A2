type Variant = 'low' | 'medium' | 'high' | 'critical' 
  | 'story' | 'task' | 'bug'
  | 'project_admin' | 'project_member' | 'project_viewer' 
  | 'archived';

const styles: Record<Variant, React.CSSProperties> = {
  low:            { background: '#d1fae5', color: '#065f46' },
  medium:         { background: '#fef9c3', color: '#854d0e' },
  high:           { background: '#fee2e2', color: '#991b1b' },
  critical:       { background: '#7f1d1d', color: '#fca5a5' },
  story:          { background: '#ede9fe', color: '#5b21b6' },
  task:           { background: '#dbeafe', color: '#1e40af' },
  bug:            { background: '#fee2e2', color: '#991b1b' },
  project_admin:  { background: '#fef3c7', color: '#92400e' },
  project_member: { background: '#dbeafe', color: '#1e40af' },
  project_viewer: { background: '#f3f4f6', color: '#374151' },
  archived:       { background: '#f3f4f6', color: '#6b7280' },
};

export default function Badge({ label, variant }: { label: string; variant: Variant }) {
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '2px 8px',
      borderRadius: 100,
      fontSize: '0.72rem',
      fontWeight: 600,
      letterSpacing: '0.02em',
      textTransform: 'uppercase',
      ...styles[variant]
    }}>
      {label}
    </span>
  );
}