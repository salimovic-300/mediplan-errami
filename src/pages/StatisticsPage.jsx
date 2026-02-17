import React, { useMemo } from 'react';
import { TrendingUp, Users, Calendar, CreditCard, Clock, CheckCircle, XCircle, Bell, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatCurrency } from '../utils/helpers';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, PieChart, Pie, Cell, AreaChart, Area, LineChart, Line, Legend } from 'recharts';
import { APPOINTMENT_STATUSES, APPOINTMENT_TYPES } from '../data/constants';

const COLORS = ['#14b8a6', '#f59e0b', '#ef4444', '#8b5cf6', '#3b82f6', '#10b981'];

export default function StatisticsPage() {
  const { patients, appointments, invoices, getStats, cabinetConfig } = useApp();
  const stats = getStats();

  const appointmentsByDay = useMemo(() => {
    const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    const counts = Array(7).fill(0);
    appointments.forEach(apt => {
      const day = new Date(apt.date).getDay();
      counts[day]++;
    });
    return days.map((day, i) => ({ day, count: counts[i] }));
  }, [appointments]);

  const appointmentsByType = useMemo(() => {
    const types = {};
    appointments.forEach(apt => {
      const typeInfo = APPOINTMENT_TYPES.find(t => t.id === apt.type);
      const label = typeInfo?.label || apt.type;
      types[label] = (types[label] || 0) + 1;
    });
    return Object.entries(types).map(([name, value]) => ({ name, value }));
  }, [appointments]);

  const appointmentsByStatus = useMemo(() => {
    const statuses = {};
    appointments.forEach(apt => {
      const statusInfo = APPOINTMENT_STATUSES[apt.status];
      const label = statusInfo?.label || apt.status;
      statuses[label] = (statuses[label] || 0) + 1;
    });
    return Object.entries(statuses).map(([name, value]) => ({ name, value }));
  }, [appointments]);

  const revenueByMonth = useMemo(() => {
    const months = {};
    invoices.filter(i => i.status === 'paid').forEach(inv => {
      const month = inv.date?.slice(0, 7);
      if (month) months[month] = (months[month] || 0) + inv.total;
    });
    return Object.entries(months)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([month, total]) => ({
        month: new Date(month + '-01').toLocaleDateString('fr-FR', { month: 'short' }),
        total
      }));
  }, [invoices]);

  const patientGrowth = useMemo(() => {
    const months = {};
    patients.forEach(p => {
      const month = p.createdAt?.slice(0, 7);
      if (month) months[month] = (months[month] || 0) + 1;
    });
    let cumulative = 0;
    return Object.entries(months)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([month, count]) => {
        cumulative += count;
        return {
          month: new Date(month + '-01').toLocaleDateString('fr-FR', { month: 'short' }),
          nouveaux: count,
          total: cumulative
        };
      });
  }, [patients]);

  const StatCard = ({ title, value, subtitle, icon: Icon, color, trend, trendUp }) => (
    <div className="stat-card">
      <div className="flex items-start justify-between">
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shadow-lg`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-sm font-medium ${trendUp ? 'text-emerald-600' : 'text-rose-600'}`}>
            {trendUp ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
            <span>{trend}</span>
          </div>
        )}
      </div>
      <div className="mt-4">
        <h3 className="text-3xl font-display font-bold text-slate-900">{value}</h3>
        <p className="text-slate-500 text-sm mt-1">{title}</p>
        {subtitle && <p className="text-primary-600 text-xs mt-1 font-medium">{subtitle}</p>}
      </div>
    </div>
  );

  return (
    <div className="space-y-6 pb-20 lg:pb-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-display font-bold text-slate-900">Statistiques</h1>
        <p className="text-slate-500">Analysez les performances de votre cabinet</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Patients totaux" value={stats.totalPatients} icon={Users} color="from-sky-500 to-sky-600" trend="+12%" trendUp />
        <StatCard title="RDV ce mois" value={appointments.filter(a => a.date?.startsWith(new Date().toISOString().slice(0, 7))).length} icon={Calendar} color="from-emerald-500 to-emerald-600" />
        <StatCard title="Revenus du mois" value={formatCurrency(stats.monthlyRevenue)} icon={TrendingUp} color="from-violet-500 to-violet-600" trend="+8%" trendUp />
        <StatCard title="Taux présence" value={`${100 - parseFloat(stats.absenceRate)}%`} icon={CheckCircle} color="from-primary-500 to-primary-600" subtitle={`${stats.absenceRate}% absences`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h3 className="font-display font-semibold text-slate-800 mb-4">Revenus mensuels</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueByMonth}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#14b8a6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} tickFormatter={(v) => `${v/1000}k`} />
                <Tooltip formatter={(v) => formatCurrency(v)} contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px' }} />
                <Area type="monotone" dataKey="total" stroke="#14b8a6" strokeWidth={3} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-6">
          <h3 className="font-display font-semibold text-slate-800 mb-4">Croissance patients</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={patientGrowth}>
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px' }} />
                <Legend />
                <Line type="monotone" dataKey="total" name="Total" stroke="#14b8a6" strokeWidth={3} dot={false} />
                <Line type="monotone" dataKey="nouveaux" name="Nouveaux" stroke="#8b5cf6" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card p-6">
          <h3 className="font-display font-semibold text-slate-800 mb-4">RDV par jour</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={appointmentsByDay}>
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px' }} />
                <Bar dataKey="count" fill="#14b8a6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-6">
          <h3 className="font-display font-semibold text-slate-800 mb-4">Types de RDV</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={appointmentsByType} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={3} dataKey="value">
                  {appointmentsByType.map((_, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-2 mt-2 justify-center">
            {appointmentsByType.slice(0, 4).map((item, i) => (
              <span key={i} className="flex items-center gap-1 text-xs text-slate-600">
                <span className="w-2 h-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                {item.name}
              </span>
            ))}
          </div>
        </div>

        <div className="card p-6">
          <h3 className="font-display font-semibold text-slate-800 mb-4">Statuts des RDV</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={appointmentsByStatus} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={3} dataKey="value">
                  {appointmentsByStatus.map((_, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-2 mt-2 justify-center">
            {appointmentsByStatus.slice(0, 4).map((item, i) => (
              <span key={i} className="flex items-center gap-1 text-xs text-slate-600">
                <span className="w-2 h-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                {item.name}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-4 text-center">
          <p className="text-3xl font-bold text-primary-600">{stats.remindersSent}</p>
          <p className="text-sm text-slate-500 mt-1">Rappels envoyés</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-3xl font-bold text-emerald-600">{stats.paidInvoices}</p>
          <p className="text-sm text-slate-500 mt-1">Factures payées</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-3xl font-bold text-amber-600">{formatCurrency(stats.pendingPayments)}</p>
          <p className="text-sm text-slate-500 mt-1">À encaisser</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-3xl font-bold text-violet-600">{stats.upcomingAppointments}</p>
          <p className="text-sm text-slate-500 mt-1">RDV à venir</p>
        </div>
      </div>
    </div>
  );
}
