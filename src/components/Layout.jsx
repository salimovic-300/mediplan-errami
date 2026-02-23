import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Calendar, Users, UserCog, FileText, Settings, LogOut, Menu, X, TrendingUp, Sparkles, Bell, FolderOpen, CreditCard } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { USER_ROLES } from '../data/constants';
import { hasPermission } from '../utils/helpers';

// ─── Logo Dr Errami intégré ───────────────────────────────────────────────────
const ERRAMI_LOGO = 'data:image/jpeg;base64,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';

const allMenuItems = [
  { path: '/dashboard',       icon: LayoutDashboard, label: 'Tableau de bord',      permission: null },
  { path: '/agenda',          icon: Calendar,        label: 'Agenda',               permission: 'appointments' },
  { path: '/patients',        icon: Users,           label: 'Les patients',         permission: 'patients' },
  { path: '/medical-records', icon: FolderOpen,      label: 'Dossiers médicaux',    permission: 'medical_records' },
  { path: '/invoices',        icon: FileText,        label: 'Facturation',          permission: 'invoices' },
  { path: '/payments',        icon: CreditCard,      label: 'Paiements',            permission: 'invoices' },
  { path: '/reminders',       icon: Bell,            label: 'Rappels SMS/WhatsApp', permission: 'reminders' },
  { path: '/users',           icon: UserCog,         label: 'Utilisateurs',         permission: 'all' },
  { path: '/statistics',      icon: TrendingUp,      label: 'Statistiques',         permission: 'statistics' },
  { path: '/ai-assistant',    icon: Sparkles,        label: 'Assistant IA',         permission: null },
  { path: '/settings',        icon: Settings,        label: 'Paramètres',           permission: null },
];

export default function Layout({ children }) {
  const { sidebarOpen, setSidebarOpen, logout, currentUser, cabinetConfig } = useApp();
  const location = useLocation();

  const menuItems = allMenuItems.filter(item =>
    !item.permission || hasPermission(currentUser?.role, item.permission)
  );

  const roleInfo = USER_ROLES[currentUser?.role];
  const logoSrc = cabinetConfig?.logo || ERRAMI_LOGO;

  return (
    <div className="min-h-screen bg-slate-50 medical-pattern">
      {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* ── Sidebar ── */}
      <aside className={`fixed top-0 left-0 h-full w-72 z-50 transform transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
        style={{ background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)' }}>
        <div className="flex flex-col h-full">

          {/* ── En-tête sidebar avec logo Dr Errami ── */}
          <div className="p-6 border-b border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* Logo doré Dr Errami */}
                <div style={{ width:48, height:48, borderRadius:14, overflow:'hidden', background:'linear-gradient(135deg,#fef3c7,#fde68a)', padding:5, boxShadow:'0 4px 16px rgba(217,119,6,0.35)', flexShrink:0 }}>
                  <img src={logoSrc} alt="Dr Errami" style={{ width:'100%', height:'100%', objectFit:'contain' }} />
                </div>
                <div>
                  <h1 className="text-white font-display font-bold text-lg leading-tight">Dr Errami Amine</h1>
                  <span style={{ color:'#fbbf24', fontSize:12, fontWeight:500 }}>Cardiologie</span>
                </div>
              </div>
              <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-2 rounded-lg hover:bg-white/10 text-slate-400">
                <X size={20} />
              </button>
            </div>

            {/* Nom du cabinet */}
            {cabinetConfig?.name && (
              <div className="mt-4 px-3 py-2 rounded-lg" style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)' }}>
                <p className="text-white/70 text-xs font-medium truncate">{cabinetConfig.name}</p>
                <p style={{ color:'rgba(251,191,36,0.7)', fontSize:11 }}>{cabinetConfig?.subtitle || 'Cabinet de Cardiologie'}</p>
              </div>
            )}
          </div>

          {/* ── Navigation ── */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
              return (
                <NavLink key={item.path} to={item.path} onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                    isActive
                      ? 'text-white shadow-lg'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  style={isActive ? { background:'linear-gradient(135deg,#d97706,#b45309)', boxShadow:'0 4px 14px rgba(180,83,9,0.4)' } : { }}
                  onMouseEnter={e => { if(!isActive) e.currentTarget.style.background='rgba(255,255,255,0.07)'; }}
                  onMouseLeave={e => { if(!isActive) e.currentTarget.style.background=''; }}>
                  <Icon size={20} />
                  <span>{item.label}</span>
                  {item.path === '/ai-assistant' && (
                    <span className="ml-auto px-2 py-0.5 text-xs rounded-full text-white" style={{ background:'#d97706' }}>IA</span>
                  )}
                </NavLink>
              );
            })}
          </nav>

          {/* ── Footer sidebar ── */}
          <div className="p-4 border-t border-white/10">
            {currentUser && (
              <div className="mb-3 px-3 py-3 rounded-xl" style={{ background:'rgba(255,255,255,0.05)' }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm"
                    style={{ background:'linear-gradient(135deg,#d97706,#b45309)' }}>
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
            <button onClick={logout} className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-rose-400 hover:text-rose-300 transition-all"
              style={{ }} onMouseEnter={e => e.currentTarget.style.background='rgba(239,68,68,0.1)'} onMouseLeave={e => e.currentTarget.style.background=''}>
              <LogOut size={20} /><span>Déconnexion</span>
            </button>
          </div>
        </div>
      </aside>

      {/* ── Contenu principal ── */}
      <div className="lg:ml-72 min-h-screen">
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-lg border-b border-slate-200/60">
          <div className="flex items-center justify-between px-4 lg:px-8 py-4">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-xl hover:bg-slate-100 text-slate-600">
              <Menu size={24} />
            </button>
            <div className="hidden lg:flex items-center gap-3">
              {/* Mini logo dans le header */}
              <div style={{ width:32, height:32, borderRadius:8, overflow:'hidden', background:'linear-gradient(135deg,#fef3c7,#fde68a)', padding:3 }}>
                <img src={logoSrc} alt="Logo" style={{ width:'100%', height:'100%', objectFit:'contain' }} />
              </div>
              <h2 className="text-lg font-display font-semibold text-slate-800">
                {menuItems.find(m => location.pathname.startsWith(m.path))?.label || 'Dr Errami Amine'}
              </h2>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl text-sm"
                style={{ background:'linear-gradient(135deg,#fef3c7,#fde68a)' }}>
                <Sparkles size={16} style={{ color:'#d97706' }} />
                <span className="font-medium" style={{ color:'#92400e' }}>IA activée</span>
              </div>
            </div>
          </div>
        </header>
        <main className="p-4 lg:p-8">{children}</main>
      </div>

      {/* ── Nav mobile bas ── */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-30 safe-area-pb">
        <div className="flex justify-around py-2">
          {menuItems.slice(0, 5).map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.path);
            return (
              <NavLink key={item.path} to={item.path}
                className="flex flex-col items-center p-2 rounded-xl"
                style={{ color: isActive ? '#d97706' : '#94a3b8' }}>
                <Icon size={22} />
                <span className="text-xs mt-1">{item.label.split(' ')[0]}</span>
              </NavLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
