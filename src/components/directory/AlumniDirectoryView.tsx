'use client';

import React, { useState, useEffect } from 'react';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';
import {
  Search,
  MapPin,
  GraduationCap,
  Briefcase,
  Phone,
  Mail,
  UserCheck,
  Building,
  Filter,
  Grid,
  List,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import type { Alumni, AlumniZone } from '../../types';

export const AlumniDirectoryView: React.FC = () => {
  const [alumniList, setAlumniList] = useState<Alumni[]>([]);
  const [availableBatches, setAvailableBatches] = useState<string[]>([]);
  const [zones, setZones] = useState<AlumniZone[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedZone, setSelectedZone] = useState('ALL');
  const [selectedBatch, setSelectedBatch] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedFundStatus, setSelectedFundStatus] = useState<'ALL' | 'PAID' | 'UNPAID' | 'PARTIAL'>('ALL');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // IFLAH Fund Map
  const [fundStatusMap, setFundStatusMap] = useState<Map<string, any>>(new Map());

  // Selected Alumnus for Detailed Dossier
  const [selectedAlumni, setSelectedAlumni] = useState<Alumni | null>(null);

  const fetchDirectory = () => {
    setIsLoading(true);
    const query = new URLSearchParams();
    if (search.trim()) query.append('search', search.trim());
    if (selectedZone !== 'ALL') query.append('zoneId', selectedZone);
    if (selectedBatch !== 'ALL') query.append('batch', selectedBatch);
    if (selectedStatus !== 'ALL') query.append('status', selectedStatus);

    fetch(`/api/alumni?${query.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setAlumniList(data.alumni || []);
          if (data.availableBatches) setAvailableBatches(data.availableBatches);
        }
      })
      .catch((err) => console.error('Directory fetch error:', err))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchDirectory();
  }, [selectedZone, selectedBatch, selectedStatus]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchDirectory();
    }, 350);
    return () => clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    fetch('/api/zones')
      .then((r) => r.json())
      .then((d) => {
        if (d.zones) setZones(d.zones);
      })
      .catch(() => {});

    // Fetch IFLAH Fund status map
    fetch('/api/donations')
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.donations) {
          const map = new Map<string, any>();
          d.donations.forEach((item: any) => {
            map.set(item.alumniId, item);
          });
          setFundStatusMap(map);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>Alumni Directory & Network</span>
            <Badge variant="primary" size="sm">{alumniList.length} Members</Badge>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Search, connect, and collaborate with alumni across batches and global chapters.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
              title="Grid View"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
              title="Table View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, admission no, college, degree, or company..."
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
          {/* Zone Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
              Regional Chapter / Zone
            </label>
            <select
              value={selectedZone}
              onChange={(e) => setSelectedZone(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 outline-none"
            >
              <option value="ALL">All Regional Zones</option>
              {zones.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.name}
                </option>
              ))}
            </select>
          </div>

          {/* Batch Year Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
              Batch
            </label>
            <select
              value={selectedBatch}
              onChange={(e) => setSelectedBatch(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 outline-none"
            >
              <option value="ALL">All Batches</option>
              {availableBatches.map((b) => (
                <option key={b} value={b}>
                  Batch {b}
                </option>
              ))}
            </select>
          </div>

          {/* Current Status Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
              Occupation Status
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="Higher Studies">Higher Studies</option>
              <option value="Employed">Employed</option>
              <option value="Business">Business / Entrepreneur</option>
              <option value="Research">Research & Academics</option>
            </select>
          </div>

          {/* IFLAH Fund Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
              IFLAH Fund Status
            </label>
            <select
              value={selectedFundStatus}
              onChange={(e) => setSelectedFundStatus(e.target.value as any)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 outline-none"
            >
              <option value="ALL">All (Paid &amp; Unpaid)</option>
              <option value="UNPAID">🔴 Unpaid (Defaulters)</option>
              <option value="PARTIAL">🟠 Partially Paid</option>
              <option value="PAID">🟢 Fully Cleared</option>
            </select>
          </div>
        </div>
      </div>

      {/* Filtered List */}
      {(() => {
        const displayedAlumni = alumniList.filter((alm) => {
          if (selectedFundStatus === 'ALL') return true;
          const fund = fundStatusMap.get(alm.id);
          const isPaid = fund?.status === 'COMPLETED';
          const isPartial = fund?.status === 'PARTIAL';
          if (selectedFundStatus === 'PAID') return isPaid;
          if (selectedFundStatus === 'PARTIAL') return isPartial;
          if (selectedFundStatus === 'UNPAID') return !isPaid && !isPartial;
          return true;
        });

        if (isLoading) {
          return <div className="p-12 text-center text-xs text-slate-400">Loading alumni directory...</div>;
        }

        if (displayedAlumni.length === 0) {
          return (
            <div className="p-12 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-center space-y-2">
              <GraduationCap className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
              <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">No Alumni Found</h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Try adjusting your search query, selecting another zone, or clearing the IFLAH Fund filter.
              </p>
            </div>
          );
        }

        if (viewMode === 'grid') {
          return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {displayedAlumni.map((alm) => {
                const fund = fundStatusMap.get(alm.id);
                const isPaid = fund?.status === 'COMPLETED';
                const isPartial = fund?.status === 'PARTIAL';

                return (
                  <div
                    key={alm.id}
                    onClick={() => setSelectedAlumni(alm)}
                    className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-600 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
                  >
                    <div>
                      {/* Card Header with Photo */}
                      <div className="flex items-start gap-3.5 mb-3">
                        {alm.photoUrl ? (
                          <img
                            src={alm.photoUrl}
                            alt={alm.name}
                            className="w-12 h-12 rounded-xl object-cover ring-2 ring-indigo-500/20 shrink-0"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-100 to-indigo-50 dark:from-indigo-950/80 dark:to-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-bold text-base flex items-center justify-center shrink-0 ring-2 ring-indigo-500/20">
                            {alm.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="overflow-hidden">
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                            {alm.name}
                          </h4>
                          <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                            Ad.No: {alm.admissionNumber}
                          </p>
                        </div>
                      </div>

                      {/* IFLAH Fund Status Badge (Red if Unpaid) */}
                      <div className="mb-3">
                        {isPaid ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                            🟢 IFLAH: Paid (₹{fund?.paidAmount || 1200})
                          </span>
                        ) : isPartial ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                            🟠 IFLAH: Partial (Due ₹{fund?.balanceAmount})
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300 dark:border-rose-700 animate-pulse">
                            🔴 IFLAH: Unpaid (Due ₹{fund?.balanceAmount || 1200})
                          </span>
                        )}
                      </div>

                      {/* Badges Bar */}
                      <div className="flex flex-wrap items-center gap-1.5 mb-3.5">
                        <Badge variant="primary" size="sm">
                          Batch {alm.passoutBatchYear}
                        </Badge>
                        {alm.zoneName && (
                          <Badge variant="neutral" size="sm">
                            <MapPin className="w-3 h-3 text-indigo-500" />
                            <span className="truncate max-w-[120px]">{alm.zoneName}</span>
                          </Badge>
                        )}
                        {alm.currentStatus && (
                          <Badge variant="info" size="sm">
                            {alm.currentStatus}
                          </Badge>
                        )}
                      </div>

                      {/* Occupation / Studies snippet */}
                      <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1 mb-2">
                        {alm.currentInstitution && (
                          <div className="flex items-center gap-1.5 truncate">
                            <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">{alm.currentInstitution}</span>
                          </div>
                        )}
                        {alm.courseOrDegree && (
                          <div className="flex items-center gap-1.5 truncate text-slate-500 dark:text-slate-400">
                            <GraduationCap className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">{alm.courseOrDegree}</span>
                          </div>
                        )}
                        {alm.organizationOrCompany && (
                          <div className="flex items-center gap-1.5 truncate">
                            <Briefcase className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">{alm.organizationOrCompany} ({alm.designation || 'Staff'})</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold">
                      <span>View Dossier &rarr;</span>
                      {alm.currentCity && <span className="text-slate-400 font-normal">{alm.currentCity}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        }

        // Table View
        return (
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200/60 dark:border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Alumnus Name</th>
                    <th className="py-3 px-4">Ad. No</th>
                    <th className="py-3 px-4">Batch</th>
                    <th className="py-3 px-4">Zone / Chapter</th>
                    <th className="py-3 px-4">IFLAH Fund Status</th>
                    <th className="py-3 px-4">Current Activity</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                  {displayedAlumni.map((alm) => {
                    const fund = fundStatusMap.get(alm.id);
                    const isPaid = fund?.status === 'COMPLETED';
                    const isPartial = fund?.status === 'PARTIAL';

                    return (
                      <tr
                        key={alm.id}
                        onClick={() => setSelectedAlumni(alm)}
                        className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors cursor-pointer"
                      >
                        <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                          {alm.name}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-500">{alm.admissionNumber}</td>
                        <td className="py-3 px-4">
                          <Badge variant="primary" size="sm">
                            {alm.passoutBatchYear}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">{alm.zoneName || '—'}</td>
                        <td className="py-3 px-4">
                          {isPaid ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                              🟢 Paid
                            </span>
                          ) : isPartial ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                              🟠 Partial (Due ₹{fund?.balanceAmount})
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                              🔴 Unpaid (Due ₹{fund?.balanceAmount || 1200})
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 truncate max-w-xs">
                          {alm.currentInstitution || alm.organizationOrCompany || alm.currentStatus || '—'}
                        </td>
                        <td className="py-3 px-4 text-right text-indigo-600 font-bold">
                          View &rarr;
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      })()}

      {/* Selected Alumnus Dossier Modal */}
      {selectedAlumni && (
        <Modal
          isOpen={!!selectedAlumni}
          onClose={() => setSelectedAlumni(null)}
          title={`Alumni Dossier: ${selectedAlumni.name}`}
          maxWidth="xl"
        >
          <div className="space-y-5">
            {/* Top Identity Card */}
            <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-800">
              {selectedAlumni.photoUrl ? (
                <img
                  src={selectedAlumni.photoUrl}
                  alt={selectedAlumni.name}
                  className="w-16 h-16 rounded-2xl object-cover ring-2 ring-indigo-500/20"
                />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 font-bold text-2xl flex items-center justify-center ring-2 ring-indigo-500/20">
                  {selectedAlumni.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {selectedAlumni.name}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="primary" size="sm">
                    Batch of {selectedAlumni.passoutBatchYear}
                  </Badge>
                  <span className="text-xs text-slate-400 font-mono">
                    Ad.No: {selectedAlumni.admissionNumber}
                  </span>
                </div>
              </div>
            </div>

            {/* Academic & Geographic Attributes */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
                <span className="text-slate-400 text-[11px] block">Regional Chapter</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5 block">
                  {selectedAlumni.zoneName || 'Not Assigned'}
                </span>
              </div>
              <div className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
                <span className="text-slate-400 text-[11px] block">Current Location</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5 block">
                  {selectedAlumni.currentCity ? `${selectedAlumni.currentCity}, ${selectedAlumni.currentState || 'Kerala'}` : 'Edappal / Manoor'}
                </span>
              </div>
              <div className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
                <span className="text-slate-400 text-[11px] block">Graduated Class</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5 block">
                  {selectedAlumni.completedClass || '10th Standard'}
                </span>
              </div>
              <div className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
                <span className="text-slate-400 text-[11px] block">Academic Marks Snapshot</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5 block">
                  {selectedAlumni.finalGradeOrPercentage || 'Completed Secondary'}
                </span>
              </div>
            </div>

            {/* Current Occupation / Higher Education */}
            <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-2 text-xs">
              <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-indigo-500" />
                <span>Current Activity</span>
              </h4>
              <p className="text-slate-600 dark:text-slate-300">
                <span className="font-semibold">Status:</span> {selectedAlumni.currentStatus || 'Higher Studies'}
              </p>
              {selectedAlumni.currentInstitution && (
                <p className="text-slate-600 dark:text-slate-300">
                  <span className="font-semibold">Institution / College:</span> {selectedAlumni.currentInstitution}
                </p>
              )}
              {selectedAlumni.courseOrDegree && (
                <p className="text-slate-600 dark:text-slate-300">
                  <span className="font-semibold">Course / Major:</span> {selectedAlumni.courseOrDegree}
                </p>
              )}
              {selectedAlumni.organizationOrCompany && (
                <p className="text-slate-600 dark:text-slate-300">
                  <span className="font-semibold">Company:</span> {selectedAlumni.organizationOrCompany} ({selectedAlumni.designation || 'Staff'})
                </p>
              )}
            </div>

            {/* IFLAH Fund Status in Dossier */}
            {(() => {
              const fund = fundStatusMap.get(selectedAlumni.id);
              const isPaid = fund?.status === 'COMPLETED';
              const isPartial = fund?.status === 'PARTIAL';
              return (
                <div
                  className={`p-4 rounded-xl border space-y-2 text-xs ${
                    isPaid
                      ? 'bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800'
                      : isPartial
                      ? 'bg-amber-50/70 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800'
                      : 'bg-rose-50/70 dark:bg-rose-950/25 border-rose-200 dark:border-rose-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <span>IFLAH Fund Collection Status</span>
                    </h4>
                    {isPaid ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-600 text-white">
                        🟢 Fully Cleared (₹{fund?.paidAmount || 1200})
                      </span>
                    ) : isPartial ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white">
                        🟠 Partial • Due ₹{fund?.balanceAmount}
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-600 text-white animate-pulse">
                        🔴 Unpaid • Due ₹{fund?.balanceAmount || 1200}
                      </span>
                    )}
                  </div>

                  {fund?.levelsBreakdown && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {fund.levelsBreakdown.map((l: any) => (
                        <span
                          key={l.levelId}
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            l.isPaid
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
                              : 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300'
                          }`}
                        >
                          {l.levelName}: {l.isPaid ? 'Paid ✓' : `Due: ₹${l.balance}`}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Contact details */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 space-y-2 text-xs">
              <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Phone className="w-4 h-4 text-emerald-500" />
                <span>Contact Information</span>
              </h4>
              {selectedAlumni.showContactNumber !== false && selectedAlumni.phone && (
                <p className="text-slate-600 dark:text-slate-300">
                  <span className="font-semibold">Phone:</span> {selectedAlumni.phone}
                </p>
              )}
              {selectedAlumni.email && (
                <p className="text-slate-600 dark:text-slate-300">
                  <span className="font-semibold">Email:</span> {selectedAlumni.email}
                </p>
              )}
              {selectedAlumni.permanentAddress && (
                <p className="text-slate-600 dark:text-slate-300">
                  <span className="font-semibold">Address:</span> {selectedAlumni.permanentAddress}
                </p>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelectedAlumni(null)}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
