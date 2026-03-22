import { useParams } from 'react-router-dom';
import TaskDetail from '../components/tasks/task_detail';

export default function TaskDetailPage() {
  const { taskId } = useParams<{ taskId: string }>();
  if (!taskId) return <p>Invalid task ID.</p>;
  return <TaskDetail taskId={taskId} />;
}