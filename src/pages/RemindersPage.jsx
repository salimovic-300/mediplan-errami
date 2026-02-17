import React, { useState, useMemo } from 'react';
import { Bell, MessageSquare, Phone, Mail, Send, Check, Clock, AlertTriangle, Settings, ChevronRight } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Modal } from '../components/Modal';
import { formatDate } from '../utils/helpers';
import { REMINDER_TYPES, REMINDER_TIMINGS } from '../data/constants';

export default function RemindersPage() {
  const { appointments, patients, getPatientById, sendReminder, cabinetConfig, updateCabinetConfig, addNotification } = useApp();
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [selectedReminders, setSelectedReminders] = useState([]);
  const [sending, setSending] = useState(false);
  
  const [settings, setSettings] = useState({
    enabled: cabinetConfig.reminderSettings?.enabled ?? true,
    defaultType: cabinetConfig.reminderSettings?.defaultType || 'whatsapp',
    defaultTiming: cabinetConfig.reminderSettings?.defaultTiming || '24h',
    smsTemplate: cabinetConfig.reminderSettings?.smsTemplate || 'Rappel: RDV le {date} à {time}. {cabinet}',
    whatsappTemplate: cabinetConfig.reminderSettings?.whatsappTemplate || '👋 Bonjour {patient}!\n📅 RDV: {date} à {time}\n📍 {cabinet}',
  });

  const today = new Date().toISOString().split('T')[0];

  const pendingReminders = useMemo(() => {
    return appointments
      .filter(a => a.date >= today && !a.reminderSent && !['annule', 'termine', 'absent'].includes(a.status))
      .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))
      .map(a => ({
        ...a,
        patient: getPatientById(a.patientId),
      }));
  }, [appointments, today, getPatientById]);

  const sentReminders = useMemo(() => {
    return appointments
      .filter(a => a.date >= today && a.reminderSent)
      .sort((a, b) => b.date.localeCompare(a.date))
      .map(a => ({
        ...a,
        patient: getPatientById(a.patientId),
      }));
  }, [appointments, today, getPatientById]);

  const toggleSelectAll = () => {
    if (selectedReminders.length === pendingReminders.length) {
      setSelectedReminders([]);
    } else {
      setSelectedReminders(pendingReminders.map(r => r.id));
    }
  };

  const toggleSelect = (id) => {
    if (selectedReminders.includes(id)) {
      setSelectedReminders(selectedReminders.filter(r => r !== id));
    } else {
      setSelectedReminders([...selectedReminders, id]);
    }
  };

  const handleSendSelected = async () => {
    if (selectedReminders.length === 0) return;
    setSending(true);
    
    for (const id of selectedReminders) {
      const apt = pendingReminders.find(r => r.id === id);
      if (apt) {
        await new Promise(resolve => setTimeout(resolve, 300));
        sendReminder(id, apt.patient?.preferredReminder || settings.defaultType);
      }
    }
    
    setSending(false);
    setSelectedReminders([]);
    addNotification(`${selectedReminders.length} rappels envoyés avec succès`, 'success');
  };

  const handleSendSingle = (apt) => {
    sendReminder(apt.id, apt.patient?.preferredReminder || settings.defaultType);
  };

  const handleSaveSettings = () => {
    updateCabinetConfig({ reminderSettings: settings });
    setShowSettingsModal(false);
  };

  const getReminderIcon = (type) => {
    switch(type) {
      case 'sms': return MessageSquare;
      case 'whatsapp': return Phone;
      case 'email': return Mail;
      default: return Bell;
    }
  };

  const getReminderColor = (type) => {
    switch(type) {
      case 'sms': return 'text-sky-500 bg-sky-100';
      case 'whatsapp': return 'text-emerald-500 bg-emerald-100';
      case 'email': return 'text-violet-500 bg-violet-100';
      default: return 'text-slate-500 bg-slate-100';
    }
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold text-slate-900">Rappels SMS/WhatsApp</h1>
          <p className="text-slate-500">{pendingReminders.length} rappels en attente</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowSettingsModal(true)} className="btn-secondary flex items-center gap-2">
            <Settings size={18} /><span className="hidden sm:inline">Paramètres</span>
          </button>
          {selectedReminders.length > 0 && (
            <button onClick={handleSendSelected} disabled={sending} className="btn-primary flex items-center gap-2">
              {sending ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send size={18} />
              )}
              <span>Envoyer ({selectedReminders.length})</span>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
              <Clock className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{pendingReminders.length}</p>
              <p className="text-slate-500 text-sm">En attente</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
              <Check className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{sentReminders.length}</p>
              <p className="text-slate-500 text-sm">Envoyés</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center">
              <Phone className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{settings.defaultType === 'whatsapp' ? 'WhatsApp' : settings.defaultType.toUpperCase()}</p>
              <p className="text-slate-500 text-sm">Canal par défaut</p>
            </div>
          </div>
        </div>
      </div>

      {!settings.enabled && (
        <div className="card p-4 border-amber-200 bg-amber-50">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <div>
              <p className="font-medium text-amber-800">Rappels désactivés</p>
              <p className="text-sm text-amber-600">Activez les rappels dans les paramètres pour envoyer des notifications.</p>
            </div>
          </div>
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <input type="checkbox" checked={selectedReminders.length === pendingReminders.length && pendingReminders.length > 0} onChange={toggleSelectAll} className="checkbox-custom" />
            <h3 className="font-semibold text-slate-800">Rappels en attente</h3>
          </div>
        </div>

        {pendingReminders.length === 0 ? (
          <div className="p-12 text-center">
            <Bell className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">Aucun rappel en attente</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {pendingReminders.map(apt => {
              const Icon = getReminderIcon(apt.patient?.preferredReminder || settings.defaultType);
              const iconColor = getReminderColor(apt.patient?.preferredReminder || settings.defaultType);
              return (
                <div key={apt.id} className="p-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <input type="checkbox" checked={selectedReminders.includes(apt.id)} onChange={() => toggleSelect(apt.id)} className="checkbox-custom" />
                    <div className={`w-10 h-10 rounded-xl ${iconColor} flex items-center justify-center`}>
                      <Icon size={20} />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-slate-800">{apt.patient?.firstName} {apt.patient?.lastName}</p>
                      <p className="text-sm text-slate-500">{apt.patient?.phone}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-slate-800">{formatDate(apt.date, 'EEE d MMM')}</p>
                      <p className="text-sm text-slate-500">à {apt.time}</p>
                    </div>
                    <button onClick={() => handleSendSingle(apt)} className="btn-primary text-sm px-4 py-2 flex items-center gap-2">
                      <Send size={14} />Envoyer
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {sentReminders.length > 0 && (
        <div className="card overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50">
            <h3 className="font-semibold text-slate-800">Rappels envoyés récemment</h3>
          </div>
          <div className="divide-y divide-slate-100">
            {sentReminders.slice(0, 10).map(apt => {
              const Icon = getReminderIcon(apt.reminderType);
              const iconColor = getReminderColor(apt.reminderType);
              return (
                <div key={apt.id} className="p-4 flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl ${iconColor} flex items-center justify-center`}>
                    <Icon size={20} />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-slate-800">{apt.patient?.firstName} {apt.patient?.lastName}</p>
                    <p className="text-sm text-slate-500">{apt.patient?.phone}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-slate-800">{formatDate(apt.date, 'EEE d MMM')}</p>
                    <p className="text-sm text-slate-500">à {apt.time}</p>
                  </div>
                  <span className="badge badge-success flex items-center gap-1"><Check size={12} />Envoyé</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <Modal isOpen={showSettingsModal} onClose={() => setShowSettingsModal(false)} title="Paramètres des rappels" size="lg">
        <div className="space-y-6">
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
            <div>
              <p className="font-medium text-slate-800">Activer les rappels</p>
              <p className="text-sm text-slate-500">Envoyer des rappels automatiques aux patients</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={settings.enabled} onChange={(e) => setSettings({ ...settings, enabled: e.target.checked })} className="sr-only peer" />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Canal par défaut</label>
            <div className="grid grid-cols-3 gap-3">
              {REMINDER_TYPES.map(type => {
                const Icon = getReminderIcon(type.id);
                return (
                  <button key={type.id} type="button" onClick={() => setSettings({ ...settings, defaultType: type.id })} className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${settings.defaultType === type.id ? 'border-primary-500 bg-primary-50' : 'border-slate-200 hover:border-slate-300'}`}>
                    <Icon size={24} className={settings.defaultType === type.id ? 'text-primary-600' : 'text-slate-400'} />
                    <span className={settings.defaultType === type.id ? 'text-primary-700 font-medium' : 'text-slate-600'}>{type.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Délai d'envoi</label>
            <select value={settings.defaultTiming} onChange={(e) => setSettings({ ...settings, defaultTiming: e.target.value })} className="select-field">
              {REMINDER_TIMINGS.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Template SMS</label>
            <textarea value={settings.smsTemplate} onChange={(e) => setSettings({ ...settings, smsTemplate: e.target.value })} className="input-field" rows={2} />
            <p className="text-xs text-slate-500 mt-1">Variables: {'{patient}'}, {'{date}'}, {'{time}'}, {'{cabinet}'}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Template WhatsApp</label>
            <textarea value={settings.whatsappTemplate} onChange={(e) => setSettings({ ...settings, whatsappTemplate: e.target.value })} className="input-field" rows={3} />
          </div>

          <div className="flex gap-3 pt-4">
            <button onClick={() => setShowSettingsModal(false)} className="btn-secondary flex-1">Annuler</button>
            <button onClick={handleSaveSettings} className="btn-primary flex-1">Enregistrer</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
