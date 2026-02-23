import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Phone, Mail, MapPin, Calendar, FileText, Edit2, Trash2, Plus, Heart, AlertTriangle, Clock, CreditCard, Download, Upload, FolderOpen } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Modal, ConfirmModal } from '../components/Modal';
import { formatDate, formatCurrency, calculateAge, getStatusColor, getStatusLabel, fileToBase64 } from '../utils/helpers';
import { MEDICAL_RECORD_TYPES, APPOINTMENT_TYPES } from '../data/constants';

export default function PatientDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getPatientById, deletePatient, getAppointmentsByPatient, getMedicalRecordsByPatient, addMedicalRecord, updateMedicalRecord, deleteMedicalRecord, updatePatient, invoices } = useApp();
  
  const patient = getPatientById(id);
  const appointments = getAppointmentsByPatient(id);
  const medicalRecords = getMedicalRecordsByPatient(id);
  const patientInvoices = invoices.filter(inv => inv.patientId === id);

  const [activeTab, setActiveTab] = useState('overview');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [recordForm, setRecordForm] = useState({ type: 'consultation_note', title: '', content: '', attachments: [] });

  if (!patient) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <p className="text-slate-500 mb-4">Patient non trouvé</p>
        <button onClick={() => navigate('/patients')} className="btn-primary">Retour aux patients</button>
      </div>
    );
  }

  const completedAppointments = appointments.filter(a => a.status === 'termine' || a.status === 'present');
  const totalSpent = patientInvoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + (i.total || 0), 0);
  const pendingAmount = patientInvoices.filter(i => i.status !== 'paid').reduce((sum, i) => sum + (i.total || 0), 0);

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const base64 = await fileToBase64(file);
      updatePatient(patient.id, { photo: base64 });
    }
  };

  const handleRecordSubmit = (e) => {
    e.preventDefault();
    if (editingRecord) {
      updateMedicalRecord(editingRecord.id, recordForm);
    } else {
      addMedicalRecord({ ...recordForm, patientId: patient.id });
    }
    setShowRecordModal(false);
    setRecordForm({ type: 'consultation_note', title: '', content: '', attachments: [] });
    setEditingRecord(null);
  };

  const handleAttachmentUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const base64 = await fileToBase64(file);
      setRecordForm({
        ...recordForm,
        attachments: [...recordForm.attachments, { name: file.name, type: file.type, data: base64 }]
      });
    }
  };

  const openEditRecord = (record) => {
    setEditingRecord(record);
    setRecordForm({ type: record.type, title: record.title, content: record.content, attachments: record.attachments || [] });
    setShowRecordModal(true);
  };

  const tabs = [
    { id: 'overview', label: 'Aperçu', icon: Heart },
    { id: 'appointments', label: 'Rendez-vous', icon: Calendar },
    { id: 'records', label: 'Dossier médical', icon: FolderOpen },
    { id: 'billing', label: 'Facturation', icon: CreditCard },
  ];

  return (
    <div className="space-y-6 pb-20 lg:pb-6">
      <button onClick={() => navigate('/patients')} className="flex items-center gap-2 text-slate-600 hover:text-slate-800 transition-colors">
        <ArrowLeft size={20} /><span>Retour aux patients</span>
      </button>

      <div className="card p-6">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="relative group">
            {patient.photo ? (
              <img src={patient.photo} alt="" className="w-24 h-24 rounded-2xl object-cover" />
            ) : (
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary-400 to-primary-500 text-white flex items-center justify-center text-2xl font-bold">
                {patient.firstName[0]}{patient.lastName[0]}
              </div>
            )}
            <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-2xl opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
              <Upload className="text-white" size={24} />
              <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
            </label>
          </div>

          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-display font-bold text-slate-900">{patient.firstName} {patient.lastName}</h1>
                <p className="text-slate-500">{patient.gender} • {calculateAge(patient.dateOfBirth)} ans</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => navigate(`/patients`)} className="btn-secondary flex items-center gap-2"><Edit2 size={16} />Modifier</button>
                <button onClick={() => setShowDeleteConfirm(true)} className="btn-danger flex items-center gap-2"><Trash2 size={16} /></button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
              <div className="flex items-center gap-2 text-slate-600"><Phone size={16} className="text-slate-400" /><span>{patient.phone}</span></div>
              {patient.email && <div className="flex items-center gap-2 text-slate-600"><Mail size={16} className="text-slate-400" /><span>{patient.email}</span></div>}
              {patient.city && <div className="flex items-center gap-2 text-slate-600"><MapPin size={16} className="text-slate-400" /><span>{patient.city}</span></div>}
            </div>

            {(patient.allergies?.length > 0 || patient.bloodType) && (
              <div className="flex flex-wrap gap-2 mt-4">
                {patient.bloodType && <span className="badge badge-info">{patient.bloodType}</span>}
                {patient.allergies?.map((a, i) => <span key={i} className="badge badge-danger flex items-center gap-1"><AlertTriangle size={12} />{a}</span>)}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium whitespace-nowrap transition-all ${activeTab === tab.id ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30' : 'bg-white text-slate-600 hover:bg-slate-50'}`}>
            <tab.icon size={18} /><span>{tab.label}</span>
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="stat-card">
            <Calendar className="w-8 h-8 text-primary-500 mb-3" />
            <p className="text-2xl font-bold text-slate-900">{patient.totalVisits || appointments.length}</p>
            <p className="text-slate-500 text-sm">Visites totales</p>
          </div>
          <div className="stat-card">
            <Clock className="w-8 h-8 text-amber-500 mb-3" />
            <p className="text-2xl font-bold text-slate-900">{patient.lastVisit ? formatDate(patient.lastVisit) : 'N/A'}</p>
            <p className="text-slate-500 text-sm">Dernière visite</p>
          </div>
          <div className="stat-card">
            <CreditCard className="w-8 h-8 text-emerald-500 mb-3" />
            <p className="text-2xl font-bold text-slate-900">{formatCurrency(totalSpent)}</p>
            <p className="text-slate-500 text-sm">Total payé</p>
          </div>
          <div className="stat-card">
            <FileText className="w-8 h-8 text-rose-500 mb-3" />
            <p className="text-2xl font-bold text-slate-900">{formatCurrency(pendingAmount)}</p>
            <p className="text-slate-500 text-sm">En attente</p>
          </div>

          {patient.emergencyContact?.name && (
            <div className="md:col-span-2 card p-5 border-amber-200 bg-amber-50">
              <div className="flex items-center gap-2 text-amber-800 font-semibold mb-2">
                <AlertTriangle size={18} />Contact d'urgence
              </div>
              <p className="text-slate-700">{patient.emergencyContact.name} ({patient.emergencyContact.relation})</p>
              <p className="text-slate-600">{patient.emergencyContact.phone}</p>
            </div>
          )}

          {patient.mutuelle && (
            <div className="md:col-span-2 card p-5">
              <h4 className="font-semibold text-slate-800 mb-2">Mutuelle</h4>
              <p className="text-slate-700">{patient.mutuelle}</p>
              {patient.mutuelleNumber && <p className="text-slate-500 text-sm">N° {patient.mutuelleNumber}</p>}
            </div>
          )}
        </div>
      )}

      {activeTab === 'appointments' && (
        <div className="card overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <h3 className="font-semibold text-slate-800">Historique des rendez-vous</h3>
            <button onClick={() => navigate('/agenda')} className="btn-primary text-sm">Nouveau RDV</button>
          </div>
          {appointments.length === 0 ? (
            <p className="p-8 text-center text-slate-500">Aucun rendez-vous</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {appointments.sort((a, b) => b.date.localeCompare(a.date)).map(apt => {
                const typeInfo = APPOINTMENT_TYPES.find(t => t.id === apt.type);
                return (
                  <div key={apt.id} className="p-4 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-slate-100 flex flex-col items-center justify-center">
                          <span className="text-xs text-slate-500">{formatDate(apt.date, 'MMM')}</span>
                          <span className="text-lg font-bold text-slate-800">{formatDate(apt.date, 'd')}</span>
                        </div>
                        <div>
                          <p className="font-medium text-slate-800">{typeInfo?.label || apt.type}</p>
                          <p className="text-sm text-slate-500">{apt.time} • {apt.duration} min</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-slate-700 font-medium">{formatCurrency(apt.fee)}</span>
                        <span className={`badge ${getStatusColor(apt.status)}`}>{getStatusLabel(apt.status)}</span>
                        {apt.paid && <span className="badge badge-success">Payé</span>}
                      </div>
                    </div>
                    {apt.notes && <p className="mt-2 text-sm text-slate-500 ml-16">{apt.notes}</p>}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === 'records' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => { setEditingRecord(null); setRecordForm({ type: 'consultation_note', title: '', content: '', attachments: [] }); setShowRecordModal(true); }} className="btn-primary flex items-center gap-2">
              <Plus size={18} />Ajouter un document
            </button>
          </div>

          {medicalRecords.length === 0 ? (
            <div className="card p-12 text-center">
              <FolderOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">Aucun document médical</p>
            </div>
          ) : (
            <div className="space-y-3">
              {medicalRecords.map(record => {
                const typeInfo = MEDICAL_RECORD_TYPES.find(t => t.id === record.type);
                return (
                  <div key={record.id} className="card p-5 hover:shadow-lg transition-all">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center">
                          <FileText className="w-5 h-5 text-primary-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-slate-800">{record.title}</h4>
                          <p className="text-sm text-slate-500">{typeInfo?.label} • {formatDate(record.date)}</p>
                          <p className="text-slate-600 mt-2">{record.content}</p>
                          {record.attachments?.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-3">
                              {record.attachments.map((att, i) => (
                                <a key={i} href={att.data} download={att.name} className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 rounded-lg text-sm text-slate-600 hover:bg-slate-200">
                                  <Download size={14} />{att.name}
                                </a>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => openEditRecord(record)} className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600"><Edit2 size={16} /></button>
                        <button onClick={() => deleteMedicalRecord(record.id)} className="p-2 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-500"><Trash2 size={16} /></button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === 'billing' && (
        <div className="card overflow-hidden">
          <div className="p-4 border-b border-slate-200">
            <h3 className="font-semibold text-slate-800">Historique de facturation</h3>
          </div>
          <div className="divide-y divide-slate-100">
            {patientInvoices.length === 0 ? (
              <p className="p-8 text-center text-slate-500">Aucune facture pour ce patient</p>
            ) : (
              patientInvoices.sort((a, b) => b.createdAt?.localeCompare(a.createdAt)).map(inv => (
                <div key={inv.id} className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-800">{inv.number}</p>
                    <p className="text-sm text-slate-500">{inv.date || inv.createdAt?.split('T')[0]}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-semibold text-slate-800">{formatCurrency(inv.total)}</span>
                    <span className={`badge ${inv.status === 'paid' ? 'badge-success' : 'badge-warning'}`}>
                      {inv.status === 'paid' ? 'Payé' : 'En attente'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="p-4 bg-slate-50 border-t border-slate-200">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Total payé</span>
              <span className="font-semibold text-emerald-600">{formatCurrency(totalSpent)}</span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span className="text-slate-600">En attente</span>
              <span className="font-semibold text-amber-600">{formatCurrency(pendingAmount)}</span>
            </div>
          </div>
        </div>
      )}

      <Modal isOpen={showRecordModal} onClose={() => setShowRecordModal(false)} title={editingRecord ? 'Modifier le document' : 'Nouveau document médical'} size="lg">
        <form onSubmit={handleRecordSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Type de document</label>
            <select value={recordForm.type} onChange={(e) => setRecordForm({ ...recordForm, type: e.target.value })} className="select-field">
              {MEDICAL_RECORD_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Titre</label>
            <input type="text" value={recordForm.title} onChange={(e) => setRecordForm({ ...recordForm, title: e.target.value })} className="input-field" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Contenu</label>
            <textarea value={recordForm.content} onChange={(e) => setRecordForm({ ...recordForm, content: e.target.value })} className="input-field" rows={5} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Pièces jointes</label>
            <div className="file-upload">
              <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-slate-500 text-sm">Cliquez pour ajouter un fichier</p>
              <input type="file" onChange={handleAttachmentUpload} className="hidden" />
            </div>
            {recordForm.attachments.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {recordForm.attachments.map((att, i) => (
                  <span key={i} className="badge badge-info flex items-center gap-1">{att.name}
                    <button type="button" onClick={() => setRecordForm({ ...recordForm, attachments: recordForm.attachments.filter((_, idx) => idx !== i) })} className="ml-1">×</button>
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="flex gap-3 pt-4">
            <button type="button" onClick={() => setShowRecordModal(false)} className="btn-secondary flex-1">Annuler</button>
            <button type="submit" className="btn-primary flex-1">{editingRecord ? 'Enregistrer' : 'Créer'}</button>
          </div>
        </form>
      </Modal>

      <ConfirmModal isOpen={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)} onConfirm={() => { deletePatient(patient.id); navigate('/patients'); }} title="Supprimer le patient" message="Cette action supprimera définitivement le patient et tous ses dossiers." confirmText="Supprimer" danger />
    </div>
  );
}
