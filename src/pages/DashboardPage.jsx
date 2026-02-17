import React from 'react';
import { Users, Calendar, TrendingUp, CreditCard, Clock, ArrowUpRight, ArrowRight, Bell, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { formatCurrency, formatDate, getStatusColor, getStatusLabel } from '../utils/helpers';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, AreaChart, Area } from 'recharts';

export default function DashboardPage() {
  const { patients, appointments, invoices, getStats, getPatientById, cabinetConfig, currentUser } = useApp();
  const navigate = useNavigate();
  const stats = getStats();
  const today = new Date().toISOString().split('T')[0];

  const upcomingAppointments = appointments
    .filter(a => a.date >= today && !['annule', 'termine', 'absent'].includes(a.status))
    .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))
    .slice(0, 5);

  const pendingReminders = appointments.filter(a => a.date >= today && !a.reminderSent && a.status !== 'annule');
  const recentPatients = [...patients].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 4);

  const chartData = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date(); date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    const dayInvoices = invoices.filter(inv => inv.date === dateStr && inv.status === 'paid');
    chartData.push({
      day: formatDate(date, 'EEE'),
      rdv: appointments.filter(a => a.date === dateStr).length,
      revenue: dayInvoices.reduce((sum, i) => sum + i.total, 0),
    });
  }

  const StatCard = ({ title, value, subtitle, icon: Icon, color, trend, onClick }) => (
    <div className="stat-card group cursor-pointer" onClick={onClick}>
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shadow-lg`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        {trend && <div className="flex items-center gap-1 text-emerald-600 text-sm font-medium"><ArrowUpRight size={16} /><span>{trend}</span></div>}
      </div>
      <h3 className="text-3xl font-display font-bold text-slate-900 mb-1">{value}</h3>
      <p className="text-slate-500 text-sm">{title}</p>
      {subtitle && <p className="text-primary-600 text-xs mt-1 font-medium">{subtitle}</p>}
    </div>
  );

  return (
    <div className="space-y-6 pb-20 lg:pb-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold text-slate-900">Bonjour, {currentUser?.name?.split(' ')[0]} 👋</h1>
          <p className="text-slate-500 mt-1">Voici un aperçu de votre journée</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => navigate('/agenda')} className="btn-primary flex items-center gap-2">
            <Calendar size={18} /><span className="hidden sm:inline">Nouveau RDV</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <StatCard title="Patients" value={stats.totalPatients} icon={Users} color="from-sky-500 to-sky-600" onClick={() => navigate('/patients')} />
        <StatCard title="RDV aujourd'hui" value={stats.todayAppointments} subtitle={`${stats.upcomingAppointments} à venir`} icon={Calendar} color="from-emerald-500 to-emerald-600" onClick={() => navigate('/agenda')} />
        <StatCard title="Revenus du mois" value={formatCurrency(stats.monthlyRevenue)} icon={TrendingUp} color="from-violet-500 to-violet-600" trend="+12%" onClick={() => navigate('/invoices')} />
        <StatCard title="Taux présence" value={`${100 - parseFloat(stats.absenceRate)}%`} icon={Clock} color="from-amber-500 to-amber-600" onClick={() => navigate('/statistics')} />
      </div>

      {pendingReminders.length > 0 && (
        <div className="card p-4 border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center"><Bell className="w-5 h-5 text-amber-600" /></div>
              <div>
                <p className="font-semibold text-amber-800">{pendingReminders.length} rappels à envoyer</p>
                <p className="text-sm text-amber-600">Patients en attente de rappel SMS/WhatsApp</p>
              </div>
            </div>
            <button onClick={() => navigate('/reminders')} className="btn-secondary text-sm border-amber-300 text-amber-700 hover:bg-amber-100">Gérer les rappels</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-6">
            <h3 className="font-display font-semibold text-slate-800 mb-4">Activité de la semaine</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorRdv" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#14b8a6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                  <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                  <Area type="monotone" dataKey="rdv" stroke="#14b8a6" strokeWidth={3} fill="url(#colorRdv)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-semibold text-slate-800">Prochains RDV</h3>
              <button onClick={() => navigate('/agenda')} className="text-primary-600 text-sm font-medium hover:text-primary-700 flex items-center gap-1">Voir tout <ArrowRight size={16} /></button>
            </div>
            {upcomingAppointments.length === 0 ? (
              <p className="text-slate-500 text-center py-8">Aucun rendez-vous à venir</p>
            ) : (
              <div className="space-y-3">
                {upcomingAppointments.map(apt => {
                  const patient = getPatientById(apt.patientId);
                  return (
                    <div key={apt.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-500 text-white flex items-center justify-center font-semibold text-sm">
                          {patient?.firstName?.[0]}{patient?.lastName?.[0]}
                        </div>
                        <div>
                          <p className="font-medium text-slate-800">{patient?.firstName} {patient?.lastName}</p>
                          <p className="text-sm text-slate-500">{formatDate(apt.date, 'EEE d MMM')} à {apt.time}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {apt.reminderSent && <Bell size={14} className="text-emerald-500" />}
                        <span className={`badge ${getStatusColor(apt.status)}`}>{getStatusLabel(apt.status)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-semibold text-slate-800">Patients récents</h3>
              <button onClick={() => navigate('/patients')} className="text-primary-600 text-sm font-medium hover:text-primary-700">Voir tout</button>
            </div>
            <div className="space-y-3">
              {recentPatients.map(patient => (
                <div key={patient.id} onClick={() => navigate(`/patients/${patient.id}`)} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-500 text-white flex items-center justify-center font-semibold text-sm">
                    {patient.firstName[0]}{patient.lastName[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-800 truncate">{patient.firstName} {patient.lastName}</p>
                    <p className="text-sm text-slate-500">{patient.phone}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {stats.pendingPayments > 0 && (
            <div className="card p-6 border-rose-200 bg-gradient-to-br from-rose-50 to-pink-50">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-rose-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-rose-800">Paiements en attente</h4>
                  <p className="text-rose-700 text-sm mt-1">{formatCurrency(stats.pendingPayments)} à encaisser</p>
                  <button onClick={() => navigate('/payments')} className="text-rose-800 text-sm font-medium mt-2 hover:text-rose-900">Voir les paiements →</button>
                </div>
              </div>
            </div>
          )}

          <div className="card p-6 bg-gradient-to-br from-primary-50 to-accent-50 border-primary-200">
            <div className="flex items-center gap-3 mb-3">
              <FileText className="w-5 h-5 text-primary-600" />
              <h4 className="font-semibold text-primary-800">Factures du mois</h4>
            </div>
            <p className="text-3xl font-bold text-primary-700">{stats.paidInvoices}</p>
            <p className="text-sm text-primary-600">factures payées</p>
          </div>
        </div>
      </div>
    </div>
  );
}
