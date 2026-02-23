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
  const {
    getPatientById,
    deletePatient,
    getAppointmentsByPatient,
    getMedicalRecordsByPatient,
    addMedicalRecord,
    updateMedicalRecord,
    deleteMedicalRecord,
    updatePatient,
    invoices
  } = useApp();

  // On convertit l'ID en String pour être sûr de la comparaison
  const patient = getPatientById(id);
  const appointments = getAppointmentsByPatient(id);
  const medicalRecords = getMedicalRecordsByPatient(id);

  // CORRECTION : Utilisation de String() pour comparer les IDs
  const patientInvoices = (invoices || []).filter(inv => String(inv.patientId) === String(id));

  const [activeTab, setActiveTab] = useState('overview');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [recordForm, setRecordForm] = useState({ type: 'consultation_note', title: '', content: '', attachments: [] });

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

  const totalSpent = patientInvoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + (i.total || 0), 0);
  const pendingAmount = patientInvoices.filter(i => i.status !== 'paid').reduce((sum, i) => sum + (i.total || 0), 0);

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
          <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary-400 to-primary-500 text-white flex items-center justify-center text-2xl font-bold">
            {patient.firstName[0]}{patient.lastName[0]}
          </div>

          <div className="flex-1">
            <h1 className="text-2xl font-display font-bold text-slate-900">{patient.firstName} {patient.lastName}</h1>
            <p className="text-slate-500">{patient.gender} • {calculateAge(patient.dateOfBirth)} ans</p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
              <div className="flex items-center gap-2 text-slate-600"><Phone size={16} /><span>{patient.phone}</span></div>
              <div className="flex items-center gap-2 text-slate-600"><Mail size={16} /><span>{patient.email}</span></div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium whitespace-nowrap transition-all ${activeTab === tab.id ? 'bg-primary-500 text-white shadow-lg' : 'bg-white text-slate-600 hover:bg-slate-50'}`}>
            <tab.icon size={18} /><span>{tab.label}</span>
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="stat-card">
            <Calendar className="w-8 h-8 text-primary-500 mb-3" />
            <p className="text-2xl font-bold text-slate-900">{appointments.length}</p>
            <p className="text-slate-500 text-sm">Rendez-vous</p>
          </div>
          <div className="stat-card">
            <CreditCard className="w-8 h-8 text-emerald-500 mb-3" />
            <p className="text-2xl font-bold text-slate-900">{formatCurrency(totalSpent)}</p>
            <p className="text-slate-500 text-sm">Total payé</p>
          </div>
        </div>
      )}

      {/* Reste du composant... */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={() => { deletePatient(patient.id); navigate('/patients'); }}
        title="Supprimer le patient"
        message="Cette action est irréversible."
        danger
      />
    </div>
  );
}