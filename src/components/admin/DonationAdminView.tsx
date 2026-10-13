'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';
import {
  CreditCard,
  Plus,
  Search,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Wallet,
  Building,
  Printer,
  ArrowUpRight,
  Filter,
  Trash2,
  Edit,
  Download,
  UploadCloud,
  FileSpreadsheet,
  Layers,
  Sparkles,
  Check,
  X,
  Clock,
  RotateCcw,
  Users,
} from 'lucide-react';
import { PrintableReceiptModal } from '../donations/PrintableReceiptModal';
import {
  downloadIflahFundTemplate,
  parseIflahFundExcel,
  validateIflahFundRows,
  exportIflahFundLedger,
  type ValidatedIflahFundImportResult,
} from '../../utils/excel';
import type {
  AlumniDonation,
  AlumniDonationCycle,
  Alumni,
  IFLAHFundLevel,
  AlumniPaymentRecord,
} from '../../types';

export const DonationAdminView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'ledger' | 'cycles' | 'excel'>('ledger');
  const [donations, setDonations] = useState<AlumniDonation[]>([]);
  const [cycles, setCycles] = useState<AlumniDonationCycle[]>([]);
  const [currentCycle, setCurrentCycle] = useState<AlumniDonationCycle | null>(null);
  const [selectedCycleId, setSelectedCycleId] = useState('ALL');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'UNPAID' | 'PARTIAL' | 'PAID'>('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalAlumni: 0,
    paidCount: 0,
    partialCount: 0,
    unpaidCount: 0,
    totalCollected: 0,
    totalTarget: 0,
  });

  const [allAlumni, setAllAlumni] = useState<Alumni[]>([]);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // ==========================================
  // ADD / RECORD PAYMENT STATE
  // ==========================================
  const [showLogModal, setShowLogModal] = useState(false);
  const [selectedAlumniId, setSelectedAlumniId] = useState('');
  const [selectedPaymentCycleId, setSelectedPaymentCycleId] = useState('');
  const [selectedLevelName, setSelectedLevelName] = useState("Rabee'");
  const [amount, setAmount] = useState('600');
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [transactionRef, setTransactionRef] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ==========================================
  // EDIT PAYMENT STATE
  // ==========================================
  const [showEditPaymentModal, setShowEditPaymentModal] = useState(false);
  const [editingPayment, setEditingPayment] = useState<AlumniPaymentRecord | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [editLevelName, setEditLevelName] = useState('');
  const [editPaymentMethod, setEditPaymentMethod] = useState('UPI');
  const [editTransactionRef, setEditTransactionRef] = useState('');
  const [editPaymentDate, setEditPaymentDate] = useState('');
  const [editNotes, setEditNotes] = useState('');

  // ==========================================
  // DELETE PAYMENT STATE
  // ==========================================
  const [paymentToDelete, setPaymentToDelete] = useState<AlumniPaymentRecord | null>(null);
  const [showDeletePaymentModal, setShowDeletePaymentModal] = useState(false);

  // ==========================================
  // VIEW PAYMENTS DRAWER / MODAL
  // ==========================================
  const [viewingDonation, setViewingDonation] = useState<AlumniDonation | null>(null);

  // ==========================================
  // RECEIPT MODAL
  // ==========================================
  const [selectedReceiptDonation, setSelectedReceiptDonation] = useState<AlumniDonation | null>(null);

  // ==========================================
  // MANAGE CYCLES & LEVELS STATE
  // ==========================================
  const [showCycleModal, setShowCycleModal] = useState(false);
  const [editingCycle, setEditingCycle] = useState<AlumniDonationCycle | null>(null);
  const [cycleYear, setCycleYear] = useState('2026-2027');
  const [cycleLabel, setCycleLabel] = useState('2026-2027 IFLAH Fund Collection');
  const [cycleIsCurrent, setCycleIsCurrent] = useState(true);
  const [cycleLevels, setCycleLevels] = useState<IFLAHFundLevel[]>([
    { id: 'rabee', name: "Rabee'", target: 600 },
    { id: 'ramadan', name: 'Ramadan', target: 600 },
  ]);
  const [newLevelName, setNewLevelName] = useState('');
  const [newLevelTarget, setNewLevelTarget] = useState('600');
  const [cycleToDelete, setCycleToDelete] = useState<AlumniDonationCycle | null>(null);

  // ==========================================
  // EXCEL IMPORT STATE
  // ==========================================
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [excelFileName, setExcelFileName] = useState<string | null>(null);
  const [excelValidation, setExcelValidation] = useState<ValidatedIflahFundImportResult | null>(null);
  const [isProcessingExcel, setIsProcessingExcel] = useState(false);
  const [isImportingExcel, setIsImportingExcel] = useState(false);
  const [excelImportResult, setExcelImportResult] = useState<{ imported: number; skipped: number; errors: string[] } | null>(null);

  // Load Donations and Cycles
  const fetchDonations = () => {
    setIsLoading(true);
    const query = new URLSearchParams();
    if (selectedCycleId !== 'ALL') query.append('cycleId', selectedCycleId);

    fetch(`/api/donations?${query.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setDonations(data.donations || []);
          setCycles(data.cycles || []);
          setCurrentCycle(data.currentCycle || null);
          if (data.stats) setStats(data.stats);
        }
      })
      .catch((e) => console.error('Fetch admin donations error:', e))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchDonations();
  }, [selectedCycleId]);

  // Load all alumni
  useEffect(() => {
    fetch('/api/alumni')
      .then((r) => r.json())
      .then((d) => {
        if (d.alumni) setAllAlumni(d.alumni);
      })
      .catch(() => {});
  }, []);

  // Update amount preset when level selection changes in Payment Modal
  const handleLevelChange = (level: string) => {
    setSelectedLevelName(level);
    const activeLevels = currentCycle?.levels || [
      { id: 'rabee', name: "Rabee'", target: 600 },
      { id: 'ramadan', name: 'Ramadan', target: 600 },
    ];
    if (level === 'Both') {
      const sum = activeLevels.reduce((s, l) => s + (l.target || 0), 0);
      setAmount(String(sum));
    } else {
      const found = activeLevels.find((l) => l.name.toLowerCase() === level.toLowerCase());
      if (found) {
        setAmount(String(found.target));
      }
    }
  };

  // Open Log Payment Modal
  const handleOpenLogModal = (alumnusId?: string) => {
    if (currentCycle) {
      setSelectedPaymentCycleId(currentCycle.id);
    } else if (cycles.length > 0) {
      setSelectedPaymentCycleId(cycles[0].id);
    }

    if (alumnusId) {
      setSelectedAlumniId(alumnusId);
    } else if (allAlumni.length > 0 && !selectedAlumniId) {
      setSelectedAlumniId(allAlumni[0].id);
    }

    setSelectedLevelName("Rabee'");
    setAmount('600');
    setTransactionRef('');
    setNotes('');
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setShowLogModal(true);
  };

  // Submit New Payment
  const handleLogPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAlumniId || !selectedPaymentCycleId || !amount) return;

    setIsSubmitting(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/donations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          alumniId: selectedAlumniId,
          cycleId: selectedPaymentCycleId,
          amount: parseFloat(amount),
          levelName: selectedLevelName,
          paymentMethod,
          transactionRef: transactionRef.trim() || undefined,
          notes: notes.trim() || undefined,
          paymentDate,
          recordedByName: 'Finance Office',
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to log payment');

      setSuccessMsg(`Payment of ₹${amount} (${selectedLevelName}) recorded successfully! Receipt: ${data.receiptNumber}`);
      setShowLogModal(false);
      fetchDonations();
    } catch (err: any) {
      setErrorMsg(`Error recording payment: ${err?.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Edit Payment Modal
  const handleOpenEditPayment = (payment: AlumniPaymentRecord) => {
    setEditingPayment(payment);
    setEditAmount(String(payment.amount));
    // extract level from notes if present
    const match = (payment.notes || '').match(/\[Level:\s*([^\]]+)\]/i);
    setEditLevelName(match ? match[1] : "Rabee'");
    setEditPaymentMethod(payment.paymentMethod || 'UPI');
    setEditTransactionRef(payment.transactionRef || '');
    setEditPaymentDate(
      payment.paymentDate ? new Date(payment.paymentDate).toISOString().split('T')[0] : ''
    );
    setEditNotes((payment.notes || '').replace(/\[Level:\s*[^\]]+\]/i, '').trim());
    setShowEditPaymentModal(true);
  };

  // Submit Edit Payment
  const handleSaveEditPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPayment) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/donations', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentId: editingPayment.id,
          amount: parseFloat(editAmount),
          levelName: editLevelName,
          paymentMethod: editPaymentMethod,
          transactionRef: editTransactionRef.trim() || undefined,
          notes: editNotes.trim() || undefined,
          paymentDate: editPaymentDate,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update payment');

      setSuccessMsg('Payment updated successfully!');
      setShowEditPaymentModal(false);
      if (viewingDonation) {
        // Refresh viewing donation payments
        const updatedPayments = (viewingDonation.payments || []).map((p) =>
          p.id === editingPayment.id ? data.payment : p
        );
        setViewingDonation({ ...viewingDonation, payments: updatedPayments });
      }
      fetchDonations();
    } catch (err: any) {
      alert(`Error updating payment: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Confirm Delete Payment
  const handleDeletePayment = async () => {
    if (!paymentToDelete) return;
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/donations?paymentId=${encodeURIComponent(paymentToDelete.id)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete payment');

      setSuccessMsg(`Payment of ₹${paymentToDelete.amount} deleted.`);
      setShowDeletePaymentModal(false);
      setPaymentToDelete(null);
      if (viewingDonation) {
        setViewingDonation({
          ...viewingDonation,
          payments: (viewingDonation.payments || []).filter((p) => p.id !== paymentToDelete.id),
        });
      }
      fetchDonations();
    } catch (err: any) {
      alert(`Error deleting payment: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Create/Edit Cycle Modal
  const handleOpenCycleModal = (cycle?: AlumniDonationCycle) => {
    if (cycle) {
      setEditingCycle(cycle);
      setCycleYear(cycle.academicYear);
      setCycleLabel(cycle.label);
      setCycleIsCurrent(cycle.isCurrent);
      setCycleLevels(
        cycle.levels || [
          { id: 'rabee', name: "Rabee'", target: 600 },
          { id: 'ramadan', name: 'Ramadan', target: 600 },
        ]
      );
    } else {
      const nextYear = new Date().getFullYear();
      setEditingCycle(null);
      setCycleYear(`${nextYear}-${nextYear + 1}`);
      setCycleLabel(`${nextYear}-${nextYear + 1} IFLAH Fund Collection`);
      setCycleIsCurrent(false);
      setCycleLevels([
        { id: 'rabee', name: "Rabee'", target: 600 },
        { id: 'ramadan', name: 'Ramadan', target: 600 },
      ]);
    }
    setNewLevelName('');
    setNewLevelTarget('600');
    setShowCycleModal(true);
  };

  // Add Level to Cycle
  const handleAddLevel = () => {
    if (!newLevelName.trim() || !newLevelTarget) return;
    const targetNum = parseFloat(newLevelTarget);
    if (isNaN(targetNum) || targetNum <= 0) return;

    const id = newLevelName.toLowerCase().replace(/[^a-z0-9]/g, '_') || `lvl_${Date.now()}`;
    setCycleLevels([...cycleLevels, { id, name: newLevelName.trim(), target: targetNum }]);
    setNewLevelName('');
    setNewLevelTarget('600');
  };

  // Delete Level from Cycle
  const handleDeleteLevel = (index: number) => {
    if (cycleLevels.length <= 1) {
      alert('A collection cycle must contain at least one instalment level.');
      return;
    }
    setCycleLevels(cycleLevels.filter((_, i) => i !== index));
  };

  // Save Cycle (POST or PUT)
  const handleSaveCycle = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const url = '/api/donations/cycles';
      const method = editingCycle ? 'PUT' : 'POST';
      const body = {
        id: editingCycle?.id,
        academicYear: cycleYear,
        label: cycleLabel,
        isCurrent: cycleIsCurrent,
        levels: cycleLevels,
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save cycle');

      setSuccessMsg(data.message || 'Collection cycle saved successfully!');
      setShowCycleModal(false);
      fetchDonations();
    } catch (err: any) {
      alert(`Error saving cycle: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Cycle
  const handleDeleteCycle = async () => {
    if (!cycleToDelete) return;
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/donations/cycles?id=${encodeURIComponent(cycleToDelete.id)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete cycle');

      setSuccessMsg('Collection cycle deleted successfully.');
      setCycleToDelete(null);
      fetchDonations();
    } catch (err: any) {
      alert(`Error deleting cycle: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ==========================================
  // EXCEL IMPORT HANDLERS
  // ==========================================
  const handleExcelFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setExcelFileName(file.name);
    setIsProcessingExcel(true);
    setExcelImportResult(null);

    try {
      const rawRows = await parseIflahFundExcel(file);
      const knownAdmissions = new Set(allAlumni.map((a) => a.admissionNumber.trim()));
      const validated = validateIflahFundRows(rawRows, knownAdmissions);
      setExcelValidation(validated);
    } catch (err: any) {
      alert(`Failed to parse Excel file: ${err.message}`);
      setExcelValidation(null);
    } finally {
      setIsProcessingExcel(false);
    }
  };

  const handleExecuteExcelImport = async () => {
    if (!excelValidation || excelValidation.validRows.length === 0) return;

    setIsImportingExcel(true);
    setExcelImportResult(null);

    try {
      const targetCycleId = currentCycle?.id || cycles[0]?.id;
      const res = await fetch('/api/donations/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cycleId: targetCycleId,
          rows: excelValidation.validRows,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Import failed');

      setExcelImportResult({
        imported: data.importedCount,
        skipped: data.skippedCount,
        errors: data.errors || [],
      });
      setExcelValidation(null);
      setExcelFileName(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      fetchDonations();
    } catch (err: any) {
      alert(`Excel import error: ${err.message}`);
    } finally {
      setIsImportingExcel(false);
    }
  };

  // Filter donations for display
  const filteredDonations = donations.filter((d) => {
    // Search query
    if (search.trim()) {
      const q = search.toLowerCase();
      const match =
        d.alumniName.toLowerCase().includes(q) ||
        d.admissionNumber.toLowerCase().includes(q) ||
        (d.receiptNumber && d.receiptNumber.toLowerCase().includes(q)) ||
        (d.alumni?.phone && d.alumni.phone.includes(q));
      if (!match) return false;
    }

    // Status filter
    const isCompleted = d.status === 'COMPLETED' || d.paidAmount >= d.targetAmount;
    const isPartial = d.status === 'PARTIAL' && d.paidAmount > 0;
    const isUnpaid = !isCompleted && !isPartial;

    if (statusFilter === 'PAID') return isCompleted;
    if (statusFilter === 'PARTIAL') return isPartial;
    if (statusFilter === 'UNPAID') return isUnpaid;

    return true;
  });

  const totalCollectedInView = filteredDonations.reduce((sum, d) => sum + (d.paidAmount || 0), 0);

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>IFLAH Fund Collection Management</span>
            <Badge variant="primary" size="sm">Superadmin Finance</Badge>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Configure two-time collection instalments (Rabee&apos; &amp; Ramadan), record payments, import Excel, and monitor payment status.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => handleOpenLogModal()}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-all transform active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Record Payment</span>
          </button>

          <button
            type="button"
            onClick={() => exportIflahFundLedger(donations, currentCycle?.label || 'IFLAH_Fund')}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-xs font-semibold"
            title="Export all records to Excel (.xlsx)"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>Export Excel</span>
          </button>
        </div>
      </div>

      {/* Primary Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 text-xs font-bold">
        <button
          onClick={() => setActiveTab('ledger')}
          className={`flex items-center gap-2 px-4 py-2.5 border-b-2 transition-all ${
            activeTab === 'ledger'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Collection Ledger ({stats.totalAlumni} Alumni)</span>
        </button>

        <button
          onClick={() => setActiveTab('cycles')}
          className={`flex items-center gap-2 px-4 py-2.5 border-b-2 transition-all ${
            activeTab === 'cycles'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Cycles &amp; Instalment Levels (Rabee&apos; / Ramadan)</span>
        </button>

        <button
          onClick={() => setActiveTab('excel')}
          className={`flex items-center gap-2 px-4 py-2.5 border-b-2 transition-all ${
            activeTab === 'excel'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Excel Bulk Import</span>
        </button>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 flex items-center justify-between gap-2.5 text-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-600 hover:text-emerald-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 flex items-center justify-between gap-2.5 text-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="text-rose-600 hover:text-rose-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 1: COLLECTION LEDGER & DEFAULTERS */}
      {/* ========================================================================= */}
      {activeTab === 'ledger' && (
        <div className="space-y-6">
          {/* Summary Overview Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Total Collected</p>
              <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1 font-mono">
                ₹{stats.totalCollected.toLocaleString('en-IN')}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Target: ₹{stats.totalTarget.toLocaleString('en-IN')}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
                  Unpaid (Defaulters)
                </p>
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              </div>
              <p className="text-xl font-black text-rose-700 dark:text-rose-300 mt-1">
                {stats.unpaidCount} Alumni
              </p>
              <p className="text-[10px] text-rose-600/80 dark:text-rose-400 mt-0.5">
                🔴 Payment pending
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 shadow-sm">
              <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                Partially Paid
              </p>
              <p className="text-xl font-bold text-amber-700 dark:text-amber-300 mt-1">
                {stats.partialCount} Alumni
              </p>
              <p className="text-[10px] text-amber-600/80 dark:text-amber-400 mt-0.5">
                🟠 1 of 2 levels paid
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 shadow-sm">
              <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                Fully Cleared
              </p>
              <p className="text-xl font-bold text-emerald-700 dark:text-emerald-300 mt-1">
                {stats.paidCount} Alumni
              </p>
              <p className="text-[10px] text-emerald-600/80 dark:text-emerald-400 mt-0.5">
                🟢 Rabee&apos; &amp; Ramadan paid
              </p>
            </div>
          </div>

          {/* Filter & Search Bar */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search alumni, ad.no, phone, or receipt..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none"
              />
            </div>

            {/* Quick Status Filter Tabs */}
            <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
              <button
                onClick={() => setStatusFilter('ALL')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
                  statusFilter === 'ALL'
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                All ({donations.length})
              </button>

              <button
                onClick={() => setStatusFilter('UNPAID')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg font-bold transition-colors ${
                  statusFilter === 'UNPAID'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 hover:bg-rose-100'
                }`}
              >
                <span>🔴 Unpaid ({stats.unpaidCount})</span>
              </button>

              <button
                onClick={() => setStatusFilter('PARTIAL')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg font-bold transition-colors ${
                  statusFilter === 'PARTIAL'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 hover:bg-amber-100'
                }`}
              >
                <span>🟠 Partial ({stats.partialCount})</span>
              </button>

              <button
                onClick={() => setStatusFilter('PAID')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg font-bold transition-colors ${
                  statusFilter === 'PAID'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 hover:bg-emerald-100'
                }`}
              >
                <span>🟢 Paid ({stats.paidCount})</span>
              </button>
            </div>

            {/* Cycle Selector */}
            <div className="flex items-center gap-2 w-full md:w-auto">
              <select
                value={selectedCycleId}
                onChange={(e) => setSelectedCycleId(e.target.value)}
                className="w-full md:w-56 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 outline-none"
              >
                <option value="ALL">All Cycles</option>
                {cycles.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Table of All Alumni Donations */}
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
            {isLoading ? (
              <div className="p-12 text-center text-xs text-slate-400">Loading collection ledger...</div>
            ) : filteredDonations.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-400">No alumni records found matching filter.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200/60 dark:border-slate-800">
                    <tr>
                      <th className="py-3 px-4">Alumnus Name &amp; Contact</th>
                      <th className="py-3 px-4">Ad.No</th>
                      <th className="py-3 px-4">Instalments Status</th>
                      <th className="py-3 px-4">Target (₹)</th>
                      <th className="py-3 px-4">Paid (₹)</th>
                      <th className="py-3 px-4">Due (₹)</th>
                      <th className="py-3 px-4">Overall Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                    {filteredDonations.map((d) => {
                      const isCompleted = d.status === 'COMPLETED' || d.paidAmount >= d.targetAmount;
                      const isPartial = d.status === 'PARTIAL' && d.paidAmount > 0;
                      const isUnpaid = !isCompleted && !isPartial;

                      return (
                        <tr
                          key={d.id}
                          className={`hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors ${
                            isUnpaid ? 'bg-rose-50/10 dark:bg-rose-950/10' : ''
                          }`}
                        >
                          <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                            <div>
                              <span>{d.alumniName}</span>
                              {d.alumni?.phone && (
                                <span className="block text-[11px] text-slate-400 font-normal">
                                  {d.alumni.phone}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 font-mono text-slate-500">{d.admissionNumber}</td>
                          <td className="py-3.5 px-4">
                            {d.levelsBreakdown && d.levelsBreakdown.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {d.levelsBreakdown.map((l) => (
                                  <span
                                    key={l.levelId}
                                    className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                                      l.isPaid
                                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
                                        : 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300'
                                    }`}
                                  >
                                    {l.levelName}: {l.isPaid ? 'Paid ✓' : `Due ₹${l.balance}`}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-slate-400 text-[11px]">Two-time Target</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 font-mono font-medium">₹{d.targetAmount}</td>
                          <td className="py-3.5 px-4 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                            ₹{d.paidAmount}
                          </td>
                          <td className="py-3.5 px-4 font-mono font-bold text-rose-600 dark:text-rose-400">
                            ₹{d.balanceAmount}
                          </td>
                          <td className="py-3.5 px-4">
                            {isCompleted ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                                🟢 Cleared
                              </span>
                            ) : isPartial ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                                🟠 Partial
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 ring-1 ring-rose-400/40 animate-pulse">
                                🔴 Unpaid Due
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Quick Record Payment */}
                              <button
                                type="button"
                                onClick={() => handleOpenLogModal(d.alumniId)}
                                className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 text-[11px] font-bold"
                                title="Add payment for this alumnus"
                              >
                                + Pay
                              </button>

                              {/* View / Edit logged payments */}
                              {d.payments && d.payments.length > 0 && (
                                <button
                                  type="button"
                                  onClick={() => setViewingDonation(d)}
                                  className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 text-[11px] font-bold"
                                  title="View and edit logged payments"
                                >
                                  Ledger ({d.payments.length})
                                </button>
                              )}

                              {/* Print Receipt */}
                              {d.paidAmount > 0 && (
                                <button
                                  type="button"
                                  onClick={() => setSelectedReceiptDonation(d)}
                                  className="p-1 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                                  title="Print Official Receipt"
                                >
                                  <Printer className="w-3.5 h-3.5" />
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
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: MANAGE CYCLES & INSTALMENT LEVELS */}
      {/* ========================================================================= */}
      {activeTab === 'cycles' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Collection Cycles &amp; Level Configurations
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Configure payment targets for Rabee&apos; and Ramadan, or add any custom collection levels.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleOpenCycleModal()}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Cycle</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {cycles.map((c) => {
              const levels = c.levels || [
                { id: 'rabee', name: "Rabee'", target: 600 },
                { id: 'ramadan', name: 'Ramadan', target: 600 },
              ];
              const totalTarget = levels.reduce((s, l) => s + (l.target || 0), 0);

              return (
                <div
                  key={c.id}
                  className={`p-5 rounded-2xl border shadow-sm space-y-4 bg-white dark:bg-slate-900 ${
                    c.isCurrent
                      ? 'border-indigo-400 dark:border-indigo-600 ring-2 ring-indigo-500/10'
                      : 'border-slate-200/80 dark:border-slate-800'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">{c.label}</h4>
                        {c.isCurrent && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                            Active Cycle
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Academic Year: <strong>{c.academicYear}</strong> • Total Target: <strong>₹{totalTarget}</strong>
                      </p>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleOpenCycleModal(c)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                        title="Edit Cycle & Levels"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setCycleToDelete(c)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                        title="Delete Cycle"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Configured Levels */}
                  <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Instalment Levels ({levels.length})
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      {levels.map((lvl) => (
                        <div
                          key={lvl.id}
                          className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-xs"
                        >
                          <span className="font-semibold text-slate-800 dark:text-slate-200">{lvl.name}</span>
                          <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">₹{lvl.target}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: EXCEL BULK IMPORT */}
      {/* ========================================================================= */}
      {activeTab === 'excel' && (
        <div className="space-y-6 max-w-3xl">
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>Bulk Import Payments from Excel</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Upload spreadsheets from offline collection drives or UPI statements. The system matches alumni by Admission Number and attributes payments to Rabee&apos; or Ramadan.
              </p>
            </div>

            {/* Template Download */}
            <div className="p-4 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div>
                <p className="font-bold text-indigo-900 dark:text-indigo-200">Official IFLAH Fund Excel Template</p>
                <p className="text-[11px] text-indigo-700 dark:text-indigo-300 mt-0.5">
                  Includes demo rows for Rabee&apos; (₹600), Ramadan (₹600), and full annual contributions.
                </p>
              </div>
              <button
                type="button"
                onClick={downloadIflahFundTemplate}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shrink-0 shadow-sm"
              >
                <Download className="w-4 h-4" />
                <span>Download Sample Template</span>
              </button>
            </div>

            {/* Dropzone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-400 rounded-2xl p-8 text-center cursor-pointer transition-colors bg-slate-50/50 dark:bg-slate-800/20"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleExcelFileSelect}
                className="hidden"
              />
              <UploadCloud className="w-10 h-10 text-slate-400 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {excelFileName ? excelFileName : 'Click to select or drop your Excel spreadsheet (.xlsx, .xls)'}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                Supported columns: Admission No, Level (Rabee / Ramadan / Both), Amount, Payment Mode, Ref, Date
              </p>
            </div>

            {/* Live Validation Results */}
            {excelValidation && (
              <div className="space-y-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 font-bold">
                      ✓ {excelValidation.validRows.length} Valid Rows
                    </span>
                    {excelValidation.invalidRows.length > 0 && (
                      <span className="px-2.5 py-1 rounded-lg bg-rose-100 text-rose-800 font-bold">
                        ⚠️ {excelValidation.invalidRows.length} Invalid Rows
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    disabled={isImportingExcel || excelValidation.validRows.length === 0}
                    onClick={handleExecuteExcelImport}
                    className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold disabled:opacity-50 shadow-md shadow-emerald-600/20"
                  >
                    <span>{isImportingExcel ? 'Importing...' : 'Confirm & Execute Import'}</span>
                    <ArrowUpRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Preview Table */}
                <div className="max-h-60 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 font-semibold sticky top-0">
                      <tr>
                        <th className="p-2">Ad.No</th>
                        <th className="p-2">Name</th>
                        <th className="p-2">Level</th>
                        <th className="p-2">Amount</th>
                        <th className="p-2">Mode</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {excelValidation.validRows.map((r, i) => (
                        <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                          <td className="p-2 font-mono font-bold">{r.admissionNumber}</td>
                          <td className="p-2">{r.name || '—'}</td>
                          <td className="p-2 font-semibold text-indigo-600">{r.levelName}</td>
                          <td className="p-2 font-mono font-bold text-emerald-600">₹{r.amount}</td>
                          <td className="p-2 text-slate-500">{r.paymentMethod}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Import Result Notification */}
            {excelImportResult && (
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-xs space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Bulk Import Successfully Completed!</span>
                </p>
                <p>
                  Imported <strong>{excelImportResult.imported}</strong> payment records into the ledger.
                  {excelImportResult.skipped > 0 && ` (Skipped ${excelImportResult.skipped} rows)`}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: RECORD INCOMING PAYMENT */}
      {/* ========================================================================= */}
      <Modal
        isOpen={showLogModal}
        onClose={() => setShowLogModal(false)}
        title="Record Incoming IFLAH Fund Contribution"
        maxWidth="md"
      >
        <form onSubmit={handleLogPayment} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Select Alumnus / Contributor *
            </label>
            <select
              required
              value={selectedAlumniId}
              onChange={(e) => setSelectedAlumniId(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 outline-none"
            >
              {allAlumni.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} (Ad.No: {a.admissionNumber} • Batch {a.passoutBatchYear})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Collection Cycle *
            </label>
            <select
              required
              value={selectedPaymentCycleId}
              onChange={(e) => setSelectedPaymentCycleId(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 outline-none"
            >
              {cycles.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label} (Target: ₹{c.defaultTarget})
                </option>
              ))}
            </select>
          </div>

          {/* Level Preset Buttons */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Select Instalment Level *
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {(currentCycle?.levels || [
                { id: 'rabee', name: "Rabee'", target: 600 },
                { id: 'ramadan', name: 'Ramadan', target: 600 },
              ]).map((lvl) => (
                <button
                  type="button"
                  key={lvl.id}
                  onClick={() => handleLevelChange(lvl.name)}
                  className={`px-3 py-1.5 rounded-lg font-bold border transition-colors ${
                    selectedLevelName === lvl.name
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {lvl.name} (₹{lvl.target})
                </button>
              ))}
              <button
                type="button"
                onClick={() => handleLevelChange('Both')}
                className={`px-3 py-1.5 rounded-lg font-bold border transition-colors ${
                  selectedLevelName === 'Both'
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                }`}
              >
                Both Levels (Full)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Amount Paid (₹) *
              </label>
              <input
                type="number"
                required
                min="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 outline-none font-bold font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Payment Mode
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 outline-none"
              >
                <option value="UPI">UPI (GPay / PhonePe / Paytm)</option>
                <option value="Bank Transfer">Bank Transfer (NEFT / IMPS)</option>
                <option value="Cash">Cash in Hand</option>
                <option value="Cheque">Cheque</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Payment Date
              </label>
              <input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Transaction Ref / UTR No (Optional)
              </label>
              <input
                type="text"
                value={transactionRef}
                onChange={(e) => setTransactionRef(e.target.value)}
                placeholder="e.g. 418290123847"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 outline-none font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Remarks / Notes
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Paid during regional chapter gathering"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setShowLogModal(false)}
              className="px-4 py-2 font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md shadow-indigo-600/20 disabled:opacity-50"
            >
              {isSubmitting ? 'Recording...' : 'Record Payment & Generate Receipt'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL: VIEW & MANAGE LOGGED PAYMENTS FOR AN ALUMNUS */}
      {/* ========================================================================= */}
      {viewingDonation && (
        <Modal
          isOpen={!!viewingDonation}
          onClose={() => setViewingDonation(null)}
          title={`Payment History: ${viewingDonation.alumniName} (Ad.No: ${viewingDonation.admissionNumber})`}
          maxWidth="lg"
        >
          <div className="space-y-4 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div>
                <span className="text-slate-400 font-semibold block">Total Contributed</span>
                <span className="text-base font-bold text-emerald-600 font-mono">
                  ₹{viewingDonation.paidAmount} / ₹{viewingDonation.targetAmount}
                </span>
              </div>
              <div>
                <span className="text-slate-400 font-semibold block">Remaining Balance</span>
                <span className="text-base font-bold text-rose-600 font-mono">
                  ₹{viewingDonation.balanceAmount}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setViewingDonation(null);
                  handleOpenLogModal(viewingDonation.alumniId);
                }}
                className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white font-bold"
              >
                + Add Another Payment
              </button>
            </div>

            {(!viewingDonation.payments || viewingDonation.payments.length === 0) ? (
              <p className="text-slate-400 p-4 text-center">No payment transactions logged yet.</p>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800 border rounded-xl overflow-hidden">
                {viewingDonation.payments.map((p) => (
                  <div key={p.id} className="p-3.5 flex items-center justify-between gap-3 hover:bg-slate-50/50">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold font-mono text-emerald-600">₹{p.amount}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-800">
                          {p.paymentMethod}
                        </span>
                        {p.receiptNumber && (
                          <span className="text-[10px] font-mono text-slate-400">
                            {p.receiptNumber}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {p.notes || 'Contribution'} •{' '}
                        {p.paymentDate ? new Date(p.paymentDate).toLocaleDateString('en-IN') : '—'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenEditPayment(p)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-slate-100"
                        title="Edit Payment"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setPaymentToDelete(p);
                          setShowDeletePaymentModal(true);
                        }}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50"
                        title="Delete Payment"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* ========================================================================= */}
      {/* MODAL: EDIT PAYMENT */}
      {/* ========================================================================= */}
      <Modal
        isOpen={showEditPaymentModal}
        onClose={() => setShowEditPaymentModal(false)}
        title="Edit Payment Transaction"
        maxWidth="md"
      >
        <form onSubmit={handleSaveEditPayment} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Amount (₹) *
              </label>
              <input
                type="number"
                required
                min="1"
                value={editAmount}
                onChange={(e) => setEditAmount(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 outline-none font-bold font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Instalment Level
              </label>
              <input
                type="text"
                value={editLevelName}
                onChange={(e) => setEditLevelName(e.target.value)}
                placeholder="e.g. Rabee' or Ramadan"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Payment Mode
              </label>
              <select
                value={editPaymentMethod}
                onChange={(e) => setEditPaymentMethod(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 outline-none"
              >
                <option value="UPI">UPI</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Cash">Cash</option>
                <option value="Cheque">Cheque</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Payment Date
              </label>
              <input
                type="date"
                value={editPaymentDate}
                onChange={(e) => setEditPaymentDate(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Transaction / UTR Ref
            </label>
            <input
              type="text"
              value={editTransactionRef}
              onChange={(e) => setEditTransactionRef(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 outline-none font-mono"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Remarks / Notes
            </label>
            <input
              type="text"
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setShowEditPaymentModal(false)}
              className="px-4 py-2 font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL: DELETE PAYMENT CONFIRMATION */}
      {/* ========================================================================= */}
      <Modal
        isOpen={showDeletePaymentModal}
        onClose={() => setShowDeletePaymentModal(false)}
        title="Delete Payment Transaction"
        maxWidth="sm"
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-600 dark:text-slate-300">
            Are you sure you want to delete this payment of{' '}
            <strong className="text-rose-600 font-bold">₹{paymentToDelete?.amount}</strong>?
            The alumnus balance and status will be automatically recalculated.
          </p>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setShowDeletePaymentModal(false)}
              className="px-4 py-2 font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleDeletePayment}
              className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-md shadow-rose-600/20"
            >
              {isSubmitting ? 'Deleting...' : 'Delete Payment'}
            </button>
          </div>
        </div>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL: CREATE / EDIT CYCLE & CONFIGURE LEVELS */}
      {/* ========================================================================= */}
      <Modal
        isOpen={showCycleModal}
        onClose={() => setShowCycleModal(false)}
        title={editingCycle ? 'Edit Collection Cycle & Levels' : 'Create New Collection Cycle'}
        maxWidth="lg"
      >
        <form onSubmit={handleSaveCycle} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Academic Year *
              </label>
              <input
                type="text"
                required
                value={cycleYear}
                onChange={(e) => setCycleYear(e.target.value)}
                placeholder="e.g. 2026-2027"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Cycle Label / Title *
              </label>
              <input
                type="text"
                required
                value={cycleLabel}
                onChange={(e) => setCycleLabel(e.target.value)}
                placeholder="e.g. 2026-2027 IFLAH Fund Collection"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 outline-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="isCurrentCycle"
              checked={cycleIsCurrent}
              onChange={(e) => setCycleIsCurrent(e.target.checked)}
              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
            />
            <label htmlFor="isCurrentCycle" className="font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
              Set as Current Active Collection Cycle
            </label>
          </div>

          {/* DYNAMIC LEVELS BUILDER */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-900 dark:text-white block">
                  Configured Instalment Levels (Targets)
                </span>
                <span className="text-[11px] text-slate-500">
                  Total Cycle Target: <strong className="text-indigo-600 font-mono">₹{cycleLevels.reduce((s, l) => s + (l.target || 0), 0)}</strong>
                </span>
              </div>
            </div>

            {/* List of current levels */}
            <div className="space-y-2">
              {cycleLevels.map((lvl, index) => (
                <div
                  key={index}
                  className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 font-bold flex items-center justify-center text-[10px]">
                      {index + 1}
                    </span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{lvl.name}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-indigo-600">₹{lvl.target}</span>
                    <button
                      type="button"
                      onClick={() => handleDeleteLevel(index)}
                      className="p-1 rounded text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950"
                      title="Delete this level"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Add Level Form */}
            <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700 flex items-center gap-2">
              <input
                type="text"
                value={newLevelName}
                onChange={(e) => setNewLevelName(e.target.value)}
                placeholder="Level Name (e.g. Shawwal, Term 3)"
                className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 outline-none"
              />
              <input
                type="number"
                min="1"
                value={newLevelTarget}
                onChange={(e) => setNewLevelTarget(e.target.value)}
                placeholder="Target ₹"
                className="w-24 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 outline-none font-mono font-bold"
              />
              <button
                type="button"
                onClick={handleAddLevel}
                className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white font-bold shrink-0"
              >
                + Add Level
              </button>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setShowCycleModal(false)}
              className="px-4 py-2 font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
            >
              {isSubmitting ? 'Saving...' : 'Save Collection Cycle & Levels'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL: DELETE CYCLE CONFIRMATION */}
      {/* ========================================================================= */}
      <Modal
        isOpen={!!cycleToDelete}
        onClose={() => setCycleToDelete(null)}
        title="Delete Collection Cycle"
        maxWidth="sm"
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-600 dark:text-slate-300">
            Are you sure you want to delete the cycle <strong className="text-rose-600">{cycleToDelete?.label}</strong>?
            All associated donation records for this cycle will also be deleted.
          </p>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setCycleToDelete(null)}
              className="px-4 py-2 font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleDeleteCycle}
              className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold"
            >
              {isSubmitting ? 'Deleting...' : 'Delete Cycle'}
            </button>
          </div>
        </div>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL: PRINTABLE RECEIPT */}
      {/* ========================================================================= */}
      <PrintableReceiptModal
        isOpen={!!selectedReceiptDonation}
        onClose={() => setSelectedReceiptDonation(null)}
        donation={selectedReceiptDonation}
      />
    </div>
  );
};
