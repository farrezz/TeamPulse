// App — router, auth gate, and the shared week-state provider.

import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import { WeekProvider } from './context/WeekContext.jsx';
import NavBar from './components/NavBar.jsx';
import Sidebar from './components/Sidebar.jsx';
import LoginPage from './pages/LoginPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import TeamTrackerPage from './pages/TeamTrackerPage.jsx';
import SchedulePage from './pages/SchedulePage.jsx';
import AbsencePage from './pages/AbsencePage.jsx';

export default function App() {
  const { authUser, profile, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
        <p className="tp-muted">Laddar…</p>
      </div>
    );
  }

  // Signed out → login. A signed-in user with no roster doc is allowed in as a
  // plain member (the shared member login intentionally has no person-doc, so
  // it never counts as a member). Coordinators are identified by their doc.
  if (!authUser) return <LoginPage />;

  return (
    <WeekProvider>
      <NavBar />
      <div className="tp-layout">
        <Sidebar />
        <main className="tp-main">
          <div className="tp-content">
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/teams" element={<TeamTrackerPage />} />
            <Route path="/teams/:teamId" element={<TeamTrackerPage />} />
            <Route path="/schema" element={<SchedulePage />} />
            <Route path="/franvaro" element={<AbsencePage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          </div>
        </main>
      </div>
    </WeekProvider>
  );
}
