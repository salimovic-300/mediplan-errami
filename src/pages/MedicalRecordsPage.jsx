import React, { useState, useMemo } from 'react';
import { FolderOpen, Search, Filter, Plus, FileText, Download, Edit2, Trash2, User, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Modal, ConfirmModal } from '../components/Modal';
import { formatDate } from '../utils/helpers';
import { MEDICAL_RECORD_TYPES } from '../data/constants';

export default function MedicalRecordsPage() {
  const { medicalRecords, patients, getPatientById, addMedicalRecord, updateMedicalRecord, deleteMedicalRecord } = useApp();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState(null);

  const [formData, setFormData] = useState({
    patientId: '', type: 'consultation_note', title: '', content: '', attachments: []
  });

  const filteredRecords = useMemo(() => {
    return medicalRecords
      .filter(record => {
        const patient = getPatientById(record.patientId);
        const matchesSearch = !searchQuery || 
          record.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          record.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          `${patient?.firstName} ${patient?.lastName}`.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesType = filterType === 'all' || record.type === filterType;
        return matchesSearch && matchesType;
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [medicalRecords, searchQuery, filterType, getPatientById]);

  const recordsByPatient = useMemo(() => {
    const grouped = {};
    filteredRecords.forEach(record => {
      if (!grouped[record.patientId]) grouped[record.patientId] = [];
      grouped[record.patientId].push(record);
    });
    return grouped;
  }, [filteredRecords]);

  const resetForm = () => {
    setFormData({ patientId: '', type: 'consultation_note', title: '', content: '', attachments: [] });
    setEditingRecord(null);
  };

  const openEditModal = (record) => {
    setEditingRecord(record);
    setFormData({ ...record });
    setShowModal(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.patientId || !formData.title || !formData.content) return;
    if (editingRecord) {
      updateMedicalRecord(editingRecord.id, formData);
    } else {
      addMedicalRecord(formData);
    }
    setShowModal(false);
    resetForm();
  };

  const stats = useMemo(() => {
    const types = {};
    medicalRecords.forEach(r => { types[r.type] = (types[r.type] || 0) + 1; });
    return {
      total: medicalRecords.length,
      byType: types,
      uniquePatients: new Set(medicalRecords.map(r => r.patientId)).size,
    };
  }, [medicalRecords]);

  return (
    <div className="space-y-6 pb-20 lg:pb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold text-slate-900">Dossiers médicaux</h1>
          <p className="text-slate-500">{stats.total} documents • {stats.uniquePatients} patients</p>
        </div>
        <button onClick={() => { resetForm(); setShowModal(true); }} className="btn-primary flex items-center gap-2">
          <Plus size={20} /><span>Nouveau document</span>
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {MEDICAL_RECORD_TYPES.slice(0, 4).map(type => (
          <div key={type.id} className="stat-card cursor-pointer hover:border-primary-300" onClick={() => setFilterType(type.id)}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center">
                <FileText className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <p className="text-xl font-bold text-slate-900">{stats.byType[type.id] || 0}</p>
                <p className="text-slate-500 text-xs">{type.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input type="text" placeholder="Rechercher dans les dossiers..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="input-field pl-12" />
        </div>
        <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="select-field w-full sm:w-48">
          <option value="all">Tous les types</option>
          {MEDICAL_RECORD_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
        </select>
      </div>

      {Object.keys(recordsByPatient).length === 0 ? (
        <div className="card p-12 text-center">
          <FolderOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-700 mb-2">Aucun dossier trouvé</h3>
          <p className="text-slate-500">Créez votre premier document médical</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(recordsByPatient).map(([patientId, records]) => {
            const patient = getPatientById(patientId);
            return (
              <div key={patientId} className="card overflow-hidden">
                <div className="p-4 bg-gradient-to-r from-primary-50 to-cyan-50 border-b border-primary-100 flex items-center justify-between">
                  <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate(`/patients/${patientId}`)}>
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-500 text-white flex items-center justify-center font-semibold text-sm">
                      {patient?.firstName?.[0]}{patient?.lastName?.[0]}
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-800">{patient?.firstName} {patient?.lastName}</h3>
                      <p className="text-sm text-slate-500">{records.length} documents</p>
                    </div>
                  </div>
                  <button onClick={() => navigate(`/patients/${patientId}`)} className="text-primary-600 text-sm font-medium hover:text-primary-700">
                    Voir le patient →
                  </button>
                </div>
                <div className="divide-y divide-slate-100">
                  {records.map(record => {
                    const typeInfo = MEDICAL_RECORD_TYPES.find(t => t.id === record.type);
                    return (
                      <div key={record.id} className="p-4 hover:bg-slate-50 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                              <FileText className="w-5 h-5 text-slate-500" />
                            </div>
                            <div>
                              <h4 className="font-medium text-slate-800">{record.title}</h4>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="badge badge-info text-xs">{typeInfo?.label}</span>
                                <span className="text-xs text-slate-500">{formatDate(record.date)}</span>
                              </div>
                              <p className="text-sm text-slate-600 mt-2 line-clamp-2">{record.content}</p>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <button onClick={() => openEditModal(record)} className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600">
                              <Edit2 size={16} />
                            </button>
                            <button onClick={() => { setRecordToDelete(record); setShowDeleteConfirm(true); }} className="p-2 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-500">
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => { setShowModal(false); resetForm(); }} title={editingRecord ? 'Modifier le document' : 'Nouveau document médical'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Patient *</label>
            <select value={formData.patientId} onChange={(e) => setFormData({ ...formData, patientId: e.target.value })} className="select-field" required disabled={!!editingRecord}>
              <option value="">Sélectionner un patient</option>
              {patients.map(p => <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Type de document *</label>
            <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })} className="select-field">
              {MEDICAL_RECORD_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Titre *</label>
            <input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="input-field" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Contenu *</label>
            <textarea value={formData.content} onChange={(e) => setFormData({ ...formData, content: e.target.value })} className="input-field" rows={6} required />
          </div>
          <div className="flex gap-3 pt-4">
            <button type="button" onClick={() => { setShowModal(false); resetForm(); }} className="btn-secondary flex-1">Annuler</button>
            <button type="submit" className="btn-primary flex-1">{editingRecord ? 'Enregistrer' : 'Créer'}</button>
          </div>
        </form>
      </Modal>

      <ConfirmModal isOpen={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)} onConfirm={() => { deleteMedicalRecord(recordToDelete?.id); setRecordToDelete(null); }} title="Supprimer le document" message="Cette action est irréversible." confirmText="Supprimer" danger />
    </div>
  );
}
