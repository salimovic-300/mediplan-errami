import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight, Shield, Users, Calendar, Activity } from 'lucide-react';
import { useApp } from '../context/AppContext';

// ── Logo SVG — cœur technologique doré ────────────────────────────────────────
function MediPlanLogo({ size = 40, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Cœur outline */}
      <path
        d="M50 85 C50 85 10 58 10 32 C10 18 20 8 34 8 C41 8 47 12 50 17 C53 12 59 8 66 8 C80 8 90 18 90 32 C90 58 50 85 50 85Z"
        stroke="#D97706"
        strokeWidth="5"
        fill="none"
        strokeLinejoin="round"
      />
      {/* Ligne techno interne */}
      <path
        d="M28 48 C28 48 36 35 50 42 C57 46 60 36 68 32"
        stroke="#D97706"
        strokeWidth="4.5"
        strokeLinecap="round"
        fill="none"
      />
      {/* Nœuds / points de connexion */}
      <circle cx="28" cy="48" r="4.5" fill="#D97706" />
      <circle cx="50" cy="42" r="4.5" fill="#D97706" />
      <circle cx="68" cy="32" r="4.5" fill="#D97706" />
    </svg>
  );
}

export default function LoginPage() {
  const { login } = useApp();
  const navigate = useNavigate();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    setTimeout(() => {
      const result = login(email, password);
      if (result.success) navigate('/dashboard');
      else setError(result.error);
      setLoading(false);
    }, 500);
  };

  const features = [
    { icon: Calendar,  text: 'Gestion agenda intelligent'   },
    { icon: Users,     text: 'Suivi complet des patients'   },
    { icon: Activity,  text: 'Dossiers cardiologiques'      },
    { icon: Shield,    text: 'Données sécurisées & privées' },
  ];

  return (
    <div className="min-h-screen flex">

      {/* ── Panneau gauche ── */}
      <div className="hidden lg:flex lg:w-1/2 p-12 flex-col justify-between relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #7c2d12 100%)' }}>

        {/* Cercles décoratifs */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-20 left-20 w-72 h-72 rounded-full blur-3xl" style={{ background: '#d97706' }} />
          <div className="absolute bottom-20 right-20 w-96 h-96 rounded-full blur-3xl" style={{ background: '#b45309' }} />
        </div>

        {/* Logo + nom */}
        <div className="relative z-10 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg"
            style={{ background: 'linear-gradient(135deg, #1e293b, #0f172a)', border: '2px solid #d97706' }}>
            <MediPlanLogo size={38} />
          </div>
          <div>
            <h1 className="text-white font-display font-bold text-2xl">Dr. Errami Amine</h1>
            <span className="text-amber-400 text-sm font-medium">Cabinet de Cardiologie</span>
          </div>
        </div>

        {/* Titre + description */}
        <div className="relative z-10 space-y-6">
          <h2 className="text-4xl lg:text-5xl font-display font-bold text-white leading-tight">
            Gérez votre cabinet<br />
            <span style={{ background: 'linear-gradient(90deg, #fbbf24, #f59e0b)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              avec intelligence
            </span>
          </h2>
          <p className="text-slate-400 text-lg max-w-md">
            Solution complète: agenda, patients, facturation, rappels et dossiers médicaux.
          </p>
          <div className="grid grid-cols-2 gap-3 pt-4">
            {features.map((f, i) => (
              <div key={i} className="flex items-center gap-2 px-4 py-3 rounded-xl text-white text-sm"
                style={{ background: 'rgba(255,255,255,0.08)' }}>
                <f.icon size={18} style={{ color: '#fbbf24' }} />
                <span>{f.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Copyright mis à jour ── */}
        <div className="relative z-10 flex items-center gap-2 text-slate-500 text-sm">
          <MediPlanLogo size={18} />
          <span>© 2026 MediPlan Pro · Cabinet Dr. Errami Amine · Tous droits réservés</span>
        </div>
      </div>

      {/* ── Panneau droit (formulaire) ── */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-slate-50">
        <div className="w-full max-w-md">

          {/* Logo mobile */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center"
              style={{ background: '#0f172a', border: '2px solid #d97706' }}>
              <MediPlanLogo size={30} />
            </div>
            <div>
              <h1 className="font-display font-bold text-xl text-slate-900">Dr. Errami Amine</h1>
              <span className="text-amber-600 text-sm">Cabinet de Cardiologie</span>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-display font-bold text-slate-900 mb-2">Bienvenue 👋</h2>
            <p className="text-slate-500">Connectez-vous pour accéder à votre espace</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Adresse email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  className="input-field pl-12" placeholder="vous@exemple.com" required />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Mot de passe</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                  className="input-field pl-12" placeholder="••••••••" required />
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl text-white font-semibold transition-all shadow-lg"
              style={{ background: loading ? '#9ca3af' : 'linear-gradient(135deg, #d97706, #b45309)' }}>
              {loading
                ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : <><span>Se connecter</span><ArrowRight size={18} /></>
              }
            </button>
          </form>

          <p className="text-center text-slate-400 text-xs mt-8">
            Cabinet Dr. Errami Amine · Cardiologie · Oulad Salah
          </p>
        </div>
      </div>
    </div>
  );
}
