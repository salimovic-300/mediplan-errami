import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Plus, Bell, MessageSquare, Phone, Mail, Trash2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Modal } from '../components/Modal';
import { formatDate, getStatusColor, getStatusLabel, generateTimeSlots } from '../utils/helpers';
import { APPOINTMENT_TYPES, REMINDER_TYPES } from '../data/constants';
import { addDays, format, startOfWeek } from 'date-fns';
import { fr } from 'date-fns/locale';

const TIME_SLOTS = generateTimeSlots(8, 19, 30);

const INITIAL_FORM = (currentUser, practitioners) => ({
  patientId: '',
  practitionerId: currentUser?.id || practitioners?.[0]?.id || '',
  date: '',
  time: '',
  duration: 30,
  type: 'consultation',
  notes: '',
  fee: 400,
  reminderType: 'whatsapp',
});

export default function AgendaPage() {
  const {
    appointments, patients,
    addAppointment, updateAppointment, deleteAppointment,
    getPatientById, sendReminder, currentUser,
  } = useApp();

  // ── getPractitioners est optionnel selon le contexte ──────────────────────
  const { getPractitioners } = useApp();
  const practitioners = useMemo(() => {
    try { return getPractitioners?.() || []; }
    catch { return []; }
  }, [getPractitioners]);

  // ── N'afficher le champ praticien que s'il y a VRAIMENT plusieurs praticiens
  // distincts du currentUser
  const showPractitionerField = practitioners.length > 1;

  const [currentDate, setCurrentDate] = useState(new Date());
  const [showModal, setShowModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [formData, setFormData] = useState(INITIAL_FORM(currentUser, practitioners));
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays  = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const today     = new Date().toISOString().split('T')[0];

  // ── Helpers ───────────────────────────────────────────────────────────────
  const getAppointmentsForSlot = (date, time) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return appointments.filter(a => a.date === dateStr && a.time === time);
  };

  const resetForm = () => {
    setFormData(INITIAL_FORM(currentUser, practitioners));
    setSelectedAppointment(null);
    setDeleteConfirm(false);
  };

  const update = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));

  // ── Ouverture modal ───────────────────────────────────────────────────────
  const handleSlotClick = (date, time) => {
    resetForm();
    setFormData(prev => ({
      ...prev,
      date: format(date, 'yyyy-MM-dd'),
      time,
      practitionerId: currentUser?.id || practitioners[0]?.id || '',
    }));
    setShowModal(true);
  };

  const handleAppointmentClick = (apt, e) => {
    e.stopPropagation();
    setSelectedAppointment(apt);
    setFormData({ ...INITIAL_FORM(currentUser, practitioners), ...apt });
    setDeleteConfirm(false);
    setShowModal(true);
  };

  const handleNewRDV = () => {
    resetForm();
    setShowModal(true);
  };

  // ── Soumission ────────────────────────────────────────────────────────────
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.patientId || !formData.date || !formData.time) return;

    if (selectedAppointment) {
      updateAppointment(selectedAppointment.id, formData);
    } else {
      addAppointment({
        ...formData,
        practitionerId: formData.practitionerId || currentUser?.id || '',
        status: 'planifie',
        paid: false,
        reminderSent: false,
      });
    }
    setShowModal(false);
    resetForm();
  };

  // ── Suppression ───────────────────────────────────────────────────────────
  const handleDelete = () => {
    if (!deleteConfirm) { setDeleteConfirm(true); return; }
    if (selectedAppointment) {
      deleteAppointment(selectedAppointment.id);
      setShowModal(false);
      resetForm();
    }
  };

  // ── Changement de type → mise à jour tarif + durée ────────────────────────
  const handleTypeChange = (typeId) => {
    const type = APPOINTMENT_TYPES.find(t => t.id === typeId);
    setFormData(prev => ({
      ...prev,
      type: typeId,
      duration: type?.duration || 30,
      fee: type?.fee || prev.fee,
    }));
  };

  // ── Icône rappel ──────────────────────────────────────────────────────────
  const getReminderIcon = (type) => {
    switch (type) {
      case 'sms':      return MessageSquare;
      case 'whatsapp': return Phone;
      case 'email':    return Mail;
      default:         return Bell;
    }
  };

  // ── RENDER ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 pb-20 lg:pb-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold text-slate-900">Agenda</h1>
          <p className="text-slate-500">Gérez vos rendez-vous</p>
        </div>
        <button onClick={handleNewRDV} className="btn-primary flex items-center gap-2">
          <Plus size={20} /><span>Nouveau RDV</span>
        </button>
      </div>

      {/* Navigation semaine */}
      <div className="card p-4">
        <div className="flex items-center justify-between">
          <button onClick={() => setCurrentDate(addDays(currentDate, -7))} className="p-2 rounded-lg hover:bg-slate-100">
            <ChevronLeft size={20} />
          </button>
          <div className="flex items-center gap-4">
            <button onClick={() => setCurrentDate(new Date())} className="btn-secondary text-sm">Aujourd'hui</button>
            <h2 className="font-display font-semibold text-slate-800 capitalize">
              {format(weekStart, 'MMMM yyyy', { locale: fr })}
            </h2>
          </div>
          <button onClick={() => setCurrentDate(addDays(currentDate, 7))} className="p-2 rounded-lg hover:bg-slate-100">
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Grille agenda */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            {/* En-tête jours */}
            <div className="grid grid-cols-8 border-b border-slate-200">
              <div className="p-3 bg-slate-50" />
              {weekDays.map(day => {
                const isToday = format(day, 'yyyy-MM-dd') === today;
                return (
                  <div key={day.toISOString()} className={`p-3 text-center border-l border-slate-200 ${isToday ? 'bg-primary-50' : 'bg-slate-50'}`}>
                    <p className="text-xs text-slate-500 uppercase">{format(day, 'EEE', { locale: fr })}</p>
                    <p className={`text-lg font-semibold ${isToday ? 'text-primary-600' : 'text-slate-800'}`}>{format(day, 'd')}</p>
                  </div>
                );
              })}
            </div>

            {/* Créneaux */}
            <div className="max-h-[600px] overflow-y-auto">
              {TIME_SLOTS.map(time => (
                <div key={time} className="grid grid-cols-8 border-b border-slate-100">
                  <div className="p-2 text-xs text-slate-500 text-right pr-3 bg-slate-50 select-none">{time}</div>
                  {weekDays.map(day => {
                    const slotApts = getAppointmentsForSlot(day, time);
                    return (
                      <div
                        key={`${day}-${time}`}
                        className="p-1 border-l border-slate-100 min-h-[60px] hover:bg-slate-50 cursor-pointer transition-colors"
                        onClick={() => handleSlotClick(day, time)}
                      >
                        {slotApts.map(apt => {
                          const patient   = getPatientById(apt.patientId);
                          const typeInfo  = APPOINTMENT_TYPES.find(t => t.id === apt.type);
                          const RIcon     = getReminderIcon(apt.reminderType);
                          return (
                            <div
                              key={apt.id}
                              onClick={(e) => handleAppointmentClick(apt, e)}
                              className={`p-2 rounded-lg text-xs mb-1 cursor-pointer transition-all hover:scale-[1.02] shadow-sm ${getStatusColor(apt.status)}`}
                              style={{ borderLeft: `3px solid ${typeInfo?.color || '#14b8a6'}` }}
                            >
                              <div className="flex items-center justify-between gap-1">
                                <p className="font-medium truncate">{patient?.firstName} {patient?.lastName?.[0]}.</p>
                                {apt.reminderSent && <RIcon size={10} className="text-current opacity-60 flex-shrink-0" />}
                              </div>
                              <p className="text-[10px] opacity-75 truncate">{typeInfo?.label}</p>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── MODAL RDV ── */}
      <Modal
        isOpen={showModal}
        onClose={() => { setShowModal(false); resetForm(); }}
        title={selectedAppointment ? 'Modifier le rendez-vous' : 'Nouveau rendez-vous'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Patient */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Patient *</label>
            <select
              value={formData.patientId}
              onChange={(e) => update('patientId', e.target.value)}
              className="select-field"
              required
            >
              <option value="">— Sélectionner un patient —</option>
              {patients
                .slice()
                .sort((a, b) => a.lastName.localeCompare(b.lastName))
                .map(p => (
                  <option key={p.id} value={p.id}>{p.lastName} {p.firstName}</option>
                ))}
            </select>
          </div>

          {/* Praticien — affiché seulement si cabinet multi-praticiens */}
          {showPractitionerField && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Praticien</label>
              <select
                value={formData.practitionerId}
                onChange={(e) => update('practitionerId', e.target.value)}
                className="select-field"
              >
                {practitioners.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Date + Heure */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Date *</label>
              <input
                type="date"
                value={formData.date}
                min={today}
                onChange={(e) => update('date', e.target.value)}
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Heure *</label>
              <select
                value={formData.time}
                onChange={(e) => update('time', e.target.value)}
                className="select-field"
                required
              >
                <option value="">— Choisir —</option>
                {TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          {/* Type + Tarif */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
              <select
                value={formData.type}
                onChange={(e) => handleTypeChange(e.target.value)}
                className="select-field"
              >
                {APPOINTMENT_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Tarif (DH)</label>
              <input
                type="number"
                min="0"
                step="50"
                value={formData.fee}
                onChange={(e) => update('fee', Number(e.target.value))}
                className="input-field"
              />
            </div>
          </div>

          {/* Rappel */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Rappel par</label>
            <select
              value={formData.reminderType}
              onChange={(e) => update('reminderType', e.target.value)}
              className="select-field"
            >
              {REMINDER_TYPES.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => update('notes', e.target.value)}
              className="input-field resize-none"
              rows={2}
              placeholder="Motif, observations..."
            />
          </div>

          {/* Statut (modification uniquement) */}
          {selectedAppointment && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Statut</label>
              <div className="flex flex-wrap gap-2">
                {['planifie', 'confirme', 'present', 'termine', 'absent', 'annule'].map(status => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => update('status', status)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      formData.status === status
                        ? getStatusColor(status)
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {getStatusLabel(status)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-4 border-t border-slate-100">
            {selectedAppointment && (
              <>
                {/* Bouton supprimer avec confirmation */}
                <button
                  type="button"
                  onClick={handleDelete}
                  className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    deleteConfirm
                      ? 'bg-red-600 text-white'
                      : 'bg-red-50 text-red-600 hover:bg-red-100'
                  }`}
                >
                  <Trash2 size={15} />
                  {deleteConfirm ? 'Confirmer ?' : 'Suppr.'}
                </button>

                {/* Envoyer rappel */}
                {!selectedAppointment.reminderSent && (
                  <button
                    type="button"
                    onClick={() => { sendReminder(selectedAppointment.id, selectedAppointment.reminderType || 'whatsapp'); }}
                    className="btn-secondary flex items-center gap-1 text-sm"
                  >
                    <Bell size={14} /> Rappel
                  </button>
                )}
              </>
            )}

            <div className="flex-1" />

            <button
              type="button"
              onClick={() => { setShowModal(false); resetForm(); }}
              className="btn-secondary"
            >
              Annuler
            </button>
            <button type="submit" className="btn-primary">
              {selectedAppointment ? 'Enregistrer' : 'Créer'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
