import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Stethoscope, Mail, Lock, ArrowRight, Sparkles, Shield, Users, Calendar } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function LoginPage() {
  const { login } = useApp();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
    { icon: Calendar, text: 'Gestion agenda intelligent' },
    { icon: Users, text: 'Multi-utilisateurs & rôles' },
    { icon: Sparkles, text: 'Assistant IA intégré' },
    { icon: Shield, text: 'Sécurisé & RGPD' },
  ];

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-900 via-slate-800 to-primary-900 p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-primary-500 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-accent-500 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
              <Stethoscope className="w-7 h-7 text-white" />
            </div>
            <div><h1 className="text-white font-display font-bold text-2xl">MediPlan</h1><span className="text-primary-400 text-sm">Pro v3.0</span></div>
          </div>
        </div>
        <div className="relative z-10 space-y-6">
          <h2 className="text-4xl lg:text-5xl font-display font-bold text-white leading-tight">
            Gérez votre cabinet<br /><span className="gradient-text">avec intelligence</span>
          </h2>
          <p className="text-slate-400 text-lg max-w-md">Solution complète: agenda, patients, facturation, rappels SMS/WhatsApp, dossiers médicaux et assistant IA.</p>
          <div className="grid grid-cols-2 gap-3 pt-4">
            {features.map((f, i) => (
              <div key={i} className="flex items-center gap-2 px-4 py-3 bg-white/10 rounded-xl text-white text-sm">
                <f.icon size={18} className="text-primary-400" /><span>{f.text}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="relative z-10 text-slate-500 text-sm">© 2025 MediPlan Pro. Tous droits réservés.</div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-slate-50">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
              <Stethoscope className="w-6 h-6 text-white" />
            </div>
            <div><h1 className="font-display font-bold text-xl text-slate-900">MediPlan</h1><span className="text-primary-500 text-sm">Pro v3.0</span></div>
          </div>
          <div className="mb-8">
            <h2 className="text-2xl font-display font-bold text-slate-900 mb-2">Bienvenue 👋</h2>
            <p className="text-slate-500">Connectez-vous pour accéder à votre espace</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm">{error}</div>}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Adresse email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input-field pl-12" placeholder="vous@exemple.com" required />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Mot de passe</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="input-field pl-12" placeholder="••••••••" required />
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 py-3">
              {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><span>Se connecter</span><ArrowRight size={18} /></>}
            </button>
          </form>
          <div className="mt-6 p-4 bg-primary-50 rounded-xl border border-primary-100">
            <p className="text-sm text-primary-700 font-medium mb-2">Comptes de démo:</p>
            <div className="space-y-1 text-xs text-primary-600">
              <p>👨‍⚕️ Admin: admin@mediplan.ma / admin123</p>
              <p>👩‍⚕️ Praticien: dr.sarah@mediplan.ma / sarah123</p>
              <p>👩‍💼 Secrétaire: secretaire@mediplan.ma / sec123</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
