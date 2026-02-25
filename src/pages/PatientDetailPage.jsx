import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Phone, Mail, Calendar, FileText, Edit2, Trash2,
  Plus, Heart, AlertTriangle, Clock, CreditCard, FolderOpen,
  Check, X, ChevronRight, Download, Upload, User
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Modal, ConfirmModal } from '../components/Modal';
import {
  formatDate, formatCurrency, calculateAge,
  getStatusColor, getStatusLabel, fileToBase64
} from '../utils/helpers';
import { MEDICAL_RECORD_TYPES, APPOINTMENT_TYPES } from '../data/constants';

export default function PatientDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    getPatientById, deletePatient,
    getAppointmentsByPatient, getMedicalRecordsByPatient,
    addMedicalRecord, updateMedicalRecord, deleteMedicalRecord,
    updatePatient, invoices, markInvoicePaid, addNotification,
    cabinetConfig,
  } = useApp();

  const patient = getPatientById(id);
  const appointments = getAppointmentsByPatient(id);
  const medicalRecords = getMedicalRecordsByPatient(id);
  const patientInvoices = (invoices || []).filter(inv => String(inv.patientId) === String(id));

  const [activeTab, setActiveTab] = useState('overview');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [showPayModal, setShowPayModal] = useState(null); // invoice
  const [payMethod, setPayMethod] = useState('cash');
  const [recordForm, setRecordForm] = useState({
    type: 'consultation_note', title: '', content: '', attachments: []
  });

  if (!patient) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
          <AlertTriangle className="text-slate-400" size={32} />
        </div>
        <h2 className="text-xl font-bold text-slate-800">Patient non trouvé</h2>
        <p className="text-slate-500 mb-6">L'ID demandé est : {id}</p>
        <button onClick={() => navigate('/patients')} className="btn-primary flex items-center gap-2">
          <ArrowLeft size={18} /> Retour aux patients
        </button>
      </div>
    );
  }

  // ── Calculs facturation ─────────────────────────────────────────────────────
  const totalPaid = patientInvoices.filter(i => i.status === 'paid').reduce((s, i) => s + (i.total || 0), 0);
  const totalPending = patientInvoices.filter(i => i.status !== 'paid').reduce((s, i) => s + (i.total || 0), 0);

  // ── Handlers ────────────────────────────────────────────────────────────────
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

  const openEditRecord = (rec) => {
    setEditingRecord(rec);
    setRecordForm({ type: rec.type, title: rec.title, content: rec.content, attachments: rec.attachments || [] });
    setShowRecordModal(true);
  };

  const handleMarkPaid = async () => {
    if (!showPayModal) return;
    await markInvoicePaid(showPayModal.id, payMethod);
    setShowPayModal(null);
  };

  const tabs = [
    { id: 'overview', label: 'Aperçu', icon: Heart },
    { id: 'appointments', label: 'Rendez-vous', icon: Calendar },
    { id: 'records', label: 'Dossier médical', icon: FolderOpen },
    { id: 'billing', label: 'Facturation', icon: CreditCard },
  ];

  const getTypeFee = (type) => APPOINTMENT_TYPES.find(t => t.id === type)?.fee || 0;
  const getTypeLabel = (type) => APPOINTMENT_TYPES.find(t => t.id === type)?.label || type;
  const getRecordIcon = (type) => MEDICAL_RECORD_TYPES.find(t => t.id === type)?.label || type;

  return (
    <div className="space-y-6 pb-20 lg:pb-6">
      {/* ── Back ── */}
      <button onClick={() => navigate('/patients')} className="flex items-center gap-2 text-slate-600 hover:text-slate-800 transition-colors">
        <ArrowLeft size={20} /><span>Retour aux patients</span>
      </button>

      {/* ── Header card ── */}
      <div className="card p-6">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary-400 to-primary-500 text-white flex items-center justify-center text-3xl font-bold shrink-0">
            {patient.firstName?.[0]}{patient.lastName?.[0]}
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-display font-bold text-slate-900">
                  {patient.firstName} {patient.lastName}
                </h1>
                <p className="text-slate-500 mt-0.5">
                  {patient.gender} • {calculateAge(patient.dateOfBirth)} ans
                  {patient.bloodType && <span className="ml-2 badge badge-danger">{patient.bloodType}</span>}
                </p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setShowDeleteConfirm(true)} className="btn-secondary text-red-500 flex items-center gap-2">
                  <Trash2 size={16} /> Supprimer
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
              {patient.phone && (
                <a href={`tel:${patient.phone}`} className="flex items-center gap-2 text-slate-600 hover:text-primary-600 transition-colors">
                  <Phone size={16} className="text-primary-500" /><span>{patient.phone}</span>
                </a>
              )}
              {patient.email && (
                <a href={`mailto:${patient.email}`} className="flex items-center gap-2 text-slate-600 hover:text-primary-600 transition-colors">
                  <Mail size={16} className="text-primary-500" /><span className="truncate">{patient.email}</span>
                </a>
              )}
              {patient.createdAt && (
                <div className="flex items-center gap-2 text-slate-500 text-sm">
                  <Clock size={16} /><span>Patient depuis {formatDate(patient.createdAt)}</span>
                </div>
              )}
            </div>

            {patient.allergies && (
              <div className="mt-3 flex items-center gap-2 text-amber-700 bg-amber-50 rounded-xl px-3 py-2 text-sm">
                <AlertTriangle size={16} className="shrink-0" />
                <span><strong>Allergies :</strong> {patient.allergies}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium whitespace-nowrap transition-all ${activeTab === tab.id
                ? 'bg-primary-500 text-white shadow-lg'
                : 'bg-white text-slate-600 hover:bg-slate-50'
              }`}
          >
            <tab.icon size={18} /><span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════
          ONGLET : APERÇU
      ══════════════════════════════════════════════════════ */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="stat-card">
              <Calendar className="w-8 h-8 text-primary-500 mb-2" />
              <p className="text-2xl font-bold text-slate-900">{appointments.length}</p>
              <p className="text-slate-500 text-sm">Rendez-vous</p>
            </div>
            <div className="stat-card">
              <FolderOpen className="w-8 h-8 text-violet-500 mb-2" />
              <p className="text-2xl font-bold text-slate-900">{medicalRecords.length}</p>
              <p className="text-slate-500 text-sm">Documents</p>
            </div>
            <div className="stat-card">
              <CreditCard className="w-8 h-8 text-emerald-500 mb-2" />
              <p className="text-2xl font-bold text-slate-900">{formatCurrency(totalPaid)}</p>
              <p className="text-slate-500 text-sm">Total payé</p>
            </div>
            <div className="stat-card">
              <Clock className="w-8 h-8 text-amber-500 mb-2" />
              <p className="text-2xl font-bold text-slate-900">{formatCurrency(totalPending)}</p>
              <p className="text-slate-500 text-sm">Reste à payer</p>
            </div>
          </div>

          {/* Infos personnelles */}
          <div className="card p-6">
            <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2"><User size={18} /> Informations personnelles</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              {[
                { label: 'Date de naissance', value: patient.dateOfBirth ? formatDate(patient.dateOfBirth) : '—' },
                { label: 'Groupe sanguin', value: patient.bloodType || '—' },
                { label: 'Téléphone', value: patient.phone || '—' },
                { label: 'Email', value: patient.email || '—' },
                { label: 'Adresse', value: patient.address || '—' },
                { label: 'Allergies', value: patient.allergies || 'Aucune connue' },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-slate-400 text-xs uppercase tracking-wide mb-0.5">{label}</p>
                  <p className="text-slate-900 font-medium">{value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Prochain RDV */}
          {(() => {
            const today = new Date().toISOString().split('T')[0];
            const next = appointments.filter(a => a.date >= today && !['annule', 'absent'].includes(a.status)).sort((a, b) => a.date.localeCompare(b.date))[0];
            return next ? (
              <div className="card p-4 border-l-4 border-primary-500 bg-primary-50">
                <p className="text-xs text-primary-600 font-semibold uppercase tracking-wide mb-1">Prochain rendez-vous</p>
                <p className="font-bold text-slate-900">{formatDate(next.date, 'EEEE d MMMM yyyy')} à {next.time}</p>
                <p className="text-slate-600 text-sm">{getTypeLabel(next.type)}</p>
              </div>
            ) : null;
          })()}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          ONGLET : RENDEZ-VOUS
      ══════════════════════════════════════════════════════ */}
      {activeTab === 'appointments' && (
        <div className="card overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <h3 className="font-semibold text-slate-800">Historique des rendez-vous ({appointments.length})</h3>
          </div>
          {appointments.length === 0 ? (
            <div className="p-12 text-center">
              <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">Aucun rendez-vous enregistré</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {[...appointments].sort((a, b) => b.date.localeCompare(a.date)).map(apt => (
                <div key={apt.id} className="p-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center shrink-0">
                        <Calendar size={18} className="text-primary-600" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-800">{getTypeLabel(apt.type)}</p>
                        <p className="text-sm text-slate-500">{formatDate(apt.date, 'EEE d MMM yyyy')} à {apt.time}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-slate-700">{formatCurrency(getTypeFee(apt.type))}</span>
                      <span className={`badge ${getStatusColor(apt.status)}`}>{getStatusLabel(apt.status)}</span>
                    </div>
                  </div>
                  {apt.notes && (
                    <p className="mt-2 text-sm text-slate-500 ml-13 pl-13">{apt.notes}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          ONGLET : DOSSIER MÉDICAL
      ══════════════════════════════════════════════════════ */}
      {activeTab === 'records' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => { setEditingRecord(null); setRecordForm({ type: 'consultation_note', title: '', content: '', attachments: [] }); setShowRecordModal(true); }}
              className="btn-primary flex items-center gap-2"
            >
              <Plus size={18} /> Ajouter un document
            </button>
          </div>

          {medicalRecords.length === 0 ? (
            <div className="card p-12 text-center">
              <FolderOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">Aucun document médical</p>
            </div>
          ) : (
            <div className="card overflow-hidden">
              <div className="divide-y divide-slate-100">
                {medicalRecords.map(rec => (
                  <div key={rec.id} className="p-4 hover:bg-slate-50 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center shrink-0 mt-0.5">
                          <FileText size={18} className="text-violet-600" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-800">{rec.title || getRecordIcon(rec.type)}</p>
                          <p className="text-xs text-slate-400 mt-0.5">{getRecordIcon(rec.type)} • {formatDate(rec.date)}</p>
                          {rec.content && (
                            <p className="text-sm text-slate-600 mt-2 whitespace-pre-wrap line-clamp-3">{rec.content}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <button onClick={() => openEditRecord(rec)} className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => deleteMedicalRecord(rec.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          ONGLET : FACTURATION
      ══════════════════════════════════════════════════════ */}
      {activeTab === 'billing' && (
        <div className="space-y-4">
          {/* Résumé */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="stat-card border-l-4 border-emerald-500">
              <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Total payé</p>
              <p className="text-2xl font-bold text-emerald-600">{formatCurrency(totalPaid)}</p>
              <p className="text-sm text-slate-500">{patientInvoices.filter(i => i.status === 'paid').length} facture(s)</p>
            </div>
            <div className="stat-card border-l-4 border-amber-500">
              <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Reste à payer</p>
              <p className="text-2xl font-bold text-amber-600">{formatCurrency(totalPending)}</p>
              <p className="text-sm text-slate-500">{patientInvoices.filter(i => i.status !== 'paid').length} facture(s)</p>
            </div>
            <div className="stat-card border-l-4 border-primary-500">
              <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Total facturé</p>
              <p className="text-2xl font-bold text-slate-900">{formatCurrency(totalPaid + totalPending)}</p>
              <p className="text-sm text-slate-500">{patientInvoices.length} facture(s) au total</p>
            </div>
          </div>

          {/* Liste des factures */}
          <div className="card overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50">
              <h3 className="font-semibold text-slate-800">Historique des factures</h3>
            </div>

            {patientInvoices.length === 0 ? (
              <div className="p-12 text-center">
                <CreditCard className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">Aucune facture pour ce patient</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {[...patientInvoices].sort((a, b) => (b.date || '').localeCompare(a.date || '')).map(inv => {
                  const isPaid = inv.status === 'paid';
                  return (
                    <div key={inv.id} className="p-4 hover:bg-slate-50 transition-colors">
                      <div className="flex items-center justify-between gap-4 flex-wrap">
                        {/* Info facture */}
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isPaid ? 'bg-emerald-100' : 'bg-amber-100'}`}>
                            {isPaid
                              ? <Check size={18} className="text-emerald-600" />
                              : <Clock size={18} className="text-amber-600" />
                            }
                          </div>
                          <div>
                            <p className="font-medium text-slate-800">{inv.number || `FAC-${inv.id.slice(-6).toUpperCase()}`}</p>
                            <p className="text-sm text-slate-500">
                              {inv.date ? formatDate(inv.date) : '—'}
                              {inv.description && <span className="ml-2">• {inv.description}</span>}
                            </p>
                          </div>
                        </div>

                        {/* Montant + statut */}
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="font-bold text-slate-900">{formatCurrency(inv.total || 0)}</p>
                            {inv.paidAt && (
                              <p className="text-xs text-slate-400">Payé le {formatDate(inv.paidAt)}</p>
                            )}
                          </div>
                          <span className={`badge ${isPaid ? 'badge-success' : 'badge-warning'}`}>
                            {isPaid ? 'Payé' : 'En attente'}
                          </span>
                          {!isPaid && (
                            <button
                              onClick={() => { setShowPayModal(inv); setPayMethod('cash'); }}
                              className="btn-primary text-sm px-3 py-2 flex items-center gap-1"
                            >
                              <CreditCard size={14} /> Marquer payé
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Détail des lignes si disponible */}
                      {inv.items && inv.items.length > 0 && (
                        <div className="mt-3 ml-13 pl-4 border-l-2 border-slate-200 space-y-1">
                          {inv.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between text-sm text-slate-600">
                              <span>{item.description || item.label}</span>
                              <span className="font-medium">{formatCurrency(item.total || item.amount || 0)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Modal : ajouter/modifier document médical ── */}
      <Modal
        isOpen={showRecordModal}
        onClose={() => { setShowRecordModal(false); setEditingRecord(null); }}
        title={editingRecord ? 'Modifier le document' : 'Ajouter un document'}
        size="lg"
      >
        <form onSubmit={handleRecordSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Type de document</label>
            <select
              value={recordForm.type}
              onChange={e => setRecordForm({ ...recordForm, type: e.target.value })}
              className="select-field"
            >
              {MEDICAL_RECORD_TYPES.map(t => (
                <option key={t.id} value={t.id}>{t.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Titre</label>
            <input
              type="text"
              value={recordForm.title}
              onChange={e => setRecordForm({ ...recordForm, title: e.target.value })}
              className="input-field"
              placeholder="Ex : Ordonnance du 25/02/2026"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Contenu / Notes</label>
            <textarea
              value={recordForm.content}
              onChange={e => setRecordForm({ ...recordForm, content: e.target.value })}
              className="input-field"
              rows={5}
              placeholder="Observations, prescriptions, résultats..."
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => { setShowRecordModal(false); setEditingRecord(null); }} className="btn-secondary flex-1">
              Annuler
            </button>
            <button type="submit" className="btn-primary flex-1">
              {editingRecord ? 'Modifier' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Modal : marquer facture comme payée ── */}
      <Modal
        isOpen={!!showPayModal}
        onClose={() => setShowPayModal(null)}
        title="Enregistrer le paiement"
        size="sm"
      >
        <div className="space-y-4">
          {showPayModal && (
            <div className="bg-slate-50 rounded-xl p-4 text-center">
              <p className="text-slate-500 text-sm">Montant à encaisser</p>
              <p className="text-3xl font-bold text-slate-900 mt-1">{formatCurrency(showPayModal.total || 0)}</p>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Mode de paiement</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'cash', label: 'Espèces' },
                { id: 'card', label: 'Carte bancaire' },
                { id: 'transfer', label: 'Virement' },
                { id: 'check', label: 'Chèque' },
              ].map(m => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setPayMethod(m.id)}
                  className={`p-3 rounded-xl border-2 text-sm font-medium transition-all ${payMethod === m.id
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setShowPayModal(null)} className="btn-secondary flex-1">Annuler</button>
            <button onClick={handleMarkPaid} className="btn-primary flex-1 flex items-center justify-center gap-2">
              <Check size={16} /> Confirmer le paiement
            </button>
          </div>
        </div>
      </Modal>

      {/* ── Confirm : suppression patient ── */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={() => { deletePatient(patient.id); navigate('/patients'); }}
        title="Supprimer le patient"
        message={`Supprimer définitivement ${patient.firstName} ${patient.lastName} ? Cette action est irréversible.`}
        danger
      />
    </div>
  );
}