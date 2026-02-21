import React, { useState, useMemo } from 'react';
import { FileText, Download, Eye, Printer, Search, Check, Plus, FileSpreadsheet, Trash2 } from 'lucide-react';
import { jsPDF } from 'jspdf';
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
      case 'today':   return { start: today, end: now };
      case 'week':    const weekStart = new Date(today); weekStart.setDate(today.getDate() - today.getDay() + 1); return { start: weekStart, end: now };
      case 'month':   return { start: new Date(now.getFullYear(), now.getMonth(), 1), end: now };
      case 'quarter': const qStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1); return { start: qStart, end: now };
      case 'year':    return { start: new Date(now.getFullYear(), 0, 1), end: now };
      default:        return null;
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
          if (range) { const d = new Date(inv.date); matchesPeriod = d >= range.start && d <= range.end; }
        }
        return matchesSearch && matchesStatus && matchesPeriod;
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [invoices, searchQuery, filterStatus, filterPeriod, getPatientById]);

  const stats = useMemo(() => {
    const paid = filteredInvoices.filter(i => i.status === 'paid');
    const pending = filteredInvoices.filter(i => i.status !== 'paid');
    return {
      total:   filteredInvoices.reduce((s, i) => s + (i.total || 0), 0),
      paid:    paid.reduce((s, i) => s + (i.total || 0), 0),
      pending: pending.reduce((s, i) => s + (i.total || 0), 0),
      count:   filteredInvoices.length,
    };
  }, [filteredInvoices]);

  const viewInvoice = (invoice) => { setSelectedInvoice(invoice); setShowInvoiceModal(true); };
  const handlePrint = () => window.print();

  // ─────────────────────────────────────────────────────────────────────────
  // TÉLÉCHARGEMENT PDF PROFESSIONNEL (jsPDF)
  // ─────────────────────────────────────────────────────────────────────────
  const downloadPDF = (invoice) => {
    const patient = getPatientById(invoice.patientId);
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const W = 210;
    const H = 297;
    let y = 0;

    // Palette
    const DARK       = [15, 52, 96];
    const TEAL       = [0, 168, 150];
    const LIGHT      = [245, 247, 250];
    const WHITE      = [255, 255, 255];
    const TEXT       = [30, 41, 59];
    const MUTED      = [100, 116, 139];
    const GREEN      = [21, 128, 61];
    const GREEN_BG   = [220, 252, 231];
    const AMBER      = [161, 98, 7];
    const AMBER_BG   = [254, 249, 195];

    const setFill  = (c) => doc.setFillColor(c[0], c[1], c[2]);
    const setFont  = (size, style = 'normal', color = TEXT) => {
      doc.setFontSize(size);
      doc.setFont('helvetica', style);
      doc.setTextColor(color[0], color[1], color[2]);
    };
    const hline = (y2, color = [226, 232, 240], lw = 0.3) => {
      doc.setDrawColor(color[0], color[1], color[2]);
      doc.setLineWidth(lw);
      doc.line(14, y2, W - 14, y2);
    };

    // ── Header band ──────────────────────────────────────────────────────────
    setFill(DARK);
    doc.rect(0, 0, W, 54, 'F');

    // Cercles décoratifs
    doc.setGState(doc.GState({ opacity: 0.06 }));
    setFill(WHITE);
    doc.circle(188, -8, 44, 'F');
    doc.circle(170, 58, 28, 'F');
    doc.setGState(doc.GState({ opacity: 1 }));

    // Cercle logo teal
    setFill(TEAL);
    doc.circle(22, 20, 10, 'F');
    setFont(13, 'bold', WHITE);
    doc.text((cabinetConfig?.name || 'M').charAt(0).toUpperCase(), 22, 24.5, { align: 'center' });

    // Nom & sous-titre cabinet
    setFont(14, 'bold', WHITE);
    doc.text(cabinetConfig?.name || 'Cabinet MediPlan', 36, 16);
    setFont(8, 'normal', [160, 195, 220]);
    doc.text('Cabinet généraliste  •  ' + (cabinetConfig?.website || 'mediplan-pro-1.vercel.app'), 36, 22);

    // Infos cabinet (droite)
    setFont(7.5, 'normal', [160, 195, 220]);
    const cabinetLines = [
      cabinetConfig?.address || '123 Avenue Mohammed V',
      (cabinetConfig?.city || 'Rabat 10000') + ' - Maroc',
      'Tel: ' + (cabinetConfig?.phone || '0537000000'),
    ];
    cabinetLines.forEach((l, i) => doc.text(l, W - 13, 9 + i * 5, { align: 'right' }));

    // Mot FACTURE + numéro
    y = 43;
    setFont(20, 'bold', TEAL);
    doc.text('FACTURE', 14, y);
    const fW = doc.getTextWidth('FACTURE');
    setFont(10, 'normal', [160, 195, 220]);
    doc.text(invoice.number || '', 14 + fW + 3, y);

    // ── Section FACTURÉ À + DÉTAILS ──────────────────────────────────────────
    y = 62;

    // Col gauche
    setFont(7, 'bold', TEAL);
    doc.text('FACTURÉ À :', 14, y);
    setFont(11, 'bold', TEXT);
    doc.text(`${patient?.firstName || ''} ${patient?.lastName || ''}`, 14, y + 7);
    setFont(8, 'normal', MUTED);
    doc.text('Patient', 14, y + 13);
    doc.text('Tel: ' + (patient?.phone || '—'), 14, y + 19);

    // Col droite
    const rx = 115;
    setFont(7, 'bold', TEAL);
    doc.text('DÉTAILS FACTURE :', rx, y);
    const rows = [
      ['N° Facture :', invoice.number || '—'],
      ['Date :', formatDate(invoice.date)],
      ['Médecin :', cabinetConfig?.doctorName || cabinetConfig?.name || '—'],
    ];
    rows.forEach(([lbl, val], i) => {
      setFont(8, 'bold', MUTED);  doc.text(lbl, rx, y + 7 + i * 6.5);
      setFont(8, 'bold', TEXT);   doc.text(val, rx + 32, y + 7 + i * 6.5);
    });

    // Badge statut
    const isPaid = invoice.status === 'paid';
    setFill(isPaid ? GREEN_BG : AMBER_BG);
    doc.roundedRect(W - 44, y + 24, 30, 8, 2, 2, 'F');
    setFont(7.5, 'bold', isPaid ? GREEN : AMBER);
    doc.text(isPaid ? 'PAYÉE' : 'EN ATTENTE', W - 29, y + 29.5, { align: 'center' });

    // ── Tableau ──────────────────────────────────────────────────────────────
    y += 36;
    hline(y, [226, 232, 240], 0.5);
    y += 7;

    // En-tête tableau
    setFill(DARK);
    doc.rect(14, y, W - 28, 11, 'F');
    setFont(8, 'bold', WHITE);
    doc.text('DESCRIPTION',  17,        y + 7.5);
    doc.text('QTÉ',          117,       y + 7.5);
    doc.text('PRIX UNITAIRE', 140,      y + 7.5);
    doc.text('TOTAL',         W - 17,   y + 7.5, { align: 'right' });
    y += 11;

    // Lignes items
    (invoice.items || []).forEach((item, i) => {
      const rH = 13;
      if (i % 2 === 0) { setFill(LIGHT); doc.rect(14, y, W - 28, rH, 'F'); }
      const unitPrice = item.unitPrice || 0;
      const qty       = item.quantity || 1;
      const itemTotal = item.total || qty * unitPrice;

      setFont(9, 'bold', TEXT);
      doc.text(item.description || '', 17, y + 8.5);
      setFont(8, 'normal', MUTED);
      doc.text(String(qty), 120, y + 8.5);
      doc.text(formatCurrency(unitPrice), 140, y + 8.5);
      setFont(9, 'bold', TEAL);
      doc.text(formatCurrency(itemTotal), W - 17, y + 8.5, { align: 'right' });
      hline(y + rH, [226, 232, 240], 0.2);
      y += rH;
    });

    // ── Totaux ───────────────────────────────────────────────────────────────
    y += 6;
    const tX = 118; const tW = W - 14 - tX;

    const addRow = (lbl, val, highlight = false) => {
      if (highlight) {
        setFill(TEAL);
        doc.roundedRect(tX, y - 3, tW, 11, 2, 2, 'F');
        setFont(10, 'bold', WHITE);
        doc.text(lbl, tX + 4, y + 4.5);
        doc.text(val, tX + tW - 4, y + 4.5, { align: 'right' });
        y += 13;
      } else {
        setFont(8.5, 'normal', MUTED);
        doc.text(lbl, tX + 4, y + 3.5);
        doc.text(val, tX + tW - 4, y + 3.5, { align: 'right' });
        hline(y + 7, [226, 232, 240], 0.2);
        y += 9;
      }
    };

    addRow('Sous-total :', formatCurrency(invoice.subtotal || invoice.total));
    addRow('TVA (' + (cabinetConfig?.invoiceSettings?.taxRate || 0) + '%) :', formatCurrency(invoice.tax || 0));
    y += 3;
    addRow('TOTAL À PAYER :', formatCurrency(invoice.total), true);

    // ── Zone signature + modalités ───────────────────────────────────────────
    y += 10;
    hline(y, [226, 232, 240], 0.4);
    y += 8;

    setFont(8, 'bold', MUTED);
    doc.text('CACHET ET SIGNATURE DU MÉDECIN', 14, y);
    setFill(LIGHT);
    doc.roundedRect(14, y + 4, 72, 28, 2, 2, 'F');

    setFont(8, 'bold', TEAL);
    doc.text('MODALITÉS DE PAIEMENT :', 110, y);
    setFont(8, 'normal', TEXT);
    ['- Espèces', "- Chèque à l'ordre de " + (cabinetConfig?.name || 'Cabinet MediPlan'), '- Virement bancaire'].forEach((m, i) => {
      doc.text(m, 110, y + 8 + i * 6.5);
    });

    // ── Footer ───────────────────────────────────────────────────────────────
    setFill(DARK);
    doc.rect(0, H - 14, W, 14, 'F');
    setFont(7.5, 'normal', [160, 195, 220]);
    doc.text(
      `${cabinetConfig?.name || 'Cabinet MediPlan'}  •  ${cabinetConfig?.address || '123 Avenue Mohammed V'}, ${cabinetConfig?.city || 'Rabat 10000'}  •  Tél: ${cabinetConfig?.phone || '0537000000'}`,
      W / 2, H - 8, { align: 'center' }
    );
    setFont(7, 'normal', TEAL);
    doc.text('mediplan-pro-1.vercel.app  •  Généré par MediPlan Pro v3.0', W / 2, H - 3.5, { align: 'center' });

    doc.save(`facture-${invoice.number || invoice.id}.pdf`);
  };

  // ─────────────────────────────────────────────────────────────────────────
  // CSV EXPORT
  // ─────────────────────────────────────────────────────────────────────────
  const exportToCSV = () => {
    const headers = ['N° Facture', 'Date', 'Patient', 'Téléphone', 'Montant', 'Statut'];
    const rows = filteredInvoices.map(inv => {
      const p = getPatientById(inv.patientId);
      return [inv.number, formatDate(inv.date), `${p?.firstName || ''} ${p?.lastName || ''}`, p?.phone || '', inv.total, inv.status === 'paid' ? 'Payée' : 'En attente'];
    });
    const csv = [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `factures-${new Date().toISOString().split('T')[0]}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  // ─────────────────────────────────────────────────────────────────────────
  // FORMULAIRE NOUVELLE FACTURE
  // ─────────────────────────────────────────────────────────────────────────
  const handleAddItem    = () => setFormData(prev => ({ ...prev, items: [...prev.items, { description: '', quantity: 1, unitPrice: '' }] }));
  const handleRemoveItem = (idx) => { if (formData.items.length > 1) setFormData(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== idx) })); };
  const handleItemChange = (idx, field, value) => {
    setFormData(prev => { const items = [...prev.items]; items[idx] = { ...items[idx], [field]: value }; return { ...prev, items }; });
  };
  const calculateTotal = () => formData.items.reduce((s, item) => s + (parseInt(item.quantity) || 0) * (parseFloat(item.unitPrice) || 0), 0);
  const handleOpenNewInvoice = () => { setFormData(initialFormState); setShowNewInvoiceModal(true); };

  const handleCreateInvoice = () => {
    if (!formData.patientId) { alert('Veuillez sélectionner un patient'); return; }
    if (formData.items.some(item => !item.description?.trim() || isNaN(parseFloat(item.unitPrice)) || parseFloat(item.unitPrice) <= 0)) {
      alert('Veuillez remplir tous les articles avec une description et un prix valide'); return;
    }
    const subtotal = calculateTotal();
    const taxRate  = cabinetConfig?.invoiceSettings?.taxRate || 0;
    const tax      = subtotal * (taxRate / 100);
    addInvoice({
      patientId: formData.patientId,
      date: new Date().toISOString().split('T')[0],
      items: formData.items.map(item => ({
        description: item.description.trim(),
        quantity:    parseInt(item.quantity) || 1,
        unitPrice:   parseFloat(item.unitPrice) || 0,
        total:       (parseInt(item.quantity) || 1) * (parseFloat(item.unitPrice) || 0),
      })),
      subtotal, tax, total: subtotal + tax, status: 'pending', notes: formData.notes?.trim() || '',
    });
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

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────
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
            <Plus size={18} /><span>Nouvelle</span>
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

      {/* Filtres */}
      <div className="flex flex-col gap-3">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input type="text" placeholder="Rechercher..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="input-field pl-12 w-full" />
        </div>
        <div className="flex gap-2 flex-wrap">
          <select value={filterPeriod} onChange={(e) => setFilterPeriod(e.target.value)} className="input-field text-sm flex-1 min-w-[100px]">
            {periodOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
          <div className="flex gap-1">
            {['all', 'paid', 'pending'].map(status => (
              <button key={status} onClick={() => setFilterStatus(status)}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${filterStatus === status ? 'bg-primary-500 text-white' : 'bg-white border border-slate-200 text-slate-600'}`}>
                {status === 'all' ? 'Tous' : status === 'paid' ? 'Payé' : 'Attente'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tableau */}
      <div className="card overflow-hidden">
        {filteredInvoices.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">Aucune facture</p>
            <button onClick={handleOpenNewInvoice} className="mt-4 text-primary-600 hover:text-primary-700 font-medium">+ Créer une facture</button>
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
                      <td className="px-4 py-3"><span className="font-mono text-xs text-slate-800">{invoice.number}</span></td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-sm text-slate-800">{patient?.firstName} {patient?.lastName}</p>
                        <p className="text-xs text-slate-500 sm:hidden">{formatDate(invoice.date)}</p>
                      </td>
                      <td className="px-4 py-3 text-slate-600 text-sm hidden sm:table-cell">{formatDate(invoice.date)}</td>
                      <td className="px-4 py-3 text-right font-semibold text-sm text-slate-800">{formatCurrency(invoice.total)}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${invoice.status === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                          {invoice.status === 'paid' ? '✓' : '⏳'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <button onClick={() => viewInvoice(invoice)} className="p-2 rounded-lg hover:bg-slate-100 text-slate-400"><Eye size={16} /></button>
                          <button onClick={() => downloadPDF(invoice)} className="p-2 rounded-lg hover:bg-slate-100 text-slate-400"><Download size={16} /></button>
                          {invoice.status !== 'paid' && (
                            <button onClick={() => markInvoicePaid(invoice.id, 'cash')} className="p-2 rounded-lg hover:bg-emerald-50 text-emerald-500"><Check size={16} /></button>
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

      {/* ═══════════════════════════════════════════════════════════════════
          MODAL DÉTAILS FACTURE — Design professionnel bleu marine
      ═══════════════════════════════════════════════════════════════════ */}
      {showInvoiceModal && selectedInvoice && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(10,18,35,0.65)', backdropFilter: 'blur(6px)' }}
          onClick={() => setShowInvoiceModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#fff', borderRadius: 20, width: '100%', maxWidth: 640,
              maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 32px 80px rgba(0,0,0,0.25)',
              animation: 'invSlideUp .3s ease',
            }}
          >
            <style>{`
              @keyframes invSlideUp { from { opacity:0; transform:translateY(20px) } to { opacity:1; transform:translateY(0) } }
              .inv-tbl tbody tr:hover { background:#f8fafc }
              .inv-btn { display:inline-flex; align-items:center; gap:8px; border:none; cursor:pointer; font-size:14px; font-weight:600; border-radius:12px; padding:11px 20px; transition:all .2s; }
              .inv-ghost { background:transparent; border:1.5px solid #e2e8f0; color:#64748b; }
              .inv-ghost:hover { background:#f8fafc }
              .inv-print { background:#f1f5f9; color:#475569; }
              .inv-print:hover { background:#e2e8f0 }
              .inv-pdf { background:linear-gradient(135deg,#0a3d62,#1e5f8c); color:#fff; box-shadow:0 4px 14px rgba(10,61,98,0.3); }
              .inv-pdf:hover { box-shadow:0 6px 20px rgba(10,61,98,0.4); transform:translateY(-1px) }
              .inv-paid-btn { background:#dcfce7; color:#15803d; border:none; cursor:pointer; font-size:13px; font-weight:600; border-radius:10px; padding:10px 18px; transition:all .2s; }
              .inv-paid-btn:hover { background:#bbf7d0 }
            `}</style>

            {/* Header */}
            <div style={{ background:'linear-gradient(135deg,#0a3d62 0%,#1e5f8c 100%)', borderRadius:'20px 20px 0 0', padding:'28px 32px 24px', position:'relative', overflow:'hidden' }}>
              <div style={{ position:'absolute', right:-50, top:-50, width:200, height:200, borderRadius:'50%', background:'rgba(255,255,255,0.05)' }} />
              <div style={{ position:'absolute', right:50, bottom:-40, width:130, height:130, borderRadius:'50%', background:'rgba(255,255,255,0.04)' }} />

              <button onClick={() => setShowInvoiceModal(false)}
                style={{ position:'absolute', top:16, right:16, background:'rgba(255,255,255,0.12)', border:'none', color:'#fff', width:32, height:32, borderRadius:'50%', cursor:'pointer', fontSize:18, display:'flex', alignItems:'center', justifyContent:'center' }}>×</button>

              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                  <div style={{ width:44, height:44, background:'rgba(255,255,255,0.15)', borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', fontSize:22 }}>🏥</div>
                  <div>
                    <div style={{ fontFamily:'Georgia,serif', fontSize:19, fontWeight:700, color:'#fff' }}>{cabinetConfig?.name || 'Cabinet'}</div>
                    <div style={{ fontSize:12, color:'rgba(255,255,255,0.6)', marginTop:2 }}>{cabinetConfig?.address}</div>
                  </div>
                </div>
                <div style={{ textAlign:'right' }}>
                  <div style={{ fontFamily:'Georgia,serif', fontSize:22, fontWeight:700, color:'#4fc3f7' }}>{selectedInvoice.number}</div>
                  <div style={{ fontSize:12, color:'rgba(255,255,255,0.6)', marginTop:3 }}>{formatDate(selectedInvoice.date)}</div>
                </div>
              </div>

              <div style={{ borderTop:'1px solid rgba(255,255,255,0.15)', margin:'18px 0' }} />

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <div>
                  <div style={{ fontSize:10, textTransform:'uppercase', letterSpacing:'.1em', color:'rgba(255,255,255,0.5)', marginBottom:3 }}>Téléphone</div>
                  <div style={{ fontSize:13, color:'#fff', fontWeight:500 }}>{cabinetConfig?.phone || '—'}</div>
                </div>
                <div>
                  <div style={{ fontSize:10, textTransform:'uppercase', letterSpacing:'.1em', color:'rgba(255,255,255,0.5)', marginBottom:3 }}>Statut</div>
                  <span style={{
                    background: selectedInvoice.status === 'paid' ? '#dcfce7' : '#fef9c3',
                    color: selectedInvoice.status === 'paid' ? '#15803d' : '#a16207',
                    borderRadius:20, padding:'3px 12px', fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'.05em'
                  }}>
                    {selectedInvoice.status === 'paid' ? 'Payée' : 'En attente'}
                  </span>
                </div>
              </div>
            </div>

            {/* Body */}
            <div style={{ padding:'24px 32px' }}>
              {/* Patient */}
              <div style={{ fontSize:10, textTransform:'uppercase', letterSpacing:'.12em', color:'#94a3b8', fontWeight:600, marginBottom:10 }}>Patient</div>
              <div style={{ background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:12, padding:'14px 18px', marginBottom:22, display:'flex', alignItems:'center', gap:14 }}>
                <div style={{ width:42, height:42, background:'linear-gradient(135deg,#0a3d62,#1e5f8c)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontFamily:'Georgia,serif', fontSize:18, fontWeight:700, flexShrink:0 }}>
                  {getPatientById(selectedInvoice.patientId)?.firstName?.charAt(0) || '?'}
                </div>
                <div>
                  <div style={{ fontSize:15, fontWeight:600, color:'#1e293b' }}>
                    {getPatientById(selectedInvoice.patientId)?.firstName} {getPatientById(selectedInvoice.patientId)?.lastName}
                  </div>
                  <div style={{ fontSize:12, color:'#64748b', marginTop:2 }}>{getPatientById(selectedInvoice.patientId)?.phone}</div>
                </div>
              </div>

              {/* Tableau */}
              <div style={{ fontSize:10, textTransform:'uppercase', letterSpacing:'.12em', color:'#94a3b8', fontWeight:600, marginBottom:10 }}>Détail des prestations</div>
              <table className="inv-tbl" style={{ width:'100%', borderCollapse:'collapse', marginBottom:18 }}>
                <thead>
                  <tr style={{ background:'#0f3460' }}>
                    {['Prestation','Qté','P.U.','Total'].map((h, i) => (
                      <th key={h} style={{ padding:'10px 14px', fontSize:11, textTransform:'uppercase', letterSpacing:'.08em', color:'#fff', fontWeight:600, textAlign: i === 0 ? 'left' : i === 1 ? 'center' : 'right' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {selectedInvoice.items?.map((item, i) => (
                    <tr key={i} style={{ background: i % 2 === 0 ? '#f8fafc' : '#fff', borderBottom:'1px solid #f1f5f9' }}>
                      <td style={{ padding:'12px 14px', fontSize:13.5, color:'#334155', fontWeight:500 }}>{item.description}</td>
                      <td style={{ padding:'12px 14px', textAlign:'center', color:'#64748b', fontSize:13 }}>{item.quantity}</td>
                      <td style={{ padding:'12px 14px', textAlign:'right', color:'#64748b', fontSize:13 }}>{formatCurrency(item.unitPrice)}</td>
                      <td style={{ padding:'12px 14px', textAlign:'right', fontWeight:700, color:'#0a3d62', fontSize:13.5 }}>{formatCurrency(item.total || item.quantity * item.unitPrice)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totaux */}
              <div style={{ background:'#f8fafc', borderRadius:12, padding:'14px 18px', marginBottom:22 }}>
                {selectedInvoice.tax > 0 && <>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:13, color:'#64748b', padding:'3px 0' }}><span>Sous-total</span><span>{formatCurrency(selectedInvoice.subtotal)}</span></div>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:13, color:'#64748b', padding:'3px 0' }}><span>TVA</span><span>{formatCurrency(selectedInvoice.tax)}</span></div>
                </>}
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', borderTop: selectedInvoice.tax > 0 ? '2px solid #e2e8f0' : 'none', marginTop: selectedInvoice.tax > 0 ? 10 : 0, paddingTop: selectedInvoice.tax > 0 ? 12 : 0 }}>
                  <span style={{ fontSize:16, fontWeight:700, color:'#0a3d62' }}>Total à payer</span>
                  <span style={{ fontSize:20, fontWeight:700, color:'#0a3d62' }}>{formatCurrency(selectedInvoice.total)}</span>
                </div>
              </div>

              {/* Actions */}
              <div style={{ display:'flex', gap:10, alignItems:'center', flexWrap:'wrap' }}>
                <button className="inv-btn inv-ghost" onClick={() => setShowInvoiceModal(false)}>Fermer</button>
                <div style={{ flex:1 }} />
                {selectedInvoice.status !== 'paid' && (
                  <button className="inv-paid-btn" onClick={() => { markInvoicePaid(selectedInvoice.id, 'cash'); setShowInvoiceModal(false); }}>✓ Marquer payée</button>
                )}
                <button className="inv-btn inv-print" onClick={handlePrint}>🖨️</button>
                <button className="inv-btn inv-pdf" onClick={() => downloadPDF(selectedInvoice)}>⬇ PDF</button>
              </div>

              <div style={{ textAlign:'center', fontSize:11, color:'#cbd5e1', marginTop:16 }}>
                Généré par MediPlan Pro · mediplan-pro-1.vercel.app
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          MODAL NOUVELLE FACTURE
      ═══════════════════════════════════════════════════════════════════ */}
      <Modal isOpen={showNewInvoiceModal} onClose={() => setShowNewInvoiceModal(false)} title="Nouvelle facture" size="lg">
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Patient *</label>
            <select value={formData.patientId} onChange={(e) => setFormData(prev => ({ ...prev, patientId: e.target.value }))} className="input-field w-full">
              <option value="">-- Sélectionner un patient --</option>
              {patients.map(p => <option key={p.id} value={p.id}>{p.firstName} {p.lastName} - {p.phone}</option>)}
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-slate-700">Articles *</label>
              <button type="button" onClick={handleAddItem} className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
                <Plus size={16} /> Ajouter
              </button>
            </div>
            <div className="space-y-3">
              {formData.items.map((item, index) => (
                <div key={index} className="p-3 bg-slate-50 rounded-xl space-y-3">
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">Description</label>
                    <input type="text" placeholder="Ex: Consultation, Séance..." value={item.description}
                      onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none" />
                  </div>
                  <div className="flex gap-3 items-end">
                    <div className="flex-1">
                      <label className="text-xs text-slate-500 mb-1 block">Quantité</label>
                      <input type="number" placeholder="1" min="1" value={item.quantity}
                        onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                        className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm text-center focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none" />
                    </div>
                    <div className="flex-1">
                      <label className="text-xs text-slate-500 mb-1 block">Prix (DH)</label>
                      <input type="number" placeholder="300" min="0" step="0.01" value={item.unitPrice}
                        onChange={(e) => handleItemChange(index, 'unitPrice', e.target.value)}
                        className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm text-right focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none" />
                    </div>
                    <div className="w-24 text-right">
                      <p className="text-xs text-slate-500">Total</p>
                      <p className="font-bold text-slate-800">{formatCurrency((parseInt(item.quantity) || 0) * (parseFloat(item.unitPrice) || 0))}</p>
                    </div>
                    {formData.items.length > 1 && (
                      <button type="button" onClick={() => handleRemoveItem(index)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={18} /></button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 bg-primary-50 border border-primary-200 rounded-xl">
            <div className="flex justify-between items-center">
              <span className="font-medium text-primary-700">Total Facture</span>
              <span className="text-2xl font-bold text-primary-600">{formatCurrency(calculateTotal())}</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Notes (optionnel)</label>
            <textarea value={formData.notes} onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))} className="input-field w-full" rows="2" placeholder="Ajouter des notes..." />
          </div>

          <div className="flex gap-3 pt-4 border-t border-slate-200">
            <button type="button" onClick={() => setShowNewInvoiceModal(false)} className="btn-secondary flex-1">Annuler</button>
            <button type="button" onClick={handleCreateInvoice} className="btn-primary flex-1 flex items-center justify-center gap-2">
              <FileText size={18} /> Créer
            </button>
          </div>
        </div>
      </Modal>

    </div>
  );
}
