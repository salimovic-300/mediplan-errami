import React, { useState, useMemo } from 'react';
import { CreditCard, Banknote, Building2, FileText, Globe, Check, Clock, Filter, Download, Receipt } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Modal } from '../components/Modal';
import { formatDate, formatCurrency } from '../utils/helpers';
import { PAYMENT_METHODS, APPOINTMENT_TYPES } from '../data/constants';

export default function PaymentsPage() {
  const { appointments, patients, getPatientById, updateAppointment, addInvoice, addNotification } = useApp();
  const [filterStatus, setFilterStatus] = useState('all');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [partialAmount, setPartialAmount] = useState(0);

  const billableAppointments = useMemo(() => {
    return appointments
      .filter(a => ['termine', 'present'].includes(a.status))
      .sort((a, b) => b.date.localeCompare(a.date))
      .map(a => ({
        ...a,
        patient: getPatientById(a.patientId),
      }));
  }, [appointments, getPatientById]);

  const filteredAppointments = useMemo(() => {
    if (filterStatus === 'all') return billableAppointments;
    if (filterStatus === 'pending') return billableAppointments.filter(a => !a.paid);
    if (filterStatus === 'paid') return billableAppointments.filter(a => a.paid);
    return billableAppointments;
  }, [billableAppointments, filterStatus]);

  const stats = useMemo(() => {
    const pending = billableAppointments.filter(a => !a.paid);
    const paid = billableAppointments.filter(a => a.paid);
    return {
      pendingCount: pending.length,
      pendingAmount: pending.reduce((sum, a) => sum + (a.fee || 0), 0),
      paidCount: paid.length,
      paidAmount: paid.reduce((sum, a) => sum + (a.fee || 0), 0),
      totalAmount: billableAppointments.reduce((sum, a) => sum + (a.fee || 0), 0),
    };
  }, [billableAppointments]);

  const openPaymentModal = (apt) => {
    setSelectedAppointment(apt);
    setPaymentMethod('cash');
    setPartialAmount(apt.fee || 0);
    setShowPaymentModal(true);
  };

  const handlePayment = () => {
    if (!selectedAppointment) return;
    
    updateAppointment(selectedAppointment.id, {
      paid: true,
      paymentMethod,
      paidAt: new Date().toISOString(),
    });

    addInvoice({
      patientId: selectedAppointment.patientId,
      appointmentId: selectedAppointment.id,
      date: new Date().toISOString().split('T')[0],
      items: [{
        description: APPOINTMENT_TYPES.find(t => t.id === selectedAppointment.type)?.label || 'Consultation',
        quantity: 1,
        unitPrice: selectedAppointment.fee,
        total: selectedAppointment.fee,
      }],
      subtotal: selectedAppointment.fee,
      tax: 0,
      total: selectedAppointment.fee,
      status: 'paid',
      paymentMethod,
      paidAt: new Date().toISOString(),
    });

    setShowPaymentModal(false);
    addNotification('Paiement enregistré et facture créée', 'success');
  };

  const getPaymentIcon = (method) => {
    switch(method) {
      case 'cash': return Banknote;
      case 'card': return CreditCard;
      case 'transfer': return Building2;
      case 'check': return FileText;
      case 'online': return Globe;
      default: return CreditCard;
    }
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold text-slate-900">Paiements</h1>
          <p className="text-slate-500">Gérez les encaissements</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="stat-card border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-amber-600 text-sm font-medium">En attente</p>
              <p className="text-3xl font-bold text-amber-700 mt-1">{formatCurrency(stats.pendingAmount)}</p>
              <p className="text-amber-600 text-sm mt-1">{stats.pendingCount} paiements</p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-amber-100 flex items-center justify-center">
              <Clock className="w-7 h-7 text-amber-600" />
            </div>
          </div>
        </div>

        <div className="stat-card border-emerald-200 bg-gradient-to-br from-emerald-50 to-green-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-emerald-600 text-sm font-medium">Encaissé</p>
              <p className="text-3xl font-bold text-emerald-700 mt-1">{formatCurrency(stats.paidAmount)}</p>
              <p className="text-emerald-600 text-sm mt-1">{stats.paidCount} paiements</p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 flex items-center justify-center">
              <Check className="w-7 h-7 text-emerald-600" />
            </div>
          </div>
        </div>

        <div className="stat-card border-primary-200 bg-gradient-to-br from-primary-50 to-cyan-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-primary-600 text-sm font-medium">Total</p>
              <p className="text-3xl font-bold text-primary-700 mt-1">{formatCurrency(stats.totalAmount)}</p>
              <p className="text-primary-600 text-sm mt-1">{billableAppointments.length} consultations</p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-primary-100 flex items-center justify-center">
              <CreditCard className="w-7 h-7 text-primary-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex gap-2">
            {[
              { id: 'all', label: 'Tous' },
              { id: 'pending', label: 'En attente', count: stats.pendingCount },
              { id: 'paid', label: 'Payés', count: stats.paidCount },
            ].map(tab => (
              <button key={tab.id} onClick={() => setFilterStatus(tab.id)} className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${filterStatus === tab.id ? 'bg-primary-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                {tab.label} {tab.count !== undefined && `(${tab.count})`}
              </button>
            ))}
          </div>
        </div>

        {filteredAppointments.length === 0 ? (
          <div className="p-12 text-center">
            <Receipt className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">Aucun paiement</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredAppointments.map(apt => {
              const typeInfo = APPOINTMENT_TYPES.find(t => t.id === apt.type);
              const PayIcon = apt.paid ? getPaymentIcon(apt.paymentMethod) : Clock;
              return (
                <div key={apt.id} className="p-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${apt.paid ? 'bg-emerald-100' : 'bg-amber-100'}`}>
                        <PayIcon className={`w-6 h-6 ${apt.paid ? 'text-emerald-600' : 'text-amber-600'}`} />
                      </div>
                      <div>
                        <p className="font-medium text-slate-800">{apt.patient?.firstName} {apt.patient?.lastName}</p>
                        <p className="text-sm text-slate-500">{typeInfo?.label} • {formatDate(apt.date)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-bold text-slate-800">{formatCurrency(apt.fee)}</p>
                        {apt.paid && <p className="text-xs text-slate-500">{PAYMENT_METHODS.find(m => m.id === apt.paymentMethod)?.label}</p>}
                      </div>
                      {apt.paid ? (
                        <span className="badge badge-success flex items-center gap-1"><Check size={12} />Payé</span>
                      ) : (
                        <button onClick={() => openPaymentModal(apt)} className="btn-primary text-sm">Encaisser</button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Modal isOpen={showPaymentModal} onClose={() => setShowPaymentModal(false)} title="Enregistrer le paiement" size="md">
        {selectedAppointment && (
          <div className="space-y-6">
            <div className="p-4 bg-slate-50 rounded-xl">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium text-slate-800">{selectedAppointment.patient?.firstName} {selectedAppointment.patient?.lastName}</p>
                  <p className="text-sm text-slate-500">{formatDate(selectedAppointment.date)} à {selectedAppointment.time}</p>
                </div>
                <p className="text-2xl font-bold text-primary-600">{formatCurrency(selectedAppointment.fee)}</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-3">Mode de paiement</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {PAYMENT_METHODS.map(method => {
                  const Icon = getPaymentIcon(method.id);
                  return (
                    <button key={method.id} type="button" onClick={() => setPaymentMethod(method.id)} className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${paymentMethod === method.id ? 'border-primary-500 bg-primary-50' : 'border-slate-200 hover:border-slate-300'}`}>
                      <Icon size={24} className={paymentMethod === method.id ? 'text-primary-600' : 'text-slate-400'} />
                      <span className={`text-sm ${paymentMethod === method.id ? 'text-primary-700 font-medium' : 'text-slate-600'}`}>{method.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {paymentMethod === 'online' && (
              <div className="p-4 bg-violet-50 rounded-xl border border-violet-200">
                <p className="text-violet-800 font-medium">Paiement en ligne Stripe</p>
                <p className="text-sm text-violet-600 mt-1">Un lien de paiement sera envoyé au patient par email.</p>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <button onClick={() => setShowPaymentModal(false)} className="btn-secondary flex-1">Annuler</button>
              <button onClick={handlePayment} className="btn-success flex-1 flex items-center justify-center gap-2">
                <Check size={18} />Confirmer le paiement
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
