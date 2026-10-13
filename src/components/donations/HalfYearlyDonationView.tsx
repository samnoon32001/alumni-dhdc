'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { DonationProgressCard } from './DonationProgressCard';
import { PrintableReceiptModal } from './PrintableReceiptModal';
import { Badge } from '../common/Badge';
import {
  Wallet,
  Calendar,
  FileText,
  Printer,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  ArrowUpRight,
  ShieldCheck,
} from 'lucide-react';
import type { AlumniDonation } from '../../types';

export const HalfYearlyDonationView: React.FC = () => {
  const { currentAlumni } = useAuth();

  const [isLoading, setIsLoading] = useState(true);
  const [metrics, setMetrics] = useState<any>(null);
  const [donationsList, setDonationsList] = useState<AlumniDonation[]>([]);
  const [selectedReceiptDonation, setSelectedReceiptDonation] = useState<AlumniDonation | null>(null);

  const fetchDonations = () => {
    if (!currentAlumni) return;
    setIsLoading(true);
    fetch(`/api/donations?alumniId=${encodeURIComponent(currentAlumni.id)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setMetrics(data.alumnusCurrentMetrics);
          setDonationsList(data.donations || []);
        }
      })
      .catch((e) => console.error('Fetch donations error:', e))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchDonations();
  }, [currentAlumni]);

  const handleOpenReceiptByNumber = (receiptNo: string) => {
    const found = donationsList.find((d) => d.receiptNumber === receiptNo);
    if (found) setSelectedReceiptDonation(found);
  };

  // Lifetime metrics
  const totalLifetimeContributed = donationsList.reduce((acc, d) => acc + (d.paidAmount || 0), 0);
  const completedCyclesCount = donationsList.filter((d) => d.status === 'COMPLETED').length;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>IFLAH Fund Collection Tracker</span>
            <Badge variant="gold" size="sm">FALAH DHDC</Badge>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Official institutional development fund. Targets scheduled across Rabee&apos; &amp; Ramadan instalments.
          </p>
        </div>

        {/* Stats Badges */}
        <div className="flex items-center gap-3">
          <div className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-right">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
              Lifetime Contributed
            </span>
            <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
              ₹{totalLifetimeContributed.toLocaleString('en-IN')}
            </span>
          </div>
          <div className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-right">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
              Completed Terms
            </span>
            <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
              {completedCyclesCount} Cycles
            </span>
          </div>
        </div>
      </div>

      {/* Unpaid Urgent Warning Alert Banner if payment is due */}
      {metrics && metrics.status !== 'COMPLETED' && metrics.balanceAmount > 0 && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/80 text-rose-900 dark:text-rose-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-rose-700 dark:text-rose-300">
                  Mandatory Alumni Contribution Due
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-600 text-white animate-pulse">
                  Unpaid
                </span>
              </div>
              <p className="text-xs mt-0.5 text-rose-800 dark:text-rose-300 font-medium">
                You have a pending balance of <strong>₹{metrics.balanceAmount.toLocaleString('en-IN')}</strong> for {metrics.cycleLabel}.
                All alumni are required to settle their Rabee&apos; and Ramadan instalments.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Active Progress Meter */}
      <DonationProgressCard
        metrics={metrics}
        onRefresh={fetchDonations}
        onViewReceipt={handleOpenReceiptByNumber}
      />

      {/* Historical Cycles Ledger */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Calendar className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Collection History & Receipts Ledger
            </h3>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {donationsList.length} Cycles Logged
          </span>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-xs text-slate-400">
            Loading contribution records...
          </div>
        ) : donationsList.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            No donation history logged yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200/60 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">Collection Cycle</th>
                  <th className="py-3 px-4">Target (₹)</th>
                  <th className="py-3 px-4">Paid (₹)</th>
                  <th className="py-3 px-4">Due (₹)</th>
                  <th className="py-3 px-4">Instalments Status</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Last Payment</th>
                  <th className="py-3 px-4 text-right">Official Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {donationsList.map((d) => {
                  const isDone = d.status === 'COMPLETED' || (d.paidAmount >= d.targetAmount);
                  const isPartial = d.status === 'PARTIAL' && d.paidAmount > 0;
                  return (
                    <tr key={d.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white">
                        {d.cycle?.label || 'General Term'}
                      </td>
                      <td className="py-3.5 px-4 font-mono">
                        ₹{d.targetAmount.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        ₹{d.paidAmount.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-rose-600 dark:text-rose-400">
                        ₹{d.balanceAmount.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-4">
                        {d.levelsBreakdown && d.levelsBreakdown.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {d.levelsBreakdown.map((l) => (
                              <span
                                key={l.levelId}
                                className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                                  l.isPaid
                                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                    : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                                }`}
                              >
                                {l.levelName}: {l.isPaid ? 'Paid ✓' : `₹${l.balance} Due`}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px]">—</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isDone
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : isPartial
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                              : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                          }`}
                        >
                          {isDone ? 'Paid ✓' : isPartial ? 'Partial' : 'Unpaid 🔴'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                        {d.lastPaymentDate
                          ? new Date(d.lastPaymentDate).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })
                          : '—'}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {d.paidAmount > 0 ? (
                          <button
                            type="button"
                            onClick={() => setSelectedReceiptDonation(d)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900 border border-indigo-200 dark:border-indigo-800 text-[11px] font-bold transition-colors"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>Print Receipt</span>
                          </button>
                        ) : (
                          <span className="text-rose-500 font-semibold text-[11px]">Due (No Payment)</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Official Receipt Modal */}
      <PrintableReceiptModal
        isOpen={!!selectedReceiptDonation}
        onClose={() => setSelectedReceiptDonation(null)}
        donation={selectedReceiptDonation}
      />
    </div>
  );
};
