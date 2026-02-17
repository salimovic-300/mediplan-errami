import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Bell, MessageSquare, Phone, Mail } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Modal } from '../components/Modal';
import { formatDate, getStatusColor, getStatusLabel, generateTimeSlots } from '../utils/helpers';
import { APPOINTMENT_TYPES, REMINDER_TYPES } from '../data/constants';
import { addDays, format, startOfWeek } from 'date-fns';
import { fr } from 'date-fns/locale';

const TIME_SLOTS = generateTimeSlots(8, 19, 30);

export default function AgendaPage() {
  const { appointments, patients, getPractitioners, addAppointment, updateAppointment, deleteAppointment, getPatientById, sendReminder, currentUser } = useApp();
  const practitioners = getPractitioners();
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('week');
  const [showModal, setShowModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  
  const [formData, setFormData] = useState({
    patientId: '', practitionerId: currentUser?.id || '', date: '', time: '', duration: 30, type: 'consultation', notes: '', fee: 400, reminderType: 'whatsapp',
  });

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const today = new Date().toISOString().split('T')[0];

  const getAppointmentsForSlot = (date, time) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return appointments.filter(a => a.date === dateStr && a.time === time);
  };

  const handleSlotClick = (date, time) => {
    setFormData({ ...formData, date: format(date, 'yyyy-MM-dd'), time, practitionerId: currentUser?.id || practitioners[0]?.id || '' });
    setSelectedAppointment(null);
    setShowModal(true);
  };

  const handleAppointmentClick = (apt, e) => {
    e.stopPropagation();
    setSelectedAppointment(apt);
    setFormData({ ...apt });
    setShowModal(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.patientId || !formData.date || !formData.time) return;
    if (selectedAppointment) {
      updateAppointment(selectedAppointment.id, formData);
    } else {
      addAppointment({ ...formData, status: 'planifie', paid: false, reminderSent: false });
    }
    setShowModal(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({ patientId: '', practitionerId: currentUser?.id || '', date: '', time: '', duration: 30, type: 'consultation', notes: '', fee: 400, reminderType: 'whatsapp' });
    setSelectedAppointment(null);
  };

  const handleStatusChange = (apt, newStatus) => {
    updateAppointment(apt.id, { status: newStatus });
  };

  const handleSendReminder = (apt) => {
    sendReminder(apt.id, apt.reminderType || 'whatsapp');
  };

  const handleDelete = () => {
    if (selectedAppointment) {
      deleteAppointment(selectedAppointment.id);
      setShowModal(false);
      resetForm();
    }
  };

  const getReminderIcon = (type) => {
    switch(type) {
      case 'sms': return MessageSquare;
      case 'whatsapp': return Phone;
      case 'email': return Mail;
      default: return Bell;
    }
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold text-slate-900">Agenda</h1>
          <p className="text-slate-500">Gérez vos rendez-vous</p>
        </div>
        <button onClick={() => { resetForm(); setShowModal(true); }} className="btn-primary flex items-center gap-2">
          <Plus size={20} /><span>Nouveau RDV</span>
        </button>
      </div>

      <div className="card p-4">
        <div className="flex items-center justify-between">
          <button onClick={() => setCurrentDate(addDays(currentDate, -7))} className="p-2 rounded-lg hover:bg-slate-100"><ChevronLeft size={20} /></button>
          <div className="flex items-center gap-4">
            <button onClick={() => setCurrentDate(new Date())} className="btn-secondary text-sm">Aujourd'hui</button>
            <h2 className="font-display font-semibold text-slate-800">{format(weekStart, 'MMMM yyyy', { locale: fr })}</h2>
          </div>
          <button onClick={() => setCurrentDate(addDays(currentDate, 7))} className="p-2 rounded-lg hover:bg-slate-100"><ChevronRight size={20} /></button>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
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

            <div className="max-h-[600px] overflow-y-auto">
              {TIME_SLOTS.map(time => (
                <div key={time} className="grid grid-cols-8 border-b border-slate-100">
                  <div className="p-2 text-xs text-slate-500 text-right pr-3 bg-slate-50">{time}</div>
                  {weekDays.map(day => {
                    const slotAppointments = getAppointmentsForSlot(day, time);
                    return (
                      <div key={`${day}-${time}`} className="p-1 border-l border-slate-100 min-h-[60px] hover:bg-slate-50 cursor-pointer" onClick={() => handleSlotClick(day, time)}>
                        {slotAppointments.map(apt => {
                          const patient = getPatientById(apt.patientId);
                          const typeInfo = APPOINTMENT_TYPES.find(t => t.id === apt.type);
                          const ReminderIcon = getReminderIcon(apt.reminderType);
                          return (
                            <div key={apt.id} onClick={(e) => handleAppointmentClick(apt, e)} className={`p-2 rounded-lg text-xs mb-1 cursor-pointer transition-all hover:scale-[1.02] ${getStatusColor(apt.status)}`} style={{ borderLeft: `3px solid ${typeInfo?.color || '#14b8a6'}` }}>
                              <div className="flex items-center justify-between">
                                <p className="font-medium truncate">{patient?.firstName} {patient?.lastName?.[0]}.</p>
                                {apt.reminderSent && <ReminderIcon size={10} className="text-current opacity-60" />}
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

      <Modal isOpen={showModal} onClose={() => { setShowModal(false); resetForm(); }} title={selectedAppointment ? 'Modifier le RDV' : 'Nouveau rendez-vous'} size="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Patient *</label>
            <select value={formData.patientId} onChange={(e) => setFormData({ ...formData, patientId: e.target.value })} className="select-field" required>
              <option value="">Sélectionner un patient</option>
              {patients.map(p => <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>)}
            </select>
          </div>

          {practitioners.length > 1 && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Praticien</label>
              <select value={formData.practitionerId} onChange={(e) => setFormData({ ...formData, practitionerId: e.target.value })} className="select-field">
                {practitioners.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Date *</label>
              <input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} className="input-field" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Heure *</label>
              <select value={formData.time} onChange={(e) => setFormData({ ...formData, time: e.target.value })} className="select-field" required>
                <option value="">Sélectionner</option>
                {TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
              <select value={formData.type} onChange={(e) => {
                const type = APPOINTMENT_TYPES.find(t => t.id === e.target.value);
                setFormData({ ...formData, type: e.target.value, duration: type?.duration || 30, fee: type?.fee || 400 });
              }} className="select-field">
                {APPOINTMENT_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Tarif (DH)</label>
              <input type="number" value={formData.fee} onChange={(e) => setFormData({ ...formData, fee: Number(e.target.value) })} className="input-field" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Rappel par</label>
            <select value={formData.reminderType} onChange={(e) => setFormData({ ...formData, reminderType: e.target.value })} className="select-field">
              {REMINDER_TYPES.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
            <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} className="input-field" rows={2} />
          </div>

          {selectedAppointment && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Statut</label>
              <div className="flex flex-wrap gap-2">
                {['planifie', 'confirme', 'present', 'termine', 'absent', 'annule'].map(status => (
                  <button key={status} type="button" onClick={() => setFormData({ ...formData, status })} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${formData.status === status ? getStatusColor(status) : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                    {getStatusLabel(status)}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            {selectedAppointment && (
              <>
                <button type="button" onClick={handleDelete} className="btn-danger">Supprimer</button>
                {!selectedAppointment.reminderSent && (
                  <button type="button" onClick={() => handleSendReminder(selectedAppointment)} className="btn-secondary flex items-center gap-2">
                    <Bell size={16} />Envoyer rappel
                  </button>
                )}
              </>
            )}
            <button type="button" onClick={() => { setShowModal(false); resetForm(); }} className="btn-secondary flex-1">Annuler</button>
            <button type="submit" className="btn-primary flex-1">{selectedAppointment ? 'Enregistrer' : 'Créer'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
