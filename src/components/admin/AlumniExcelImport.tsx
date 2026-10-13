'use client';

import React, { useState, useRef } from 'react';
import {
  downloadAlumniDemoTemplate,
  parseAlumniExcel,
  validateAlumniRows,
  type ValidatedImportResult,
} from '../../utils/excel';
import { Badge } from '../common/Badge';
import {
  FileSpreadsheet,
  Download,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Loader2,
  FileCheck,
  Users,
  ShieldCheck,
} from 'lucide-react';

export const AlumniExcelImport: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [fileName, setFileName] = useState<string | null>(null);
  const [validationResult, setValidationResult] = useState<ValidatedImportResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importSuccessMsg, setImportSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // 1. Download Demo Excel Template
  const handleDownloadTemplate = () => {
    try {
      downloadAlumniDemoTemplate();
    } catch (err: any) {
      alert(`Could not generate template: ${err?.message}`);
    }
  };

  // 2. Handle File Upload & Parsing
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setIsProcessing(true);
    setImportSuccessMsg(null);
    setErrorMsg(null);

    try {
      const rawRows = await parseAlumniExcel(file);
      if (rawRows.length === 0) {
        setErrorMsg('The selected spreadsheet contains no data rows.');
        setValidationResult(null);
        return;
      }
      const validated = validateAlumniRows(rawRows);
      setValidationResult(validated);
    } catch (err: any) {
      setErrorMsg(`Failed to parse Excel file: ${err?.message}`);
      setValidationResult(null);
    } finally {
      setIsProcessing(false);
    }
  };

  // 3. Execute Bulk Import
  const handleExecuteImport = async () => {
    if (!validationResult || validationResult.validRows.length === 0) return;

    setIsImporting(true);
    setErrorMsg(null);
    setImportSuccessMsg(null);

    try {
      const res = await fetch('/api/excel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows: validationResult.validRows }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to complete bulk import');
      }

      setImportSuccessMsg(
        `Successfully imported and registered ${data.successCount} alumni records! Login accounts have been generated.`
      );
      setValidationResult(null);
      setFileName(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error occurred during bulk import');
    } finally {
      setIsImporting(false);
    }
  };

  const handleReset = () => {
    setFileName(null);
    setValidationResult(null);
    setImportSuccessMsg(null);
    setErrorMsg(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>Alumni Excel Bulk Import</span>
            <Badge variant="primary" size="sm">Admin Tool</Badge>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Import hundreds of alumni records at once using a standardized Excel spreadsheet.
          </p>
        </div>

        {/* Demo Template Download Button */}
        <button
          type="button"
          onClick={handleDownloadTemplate}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all transform active:scale-95"
        >
          <Download className="w-4 h-4" />
          <span>Download Demo Template (.xlsx)</span>
        </button>
      </div>

      {/* Instructions Card */}
      <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200/80 dark:border-indigo-800/60 text-xs text-indigo-900 dark:text-indigo-200 flex items-start gap-3">
        <FileSpreadsheet className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="font-bold text-sm">How to use the Demo Excel Template:</h4>
          <ul className="list-disc list-inside space-y-0.5 text-[11px] text-slate-600 dark:text-slate-300">
            <li>Download the pre-formatted template above with sample rows and column definitions.</li>
            <li>Fill in alumni details. <strong>Admission No, Full Name, and Batch</strong> are mandatory.</li>
            <li>Upload the finished sheet below for instant client-side validation and verification.</li>
            <li>The system will automatically create Portal login credentials for each alumnus.</li>
          </ul>
        </div>
      </div>

      {/* Upload Box */}
      <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 transition-colors text-center">
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx, .xls"
          onChange={handleFileChange}
          className="hidden"
          id="alumni-file-upload"
        />

        <label
          htmlFor="alumni-file-upload"
          className="cursor-pointer flex flex-col items-center justify-center space-y-3"
        >
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-sm">
            <UploadCloud className="w-7 h-7" />
          </div>

          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              {fileName ? fileName : 'Choose an Excel file or drag & drop here'}
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Supports .xlsx and .xls workbooks up to 10MB
            </p>
          </div>

          <span className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-all">
            Browse Files
          </span>
        </label>
      </div>

      {/* Loading Indicator */}
      {isProcessing && (
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 text-center flex items-center justify-center gap-2 text-xs text-slate-600 dark:text-slate-300">
          <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
          <span>Parsing and validating spreadsheet rows...</span>
        </div>
      )}

      {/* Success Notification */}
      {importSuccessMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-xs font-semibold">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>{importSuccessMsg}</span>
          </div>
          <button
            onClick={handleReset}
            className="text-xs font-bold text-emerald-700 dark:text-emerald-300 hover:underline"
          >
            Import Another Sheet
          </button>
        </div>
      )}

      {/* Error Notification */}
      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 flex items-center gap-2.5 text-xs">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Validation Staging & Preview */}
      {validationResult && (
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden space-y-4 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Spreadsheet Validation Summary</span>
                <Badge variant="primary" size="sm">{validationResult.totalRows} Total Rows</Badge>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Review verified rows before writing to the database.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                ✓ {validationResult.validRows.length} Valid
              </span>
              {validationResult.invalidRows.length > 0 && (
                <span className="text-xs font-bold text-rose-600 dark:text-rose-400">
                  ⚠ {validationResult.invalidRows.length} Invalid
                </span>
              )}
            </div>
          </div>

          {/* Invalid Rows Warning Box */}
          {validationResult.invalidRows.length > 0 && (
            <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs space-y-1.5 text-amber-900 dark:text-amber-200">
              <div className="font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Rows requiring correction (will be skipped):</span>
              </div>
              <ul className="list-disc list-inside text-[11px] space-y-0.5 pl-2">
                {validationResult.invalidRows.slice(0, 5).map((inv, idx) => (
                  <li key={idx}>
                    Row #{inv.rowNumber}: {inv.reason}
                  </li>
                ))}
                {validationResult.invalidRows.length > 5 && (
                  <li>...and {validationResult.invalidRows.length - 5} more</li>
                )}
              </ul>
            </div>
          )}

          {/* Valid Rows Preview Table */}
          <div className="overflow-x-auto max-h-64 border rounded-xl border-slate-200 dark:border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold sticky top-0">
                <tr>
                  <th className="py-2.5 px-3">Ad.No</th>
                  <th className="py-2.5 px-3">Full Name</th>
                  <th className="py-2.5 px-3">Batch</th>
                  <th className="py-2.5 px-3">Zone</th>
                  <th className="py-2.5 px-3">Activity</th>
                  <th className="py-2.5 px-3">City</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {validationResult.validRows.slice(0, 10).map((r, i) => (
                  <tr key={i}>
                    <td className="py-2 px-3 font-mono font-bold">{r.admissionNumber}</td>
                    <td className="py-2 px-3 font-semibold">{r.name}</td>
                    <td className="py-2 px-3">{r.passoutBatchYear}</td>
                    <td className="py-2 px-3 text-slate-500">{r.zoneName || 'Auto'}</td>
                    <td className="py-2 px-3">{r.currentInstitution || r.currentStatus || '—'}</td>
                    <td className="py-2 px-3">{r.currentCity || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Discard & Upload Again</span>
            </button>

            <button
              type="button"
              onClick={handleExecuteImport}
              disabled={isImporting || validationResult.validRows.length === 0}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 disabled:opacity-50"
            >
              {isImporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Importing Records...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirm & Import {validationResult.validRows.length} Alumni</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
