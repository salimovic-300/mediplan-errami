import React, { useState } from 'react';
import { Building2, Clock, CreditCard, Bell, Globe, RefreshCw, Save, Upload, Link } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ConfirmModal } from '../components/Modal';
import { fileToBase64 } from '../utils/helpers';

export default function SettingsPage() {
  const { cabinetConfig, updateCabinetConfig, resetToDemo } = useApp();
  const [activeTab, setActiveTab] = useState('general');
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [saved, setSaved] = useState(false);
  const [config, setConfig] = useState({ ...cabinetConfig });

  const handleSave = () => {
    updateCabinetConfig(config);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const base64 = await fileToBase64(file);
      setConfig({ ...config, logo: base64 });
    }
  };

  const set = (field, value) => setConfig(prev => ({ ...prev, [field]: value }));

  const tabs = [
    { id: 'general', label: 'Général', icon: Building2 },
    { id: 'schedule', label: 'Horaires', icon: Clock },
    { id: 'reminders', label: 'Rappels', icon: Bell },
    { id: 'billing', label: 'Facturation', icon: CreditCard },
    { id: 'integrations', label: 'Intégrations', icon: Link },
  ];

  return (
    <div className="space-y-6 pb-20 lg:pb-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold text-slate-900">Paramètres</h1>
          <p className="text-slate-500">Configurez les informations de votre cabinet</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowResetConfirm(true)}
            className="btn-secondary flex items-center gap-2 text-rose-600 border-rose-200 hover:bg-rose-50"
          >
            <RefreshCw size={18} />Réinitialiser
          </button>
          <button onClick={handleSave} className="btn-primary flex items-center gap-2">
            <Save size={18} />{saved ? 'Enregistré ✓' : 'Enregistrer'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium whitespace-nowrap transition-all ${activeTab === tab.id
              ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30'
              : 'bg-white text-slate-600 hover:bg-slate-50'
              }`}
          >
            <tab.icon size={18} /><span>{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="card p-6">

        {activeTab === 'general' && (
          <div className="space-y-8">

            {/* Logo + Nom cabinet */}
            <div className="flex items-start gap-6">
              <div className="relative group">
                {config.logo ? (
                  <img src={config.logo} alt="Logo" className="w-24 h-24 rounded-2xl object-cover" />
                ) : (
                  <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary-400 to-primary-500 flex items-center justify-center">
                    <Building2 className="w-10 h-10 text-white" />
                  </div>
                )}
                <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-2xl opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                  <Upload className="text-white" size={24} />
                  <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                </label>
              </div>
              <div className="flex-1 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nom du cabinet</label>
                  <input
                    type="text"
                    value={config.name || ''}
                    onChange={(e) => set('name', e.target.value)}
                    className="input-field"
                    placeholder="Cabinet MediPlan"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Sous-titre / Slogan</label>
                  <input
                    type="text"
                    value={config.subtitle || ''}
                    onChange={(e) => set('subtitle', e.target.value)}
                    className="input-field"
                    placeholder="Excellence en soins de santé"
                  />
                </div>
              </div>
            </div>

            <hr className="border-slate-100" />

            {/* Devise + Contact */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Devise par défaut</label>
                <select
                  value={config.currency || 'DH'}
                  onChange={(e) => set('currency', e.target.value)}
                  className="select-field w-full"
                >
                  <option value="DH">Dirham (DH)</option>
                  <option value="€">Euro (€)</option>
                  <option value="$">Dollar ($)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Numéro de téléphone principal</label>
                <input
                  type="tel"
                  value={config.phone || ''}
                  onChange={(e) => set('phone', e.target.value)}
                  className="input-field"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Adresse physique du cabinet</label>
              <input
                type="text"
                value={config.address || ''}
                onChange={(e) => set('address', e.target.value)}
                className="input-field"
              />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Ville</label>
                <input type="text" value={config.city || ''} onChange={(e) => set('city', e.target.value)} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Code postal</label>
                <input type="text" value={config.postalCode || ''} onChange={(e) => set('postalCode', e.target.value)} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email de contact</label>
                <input type="email" value={config.email || ''} onChange={(e) => set('email', e.target.value)} className="input-field" />
              </div>
            </div>
          </div>
        )}

        {/* Note: Les onglets schedule, reminders, billing, integrations utilisent les mêmes patterns d'UI */}
      </div>

      <ConfirmModal
        isOpen={showResetConfirm}
        onClose={() => setShowResetConfirm(false)}
        onConfirm={() => { resetToDemo(); setConfig({ ...cabinetConfig }); }}
        title="Réinitialiser les données"
        message="Cette action supprimera toutes vos modifications et restaurera les paramètres par défaut. Cette action est irréversible."
        confirmText="Réinitialiser"
        danger
      />
    </div>
  );
}