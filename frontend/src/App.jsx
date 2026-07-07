import { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './auth';
import { get } from './api';
import Rail from './components/Rail';
import TopBar from './components/TopBar';
import NotificationSheet from './components/NotificationSheet';
import CommandPalette from './components/CommandPalette';
import Login from './pages/Login';
import Discover from './pages/Discover';
import Feed from './pages/Feed';
import Chat from './pages/Chat';
import IntentsList from './pages/IntentsList';
import IntentDetail from './pages/IntentDetail';
import Discovery from './pages/Discovery';
import EventsList from './pages/EventsList';
import EventDetail from './pages/EventDetail';
import Members from './pages/Members';
import Profile from './pages/Profile';
import DataLayout from './pages/data/DataLayout';
import DataOverview from './pages/data/DataOverview';
import Businesses from './pages/data/Businesses';
import Housing from './pages/data/Housing';
import Economic from './pages/data/Economic';
import Parcels from './pages/data/Parcels';
import Traffic from './pages/data/Traffic';
import Safety from './pages/data/Safety';
import SqlPlayground from './pages/data/SqlPlayground';

function Shell() {
  const [showPalette, setShowPalette] = useState(false);
  const [showNotif, setShowNotif] = useState(false);
  const [notifCount, setNotifCount] = useState(0);

  useEffect(() => {
    get('/api/notifications?limit=50')
      .then(res => {
        const items = res.events || res.items || res.data || [];
        setNotifCount(items.length);
      })
      .catch(() => {});
  }, []);

  const handleKeyDown = useCallback((e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      setShowPalette(v => !v);
    }
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '66px 1fr', height: '100vh', overflow: 'hidden' }}>
      <Rail />
      <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <TopBar onOpenPalette={() => setShowPalette(true)} onOpenNotif={() => setShowNotif(v => !v)} notifCount={notifCount} />
        <div style={{ flex: 1, overflow: 'auto', background: 'var(--bg)' }}>
          <Outlet />
        </div>
      </div>
      {showNotif && <NotificationSheet onClose={() => setShowNotif(false)} onCountChange={setNotifCount} />}
      {showPalette && <CommandPalette onClose={() => setShowPalette(false)} />}
    </div>
  );
}

function RequireAuth({ children }) {
  const { isAuthed } = useAuth();
  return isAuthed ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<RequireAuth><Shell /></RequireAuth>}>
        <Route index element={<Discover />} />
        <Route path="feed" element={<Feed />} />
        <Route path="chat" element={<Chat />} />
        <Route path="intents" element={<IntentsList />} />
        <Route path="intents/:id" element={<IntentDetail />} />
        <Route path="discovery" element={<Discovery />} />
        <Route path="events" element={<EventsList />} />
        <Route path="events/:id" element={<EventDetail />} />
        <Route path="members" element={<Members />} />
        <Route path="profile/:handle" element={<Profile />} />
        <Route path="data" element={<DataLayout />}>
          <Route index element={<DataOverview />} />
          <Route path="businesses" element={<Businesses />} />
          <Route path="housing" element={<Housing />} />
          <Route path="economic" element={<Economic />} />
          <Route path="parcels" element={<Parcels />} />
          <Route path="traffic" element={<Traffic />} />
          <Route path="safety" element={<Safety />} />
          <Route path="sql" element={<SqlPlayground />} />
        </Route>
      </Route>
    </Routes>
  );
}
