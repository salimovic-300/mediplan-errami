import React, { useState, useMemo } from 'react';
import { FileText, Download, Eye, Printer, Search, Check, Plus, Calendar, FileSpreadsheet, X, Trash2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Modal } from '../components/Modal';
import { formatDate, formatCurrency } from '../utils/helpers';

export default function InvoicesPage() {
  const { invoices, patients, getPatientById, markInvoicePaid, cabinetConfig, addInvoice } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPeriod, setFilterPeriod] = useState('all');
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showNewInvoiceModal, setShowNewInvoiceModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  
  // État initial du formulaire nouvelle facture
  const initialFormState = {
    patientId: '',
    items: [{ description: '', quantity: 1, unitPrice: '' }],
    notes: ''
  };
  
  const [formData, setFormData] = useState(initialFormState);

  const getDateRange = (period) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (period) {
      case 'today':
        return { start: today, end: now };
      case 'week':
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay() + 1);
        return { start: weekStart, end: now };
      case 'month':
        return { start: new Date(now.getFullYear(), now.getMonth(), 1), end: now };
      case 'quarter':
        const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
        return { start: quarterStart, end: now };
      case 'year':
        return { start: new Date(now.getFullYear(), 0, 1), end: now };
      default:
        return null;
    }
  };

  const filteredInvoices = useMemo(() => {
    return invoices
      .filter(inv => {
        const patient = getPatientById(inv.patientId);
        const matchesSearch = !searchQuery || 
          inv.number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          `${patient?.firstName} ${patient?.lastName}`.toLowerCase().includes(searchQuery.toLowerCase());
        
        const matchesStatus = filterStatus === 'all' || 
          (filterStatus === 'paid' && inv.status === 'paid') ||
          (filterStatus === 'pending' && inv.status !== 'paid');
        
        let matchesPeriod = true;
        if (filterPeriod !== 'all') {
          const range = getDateRange(filterPeriod);
          if (range) {
            const invDate = new Date(inv.date);
            matchesPeriod = invDate >= range.start && invDate <= range.end;
          }
        }
        
        return matchesSearch && matchesStatus && matchesPeriod;
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [invoices, searchQuery, filterStatus, filterPeriod, getPatientById]);

  const stats = useMemo(() => {
    const filtered = filteredInvoices;
    const paid = filtered.filter(i => i.status === 'paid');
    const pending = filtered.filter(i => i.status !== 'paid');
    return {
      total: filtered.reduce((sum, i) => sum + (i.total || 0), 0),
      paid: paid.reduce((sum, i) => sum + (i.total || 0), 0),
      pending: pending.reduce((sum, i) => sum + (i.total || 0), 0),
      count: filtered.length,
    };
  }, [filteredInvoices]);

  const viewInvoice = (invoice) => {
    setSelectedInvoice(invoice);
    setShowInvoiceModal(true);
  };

  const handlePrint = () => window.print();

  const downloadPDF = (invoice) => {
    const patient = getPatientById(invoice.patientId);
    const content = `
FACTURE ${invoice.number}
Date: ${formatDate(invoice.date)}
═══════════════════════════════════════

${cabinetConfig?.name || 'Cabinet'}
${cabinetConfig?.address || ''}
${cabinetConfig?.city || ''} ${cabinetConfig?.postalCode || ''}
Tél: ${cabinetConfig?.phone || ''}

───────────────────────────────────────
FACTURÉ À:
${patient?.firstName || ''} ${patient?.lastName || ''}
${patient?.phone || ''}
───────────────────────────────────────

DÉTAILS:
${invoice.items?.map(item => 
  `• ${item.description} x${item.quantity} = ${formatCurrency(item.total || item.quantity * item.unitPrice)}`
).join('\n') || ''}

═══════════════════════════════════════
TOTAL: ${formatCurrency(invoice.total)}
═══════════════════════════════════════

Statut: ${invoice.status === 'paid' ? 'PAYÉE' : 'EN ATTENTE'}
`;
    
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `facture-${invoice.number}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportToCSV = () => {
    const headers = ['N° Facture', 'Date', 'Patient', 'Téléphone', 'Montant', 'Statut'];
    const rows = filteredInvoices.map(inv => {
      const patient = getPatientById(inv.patientId);
      return [
        inv.number,
        formatDate(inv.date),
        `${patient?.firstName || ''} ${patient?.lastName || ''}`,
        patient?.phone || '',
        inv.total,
        inv.status === 'paid' ? 'Payée' : 'En attente'
      ];
    });
    
    const csvContent = [
      headers.join(';'),
      ...rows.map(row => row.join(';'))
    ].join('\n');
    
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `factures-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Gestion des articles du formulaire
  const handleAddItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { description: '', quantity: 1, unitPrice: '' }]
    }));
  };

  const handleRemoveItem = (index) => {
    if (formData.items.length > 1) {
      setFormData(prev => ({
        ...prev,
        items: prev.items.filter((_, i) => i !== index)
      }));
    }
  };

  const handleItemChange = (index, field, value) => {
    setFormData(prev => {
      const newItems = [...prev.items];
      newItems[index] = {
        ...newItems[index],
        [field]: value
      };
      return { ...prev, items: newItems };
    });
  };

  const calculateTotal = () => {
    return formData.items.reduce((sum, item) => {
      const qty = parseInt(item.quantity) || 0;
      const price = parseFloat(item.unitPrice) || 0;
      return sum + (qty * price);
    }, 0);
  };

  const handleOpenNewInvoice = () => {
    setFormData(initialFormState);
    setShowNewInvoiceModal(true);
  };

  const handleCreateInvoice = () => {
    // Validation
    if (!formData.patientId) {
      alert('Veuillez sélectionner un patient');
      return;
    }
    
    const hasInvalidItem = formData.items.some(item => {
      const desc = item.description?.trim();
      const price = parseFloat(item.unitPrice);
      return !desc || isNaN(price) || price <= 0;
    });
    
    if (hasInvalidItem) {
      alert('Veuillez remplir tous les articles avec une description et un prix valide');
      return;
    }

    const subtotal = calculateTotal();
    const taxRate = cabinetConfig?.invoiceSettings?.taxRate || 0;
    const tax = subtotal * (taxRate / 100);
    const total = subtotal + tax;

    const invoiceData = {
      patientId: formData.patientId,
      date: new Date().toISOString().split('T')[0],
      items: formData.items.map(item => ({
        description: item.description.trim(),
        quantity: parseInt(item.quantity) || 1,
        unitPrice: parseFloat(item.unitPrice) || 0,
        total: (parseInt(item.quantity) || 1) * (parseFloat(item.unitPrice) || 0)
      })),
      subtotal,
      tax,
      total,
      status: 'pending',
      notes: formData.notes?.trim() || '',
    };

    addInvoice(invoiceData);
    setShowNewInvoiceModal(false);
    setFormData(initialFormState);
  };

  const periodOptions = [
    { value: 'all', label: 'Toutes' },
    { value: 'today', label: "Aujourd'hui" },
    { value: 'week', label: 'Semaine' },
    { value: 'month', label: 'Mois' },
    { value: 'quarter', label: 'Trimestre' },
    { value: 'year', label: 'Année' },
  ];

  return (
    <div className="space-y-6 pb-20 lg:pb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold text-slate-900">Facturation</h1>
          <p className="text-slate-500">{filteredInvoices.length} facture{filteredInvoices.length > 1 ? 's' : ''}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportToCSV} className="btn-secondary flex items-center gap-2" title="Exporter">
            <FileSpreadsheet size={18} />
            <span className="hidden sm:inline">Export</span>
          </button>
          <button onClick={handleOpenNewInvoice} className="btn-primary flex items-center gap-2">
            <Plus size={18} />
            <span>Nouvelle</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="stat-card">
          <p className="text-slate-500 text-xs sm:text-sm">Total</p>
          <p className="text-xl sm:text-3xl font-bold text-slate-900">{formatCurrency(stats.total)}</p>
        </div>
        <div className="stat-card border-emerald-200 bg-emerald-50">
          <p className="text-emerald-600 text-xs sm:text-sm">Encaissé</p>
          <p className="text-xl sm:text-3xl font-bold text-emerald-700">{formatCurrency(stats.paid)}</p>
        </div>
        <div className="stat-card border-amber-200 bg-amber-50">
          <p className="text-amber-600 text-xs sm:text-sm">En attente</p>
          <p className="text-xl sm:text-3xl font-bold text-amber-700">{formatCurrency(stats.pending)}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="Rechercher..." 
            value={searchQuery} 
            onChange={(e) => setSearchQuery(e.target.value)} 
            className="input-field pl-12 w-full" 
          />
        </div>
        
        <div className="flex gap-2 flex-wrap">
          <select 
            value={filterPeriod} 
            onChange={(e) => setFilterPeriod(e.target.value)} 
            className="input-field text-sm flex-1 min-w-[100px]"
          >
            {periodOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          
          <div className="flex gap-1">
            {['all', 'paid', 'pending'].map(status => (
              <button 
                key={status} 
                onClick={() => setFilterStatus(status)} 
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  filterStatus === status 
                    ? 'bg-primary-500 text-white' 
                    : 'bg-white border border-slate-200 text-slate-600'
                }`}
              >
                {status === 'all' ? 'Tous' : status === 'paid' ? 'Payé' : 'Attente'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {filteredInvoices.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">Aucune facture</p>
            <button 
              onClick={handleOpenNewInvoice} 
              className="mt-4 text-primary-600 hover:text-primary-700 font-medium"
            >
              + Créer une facture
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600">N°</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600">Patient</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 hidden sm:table-cell">Date</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-slate-600">Montant</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-slate-600">Statut</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInvoices.map(invoice => {
                  const patient = getPatientById(invoice.patientId);
                  return (
                    <tr key={invoice.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs text-slate-800">{invoice.number}</span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-sm text-slate-800">{patient?.firstName} {patient?.lastName}</p>
                        <p className="text-xs text-slate-500 sm:hidden">{formatDate(invoice.date)}</p>
                      </td>
                      <td className="px-4 py-3 text-slate-600 text-sm hidden sm:table-cell">{formatDate(invoice.date)}</td>
                      <td className="px-4 py-3 text-right font-semibold text-sm text-slate-800">{formatCurrency(invoice.total)}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                          invoice.status === 'paid' 
                            ? 'bg-emerald-100 text-emerald-700' 
                            : 'bg-amber-100 text-amber-700'
                        }`}>
                          {invoice.status === 'paid' ? '✓' : '⏳'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <button 
                            onClick={() => viewInvoice(invoice)} 
                            className="p-2 rounded-lg hover:bg-slate-100 text-slate-400"
                          >
                            <Eye size={16} />
                          </button>
                          <button 
                            onClick={() => downloadPDF(invoice)} 
                            className="p-2 rounded-lg hover:bg-slate-100 text-slate-400"
                          >
                            <Download size={16} />
                          </button>
                          {invoice.status !== 'paid' && (
                            <button 
                              onClick={() => markInvoicePaid(invoice.id, 'cash')} 
                              className="p-2 rounded-lg hover:bg-emerald-50 text-emerald-500"
                            >
                              <Check size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Détails Facture */}
      <Modal isOpen={showInvoiceModal} onClose={() => setShowInvoiceModal(false)} title="Facture" size="lg">
        {selectedInvoice && (
          <div className="space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-bold text-slate-900">{cabinetConfig?.name || 'Cabinet'}</h3>
                <p className="text-slate-500 text-sm">{cabinetConfig?.address}</p>
                <p className="text-slate-500 text-sm">{cabinetConfig?.phone}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-primary-600">{selectedInvoice.number}</p>
                <p className="text-slate-500 text-sm">{formatDate(selectedInvoice.date)}</p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl">
              <p className="text-xs text-slate-500">Patient</p>
              <p className="font-medium text-slate-800">
                {getPatientById(selectedInvoice.patientId)?.firstName} {getPatientById(selectedInvoice.patientId)?.lastName}
              </p>
            </div>

            <div className="border rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="text-left p-3 font-medium text-slate-600">Article</th>
                    <th className="text-center p-3 font-medium text-slate-600 w-16">Qté</th>
                    <th className="text-right p-3 font-medium text-slate-600">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedInvoice.items?.map((item, i) => (
                    <tr key={i} className="border-t">
                      <td className="p-3 text-slate-800">{item.description}</td>
                      <td className="p-3 text-center text-slate-600">{item.quantity}</td>
                      <td className="p-3 text-right font-medium">{formatCurrency(item.total || item.quantity * item.unitPrice)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-50 border-t-2">
                  <tr>
                    <td colSpan="2" className="p-3 text-right font-bold">Total</td>
                    <td className="p-3 text-right font-bold text-primary-600">{formatCurrency(selectedInvoice.total)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="flex gap-2 pt-4">
              <button onClick={() => setShowInvoiceModal(false)} className="btn-secondary flex-1">Fermer</button>
              <button onClick={handlePrint} className="btn-secondary">
                <Printer size={18} />
              </button>
              <button onClick={() => downloadPDF(selectedInvoice)} className="btn-primary flex items-center gap-2">
                <Download size={18} /> PDF
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Nouvelle Facture */}
      <Modal isOpen={showNewInvoiceModal} onClose={() => setShowNewInvoiceModal(false)} title="Nouvelle facture" size="lg">
        <div className="space-y-5">
          {/* Sélection Patient */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Patient *</label>
            <select 
              value={formData.patientId} 
              onChange={(e) => setFormData(prev => ({ ...prev, patientId: e.target.value }))} 
              className="input-field w-full"
            >
              <option value="">-- Sélectionner un patient --</option>
              {patients.map(patient => (
                <option key={patient.id} value={patient.id}>
                  {patient.firstName} {patient.lastName} - {patient.phone}
                </option>
              ))}
            </select>
          </div>

          {/* Articles */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-slate-700">Articles *</label>
              <button 
                type="button"
                onClick={handleAddItem} 
                className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
              >
                <Plus size={16} /> Ajouter
              </button>
            </div>
            
            <div className="space-y-3">
              {formData.items.map((item, index) => (
                <div key={index} className="p-3 bg-slate-50 rounded-xl space-y-3">
                  {/* Description - Ligne complète */}
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">Description</label>
                    <input 
                      type="text" 
                      placeholder="Ex: Consultation, Séance..." 
                      value={item.description}
                      onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                      autoComplete="off"
                      autoCorrect="off"
                      autoCapitalize="words"
                    />
                  </div>
                  
                  {/* Quantité et Prix - Même ligne */}
                  <div className="flex gap-3 items-end">
                    <div className="flex-1">
                      <label className="text-xs text-slate-500 mb-1 block">Quantité</label>
                      <input 
                        type="number" 
                        placeholder="1"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                        className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm text-center focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="text-xs text-slate-500 mb-1 block">Prix (DH)</label>
                      <input 
                        type="number" 
                        placeholder="300"
                        min="0"
                        step="0.01"
                        value={item.unitPrice}
                        onChange={(e) => handleItemChange(index, 'unitPrice', e.target.value)}
                        className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm text-right focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                      />
                    </div>
                    <div className="w-24 text-right">
                      <p className="text-xs text-slate-500">Total</p>
                      <p className="font-bold text-slate-800">
                        {formatCurrency((parseInt(item.quantity) || 0) * (parseFloat(item.unitPrice) || 0))}
                      </p>
                    </div>
                    {formData.items.length > 1 && (
                      <button 
                        type="button"
                        onClick={() => handleRemoveItem(index)} 
                        className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Total Général */}
          <div className="p-4 bg-primary-50 border border-primary-200 rounded-xl">
            <div className="flex justify-between items-center">
              <span className="font-medium text-primary-700">Total Facture</span>
              <span className="text-2xl font-bold text-primary-600">{formatCurrency(calculateTotal())}</span>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Notes (optionnel)</label>
            <textarea 
              value={formData.notes} 
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))} 
              className="input-field w-full" 
              rows="2" 
              placeholder="Ajouter des notes..."
            />
          </div>

          {/* Boutons */}
          <div className="flex gap-3 pt-4 border-t border-slate-200">
            <button 
              type="button"
              onClick={() => setShowNewInvoiceModal(false)} 
              className="btn-secondary flex-1"
            >
              Annuler
            </button>
            <button 
              type="button"
              onClick={handleCreateInvoice} 
              className="btn-primary flex-1 flex items-center justify-center gap-2"
            >
              <FileText size={18} />
              Créer
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}