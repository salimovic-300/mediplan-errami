import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Calendar, Users, UserCog, FileText, Settings, LogOut, Menu, X, Stethoscope, TrendingUp, Sparkles, Bell, FolderOpen, CreditCard } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { USER_ROLES } from '../data/constants';
import { hasPermission } from '../utils/helpers';

const allMenuItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Tableau de bord', permission: null },
  { path: '/agenda', icon: Calendar, label: 'Agenda', permission: 'appointments' },
  { path: '/patients', icon: Users, label: 'Patients', permission: 'patients' },
  { path: '/medical-records', icon: FolderOpen, label: 'Dossiers médicaux', permission: 'medical_records' },
  { path: '/invoices', icon: FileText, label: 'Facturation', permission: 'invoices' },
  { path: '/payments', icon: CreditCard, label: 'Paiements', permission: 'invoices' },
  { path: '/reminders', icon: Bell, label: 'Rappels SMS/WhatsApp', permission: 'reminders' },
  { path: '/users', icon: UserCog, label: 'Utilisateurs', permission: 'all' },
  { path: '/statistics', icon: TrendingUp, label: 'Statistiques', permission: 'statistics' },
  { path: '/ai-assistant', icon: Sparkles, label: 'Assistant IA', permission: null },
  { path: '/settings', icon: Settings, label: 'Paramètres', permission: null },
];

export default function Layout({ children }) {
  const { sidebarOpen, setSidebarOpen, logout, currentUser, cabinetConfig } = useApp();
  const location = useLocation();

  const menuItems = allMenuItems.filter(item => 
    !item.permission || hasPermission(currentUser?.role, item.permission)
  );

  const roleInfo = USER_ROLES[currentUser?.role];

  return (
    <div className="min-h-screen bg-slate-50 medical-pattern">
      {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      <aside className={`fixed top-0 left-0 h-full w-72 z-50 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 transform transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/30">
                  <Stethoscope className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-white font-display font-bold text-xl">MediPlan</h1>
                  <span className="text-primary-400 text-sm font-medium">Pro v3.0</span>
                </div>
              </div>
              <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-2 rounded-lg hover:bg-white/10 text-slate-400">
                <X size={20} />
              </button>
            </div>
            {cabinetConfig.name && (
              <div className="mt-4 px-3 py-2 rounded-lg bg-white/5 border border-white/10">
                <p className="text-white/80 text-sm font-medium truncate">{cabinetConfig.name}</p>
              </div>
            )}
          </div>

          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
              return (
                <NavLink key={item.path} to={item.path} onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${isActive ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/30' : 'text-slate-400 hover:bg-white/10 hover:text-white'}`}>
                  <Icon size={20} />
                  <span>{item.label}</span>
                  {item.path === '/ai-assistant' && <span className="ml-auto px-2 py-0.5 text-xs bg-accent-500 text-white rounded-full">IA</span>}
                </NavLink>
              );
            })}
          </nav>

          <div className="p-4 border-t border-white/10">
            {currentUser && (
              <div className="mb-3 px-3 py-3 bg-white/5 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-500 flex items-center justify-center text-white font-semibold text-sm">
                    {currentUser.name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{currentUser.name}</p>
                    <span className={`inline-block px-2 py-0.5 text-xs rounded-full ${roleInfo?.color || 'bg-slate-600 text-white'}`}>
                      {roleInfo?.label || currentUser.role}
                    </span>
                  </div>
                </div>
              </div>
            )}
            <button onClick={logout} className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-all">
              <LogOut size={20} /><span>Déconnexion</span>
            </button>
          </div>
        </div>
      </aside>

      <div className="lg:ml-72 min-h-screen">
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-lg border-b border-slate-200/60">
          <div className="flex items-center justify-between px-4 lg:px-8 py-4">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-xl hover:bg-slate-100 text-slate-600">
              <Menu size={24} />
            </button>
            <div className="hidden lg:block">
              <h2 className="text-lg font-display font-semibold text-slate-800">
                {menuItems.find(m => location.pathname.startsWith(m.path))?.label || 'MediPlan Pro'}
              </h2>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary-50 to-accent-50 rounded-xl text-sm">
                <Sparkles size={16} className="text-accent-500" />
                <span className="text-slate-700 font-medium">IA activée</span>
              </div>
            </div>
          </div>
        </header>
        <main className="p-4 lg:p-8">{children}</main>
      </div>

      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-30 safe-area-pb">
        <div className="flex justify-around py-2">
          {menuItems.slice(0, 5).map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.path);
            return (
              <NavLink key={item.path} to={item.path} className={`flex flex-col items-center p-2 rounded-xl ${isActive ? 'text-primary-600' : 'text-slate-400'}`}>
                <Icon size={22} /><span className="text-xs mt-1">{item.label.split(' ')[0]}</span>
              </NavLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
