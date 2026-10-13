'use client';

import React, { useState } from 'react';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';
import {
  Wallet,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowUpRight,
  QrCode,
  CreditCard,
  Building2,
  Copy,
  Check,
  Sparkles,
} from 'lucide-react';

interface DonationProgressCardProps {
  metrics: {
    donationId?: string;
    cycleId: string;
    cycleLabel: string;
    targetAmount: number;
    paidAmount: number;
    balanceAmount: number;
    progressPercent: number;
    status: string;
    lastPaymentDate?: string;
    receiptNumber?: string;
    levelsBreakdown?: {
      levelId: string;
      levelName: string;
      target: number;
      paid: number;
      balance: number;
      isPaid: boolean;
    }[];
  } | null;
  onRefresh?: () => void;
  onViewReceipt?: (receiptNumber: string) => void;
}

export const DonationProgressCard: React.FC<DonationProgressCardProps> = ({
  metrics,
  onRefresh,
  onViewReceipt,
}) => {
  const [showPayModal, setShowPayModal] = useState(false);
  const [copiedUpi, setCopiedUpi] = useState(false);

  if (!metrics) {
    return (
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm animate-pulse">
        <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/3 mb-4" />
        <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded w-1/2 mb-2" />
      </div>
    );
  }

  const {
    cycleLabel,
    targetAmount,
    paidAmount,
    balanceAmount,
    progressPercent,
    status,
    lastPaymentDate,
    receiptNumber,
    levelsBreakdown,
  } = metrics;

  const isCompleted = status === 'COMPLETED' || progressPercent >= 100;
  const isPartial = status === 'PARTIAL' && progressPercent > 0;
  const isUnpaid = !isCompleted && !isPartial;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  return (
    <>
      <div className="p-6 rounded-2xl bg-gradient-to-br from-white via-white to-indigo-50/40 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950/20 border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden">
        {/* Subtle background decoration */}
        <div className="absolute top-0 right-0 -mt-6 -mr-6 w-32 h-32 bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl border flex items-center justify-center shadow-sm ${
              isCompleted
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                : isPartial
                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
            }`}>
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  IFLAH Fund Collection
                </span>
                {isCompleted ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                    🟢 Cleared & Fully Paid
                  </span>
                ) : isPartial ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                    🟠 Partially Paid
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-300 dark:border-rose-700 animate-pulse">
                    🔴 Payment Due / Unpaid
                  </span>
                )}
              </div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                {cycleLabel}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isCompleted && receiptNumber && onViewReceipt && (
              <button
                type="button"
                onClick={() => onViewReceipt(receiptNumber)}
                className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                View Official Receipt
              </button>
            )}
            {!isCompleted && (
              <button
                type="button"
                onClick={() => setShowPayModal(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-all transform active:scale-95"
              >
                <span>Contribute / Pay Now</span>
                <ArrowUpRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Levels Breakdown Pills (Rabee', Ramadan, etc.) */}
        {levelsBreakdown && levelsBreakdown.length > 0 && (
          <div className="mb-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Instalment Breakdown (Two-Time Target)
              </span>
              <span className="text-[11px] text-slate-400">
                Target: {levelsBreakdown.map((l) => `${l.levelName}: ₹${l.target}`).join(' + ')}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {levelsBreakdown.map((lvl) => (
                <div
                  key={lvl.levelId}
                  className={`p-2.5 rounded-lg border flex items-center justify-between text-xs transition-colors ${
                    lvl.isPaid
                      ? 'bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                      : lvl.paid > 0
                      ? 'bg-amber-50/80 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200'
                      : 'bg-rose-50/80 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200'
                  }`}
                >
                  <div>
                    <span className="font-bold block">{lvl.levelName}</span>
                    <span className="text-[10px] opacity-75">
                      Target: ₹{lvl.target}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold block">
                      ₹{lvl.paid}
                    </span>
                    <span className={`text-[10px] font-semibold ${lvl.isPaid ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                      {lvl.isPaid ? 'Paid ✓' : `Due: ₹${lvl.balance}`}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Amount Metrics */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Total Year Target</p>
            <p className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-0.5">
              ₹{targetAmount.toLocaleString('en-IN')}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40">
            <p className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">Paid So Far</p>
            <p className="text-base sm:text-lg font-bold text-emerald-700 dark:text-emerald-300 mt-0.5">
              ₹{paidAmount.toLocaleString('en-IN')}
            </p>
          </div>
          <div className={`p-3 rounded-xl border ${
            balanceAmount > 0
              ? 'bg-rose-50/60 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40'
              : 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/40'
          }`}>
            <p className={`text-[11px] font-medium ${balanceAmount > 0 ? 'text-rose-600 dark:text-rose-400 font-bold' : 'text-emerald-600 dark:text-emerald-400'}`}>
              {balanceAmount > 0 ? 'Remaining Due 🔴' : 'Remaining Due'}
            </p>
            <p className={`text-base sm:text-lg font-bold mt-0.5 ${balanceAmount > 0 ? 'text-rose-700 dark:text-rose-300' : 'text-emerald-700 dark:text-emerald-300'}`}>
              ₹{balanceAmount.toLocaleString('en-IN')}
            </p>
          </div>
        </div>

        {/* Visual Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <span>Overall Contribution Progress</span>
              {isCompleted && <Sparkles className="w-3.5 h-3.5 text-amber-500" />}
            </span>
            <span className="font-bold text-indigo-600 dark:text-indigo-400">
              {progressPercent}%
            </span>
          </div>
          <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden p-0.5 ring-1 ring-slate-200/50 dark:ring-slate-700/50">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                isCompleted
                  ? 'bg-gradient-to-r from-amber-500 to-emerald-500'
                  : 'bg-gradient-to-r from-indigo-500 to-indigo-600'
              }`}
              style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
            />
          </div>
        </div>

        {lastPaymentDate && (
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-3 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            <span>Last payment logged on {new Date(lastPaymentDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
          </p>
        )}
      </div>

      {/* Pay / Contribute Modal */}
      <Modal
        isOpen={showPayModal}
        onClose={() => setShowPayModal(false)}
        title="Contribute to DHDC IFLAH Fund Collection"
        maxWidth="md"
      >
        <div className="space-y-5 text-center">
          <div className="p-4 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800">
            <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">Pending Cycle Balance</p>
            <p className="text-2xl font-bold text-indigo-700 dark:text-indigo-300 mt-0.5">
              ₹{balanceAmount.toLocaleString('en-IN')}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Supports college maintenance, scholarship funds, and campus developments.
            </p>
          </div>

          {/* Institutional UPI QR Code Placeholder */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 inline-block shadow-sm">
            <div className="w-48 h-48 mx-auto bg-slate-100 dark:bg-slate-900 rounded-xl flex flex-col items-center justify-center p-3 text-center border border-dashed border-slate-300 dark:border-slate-700">
              <QrCode className="w-16 h-16 text-indigo-600 dark:text-indigo-400 mb-2" />
              <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                Scan with any UPI App
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">GPay / PhonePe / Paytm</p>
            </div>
          </div>

          {/* Institutional Bank & UPI Details */}
          <div className="text-left space-y-2.5 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Official UPI ID:</span>
              <button
                type="button"
                onClick={() => copyToClipboard('dhdcmanoor@sbi')}
                className="flex items-center gap-1 font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                <span>dhdcmanoor@sbi</span>
                {copiedUpi ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Account Name:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">Darul Hidaya Da&apos;wa College</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Bank:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">SBI, Edappal Branch</span>
            </div>
          </div>

          <p className="text-[11px] text-slate-500 dark:text-slate-400 text-center">
            After making the transfer, please notify the institute administration or zone representative to have your receipt generated instantly.
          </p>

          <button
            type="button"
            onClick={() => setShowPayModal(false)}
            className="w-full py-2.5 rounded-xl bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 text-xs font-bold hover:opacity-90 transition-opacity"
          >
            Done / Close
          </button>
        </div>
      </Modal>
    </>
  );
};
