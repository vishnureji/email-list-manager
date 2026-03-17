import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './index.css';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Audiences from './pages/Audiences';
import Campaigns from './pages/Campaigns';
import WeeklyReport from './pages/WeeklyReport';
import Compare from './pages/Compare';
import Admin from './pages/Admin';

function ProtectedLayout({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}><span className="loading-spinner" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Header />
        {children}
      </div>
    </div>
  );
}

function AppRoutes() {
  const { user, loading } = useAuth();
  if (loading) return null;
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/" element={<ProtectedLayout><Dashboard /></ProtectedLayout>} />
      <Route path="/audiences" element={<ProtectedLayout><Audiences /></ProtectedLayout>} />
      <Route path="/campaigns" element={<ProtectedLayout><Campaigns /></ProtectedLayout>} />
      <Route path="/reports/weekly" element={<ProtectedLayout><WeeklyReport /></ProtectedLayout>} />
      <Route path="/reports/compare" element={<ProtectedLayout><Compare /></ProtectedLayout>} />
      <Route path="/admin" element={<ProtectedLayout><Admin /></ProtectedLayout>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
