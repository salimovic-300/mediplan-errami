import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Mail, Lock, ArrowRight, Shield, Users, Calendar, Activity } from 'lucide-react';
import { useApp } from '../context/AppContext';

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

        {/* Cercles décoratifs couleur or/cardio */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-20 left-20 w-72 h-72 rounded-full blur-3xl" style={{ background: '#d97706' }} />
          <div className="absolute bottom-20 right-20 w-96 h-96 rounded-full blur-3xl" style={{ background: '#b45309' }} />
        </div>

        {/* Logo + nom */}
        <div className="relative z-10 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg"
            style={{ background: 'linear-gradient(135deg, #d97706, #b45309)' }}>
            <Heart className="w-8 h-8 text-white" fill="white" />
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

        <div className="relative z-10 text-slate-500 text-sm">
          © 2025 MediPlan Pro — Cabinet Dr. Errami Amine
        </div>
      </div>

      {/* ── Panneau droit (formulaire) ── */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-slate-50">
        <div className="w-full max-w-md">

          {/* Logo mobile */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #d97706, #b45309)' }}>
              <Heart className="w-6 h-6 text-white" fill="white" />
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

          {/* Pas de comptes de démo visibles — sécurité */}
          <p className="text-center text-slate-400 text-xs mt-8">
            Cabinet Dr. Errami Amine · Cardiologie · Oulad Salah
          </p>
        </div>
      </div>
    </div>
  );
}
