'use client';

import React from 'react';
import { Modal } from '../common/Modal';
import { Printer, CheckCircle2, Download, ShieldCheck } from 'lucide-react';
import type { AlumniDonation } from '../../types';

interface PrintableReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  donation: AlumniDonation | null;
}

export const PrintableReceiptModal: React.FC<PrintableReceiptModalProps> = ({
  isOpen,
  onClose,
  donation,
}) => {
  if (!donation) return null;

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = donation.lastPaymentDate
    ? new Date(donation.lastPaymentDate).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : new Date().toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="IFLAH Fund Official Receipt" maxWidth="2xl">
      <div className="space-y-6">
        {/* Printable Receipt Container */}
        <div className="printable-document p-8 rounded-2xl bg-white border border-slate-200 text-slate-900 shadow-sm relative overflow-hidden font-sans">
          {/* Institutional Watermark / Header */}
          <div className="border-b-2 border-[#117980] pb-5 mb-6 text-center space-y-1">
            <img src="/logo.png" alt="FALAH DHDC" className="h-12 w-auto object-contain mx-auto mb-2" />
            <div className="inline-block px-3 py-0.5 rounded text-[10px] font-bold tracking-widest uppercase bg-teal-50 text-[#117980] border border-[#117980]/30 mb-1">
              IFLAH Fund Official Contribution Voucher
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight uppercase">
              FALAH DHDC
            </h1>
            <p className="text-xs font-semibold text-slate-700">
              Alumni of Darul Hidaya Da&apos;wa College, Manoor
            </p>
            <p className="text-[11px] text-slate-500">
              Manoor, P.O. Edappal, Malappuram Dt., Kerala - 679578 • Tel: +91 494 268 0000
            </p>
          </div>

          {/* Receipt Meta Bar */}
          <div className="flex items-center justify-between py-2 px-4 rounded-xl bg-slate-50 border border-slate-200 text-xs mb-6 font-mono">
            <div>
              <span className="text-slate-500">Receipt No: </span>
              <span className="font-bold text-slate-900">{donation.receiptNumber || 'DHDC-IFLAH-RECEIPT'}</span>
            </div>
            <div>
              <span className="text-slate-500">Date: </span>
              <span className="font-bold text-slate-900">{formattedDate}</span>
            </div>
          </div>

          {/* Contributor Particulars */}
          <div className="space-y-3 text-xs mb-6">
            <div className="flex border-b border-slate-100 pb-2">
              <span className="w-36 text-slate-500 font-medium">Received with thanks from:</span>
              <span className="font-bold text-slate-900 text-sm">{donation.alumniName}</span>
            </div>
            <div className="flex border-b border-slate-100 pb-2">
              <span className="w-36 text-slate-500 font-medium">Admission Number:</span>
              <span className="font-semibold text-slate-900">{donation.admissionNumber}</span>
            </div>
            <div className="flex border-b border-slate-100 pb-2">
              <span className="w-36 text-slate-500 font-medium">Collection Purpose:</span>
              <span className="font-semibold text-slate-900">{donation.cycle?.label || 'IFLAH Fund Collection'}</span>
            </div>
            {donation.notes && (
              <div className="flex border-b border-slate-100 pb-2">
                <span className="w-36 text-slate-500 font-medium">Instalment / Remarks:</span>
                <span className="font-semibold text-indigo-700">{donation.notes}</span>
              </div>
            )}
            <div className="flex border-b border-slate-100 pb-2">
              <span className="w-36 text-slate-500 font-medium">Payment Mode / Ref:</span>
              <span className="font-semibold text-slate-900">
                {donation.paymentMethod || 'UPI'} {donation.transactionRef ? `(Ref: ${donation.transactionRef})` : ''}
              </span>
            </div>
          </div>

          {/* Amount Box */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-indigo-50/80 border border-indigo-200 mb-8">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-indigo-900">Amount Contributed</p>
              <p className="text-xs text-indigo-700 italic mt-0.5">
                Indian Rupees {donation.paidAmount.toLocaleString('en-IN')} Only
              </p>
            </div>
            <div className="text-2xl font-black text-indigo-950 font-mono">
              ₹{donation.paidAmount.toLocaleString('en-IN')}
            </div>
          </div>

          {/* Footer & Signature */}
          <div className="flex items-end justify-between pt-6 border-t border-slate-200 text-xs">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-emerald-700 font-bold text-[11px]">
                <ShieldCheck className="w-4 h-4" />
                <span>Verified Official Digital Receipt</span>
              </div>
              <p className="text-[10px] text-slate-400">
                Generated from the DHDC Institutional Alumni Portal
              </p>
            </div>

            <div className="text-center space-y-1">
              <div className="w-32 border-b border-slate-400 mb-1" />
              <p className="font-bold text-slate-800 text-[11px]">Finance Controller</p>
              <p className="text-[10px] text-slate-500">DHDC, Manoor</p>
            </div>
          </div>
        </div>

        {/* Modal Action Buttons */}
        <div className="flex items-center justify-end gap-3 no-print">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20"
          >
            <Printer className="w-4 h-4" />
            <span>Print Official Receipt</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};
