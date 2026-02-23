import { format, parseISO, isToday, startOfWeek, addDays, isSameDay, differenceInYears, addHours, isBefore } from 'date-fns';
import { fr } from 'date-fns/locale';

// Generate unique ID
export const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2);

// Format date
export const formatDate = (date, formatStr = 'dd MMM yyyy') => {
  if (!date) return '';
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, formatStr, { locale: fr });
};

// Format currency
export const formatCurrency = (amount, currency = 'DH') => `${Number(amount || 0).toLocaleString('fr-MA')} ${currency}`;

// Validate email
export const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

// Validate Moroccan phone
export const validatePhone = (phone) => /^(0|\+212)[5-7][0-9]{8}$/.test(phone?.replace(/\s/g, '') || '');

// Format phone
export const formatPhone = (phone) => {
  const cleaned = (phone || '').replace(/\D/g, '');
  if (cleaned.length === 10) return `${cleaned.slice(0, 2)} ${cleaned.slice(2, 4)} ${cleaned.slice(4, 6)} ${cleaned.slice(6, 8)} ${cleaned.slice(8)}`;
  return phone;
};

// Calculate age
export const calculateAge = (dateOfBirth) => {
  if (!dateOfBirth) return '';
  return differenceInYears(new Date(), parseISO(dateOfBirth));
};

// Get week days
export const getWeekDays = (startDate) => {
  const start = startOfWeek(startDate, { weekStartsOn: 1 });
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
};

// Check if today
export const checkIsToday = (date) => isToday(typeof date === 'string' ? parseISO(date) : date);

// Same day check
export const areSameDays = (date1, date2) => {
  const d1 = typeof date1 === 'string' ? parseISO(date1) : date1;
  const d2 = typeof date2 === 'string' ? parseISO(date2) : date2;
  return isSameDay(d1, d2);
};

// Time slots generator
export const generateTimeSlots = (start = 8, end = 19, interval = 30) => {
  const slots = [];
  for (let h = start; h < end; h++) {
    for (let m = 0; m < 60; m += interval) {
      slots.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
    }
  }
  return slots;
};

export const TIME_SLOTS = generateTimeSlots();

// Days in French
export const DAYS_FR = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
export const DAYS_FR_SHORT = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

// Status helpers
export const getStatusColor = (status) => {
  const colors = {
    planifie: 'badge-info', confirme: 'badge-primary', rappel_envoye: 'badge-warning',
    present: 'badge-success', en_cours: 'badge-accent', termine: 'badge-success',
    absent: 'badge-danger', annule: 'bg-slate-100 text-slate-600',
  };
  return colors[status] || 'bg-slate-100 text-slate-600';
};

export const getStatusLabel = (status) => {
  const labels = {
    planifie: 'Planifié', confirme: 'Confirmé', rappel_envoye: 'Rappel envoyé',
    present: 'Présent', en_cours: 'En cours', termine: 'Terminé',
    absent: 'Absent', annule: 'Annulé',
  };
  return labels[status] || status;
};

// Check reminder timing
export const shouldSendReminder = (appointmentDate, appointmentTime, reminderHours) => {
  const aptDateTime = parseISO(`${appointmentDate}T${appointmentTime}`);
  const reminderTime = addHours(new Date(), reminderHours);
  return isBefore(aptDateTime, reminderTime) && isBefore(new Date(), aptDateTime);
};

// Format reminder message
export const formatReminderMessage = (template, data) => {
  return template
    .replace(/{patient}/g, data.patientName || '')
    .replace(/{date}/g, data.date || '')
    .replace(/{time}/g, data.time || '')
    .replace(/{cabinet}/g, data.cabinetName || '')
    .replace(/{phone}/g, data.phone || '');
};

// File to base64
export const fileToBase64 = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = () => resolve(reader.result);
  reader.onerror = reject;
});

// Download blob
export const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

// Permission check
export const hasPermission = (userRole, permission) => {
  const rolePermissions = {
    admin: ['all'],
    practitioner: ['patients', 'appointments', 'invoices', 'medical_records', 'statistics'],
    secretary: ['patients', 'appointments', 'invoices', 'reminders'],
  };
  const perms = rolePermissions[userRole] || [];
  return perms.includes('all') || perms.includes(permission);
};

// Invoice number generator
export const generateInvoiceNumber = (prefix = 'FAC', existingInvoices = []) => {
  const year = new Date().getFullYear();
  const count = existingInvoices.filter(i => i.number?.includes(`${prefix}-${year}`)).length + 1;
  return `${prefix}-${year}-${count.toString().padStart(3, '0')}`;
};
