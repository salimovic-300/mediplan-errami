import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Shield, UserCog, Stethoscope, Mail, Phone, Key, Eye, EyeOff } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Modal, ConfirmModal } from '../components/Modal';
import { USER_ROLES, SPECIALTIES } from '../data/constants';
import { validateEmail, validatePhone } from '../utils/helpers';

export default function UsersPage() {
  const { users, addUser, updateUser, deleteUser, currentUser } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});

  const initialForm = { name: '', email: '', password: '', phone: '', role: 'secretary', specialty: '', isActive: true };
  const [formData, setFormData] = useState(initialForm);

  const resetForm = () => { setFormData(initialForm); setErrors({}); setEditingUser(null); setShowPassword(false); };

  const openEditModal = (user) => {
    setEditingUser(user);
    setFormData({ ...user, password: '' });
    setShowModal(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Nom requis';
    if (!formData.email.trim()) newErrors.email = 'Email requis';
    else if (!validateEmail(formData.email)) newErrors.email = 'Email invalide';
    if (!editingUser && !formData.password) newErrors.password = 'Mot de passe requis';
    if (formData.phone && !validatePhone(formData.phone)) newErrors.phone = 'Téléphone invalide';

    // Check email unique
    const existingUser = users.find(u => u.email === formData.email && u.id !== editingUser?.id);
    if (existingUser) newErrors.email = 'Cet email est déjà utilisé';

    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }

    if (editingUser) {
      const updateData = { ...formData };
      if (!updateData.password) delete updateData.password;
      updateUser(editingUser.id, updateData);
    } else {
      addUser(formData);
    }
    setShowModal(false);
    resetForm();
  };

  const getRoleIcon = (role) => {
    switch(role) {
      case 'admin': return Shield;
      case 'practitioner': return Stethoscope;
      case 'secretary': return UserCog;
      default: return UserCog;
    }
  };

  const canDelete = (user) => {
    return currentUser?.id !== user.id && user.role !== 'admin';
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold text-slate-900">Utilisateurs</h1>
          <p className="text-slate-500">{users.length} utilisateurs • Multi-rôles</p>
        </div>
        <button onClick={() => { resetForm(); setShowModal(true); }} className="btn-primary flex items-center gap-2">
          <Plus size={20} /><span>Nouvel utilisateur</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {Object.entries(USER_ROLES).map(([roleId, role]) => {
          const count = users.filter(u => u.role === roleId).length;
          const Icon = getRoleIcon(roleId);
          return (
            <div key={roleId} className="stat-card">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${role.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{count}</p>
                  <p className="text-slate-500 text-sm">{role.label}s</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {users.map(user => {
          const roleInfo = USER_ROLES[user.role];
          const Icon = getRoleIcon(user.role);
          const isCurrentUser = currentUser?.id === user.id;
          return (
            <div key={user.id} className={`card p-5 ${!user.isActive ? 'opacity-60' : ''}`}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-400 to-primary-500 text-white flex items-center justify-center font-semibold">
                    {user.name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800">{user.name}</h3>
                    <span className={`inline-block px-2 py-0.5 text-xs rounded-full ${roleInfo?.color || 'bg-slate-100 text-slate-600'}`}>
                      {roleInfo?.label || user.role}
                    </span>
                  </div>
                </div>
                {isCurrentUser && <span className="badge badge-primary text-xs">Vous</span>}
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-slate-600">
                  <Mail size={14} className="text-slate-400" />
                  <span className="truncate">{user.email}</span>
                </div>
                {user.phone && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <Phone size={14} className="text-slate-400" />
                    <span>{user.phone}</span>
                  </div>
                )}
                {user.specialty && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <Stethoscope size={14} className="text-slate-400" />
                    <span>{user.specialty}</span>
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-100">
                <span className={`text-xs ${user.isActive ? 'text-emerald-600' : 'text-slate-400'}`}>
                  {user.isActive ? '● Actif' : '○ Inactif'}
                </span>
                <div className="flex gap-1">
                  <button onClick={() => openEditModal(user)} className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600">
                    <Edit2 size={16} />
                  </button>
                  {canDelete(user) && (
                    <button onClick={() => { setUserToDelete(user); setShowDeleteConfirm(true); }} className="p-2 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-500">
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <Modal isOpen={showModal} onClose={() => { setShowModal(false); resetForm(); }} title={editingUser ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur'} size="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nom complet *</label>
            <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className={`input-field ${errors.name ? 'input-field-error' : ''}`} />
            {errors.name && <p className="text-rose-500 text-xs mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email *</label>
            <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className={`input-field ${errors.email ? 'input-field-error' : ''}`} />
            {errors.email && <p className="text-rose-500 text-xs mt-1">{errors.email}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Mot de passe {editingUser ? '(laisser vide pour garder l\'actuel)' : '*'}
            </label>
            <div className="relative">
              <input type={showPassword ? 'text' : 'password'} value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className={`input-field pr-12 ${errors.password ? 'input-field-error' : ''}`} />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && <p className="text-rose-500 text-xs mt-1">{errors.password}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Téléphone</label>
            <input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className={`input-field ${errors.phone ? 'input-field-error' : ''}`} />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Rôle *</label>
            <div className="grid grid-cols-3 gap-3">
              {Object.entries(USER_ROLES).map(([roleId, role]) => {
                const Icon = getRoleIcon(roleId);
                return (
                  <button key={roleId} type="button" onClick={() => setFormData({ ...formData, role: roleId })} className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${formData.role === roleId ? 'border-primary-500 bg-primary-50' : 'border-slate-200 hover:border-slate-300'}`}>
                    <Icon size={20} className={formData.role === roleId ? 'text-primary-600' : 'text-slate-400'} />
                    <span className={`text-xs ${formData.role === roleId ? 'text-primary-700 font-medium' : 'text-slate-600'}`}>{role.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {(formData.role === 'admin' || formData.role === 'practitioner') && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Spécialité</label>
              <select value={formData.specialty} onChange={(e) => setFormData({ ...formData, specialty: e.target.value })} className="select-field">
                <option value="">Sélectionner</option>
                {SPECIALTIES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          )}

          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
            <div>
              <p className="font-medium text-slate-800">Compte actif</p>
              <p className="text-sm text-slate-500">L'utilisateur peut se connecter</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={formData.isActive} onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })} className="sr-only peer" />
              <div className="w-11 h-6 bg-slate-200 peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={() => { setShowModal(false); resetForm(); }} className="btn-secondary flex-1">Annuler</button>
            <button type="submit" className="btn-primary flex-1">{editingUser ? 'Enregistrer' : 'Créer'}</button>
          </div>
        </form>
      </Modal>

      <ConfirmModal isOpen={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)} onConfirm={() => { deleteUser(userToDelete?.id); setUserToDelete(null); }} title="Supprimer l'utilisateur" message={`Supprimer ${userToDelete?.name} ? Cette action est irréversible.`} confirmText="Supprimer" danger />
    </div>
  );
}
