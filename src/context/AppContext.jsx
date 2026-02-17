import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { DEMO_PATIENTS, DEMO_APPOINTMENTS, DEMO_MEDICAL_RECORDS, DEMO_INVOICES, DEMO_USERS, DEFAULT_CABINET_CONFIG } from '../data/constants';
import { generateId, generateInvoiceNumber } from '../utils/helpers';

const AppContext = createContext(null);

const STORAGE_KEYS = {
  patients: 'mp_patients', appointments: 'mp_appointments', medicalRecords: 'mp_records',
  invoices: 'mp_invoices', users: 'mp_users', cabinet: 'mp_cabinet', auth: 'mp_auth',
};

export function AppProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [medicalRecords, setMedicalRecords] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [users, setUsers] = useState([]);
  const [cabinetConfig, setCabinetConfig] = useState(DEFAULT_CABINET_CONFIG);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);

  // Load data
  useEffect(() => {
    try {
      const auth = localStorage.getItem(STORAGE_KEYS.auth);
      if (auth) { setIsAuthenticated(true); setCurrentUser(JSON.parse(auth)); }
      setPatients(JSON.parse(localStorage.getItem(STORAGE_KEYS.patients)) || DEMO_PATIENTS);
      setAppointments(JSON.parse(localStorage.getItem(STORAGE_KEYS.appointments)) || DEMO_APPOINTMENTS);
      setMedicalRecords(JSON.parse(localStorage.getItem(STORAGE_KEYS.medicalRecords)) || DEMO_MEDICAL_RECORDS);
      setInvoices(JSON.parse(localStorage.getItem(STORAGE_KEYS.invoices)) || DEMO_INVOICES);
      setUsers(JSON.parse(localStorage.getItem(STORAGE_KEYS.users)) || DEMO_USERS);
      setCabinetConfig(JSON.parse(localStorage.getItem(STORAGE_KEYS.cabinet)) || DEFAULT_CABINET_CONFIG);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, []);

  // Save data
  useEffect(() => { if (!loading) localStorage.setItem(STORAGE_KEYS.patients, JSON.stringify(patients)); }, [patients, loading]);
  useEffect(() => { if (!loading) localStorage.setItem(STORAGE_KEYS.appointments, JSON.stringify(appointments)); }, [appointments, loading]);
  useEffect(() => { if (!loading) localStorage.setItem(STORAGE_KEYS.medicalRecords, JSON.stringify(medicalRecords)); }, [medicalRecords, loading]);
  useEffect(() => { if (!loading) localStorage.setItem(STORAGE_KEYS.invoices, JSON.stringify(invoices)); }, [invoices, loading]);
  useEffect(() => { if (!loading) localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(users)); }, [users, loading]);
  useEffect(() => { if (!loading) localStorage.setItem(STORAGE_KEYS.cabinet, JSON.stringify(cabinetConfig)); }, [cabinetConfig, loading]);

  // Auth
  const login = useCallback((email, password) => {
    const user = users.find(u => u.email === email && u.password === password);
    if (user) {
      const authUser = { ...user, password: undefined };
      setCurrentUser(authUser); setIsAuthenticated(true);
      localStorage.setItem(STORAGE_KEYS.auth, JSON.stringify(authUser));
      return { success: true, user: authUser };
    }
    return { success: false, error: 'Email ou mot de passe incorrect' };
  }, [users]);

  const logout = useCallback(() => {
    setCurrentUser(null); setIsAuthenticated(false);
    localStorage.removeItem(STORAGE_KEYS.auth);
  }, []);

  // Notifications
  const addNotification = useCallback((message, type = 'info') => {
    const n = { id: generateId(), message, type };
    setNotifications(prev => [...prev, n]);
    setTimeout(() => setNotifications(prev => prev.filter(x => x.id !== n.id)), 4000);
  }, []);

  const removeNotification = useCallback((id) => setNotifications(prev => prev.filter(n => n.id !== id)), []);

  // Patients
  const addPatient = useCallback((data) => {
    const p = { ...data, id: generateId(), createdAt: new Date().toISOString().split('T')[0], totalVisits: 0, balance: 0 };
    setPatients(prev => [...prev, p]);
    addNotification('Patient ajouté', 'success');
    return p;
  }, [addNotification]);

  const updatePatient = useCallback((id, data) => {
    setPatients(prev => prev.map(p => p.id === id ? { ...p, ...data } : p));
    addNotification('Patient mis à jour', 'success');
  }, [addNotification]);

  const deletePatient = useCallback((id) => {
    setPatients(prev => prev.filter(p => p.id !== id));
    setAppointments(prev => prev.filter(a => a.patientId !== id));
    setMedicalRecords(prev => prev.filter(r => r.patientId !== id));
    addNotification('Patient supprimé', 'success');
  }, [addNotification]);

  const getPatientById = useCallback((id) => patients.find(p => p.id === id), [patients]);

  // Appointments
  const addAppointment = useCallback((data) => {
    const a = { ...data, id: generateId(), createdAt: new Date().toISOString(), createdBy: currentUser?.id };
    setAppointments(prev => [...prev, a]);
    addNotification('RDV créé', 'success');
    return a;
  }, [addNotification, currentUser]);

  const updateAppointment = useCallback((id, data) => {
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, ...data } : a));
  }, []);

  const deleteAppointment = useCallback((id) => {
    setAppointments(prev => prev.filter(a => a.id !== id));
    addNotification('RDV supprimé', 'success');
  }, [addNotification]);

  const getAppointmentsByPatient = useCallback((patientId) => appointments.filter(a => a.patientId === patientId), [appointments]);
  const getAppointmentsByDate = useCallback((date) => appointments.filter(a => a.date === date), [appointments]);

  // Medical Records
  const addMedicalRecord = useCallback((data) => {
    const r = { ...data, id: generateId(), date: new Date().toISOString().split('T')[0], createdBy: currentUser?.id };
    setMedicalRecords(prev => [...prev, r]);
    addNotification('Dossier ajouté', 'success');
    return r;
  }, [addNotification, currentUser]);

  const updateMedicalRecord = useCallback((id, data) => {
    setMedicalRecords(prev => prev.map(r => r.id === id ? { ...r, ...data } : r));
    addNotification('Dossier mis à jour', 'success');
  }, [addNotification]);

  const deleteMedicalRecord = useCallback((id) => {
    setMedicalRecords(prev => prev.filter(r => r.id !== id));
    addNotification('Dossier supprimé', 'success');
  }, [addNotification]);

  const getMedicalRecordsByPatient = useCallback((patientId) => 
    medicalRecords.filter(r => r.patientId === patientId).sort((a, b) => b.date.localeCompare(a.date)), 
  [medicalRecords]);

  // Invoices
  const addInvoice = useCallback((data) => {
    const inv = {
      ...data, id: generateId(),
      number: generateInvoiceNumber(cabinetConfig.invoiceSettings?.prefix || 'FAC', invoices),
      createdAt: new Date().toISOString(), createdBy: currentUser?.id,
    };
    setInvoices(prev => [...prev, inv]);
    addNotification('Facture créée', 'success');
    return inv;
  }, [addNotification, currentUser, invoices, cabinetConfig]);

  const updateInvoice = useCallback((id, data) => {
    setInvoices(prev => prev.map(i => i.id === id ? { ...i, ...data } : i));
  }, []);

  const markInvoicePaid = useCallback((id, paymentMethod) => {
    setInvoices(prev => prev.map(i => i.id === id ? { ...i, status: 'paid', paymentMethod, paidAt: new Date().toISOString() } : i));
    addNotification('Facture payée', 'success');
  }, [addNotification]);

  // Users
  const addUser = useCallback((data) => {
    const u = { ...data, id: generateId(), isActive: true, createdAt: new Date().toISOString().split('T')[0] };
    setUsers(prev => [...prev, u]);
    addNotification('Utilisateur ajouté', 'success');
    return u;
  }, [addNotification]);

  const updateUser = useCallback((id, data) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, ...data } : u));
    addNotification('Utilisateur mis à jour', 'success');
  }, [addNotification]);

  const deleteUser = useCallback((id) => {
    setUsers(prev => prev.filter(u => u.id !== id));
    addNotification('Utilisateur supprimé', 'success');
  }, [addNotification]);

  const getUserById = useCallback((id) => users.find(u => u.id === id), [users]);
  const getPractitioners = useCallback(() => users.filter(u => u.role === 'practitioner' || u.role === 'admin'), [users]);

  // Cabinet Config
  const updateCabinetConfig = useCallback((data) => {
    setCabinetConfig(prev => ({ ...prev, ...data }));
    addNotification('Configuration mise à jour', 'success');
  }, [addNotification]);

  // Send Reminder (simulated)
  const sendReminder = useCallback((appointmentId, type) => {
    setAppointments(prev => prev.map(a => a.id === appointmentId ? { ...a, reminderSent: true, reminderType: type } : a));
    addNotification(`Rappel ${type.toUpperCase()} envoyé`, 'success');
    return { success: true };
  }, [addNotification]);

  // Statistics
  const getStats = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    const todayAppts = appointments.filter(a => a.date === today);
    const paidInvoices = invoices.filter(i => i.status === 'paid');
    const totalRevenue = paidInvoices.reduce((sum, i) => sum + i.total, 0);
    const pendingPayments = appointments.filter(a => !a.paid && a.status === 'termine').reduce((sum, a) => sum + (a.fee || 0), 0);
    const completedAppts = appointments.filter(a => a.status === 'termine' || a.status === 'present');
    const absentAppts = appointments.filter(a => a.status === 'absent');
    
    return {
      totalPatients: patients.length,
      todayAppointments: todayAppts.length,
      upcomingAppointments: appointments.filter(a => a.date >= today && !['annule', 'termine', 'absent'].includes(a.status)).length,
      totalRevenue,
      monthlyRevenue: paidInvoices.filter(i => i.date?.startsWith(today.slice(0, 7))).reduce((sum, i) => sum + i.total, 0),
      pendingPayments,
      totalInvoices: invoices.length,
      paidInvoices: paidInvoices.length,
      absenceRate: completedAppts.length + absentAppts.length > 0 ? ((absentAppts.length / (completedAppts.length + absentAppts.length)) * 100).toFixed(1) : 0,
      remindersSent: appointments.filter(a => a.reminderSent).length,
    };
  }, [patients, appointments, invoices]);

  // Reset
  const resetToDemo = useCallback(() => {
    setPatients(DEMO_PATIENTS); setAppointments(DEMO_APPOINTMENTS);
    setMedicalRecords(DEMO_MEDICAL_RECORDS); setInvoices(DEMO_INVOICES);
    setUsers(DEMO_USERS); setCabinetConfig(DEFAULT_CABINET_CONFIG);
    addNotification('Données réinitialisées', 'info');
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
