import { Outlet } from 'react-router-dom';
import Navbar from './navigbar';
import Sidebar from './sidebar';

export default function Layout() {
  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      overflow: 'hidden',
      background: 'var(--bg)'
    }}>
      <Sidebar />
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        <Navbar />
        <main style={{
          flex: 1,
          overflowY: 'auto',
          padding: '24px'
        }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
