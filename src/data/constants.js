// ROLES & PERMISSIONS
export const USER_ROLES = {
  admin: { id: 'admin', label: 'Administrateur', color: 'role-admin', permissions: ['all'] },
  practitioner: { id: 'practitioner', label: 'Praticien', color: 'role-practitioner', permissions: ['patients', 'appointments', 'invoices', 'medical_records', 'statistics'] },
  secretary: { id: 'secretary', label: 'Secrétaire', color: 'role-secretary', permissions: ['patients', 'appointments', 'invoices', 'reminders'] },
};

// DEMO USERS
export const DEMO_USERS = [
  { id: 'u1', email: 'admin@mediplan.ma', password: 'admin123', name: 'Dr. Fatima Alaoui', role: 'admin', phone: '0661234567', specialty: 'Orthophonie', isActive: true },
  { id: 'u2', email: 'dr.sarah@mediplan.ma', password: 'sarah123', name: 'Dr. Sarah Bennani', role: 'practitioner', phone: '0662345678', specialty: 'Orthophonie', isActive: true },
  { id: 'u3', email: 'secretaire@mediplan.ma', password: 'sec123', name: 'Amal Tazi', role: 'secretary', phone: '0663456789', specialty: null, isActive: true },
];

// APPOINTMENT TYPES
export const APPOINTMENT_TYPES = [
  { id: 'consultation', label: 'Consultation', duration: 30, color: '#14b8a6', fee: 400 },
  { id: 'suivi', label: 'Suivi', duration: 20, color: '#10b981', fee: 300 },
  { id: 'urgence', label: 'Urgence', duration: 15, color: '#ef4444', fee: 500 },
  { id: 'bilan', label: 'Bilan initial', duration: 60, color: '#8b5cf6', fee: 600 },
  { id: 'teleconsultation', label: 'Téléconsultation', duration: 20, color: '#f59e0b', fee: 350 },
  { id: 'reeducation', label: 'Rééducation', duration: 45, color: '#3b82f6', fee: 450 },
];

// APPOINTMENT STATUSES
export const APPOINTMENT_STATUSES = {
  planifie: { label: 'Planifié', color: 'badge-info' },
  confirme: { label: 'Confirmé', color: 'badge-primary' },
  rappel_envoye: { label: 'Rappel envoyé', color: 'badge-warning' },
  present: { label: 'Présent', color: 'badge-success' },
  en_cours: { label: 'En cours', color: 'badge-accent' },
  termine: { label: 'Terminé', color: 'badge-success' },
  absent: { label: 'Absent', color: 'badge-danger' },
  annule: { label: 'Annulé', color: 'bg-slate-100 text-slate-600' },
};

// PAYMENT
export const PAYMENT_STATUSES = {
  pending: { label: 'En attente', color: 'badge-warning' },
  partial: { label: 'Partiel', color: 'badge-info' },
  paid: { label: 'Payé', color: 'badge-success' },
  refunded: { label: 'Remboursé', color: 'badge-danger' },
};

export const PAYMENT_METHODS = [
  { id: 'cash', label: 'Espèces', icon: 'banknote' },
  { id: 'card', label: 'Carte bancaire', icon: 'credit-card' },
  { id: 'transfer', label: 'Virement', icon: 'building-2' },
  { id: 'check', label: 'Chèque', icon: 'file-text' },
  { id: 'online', label: 'Paiement en ligne', icon: 'globe' },
];

// SPECIALTIES
export const SPECIALTIES = ['Médecine générale', 'Orthophonie', 'Kinésithérapie', 'Psychologie', 'Psychiatrie', 'Dermatologie', 'Cardiologie', 'Pédiatrie', 'Ophtalmologie', 'ORL', 'Gynécologie', 'Neurologie'];

// REMINDERS
export const REMINDER_TYPES = [
  { id: 'sms', label: 'SMS', icon: 'message-square' },
  { id: 'whatsapp', label: 'WhatsApp', icon: 'phone' },
  { id: 'email', label: 'Email', icon: 'mail' },
];

export const REMINDER_TIMINGS = [
  { id: '1h', label: '1 heure avant', hours: 1 },
  { id: '24h', label: '24 heures avant', hours: 24 },
  { id: '48h', label: '48 heures avant', hours: 48 },
];

// MEDICAL RECORDS
export const MEDICAL_RECORD_TYPES = [
  { id: 'consultation_note', label: 'Note de consultation', icon: 'file-text' },
  { id: 'prescription', label: 'Ordonnance', icon: 'clipboard-list' },
  { id: 'lab_result', label: 'Analyse', icon: 'flask-conical' },
  { id: 'imaging', label: 'Imagerie', icon: 'scan' },
  { id: 'report', label: 'Compte-rendu', icon: 'file-check' },
  { id: 'certificate', label: 'Certificat', icon: 'award' },
];

// DEMO PATIENTS
export const DEMO_PATIENTS = [
  {
    id: 'p1', firstName: 'Ahmed', lastName: 'El Mansouri', email: 'ahmed.elmansouri@email.com', phone: '0677889900',
    dateOfBirth: '1988-03-15', gender: 'Homme', address: '12 Rue Mohammed V', city: 'Rabat', postalCode: '10000',
    mutuelle: 'CNOPS', mutuelleNumber: 'CNOPS-123456', bloodType: 'A+', allergies: ['Pénicilline'],
    chronicConditions: ['Hypertension légère'], emergencyContact: { name: 'Fatima El Mansouri', phone: '0677889901', relation: 'Épouse' },
    notes: 'Patient régulier', photo: null, createdAt: '2024-01-10', lastVisit: '2025-01-10', totalVisits: 12, balance: 150, preferredReminder: 'whatsapp'
  },
  {
    id: 'p2', firstName: 'Khadija', lastName: 'Ouazzani', email: 'khadija.ouazzani@email.com', phone: '0655443322',
    dateOfBirth: '1976-08-22', gender: 'Femme', address: '45 Avenue Hassan II', city: 'Casablanca', postalCode: '20000',
    mutuelle: 'CNSS', mutuelleNumber: 'CNSS-789012', bloodType: 'O+', allergies: [], chronicConditions: [],
    emergencyContact: { name: 'Omar Ouazzani', phone: '0655443323', relation: 'Époux' },
    notes: '', photo: null, createdAt: '2024-03-20', lastVisit: '2025-01-08', totalVisits: 24, balance: 0, preferredReminder: 'sms'
  },
  {
    id: 'p3', firstName: 'Youssef', lastName: 'Tazi', email: 'parent.tazi@email.com', phone: '0699887766',
    dateOfBirth: '2018-11-30', gender: 'Homme', address: '8 Rue Ibn Sina', city: 'Marrakech', postalCode: '40000',
    mutuelle: 'Assurance privée', mutuelleNumber: 'PRV-345678', bloodType: 'B+', allergies: ['Arachides'], chronicConditions: [],
    emergencyContact: { name: 'Mohammed Tazi', phone: '0699887767', relation: 'Père' },
    notes: 'Enfant - Suivi orthophonique', photo: null, createdAt: '2024-06-15', lastVisit: '2025-01-10', totalVisits: 18, balance: 200, preferredReminder: 'whatsapp'
  },
  {
    id: 'p4', firstName: 'Salma', lastName: 'Chraibi', email: 'salma.chraibi@email.com', phone: '0611223344',
    dateOfBirth: '1995-05-12', gender: 'Femme', address: '23 Boulevard Zerktouni', city: 'Casablanca', postalCode: '20100',
    mutuelle: 'CNOPS', mutuelleNumber: 'CNOPS-567890', bloodType: 'AB+', allergies: [], chronicConditions: ['Asthme léger'],
    emergencyContact: { name: 'Rachid Chraibi', phone: '0611223345', relation: 'Frère' },
    notes: '', photo: null, createdAt: '2024-09-01', lastVisit: '2025-01-05', totalVisits: 6, balance: 0, preferredReminder: 'email'
  },
];

// DEMO APPOINTMENTS
export const DEMO_APPOINTMENTS = [
  { id: 'a1', patientId: 'p1', practitionerId: 'u2', date: '2025-01-13', time: '09:00', duration: 30, type: 'suivi', status: 'confirme', notes: 'Séance de rééducation vocale', fee: 300, paid: false, reminderSent: true, reminderType: 'whatsapp' },
  { id: 'a2', patientId: 'p2', practitionerId: 'u2', date: '2025-01-13', time: '10:00', duration: 30, type: 'consultation', status: 'planifie', notes: '', fee: 400, paid: false, reminderSent: false, reminderType: 'sms' },
  { id: 'a3', patientId: 'p3', practitionerId: 'u1', date: '2025-01-13', time: '11:00', duration: 45, type: 'reeducation', status: 'confirme', notes: 'Séance orthophonique', fee: 450, paid: false, reminderSent: true, reminderType: 'whatsapp' },
  { id: 'a4', patientId: 'p4', practitionerId: 'u2', date: '2025-01-14', time: '14:00', duration: 60, type: 'bilan', status: 'planifie', notes: 'Bilan initial', fee: 600, paid: false, reminderSent: false, reminderType: 'email' },
  { id: 'a5', patientId: 'p1', practitionerId: 'u2', date: '2025-01-10', time: '09:30', duration: 30, type: 'suivi', status: 'termine', notes: 'Bonne progression', fee: 300, paid: true, paymentMethod: 'card', paidAt: '2025-01-10T10:05:00', reminderSent: true },
  { id: 'a6', patientId: 'p2', practitionerId: 'u1', date: '2025-01-09', time: '14:00', duration: 30, type: 'consultation', status: 'termine', notes: '', fee: 400, paid: true, paymentMethod: 'cash', paidAt: '2025-01-09T14:35:00', reminderSent: true },
];

// DEMO MEDICAL RECORDS
export const DEMO_MEDICAL_RECORDS = [
  { id: 'mr1', patientId: 'p1', type: 'consultation_note', title: 'Consultation initiale', content: 'Patient présentant une dysphonie fonctionnelle. Voix rauque depuis 3 mois.', date: '2024-01-10', createdBy: 'u2', attachments: [] },
  { id: 'mr2', patientId: 'p1', type: 'report', title: 'Bilan orthophonique', content: 'Score VHI: 45/120. Diagnostic: dysphonie fonctionnelle modérée.', date: '2024-01-15', createdBy: 'u2', attachments: [] },
  { id: 'mr3', patientId: 'p3', type: 'consultation_note', title: 'Première consultation', content: 'Enfant de 6 ans présentant un retard de langage.', date: '2024-06-15', createdBy: 'u1', attachments: [] },
];

// DEMO INVOICES
export const DEMO_INVOICES = [
  { id: 'inv1', number: 'FAC-2025-001', patientId: 'p1', appointmentId: 'a5', date: '2025-01-10', items: [{ description: 'Séance de suivi', quantity: 1, unitPrice: 300, total: 300 }], subtotal: 300, tax: 0, total: 300, status: 'paid', paymentMethod: 'card', paidAt: '2025-01-10T10:05:00' },
  { id: 'inv2', number: 'FAC-2025-002', patientId: 'p2', appointmentId: 'a6', date: '2025-01-09', items: [{ description: 'Consultation', quantity: 1, unitPrice: 400, total: 400 }], subtotal: 400, tax: 0, total: 400, status: 'paid', paymentMethod: 'cash', paidAt: '2025-01-09T14:35:00' },
];

// CABINET CONFIG
export const DEFAULT_CABINET_CONFIG = {
  name: 'Cabinet MediPlan', subtitle: 'Excellence en soins de santé', logo: null,
  address: '123 Avenue Mohammed V', city: 'Rabat', postalCode: '10000', country: 'Maroc',
  phone: '0537000000', email: 'contact@mediplan.ma', website: 'www.mediplan.ma',
  specialty: 'Orthophonie', currency: 'DH', taxRate: 0, appointmentDuration: 30,
  workingHours: {
    monday: { start: '08:00', end: '18:00', enabled: true },
    tuesday: { start: '08:00', end: '18:00', enabled: true },
    wednesday: { start: '08:00', end: '18:00', enabled: true },
    thursday: { start: '08:00', end: '18:00', enabled: true },
    friday: { start: '08:00', end: '18:00', enabled: true },
    saturday: { start: '09:00', end: '13:00', enabled: true },
    sunday: { start: '00:00', end: '00:00', enabled: false },
  },
  reminderSettings: {
    enabled: true, defaultType: 'whatsapp', defaultTiming: '24h',
    smsTemplate: 'Rappel: RDV le {date} à {time}. {cabinet}',
    whatsappTemplate: '👋 Bonjour {patient}!\n📅 RDV: {date} à {time}\n📍 {cabinet}',
  },
  invoiceSettings: { prefix: 'FAC', footer: 'Merci de votre confiance.', bankDetails: 'IBAN: MA00 0000 0000' },
  stripeEnabled: false, stripePublicKey: '',
  googleCalendarEnabled: false, googleCalendarId: '',
};
