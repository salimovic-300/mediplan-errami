import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { db } from '../firebase';
import {
  collection, doc, getDocs, setDoc, deleteDoc, onSnapshot
} from 'firebase/firestore';
import {
  DEMO_PATIENTS, DEMO_APPOINTMENTS, DEMO_MEDICAL_RECORDS,
  DEMO_INVOICES, DEMO_USERS, DEFAULT_CABINET_CONFIG
} from '../data/constants';
import { generateId, generateInvoiceNumber } from '../utils/helpers';

const AppContext = createContext(null);

const STORAGE_KEYS = { auth: 'errami_auth' };

const loadFromStorage = (key, fallback) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch { return fallback; }
};

const saveToStorage = (key, value) => {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { console.error(e); }
};

const initAuth = () => {
  try {
    const auth = localStorage.getItem(STORAGE_KEYS.auth);
    if (auth) return { isAuthenticated: true, currentUser: JSON.parse(auth) };
  } catch {}
  return { isAuthenticated: false, currentUser: null };
};

export function AppProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(() => initAuth().isAuthenticated);
  const [currentUser, setCurrentUser]         = useState(() => initAuth().currentUser);

  const [patients,       setPatients]       = useState([]);
  const [appointments,   setAppointments]   = useState([]);
  const [medicalRecords, setMedicalRecords] = useState([]);
  const [invoices,       setInvoices]       = useState([]);
  const [users,          setUsers]          = useState([]);
  const [cabinetConfig,  setCabinetConfig]  = useState(DEFAULT_CABINET_CONFIG);
  const [loading,        setLoading]        = useState(true);

  const [sidebarOpen,   setSidebarOpen]   = useState(false);
  const [notifications, setNotifications] = useState([]);

  // ─── CHARGEMENT FIRESTORE ─────────────────────────────────────────────────
  useEffect(() => {
    const loadCollection = async (name, setter, demo) => {
      const snap = await getDocs(collection(db, name));
      if (snap.empty) {
        // Première fois : seed avec les données demo
        for (const item of demo) {
          await setDoc(doc(db, name, item.id), item);
        }
        setter(demo);
      } else {
        setter(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      }
    };

    Promise.all([
      loadCollection('patients',       setPatients,       DEMO_PATIENTS),
      loadCollection('appointments',   setAppointments,   DEMO_APPOINTMENTS),
      loadCollection('medicalRecords', setMedicalRecords, DEMO_MEDICAL_RECORDS),
      loadCollection('invoices',       setInvoices,       DEMO_INVOICES),
      loadCollection('users',          setUsers,          DEMO_USERS),
       getDocs(collection(db, 'cabinet')).then(snap => {
    if (!snap.empty) {
      const config = snap.docs.find(d => d.id === 'config')?.data()
                  || snap.docs[0].data();
      setCabinetConfig(config);
    }}),
    ]).then(() => setLoading(false));
  }, []);

  // ─── AUTH ─────────────────────────────────────────────────────────────────
  const login = useCallback((email, password) => {
    const user = users.find(u => u.email === email && u.password === password);
    if (user) {
      const authUser = { ...user, password: undefined };
      setCurrentUser(authUser);
      setIsAuthenticated(true);
      saveToStorage(STORAGE_KEYS.auth, authUser);
      return { success: true, user: authUser };
    }
    return { success: false, error: 'Email ou mot de passe incorrect' };
  }, [users]);

  const logout = useCallback(() => {
    setCurrentUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem(STORAGE_KEYS.auth);
  }, []);

  // ─── NOTIFICATIONS ────────────────────────────────────────────────────────
  const addNotification = useCallback((message, type = 'info') => {
    const n = { id: generateId(), message, type };
    setNotifications(prev => [...prev, n]);
    setTimeout(() => setNotifications(prev => prev.filter(x => x.id !== n.id)), 4000);
  }, []);

  const removeNotification = useCallback((id) =>
    setNotifications(prev => prev.filter(n => n.id !== id)), []);

  // ─── PATIENTS ─────────────────────────────────────────────────────────────
  const addPatient = useCallback(async (data) => {
    const p = { ...data, id: generateId(), createdAt: new Date().toISOString().split('T')[0], totalVisits: 0, balance: 0 };
    await setDoc(doc(db, 'patients', p.id), p);
    setPatients(prev => [...prev, p]);
    addNotification('Patient ajouté', 'success');
    return p;
  }, [addNotification]);

  const updatePatient = useCallback(async (id, data) => {
    const updated = { ...patients.find(p => p.id === id), ...data };
    await setDoc(doc(db, 'patients', id), updated);
    setPatients(prev => prev.map(p => p.id === id ? updated : p));
    addNotification('Patient mis à jour', 'success');
  }, [patients, addNotification]);

  const deletePatient = useCallback(async (id) => {
    await deleteDoc(doc(db, 'patients', id));
    setPatients(prev => prev.filter(p => p.id !== id));
    const toDelete = appointments.filter(a => a.patientId === id);
    for (const a of toDelete) await deleteDoc(doc(db, 'appointments', a.id));
    setAppointments(prev => prev.filter(a => a.patientId !== id));
    const toDeleteR = medicalRecords.filter(r => r.patientId === id);
    for (const r of toDeleteR) await deleteDoc(doc(db, 'medicalRecords', r.id));
    setMedicalRecords(prev => prev.filter(r => r.patientId !== id));
    addNotification('Patient supprimé', 'success');
  }, [appointments, medicalRecords, addNotification]);

  const getPatientById = useCallback((id) => patients.find(p => p.id === id), [patients]);

  // ─── APPOINTMENTS ─────────────────────────────────────────────────────────
  const addAppointment = useCallback(async (data) => {
    const a = { ...data, id: generateId(), createdAt: new Date().toISOString(), createdBy: currentUser?.id };
    await setDoc(doc(db, 'appointments', a.id), a);
    setAppointments(prev => [...prev, a]);
    addNotification('RDV créé', 'success');
    return a;
  }, [addNotification, currentUser]);

  const updateAppointment = useCallback(async (id, data) => {
    const updated = { ...appointments.find(a => a.id === id), ...data };
    await setDoc(doc(db, 'appointments', id), updated);
    setAppointments(prev => prev.map(a => a.id === id ? updated : a));
  }, [appointments]);

  const deleteAppointment = useCallback(async (id) => {
    await deleteDoc(doc(db, 'appointments', id));
    setAppointments(prev => prev.filter(a => a.id !== id));
    addNotification('RDV supprimé', 'success');
  }, [addNotification]);

  const getAppointmentsByPatient = useCallback((patientId) =>
    appointments.filter(a => a.patientId === patientId), [appointments]);

  const getAppointmentsByDate = useCallback((date) =>
    appointments.filter(a => a.date === date), [appointments]);

  // ─── MEDICAL RECORDS ──────────────────────────────────────────────────────
  const addMedicalRecord = useCallback(async (data) => {
    const r = { ...data, id: generateId(), date: new Date().toISOString().split('T')[0], createdBy: currentUser?.id };
    await setDoc(doc(db, 'medicalRecords', r.id), r);
    setMedicalRecords(prev => [...prev, r]);
    addNotification('Dossier ajouté', 'success');
    return r;
  }, [addNotification, currentUser]);

  const updateMedicalRecord = useCallback(async (id, data) => {
    const updated = { ...medicalRecords.find(r => r.id === id), ...data };
    await setDoc(doc(db, 'medicalRecords', id), updated);
    setMedicalRecords(prev => prev.map(r => r.id === id ? updated : r));
    addNotification('Dossier mis à jour', 'success');
  }, [medicalRecords, addNotification]);

  const deleteMedicalRecord = useCallback(async (id) => {
    await deleteDoc(doc(db, 'medicalRecords', id));
    setMedicalRecords(prev => prev.filter(r => r.id !== id));
    addNotification('Dossier supprimé', 'success');
  }, [addNotification]);

  const getMedicalRecordsByPatient = useCallback((patientId) =>
    medicalRecords.filter(r => r.patientId === patientId)
      .sort((a, b) => b.date.localeCompare(a.date)), [medicalRecords]);

  // ─── INVOICES ─────────────────────────────────────────────────────────────
  const addInvoice = useCallback(async (data) => {
    const inv = {
      ...data, id: generateId(),
      number: generateInvoiceNumber(cabinetConfig.invoiceSettings?.prefix || 'FAC', invoices),
      createdAt: new Date().toISOString(), createdBy: currentUser?.id,
    };
    await setDoc(doc(db, 'invoices', inv.id), inv);
    setInvoices(prev => [...prev, inv]);
    addNotification('Facture créée', 'success');
    return inv;
  }, [addNotification, currentUser, invoices, cabinetConfig]);

  const updateInvoice = useCallback(async (id, data) => {
    const updated = { ...invoices.find(i => i.id === id), ...data };
    await setDoc(doc(db, 'invoices', id), updated);
    setInvoices(prev => prev.map(i => i.id === id ? updated : i));
  }, [invoices]);

  const markInvoicePaid = useCallback(async (id, paymentMethod) => {
    const updated = { ...invoices.find(i => i.id === id), status: 'paid', paymentMethod, paidAt: new Date().toISOString() };
    await setDoc(doc(db, 'invoices', id), updated);
    setInvoices(prev => prev.map(i => i.id === id ? updated : i));
    addNotification('Facture payée', 'success');
  }, [invoices, addNotification]);

  // ─── USERS ────────────────────────────────────────────────────────────────
  const addUser = useCallback(async (data) => {
    const u = { ...data, id: generateId(), isActive: true, createdAt: new Date().toISOString().split('T')[0] };
    await setDoc(doc(db, 'users', u.id), u);
    setUsers(prev => [...prev, u]);
    addNotification('Utilisateur ajouté', 'success');
    return u;
  }, [addNotification]);

  const updateUser = useCallback(async (id, data) => {
    const updated = { ...users.find(u => u.id === id), ...data };
    await setDoc(doc(db, 'users', id), updated);
    setUsers(prev => prev.map(u => u.id === id ? updated : u));
    addNotification('Utilisateur mis à jour', 'success');
  }, [users, addNotification]);

  const deleteUser = useCallback(async (id) => {
    await deleteDoc(doc(db, 'users', id));
    setUsers(prev => prev.filter(u => u.id !== id));
    addNotification('Utilisateur supprimé', 'success');
  }, [addNotification]);

  const getUserById      = useCallback((id) => users.find(u => u.id === id), [users]);
  const getPractitioners = useCallback(() =>
    users.filter(u => u.role === 'practitioner' || u.role === 'admin'), [users]);

  // ─── CABINET CONFIG ───────────────────────────────────────────────────────
  const updateCabinetConfig = useCallback(async (data) => {
  const updated = { ...cabinetConfig, ...data };
  await setDoc(doc(db, 'cabinet', 'config'), updated);
  setCabinetConfig(updated);
  addNotification('Configuration mise à jour', 'success');
}, [cabinetConfig, addNotification]);

  // ─── REMINDERS ────────────────────────────────────────────────────────────
  const sendReminder = useCallback(async (appointmentId, type) => {
    const apt = appointments.find(a => a.id === appointmentId);
    if (!apt) return { success: false };
    const patient = patients.find(p => p.id === apt.patientId);
    if (!patient) return { success: false };

    // Build message from template
    const cfg = cabinetConfig?.reminderSettings || {};
    const rawTemplate = type === 'sms'
      ? (cfg.smsTemplate || 'Rappel: RDV le {date} à {time}. {cabinet}')
      : (cfg.whatsappTemplate || '👋 Bonjour {patient}!\n📅 RDV: {date} à {time}\n📍 {cabinet}');

    const message = rawTemplate
      .replace(/{patient}/g, `${patient.firstName} ${patient.lastName}`)
      .replace(/{date}/g, apt.date)
      .replace(/{time}/g, apt.time)
      .replace(/{cabinet}/g, cabinetConfig?.name || 'Cabinet médical')
      .replace(/{phone}/g, patient.phone || '');

    const phone = (patient.phone || '').replace(/\s/g, '').replace(/^0/, '+212');

    if (type === 'whatsapp') {
      window.open(`https://wa.me/${phone.replace(/\+/, '')}?text=${encodeURIComponent(message)}`, '_blank');
    } else if (type === 'sms') {
      window.open(`sms:${phone}?body=${encodeURIComponent(message)}`, '_blank');
    } else if (type === 'email') {
      const subject = encodeURIComponent(`Rappel RDV - ${cabinetConfig?.name || 'Cabinet'}`);
      const body = encodeURIComponent(message);
      window.open(`mailto:${patient.email || ''}?subject=${subject}&body=${body}`, '_blank');
    }

    await updateAppointment(appointmentId, { reminderSent: true, reminderType: type, reminderSentAt: new Date().toISOString() });
    addNotification(`Rappel ${type === 'whatsapp' ? 'WhatsApp' : type.toUpperCase()} envoyé à ${patient.firstName}`, 'success');
    return { success: true };
  }, [updateAppointment, addNotification, appointments, patients, cabinetConfig]);

  // ─── STATS ────────────────────────────────────────────────────────────────
  const getStats = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    const paidInvoices   = invoices.filter(i => i.status === 'paid');
    const completedAppts = appointments.filter(a => a.status === 'termine' || a.status === 'present');
    const absentAppts    = appointments.filter(a => a.status === 'absent');
    return {
      totalPatients:        patients.length,
      todayAppointments:    appointments.filter(a => a.date === today).length,
      upcomingAppointments: appointments.filter(a =>
        a.date >= today && !['annule', 'termine', 'absent'].includes(a.status)).length,
      totalRevenue:    paidInvoices.reduce((s, i) => s + i.total, 0),
      monthlyRevenue:  paidInvoices.filter(i => i.date?.startsWith(today.slice(0, 7))).reduce((s, i) => s + i.total, 0),
      pendingPayments: appointments.filter(a => !a.paid && a.status === 'termine').reduce((s, a) => s + (a.fee || 0), 0),
      totalInvoices:   invoices.length,
      paidInvoices:    paidInvoices.length,
      absenceRate:     completedAppts.length + absentAppts.length > 0
        ? ((absentAppts.length / (completedAppts.length + absentAppts.length)) * 100).toFixed(1) : 0,
      remindersSent:   appointments.filter(a => a.reminderSent).length,
    };
  }, [patients, appointments, invoices]);

  const resetToDemo = useCallback(() => {
    addNotification('Réinitialisation désactivée', 'info');
  }, [addNotification]);

  const value = {
    isAuthenticated, currentUser, login, logout, loading,
    patients, appointments, medicalRecords, invoices, users, cabinetConfig,
    addPatient, updatePatient, deletePatient, getPatientById,
    addAppointment, updateAppointment, deleteAppointment, getAppointmentsByPatient, getAppointmentsByDate,
    addMedicalRecord, updateMedicalRecord, deleteMedicalRecord, getMedicalRecordsByPatient,
    addInvoice, updateInvoice, markInvoicePaid,
    addUser, updateUser, deleteUser, getUserById, getPractitioners,
    updateCabinetConfig, sendReminder,
    sidebarOpen, setSidebarOpen,
    notifications, addNotification, removeNotification,
    getStats, resetToDemo,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
}