import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import Layout from './components/Layout';

import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import AgendaPage from './pages/AgendaPage';
import PatientsPage from './pages/PatientsPage';
import PatientDetailPage from './pages/PatientDetailPage';
import MedicalRecordsPage from './pages/MedicalRecordsPage';
import InvoicesPage from './pages/InvoicesPage';
import PaymentsPage from './pages/PaymentsPage';
import RemindersPage from './pages/RemindersPage';
import UsersPage from './pages/UsersPage';
import StatisticsPage from './pages/StatisticsPage';
import AIAssistantPage from './pages/AIAssistantPage';
import SettingsPage from './pages/SettingsPage';

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useApp(); // ← plus besoin de loading

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Layout>{children}</Layout>;
}

function Notifications() {
  const { notifications, removeNotification } = useApp();

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2">
      {notifications.map(notification => (
        <div
          key={notification.id}
          className={`px-4 py-3 rounded-xl shadow-lg animate-slide-up cursor-pointer ${
            notification.type === 'success' ? 'bg-emerald-500 text-white' :
            notification.type === 'error'   ? 'bg-rose-500 text-white' :
            notification.type === 'warning' ? 'bg-amber-500 text-white' :
            'bg-slate-800 text-white'
          }`}
          onClick={() => removeNotification(notification.id)}
        >
          {notification.message}
        </div>
      ))}
    </div>
  );
}

function AppRoutes() {
  const { isAuthenticated } = useApp();

  return (
    <>
      <Routes>
        <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard"      element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/agenda"         element={<ProtectedRoute><AgendaPage /></ProtectedRoute>} />
        <Route path="/patients"       element={<ProtectedRoute><PatientsPage /></ProtectedRoute>} />
        <Route path="/patients/:id"   element={<ProtectedRoute><PatientDetailPage /></ProtectedRoute>} />
        <Route path="/medical-records" element={<ProtectedRoute><MedicalRecordsPage /></ProtectedRoute>} />
        <Route path="/invoices"       element={<ProtectedRoute><InvoicesPage /></ProtectedRoute>} />
        <Route path="/payments"       element={<ProtectedRoute><PaymentsPage /></ProtectedRoute>} />
        <Route path="/reminders"      element={<ProtectedRoute><RemindersPage /></ProtectedRoute>} />
        <Route path="/users"          element={<ProtectedRoute><UsersPage /></ProtectedRoute>} />
        <Route path="/statistics"     element={<ProtectedRoute><StatisticsPage /></ProtectedRoute>} />
        <Route path="/ai-assistant"   element={<ProtectedRoute><AIAssistantPage /></ProtectedRoute>} />
        <Route path="/settings"       element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
      <Notifications />
    </>
  );
}

export default function App() {
  return (
    <Router>
      <AppProvider>
        <AppRoutes />
      </AppProvider>
    </Router>
  );
}