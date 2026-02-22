import React, { useState } from 'react';
import { Settings, Building2, Clock, CreditCard, Bell, Globe, RefreshCw, Save, Upload, Trash2, Calendar, Link } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ConfirmModal } from '../components/Modal';
import { SPECIALTIES, REMINDER_TYPES, REMINDER_TIMINGS } from '../data/constants';
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

  const tabs = [
    { id: 'general', label: 'Général', icon: Building2 },
    { id: 'schedule', label: 'Horaires', icon: Clock },
    { id: 'reminders', label: 'Rappels', icon: Bell },
    { id: 'billing', label: 'Facturation', icon: CreditCard },
    { id: 'integrations', label: 'Intégrations', icon: Link },
  ];

  const days = [
    { id: 'monday', label: 'Lundi' },
    { id: 'tuesday', label: 'Mardi' },
    { id: 'wednesday', label: 'Mercredi' },
    { id: 'thursday', label: 'Jeudi' },
    { id: 'friday', label: 'Vendredi' },
    { id: 'saturday', label: 'Samedi' },
    { id: 'sunday', label: 'Dimanche' },
  ];

  return (
    <div className="space-y-6 pb-20 lg:pb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold text-slate-900">Paramètres</h1>
          <p className="text-slate-500">Configurez votre cabinet</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowResetConfirm(true)} className="btn-secondary flex items-center gap-2 text-rose-600 border-rose-200 hover:bg-rose-50">
            <RefreshCw size={18} />Réinitialiser
          </button>
          <button onClick={handleSave} className="btn-primary flex items-center gap-2">
            <Save size={18} />{saved ? 'Enregistré ✓' : 'Enregistrer'}
          </button>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium whitespace-nowrap transition-all ${activeTab === tab.id ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30' : 'bg-white text-slate-600 hover:bg-slate-50'}`}>
            <tab.icon size={18} /><span>{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="card p-6">
        {activeTab === 'general' && (
          <div className="space-y-6">
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
                  <input type="text" value={config.name || ''} onChange={(e) => setConfig({ ...config, name: e.target.value })} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Sous-titre</label>
                  <input type="text" value={config.subtitle || ''} onChange={(e) => setConfig({ ...config, subtitle: e.target.value })} className="input-field" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Spécialité</label>
                <select value={config.specialty || ''} onChange={(e) => setConfig({ ...config, specialty: e.target.value })} className="select-field">
                  {SPECIALTIES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Devise</label>
                <select value={config.currency || 'DH'} onChange={(e) => setConfig({ ...config, currency: e.target.value })} className="select-field">
                  <option value="DH">Dirham (DH)</option>
                  <option value="€">Euro (€)</option>
                  <option value="$">Dollar ($)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Adresse</label>
              <input type="text" value={config.address || ''} onChange={(e) => setConfig({ ...config, address: e.target.value })} className="input-field" />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Ville</label>
                <input type="text" value={config.city || ''} onChange={(e) => setConfig({ ...config, city: e.target.value })} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Code postal</label>
                <input type="text" value={config.postalCode || ''} onChange={(e) => setConfig({ ...config, postalCode: e.target.value })} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Téléphone</label>
                <input type="tel" value={config.phone || ''} onChange={(e) => setConfig({ ...config, phone: e.target.value })} className="input-field" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <input type="email" value={config.email || ''} onChange={(e) => setConfig({ ...config, email: e.target.value })} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Site web</label>
                <input type="text" value={config.website || ''} onChange={(e) => setConfig({ ...config, website: e.target.value })} className="input-field" />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'schedule' && (
          <div className="space-y-4">
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-1">Durée par défaut d'un RDV</label>
              <select value={config.appointmentDuration || 30} onChange={(e) => setConfig({ ...config, appointmentDuration: Number(e.target.value) })} className="select-field w-48">
                <option value={15}>15 minutes</option>
                <option value={20}>20 minutes</option>
                <option value={30}>30 minutes</option>
                <option value={45}>45 minutes</option>
                <option value={60}>60 minutes</option>
              </select>
            </div>

            <h3 className="font-semibold text-slate-800">Horaires d'ouverture</h3>
            <div className="space-y-3">
              {days.map(day => {
                const dayConfig = config.workingHours?.[day.id] || { start: '08:00', end: '18:00', enabled: true };
                return (
                  <div key={day.id} className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl">
                    <label className="flex items-center gap-2 w-32">
                      <input type="checkbox" checked={dayConfig.enabled} onChange={(e) => setConfig({ ...config, workingHours: { ...config.workingHours, [day.id]: { ...dayConfig, enabled: e.target.checked } } })} className="checkbox-custom" />
                      <span className="font-medium text-slate-700">{day.label}</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <input type="time" value={dayConfig.start} onChange={(e) => setConfig({ ...config, workingHours: { ...config.workingHours, [day.id]: { ...dayConfig, start: e.target.value } } })} disabled={!dayConfig.enabled} className="input-field w-32" />
                      <span className="text-slate-500">à</span>
                      <input type="time" value={dayConfig.end} onChange={(e) => setConfig({ ...config, workingHours: { ...config.workingHours, [day.id]: { ...dayConfig, end: e.target.value } } })} disabled={!dayConfig.enabled} className="input-field w-32" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'reminders' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
              <div>
                <p className="font-medium text-slate-800">Activer les rappels automatiques</p>
                <p className="text-sm text-slate-500">Envoyer des rappels avant chaque RDV</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={config.reminderSettings?.enabled ?? true} onChange={(e) => setConfig({ ...config, reminderSettings: { ...config.reminderSettings, enabled: e.target.checked } })} className="sr-only peer" />
                <div className="w-11 h-6 bg-slate-200 peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Canal par défaut</label>
              <div className="grid grid-cols-3 gap-3">
                {REMINDER_TYPES.map(type => (
                  <button key={type.id} type="button" onClick={() => setConfig({ ...config, reminderSettings: { ...config.reminderSettings, defaultType: type.id } })} className={`p-4 rounded-xl border-2 transition-all ${config.reminderSettings?.defaultType === type.id ? 'border-primary-500 bg-primary-50' : 'border-slate-200 hover:border-slate-300'}`}>
                    <span className={config.reminderSettings?.defaultType === type.id ? 'text-primary-700 font-medium' : 'text-slate-600'}>{type.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Délai d'envoi</label>
              <select value={config.reminderSettings?.defaultTiming || '24h'} onChange={(e) => setConfig({ ...config, reminderSettings: { ...config.reminderSettings, defaultTiming: e.target.value } })} className="select-field">
                {REMINDER_TIMINGS.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Template SMS</label>
              <textarea value={config.reminderSettings?.smsTemplate || ''} onChange={(e) => setConfig({ ...config, reminderSettings: { ...config.reminderSettings, smsTemplate: e.target.value } })} className="input-field" rows={2} />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Template WhatsApp</label>
              <textarea value={config.reminderSettings?.whatsappTemplate || ''} onChange={(e) => setConfig({ ...config, reminderSettings: { ...config.reminderSettings, whatsappTemplate: e.target.value } })} className="input-field" rows={3} />
            </div>
          </div>
        )}

        {activeTab === 'billing' && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Préfixe des factures</label>
              <input type="text" value={config.invoiceSettings?.prefix || 'FAC'} onChange={(e) => setConfig({ ...config, invoiceSettings: { ...config.invoiceSettings, prefix: e.target.value } })} className="input-field w-32" />
              <p className="text-xs text-slate-500 mt-1">Ex: FAC-2025-001</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Taux de TVA (%)</label>
              <input type="number" value={config.taxRate || 0} onChange={(e) => setConfig({ ...config, taxRate: Number(e.target.value) })} className="input-field w-32" min="0" max="100" />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Coordonnées bancaires</label>
              <textarea value={config.invoiceSettings?.bankDetails || ''} onChange={(e) => setConfig({ ...config, invoiceSettings: { ...config.invoiceSettings, bankDetails: e.target.value } })} className="input-field" rows={2} placeholder="IBAN, BIC..." />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Pied de page factures</label>
              <textarea value={config.invoiceSettings?.footer || ''} onChange={(e) => setConfig({ ...config, invoiceSettings: { ...config.invoiceSettings, footer: e.target.value } })} className="input-field" rows={2} placeholder="Merci de votre confiance..." />
            </div>
          </div>
        )}

        {activeTab === 'integrations' && (
          <div className="space-y-6">
            <div className="p-4 bg-gradient-to-r from-violet-50 to-purple-50 rounded-xl border border-violet-200">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-violet-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-violet-800">Paiement en ligne Stripe</h4>
                  <p className="text-sm text-violet-600">Acceptez les paiements par carte bancaire</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={config.stripeEnabled || false} onChange={(e) => setConfig({ ...config, stripeEnabled: e.target.checked })} className="sr-only peer" />
                  <div className="w-11 h-6 bg-violet-200 peer-focus:ring-4 peer-focus:ring-violet-300 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-violet-500"></div>
                </label>
              </div>
              {config.stripeEnabled && (
                <div className="mt-3">
                  <label className="block text-sm font-medium text-violet-700 mb-1">Clé publique Stripe</label>
                  <input type="text" value={config.stripePublicKey || ''} onChange={(e) => setConfig({ ...config, stripePublicKey: e.target.value })} className="input-field" placeholder="pk_live_..." />
                </div>
              )}
            </div>

            <div className="p-4 bg-gradient-to-r from-sky-50 to-blue-50 rounded-xl border border-sky-200">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-sky-100 rounded-xl flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-sky-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-sky-800">Google Calendar</h4>
                  <p className="text-sm text-sky-600">Synchronisez vos RDV avec Google</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={config.googleCalendarEnabled || false} onChange={(e) => setConfig({ ...config, googleCalendarEnabled: e.target.checked })} className="sr-only peer" />
                  <div className="w-11 h-6 bg-sky-200 peer-focus:ring-4 peer-focus:ring-sky-300 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-500"></div>
                </label>
              </div>
              {config.googleCalendarEnabled && (
                <div className="mt-3">
                  <label className="block text-sm font-medium text-sky-700 mb-1">ID du calendrier</label>
                  <input type="text" value={config.googleCalendarId || ''} onChange={(e) => setConfig({ ...config, googleCalendarId: e.target.value })} className="input-field" placeholder="votre-email@gmail.com" />
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <p className="text-sm text-slate-600">
                <strong>Note:</strong> Les intégrations Stripe et Google Calendar nécessitent une configuration supplémentaire. Contactez le support pour l'activation complète.
              </p>
            </div>
          </div>
        )}
      </div>

      <ConfirmModal isOpen={showResetConfirm} onClose={() => setShowResetConfirm(false)} onConfirm={() => { resetToDemo(); setConfig({ ...cabinetConfig }); }} title="Réinitialiser les données" message="Cette action supprimera toutes vos données et restaurera les données de démonstration. Cette action est irréversible." confirmText="Réinitialiser" danger />
    </div>
  );
}
