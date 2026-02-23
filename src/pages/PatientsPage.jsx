import React, { useState, useMemo } from 'react';
import { Search, Plus, Phone, Mail, MapPin, ChevronRight, Trash2, Edit2, Upload, Camera, Heart, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Modal, ConfirmModal } from '../components/Modal';
import { formatDate, calculateAge, validateEmail, validatePhone, fileToBase64 } from '../utils/helpers';
import { REMINDER_TYPES } from '../data/constants';

export default function PatientsPage() {
  const { patients, addPatient, updatePatient, deletePatient } = useApp();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingPatient, setEditingPatient] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [patientToDelete, setPatientToDelete] = useState(null);
  const [errors, setErrors] = useState({});
  const [activeTab, setActiveTab] = useState('info');

  const initialFormData = {
    firstName: '', lastName: '', email: '', phone: '', dateOfBirth: '', gender: '',
    address: '', city: '', postalCode: '', mutuelle: '', mutuelleNumber: '', bloodType: '',
    allergies: [], chronicConditions: [], emergencyContact: { name: '', phone: '', relation: '' },
    notes: '', photo: null, preferredReminder: 'whatsapp',
  };
  const [formData, setFormData] = useState(initialFormData);

  const filteredPatients = useMemo(() => {
    return patients.filter(p => {
      const fullName = `${p.firstName} ${p.lastName}`.toLowerCase();
      const query = searchQuery.toLowerCase();
      return fullName.includes(query) || p.phone?.includes(query) || p.email?.toLowerCase().includes(query);
    });
  }, [patients, searchQuery]);

  const resetForm = () => { setFormData(initialFormData); setErrors({}); setEditingPatient(null); setActiveTab('info'); };

  const openEditModal = (patient) => {
    setEditingPatient(patient);
    setFormData({ ...initialFormData, ...patient, emergencyContact: patient.emergencyContact || { name: '', phone: '', relation: '' } });
    setShowModal(true);
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const base64 = await fileToBase64(file);
      setFormData({ ...formData, photo: base64 });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!formData.firstName.trim()) newErrors.firstName = 'Prénom requis';
    if (!formData.lastName.trim()) newErrors.lastName = 'Nom requis';
    if (formData.email && !validateEmail(formData.email)) newErrors.email = 'Email invalide';
    if (formData.phone && !validatePhone(formData.phone)) newErrors.phone = 'Téléphone invalide';
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }
    if (editingPatient) updatePatient(editingPatient.id, formData);
    else addPatient(formData);
    setShowModal(false); resetForm();
  };

  const handleAddAllergy = (allergy) => {
    if (allergy && !formData.allergies.includes(allergy)) {
      setFormData({ ...formData, allergies: [...formData.allergies, allergy] });
    }
  };

  const handleRemoveAllergy = (index) => {
    setFormData({ ...formData, allergies: formData.allergies.filter((_, i) => i !== index) });
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold text-slate-900">Patients</h1>
          <p className="text-slate-500">{patients.length} patients enregistrés</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <Plus size={20} /><span>Nouveau patient</span>
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
        <input type="text" placeholder="Rechercher un patient..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="input-field pl-12" />
      </div>

      {filteredPatients.length === 0 ? (
        <div className="card p-12 text-center"><p className="text-slate-500">Aucun patient trouvé</p></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredPatients.map(patient => (
            <div key={patient.id} className="card p-5 hover:shadow-lg transition-all cursor-pointer group" onClick={() => navigate(`/patients/${patient.id}`)}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  {patient.photo ? (
                    <img src={patient.photo} alt="" className="w-12 h-12 rounded-full object-cover" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-400 to-primary-500 text-white flex items-center justify-center font-semibold">
                      {patient.firstName[0]}{patient.lastName[0]}
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold text-slate-800">{patient.firstName} {patient.lastName}</h3>
                    <p className="text-sm text-slate-500">{patient.gender} • {calculateAge(patient.dateOfBirth)} ans</p>
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={(e) => { e.stopPropagation(); openEditModal(patient); }} className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600"><Edit2 size={16} /></button>
                  <button onClick={(e) => { e.stopPropagation(); setPatientToDelete(patient); setShowDeleteConfirm(true); }} className="p-2 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-500"><Trash2 size={16} /></button>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-slate-600"><Phone size={14} className="text-slate-400" /><span>{patient.phone}</span></div>
                {patient.email && <div className="flex items-center gap-2 text-slate-600"><Mail size={14} className="text-slate-400" /><span className="truncate">{patient.email}</span></div>}
                {patient.city && <div className="flex items-center gap-2 text-slate-600"><MapPin size={14} className="text-slate-400" /><span>{patient.city}</span></div>}
              </div>
              {(patient.allergies?.length > 0 || patient.chronicConditions?.length > 0) && (
                <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap gap-1">
                  {patient.allergies?.slice(0, 2).map((a, i) => <span key={i} className="badge badge-danger text-xs">{a}</span>)}
                  {patient.chronicConditions?.slice(0, 1).map((c, i) => <span key={i} className="badge badge-warning text-xs">{c}</span>)}
                </div>
              )}
              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500">{patient.totalVisits} visites</span>
                <ChevronRight size={16} className="text-slate-400" />
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => { setShowModal(false); resetForm(); }} title={editingPatient ? 'Modifier le patient' : 'Nouveau patient'} size="lg">
        <div className="flex gap-2 mb-6 border-b border-slate-200 -mx-6 px-6">
          {['info', 'medical', 'contact'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 font-medium text-sm border-b-2 -mb-px transition-colors ${activeTab === tab ? 'border-primary-500 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
              {tab === 'info' ? 'Informations' : tab === 'medical' ? 'Médical' : 'Urgence'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {activeTab === 'info' && (
            <>
              <div className="flex justify-center mb-4">
                <div className="relative">
                  {formData.photo ? (
                    <img src={formData.photo} alt="" className="w-24 h-24 rounded-full object-cover" />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-slate-100 flex items-center justify-center"><Camera size={32} className="text-slate-400" /></div>
                  )}
                  <label className="absolute bottom-0 right-0 w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center cursor-pointer hover:bg-primary-600 transition-colors">
                    <Upload size={16} className="text-white" />
                    <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                  </label>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Prénom *</label>
                  <input type="text" value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} className={`input-field ${errors.firstName ? 'input-field-error' : ''}`} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nom *</label>
                  <input type="text" value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} className={`input-field ${errors.lastName ? 'input-field-error' : ''}`} />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                  <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className={`input-field ${errors.email ? 'input-field-error' : ''}`} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Téléphone</label>
                  <input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className={`input-field ${errors.phone ? 'input-field-error' : ''}`} />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Date de naissance</label>
                  <input type="date" value={formData.dateOfBirth} onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Genre</label>
                  <select value={formData.gender} onChange={(e) => setFormData({ ...formData, gender: e.target.value })} className="select-field">
                    <option value="">Sélectionner</option>
                    <option value="Homme">Homme</option>
                    <option value="Femme">Femme</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Adresse</label>
                <input type="text" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} className="input-field" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Ville</label>
                  <input type="text" value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Code postal</label>
                  <input type="text" value={formData.postalCode} onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })} className="input-field" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Rappel préféré</label>
                <select value={formData.preferredReminder} onChange={(e) => setFormData({ ...formData, preferredReminder: e.target.value })} className="select-field">
                  {REMINDER_TYPES.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
                </select>
              </div>
            </>
          )}

          {activeTab === 'medical' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Groupe sanguin</label>
                  <select value={formData.bloodType} onChange={(e) => setFormData({ ...formData, bloodType: e.target.value })} className="select-field">
                    <option value="">Sélectionner</option>
                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Mutuelle</label>
                  <input type="text" value={formData.mutuelle} onChange={(e) => setFormData({ ...formData, mutuelle: e.target.value })} className="input-field" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">N° Mutuelle</label>
                <input type="text" value={formData.mutuelleNumber} onChange={(e) => setFormData({ ...formData, mutuelleNumber: e.target.value })} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Allergies</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {formData.allergies.map((a, i) => (
                    <span key={i} className="badge badge-danger flex items-center gap-1">{a}<button type="button" onClick={() => handleRemoveAllergy(i)} className="ml-1">×</button></span>
                  ))}
                </div>
                <input type="text" placeholder="Ajouter une allergie (Entrée)" className="input-field" onKeyPress={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddAllergy(e.target.value); e.target.value = ''; } }} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Notes médicales</label>
                <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} className="input-field" rows={3} />
              </div>
            </>
          )}

          {activeTab === 'contact' && (
            <>
              <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 mb-4">
                <div className="flex items-center gap-2 text-amber-800 font-medium mb-1"><AlertTriangle size={18} />Contact d'urgence</div>
                <p className="text-sm text-amber-600">Personne à contacter en cas d'urgence</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nom complet</label>
                <input type="text" value={formData.emergencyContact.name} onChange={(e) => setFormData({ ...formData, emergencyContact: { ...formData.emergencyContact, name: e.target.value } })} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Téléphone</label>
                <input type="tel" value={formData.emergencyContact.phone} onChange={(e) => setFormData({ ...formData, emergencyContact: { ...formData.emergencyContact, phone: e.target.value } })} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Relation</label>
                <select value={formData.emergencyContact.relation} onChange={(e) => setFormData({ ...formData, emergencyContact: { ...formData.emergencyContact, relation: e.target.value } })} className="select-field">
                  <option value="">Sélectionner</option>
                  {['Époux/Épouse', 'Parent', 'Enfant', 'Frère/Sœur', 'Ami(e)', 'Autre'].map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            </>
          )}

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={() => { setShowModal(false); resetForm(); }} className="btn-secondary flex-1">Annuler</button>
            <button type="submit" className="btn-primary flex-1">{editingPatient ? 'Enregistrer' : 'Créer le patient'}</button>
          </div>
        </form>
      </Modal>

      <ConfirmModal isOpen={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)} onConfirm={() => { deletePatient(patientToDelete?.id); setPatientToDelete(null); }} title="Supprimer le patient" message={`Supprimer ${patientToDelete?.firstName} ${patientToDelete?.lastName} et tous ses dossiers ?`} confirmText="Supprimer" danger />
    </div>
  );
}
