import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/auth_context';
import { NotificationProvider } from './context/notification_context';
import ProtectedRoute from './components/common/protected_route';
import Layout from './components/layout/layout';

import LoginPage from './pages/login_page';
import RegisterPage from './pages/register_page';
import DashboardPage from './pages/dash_page';
import ProjectDetailPage from './pages/project_det_page';
import BoardPage from './pages/board_page';
import TaskDetailPage from './pages/task_det_page';

import './styles/global.css';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NotificationProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Protected routes */}
            <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/projects/:projectId" element={<ProjectDetailPage />} />
              <Route path="/projects/:projectId/boards/:boardId" element={<BoardPage />} />
              <Route path="/tasks/:taskId" element={<TaskDetailPage />} />
            </Route>

            {/* Fallback */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
