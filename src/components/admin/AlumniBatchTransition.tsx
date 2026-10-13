'use client';

import React, { useState, useEffect } from 'react';
import { Badge } from '../common/Badge';
import {
  ArrowRightLeft,
  CheckCircle2,
  AlertCircle,
  Users,
  GraduationCap,
  Sparkles,
  Search,
  CheckSquare,
  Square,
  Loader2,
  ShieldCheck,
  Check,
} from 'lucide-react';
import type { Class10StudentCandidate } from '../../types';

export const AlumniBatchTransition: React.FC = () => {
  const [candidates, setCandidates] = useState<Class10StudentCandidate[]>([]);
  const [classes, setClasses] = useState<{ id: string; name: string; academicYear: string }[]>([]);
  const [selectedClassId, setSelectedClassId] = useState('ALL');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Selection
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());

  // Transition form
  const [passoutBatchYear, setPassoutBatchYear] = useState(() => new Date().getFullYear().toString());
  const [completedClass, setCompletedClass] = useState('10th Standard');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchCandidates = () => {
    setIsLoading(true);
    const query = new URLSearchParams();
    if (selectedClassId !== 'ALL') query.append('classId', selectedClassId);

    fetch(`/api/transition?${query.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setCandidates(data.candidates || []);
          if (data.classes) setClasses(data.classes);
        }
      })
      .catch((e) => console.error('Fetch transition candidates error:', e))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchCandidates();
  }, [selectedClassId]);

  const filteredCandidates = candidates.filter((c) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return c.name.toLowerCase().includes(q) || c.admissionNumber.toLowerCase().includes(q);
  });

  const toggleSelectStudent = (id: string) => {
    setSelectedStudentIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    // Only select students who are not already alumni
    const eligibleIds = filteredCandidates.filter((c) => !c.isAlumni).map((c) => c.id);
    if (selectedStudentIds.size === eligibleIds.length && eligibleIds.length > 0) {
      setSelectedStudentIds(new Set());
    } else {
      setSelectedStudentIds(new Set(eligibleIds));
    }
  };

  const handleExecuteTransition = async () => {
    if (selectedStudentIds.size === 0) {
      setErrorMsg('Please select at least one student to transition to alumni.');
      return;
    }
    if (!passoutBatchYear.trim()) {
      setErrorMsg('Please enter a Batch (e.g. 2025).');
      return;
    }

    setIsTransitioning(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch('/api/transition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentIds: Array.from(selectedStudentIds),
          passoutBatchYear: passoutBatchYear.trim(),
          completedClass: completedClass.trim() || '10th Standard',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Transition failed');
      }

      setSuccessMsg(
        `Successfully transitioned ${data.transitionedCount} students to the Alumni table! Their 10th-grade CCE marks & history remain fully preserved.`
      );
      setSelectedStudentIds(new Set());
      fetchCandidates();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error executing transition');
    } finally {
      setIsTransitioning(false);
    }
  };

  const eligibleCandidatesCount = filteredCandidates.filter((c) => !c.isAlumni).length;
  const isAllSelected = eligibleCandidatesCount > 0 && selectedStudentIds.size === eligibleCandidatesCount;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>10th Class Graduation & Alumni Transition</span>
            <Badge variant="primary" size="sm">Pipeline</Badge>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Easily move 10th-grade students from the Students table to the Alumni table with 1-click batch processing.
          </p>
        </div>
      </div>

      {/* Safety & Preservation Notice */}
      <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/60 text-xs text-indigo-900 dark:text-indigo-200 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="font-bold text-sm">Historical Integrity Preserved</h4>
          <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
            Transitioning copies students to the <strong>Alumni table</strong> and elevates their account to <strong>Alumni</strong> status while updating the student record to <em>&lsquo;graduated&rsquo;</em>. All historical marks, CCE report cards, attendance logs, and financial records remain permanently intact in the shared database.
          </p>
        </div>
      </div>

      {/* Filter and Settings Panel */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
              Filter By Graduating Class
            </label>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 outline-none"
            >
              <option value="ALL">All 10th / Secondary Classes</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name} ({cls.academicYear})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
              Batch *
            </label>
            <input
              type="text"
              value={passoutBatchYear}
              onChange={(e) => setPassoutBatchYear(e.target.value)}
              placeholder="e.g. 2025"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 outline-none font-semibold"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
              Completed Standard
            </label>
            <input
              type="text"
              value={completedClass}
              onChange={(e) => setCompletedClass(e.target.value)}
              placeholder="10th Standard"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 outline-none"
            />
          </div>
        </div>

        {/* Search Input & Select-All bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search candidate name or admission no..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none"
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={toggleSelectAll}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 transition-colors"
            >
              {isAllSelected ? (
                <>
                  <CheckSquare className="w-4 h-4" />
                  <span>Deselect All</span>
                </>
              ) : (
                <>
                  <Square className="w-4 h-4" />
                  <span>Select All Eligible ({eligibleCandidatesCount})</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleExecuteTransition}
              disabled={isTransitioning || selectedStudentIds.size === 0}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 disabled:opacity-50 transition-all"
            >
              {isTransitioning ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Transitioning...</span>
                </>
              ) : (
                <>
                  <ArrowRightLeft className="w-4 h-4" />
                  <span>Graduate {selectedStudentIds.size} to Alumni</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 flex items-center gap-2.5 text-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 flex items-center gap-2.5 text-xs">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Candidates Table */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading 10th class candidates...</div>
        ) : filteredCandidates.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            No students found in the selected 10th grade criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200/60 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4 w-10 text-center">
                    <span className="sr-only">Select</span>
                  </th>
                  <th className="py-3 px-4">Ad.No</th>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">Class</th>
                  <th className="py-3 px-4">CCE Score Snapshot</th>
                  <th className="py-3 px-4">Current Status</th>
                  <th className="py-3 px-4 text-right">Alumni State</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {filteredCandidates.map((cand) => {
                  const isSelected = selectedStudentIds.has(cand.id);
                  const isAlreadyAlumni = cand.isAlumni;

                  return (
                    <tr
                      key={cand.id}
                      onClick={() => !isAlreadyAlumni && toggleSelectStudent(cand.id)}
                      className={`transition-colors ${
                        isAlreadyAlumni
                          ? 'bg-slate-50/40 dark:bg-slate-800/20 opacity-75'
                          : isSelected
                          ? 'bg-indigo-50/50 dark:bg-indigo-950/30'
                          : 'hover:bg-slate-50/50 dark:hover:bg-slate-800/30 cursor-pointer'
                      }`}
                    >
                      <td className="py-3 px-4 text-center">
                        <input
                          type="checkbox"
                          disabled={isAlreadyAlumni}
                          checked={isSelected}
                          onChange={() => toggleSelectStudent(cand.id)}
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">
                        {cand.admissionNumber}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                        {cand.name}
                      </td>
                      <td className="py-3 px-4 text-slate-500">{cand.className}</td>
                      <td className="py-3 px-4 font-mono">
                        {cand.cceAverage ? (
                          <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                            Avg: {cand.cceAverage}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <Badge
                          variant={cand.status === 'graduated' ? 'info' : 'success'}
                          size="sm"
                        >
                          {cand.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {isAlreadyAlumni ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                            <Check className="w-3.5 h-3.5" />
                            <span>In Alumni Table</span>
                          </span>
                        ) : (
                          <span className="text-indigo-600 text-[11px] font-bold">
                            Ready for Transfer
                          </span>
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
    </div>
  );
};
