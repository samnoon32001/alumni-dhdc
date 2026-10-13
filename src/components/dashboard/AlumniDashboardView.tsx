'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { DonationProgressCard } from '../donations/DonationProgressCard';
import { PrintableReceiptModal } from '../donations/PrintableReceiptModal';
import { Badge } from '../common/Badge';
import {
  Users,
  Wallet,
  Bell,
  Sparkles,
  MapPin,
  ArrowRight,
  GraduationCap,
  HeartHandshake,
  Calendar,
  AlertCircle,
  Building,
} from 'lucide-react';
import type { AlumniNavSection } from '../layout/Sidebar';
import type { AlumniAnnouncement, AlumniDonation } from '../../types';

interface AlumniDashboardViewProps {
  onNavigate: (section: AlumniNavSection) => void;
  onOpenOnboarding: () => void;
}

export const AlumniDashboardView: React.FC<AlumniDashboardViewProps> = ({
  onNavigate,
  onOpenOnboarding,
}) => {
  const { currentUser, currentAlumni } = useAuth();

  const [metrics, setMetrics] = useState<any>(null);
  const [announcements, setAnnouncements] = useState<AlumniAnnouncement[]>([]);
  const [selectedReceiptDonation, setSelectedReceiptDonation] = useState<AlumniDonation | null>(null);
  const [alumniCount, setAlumniCount] = useState(0);

  useEffect(() => {
    // 1. Fetch donation progress
    if (currentAlumni?.id) {
      fetch(`/api/donations?alumniId=${encodeURIComponent(currentAlumni.id)}`)
        .then((r) => r.json())
        .then((d) => {
          if (d.success) setMetrics(d.alumnusCurrentMetrics);
        })
        .catch(() => {});
    }

    // 2. Fetch announcements
    fetch('/api/announcements')
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setAnnouncements(d.announcements?.slice(0, 3) || []);
      })
      .catch(() => {});

    // 3. Fetch directory count
    fetch('/api/alumni')
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setAlumniCount(d.totalCount || 0);
      })
      .catch(() => {});
  }, [currentAlumni]);

  const isProfileComplete = currentAlumni?.isProfileCompleted && currentAlumni?.zoneId;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white relative overflow-hidden shadow-lg shadow-indigo-950/20">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-[11px] font-semibold tracking-wide text-indigo-100">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>FALAH DHDC • Alumni of Darul Hidaya Da&apos;wa College, Manoor</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Assalamu Alaikum, {currentAlumni?.name || currentUser?.name || 'Brother'}!
            </h1>

            <p className="text-xs sm:text-sm text-indigo-100 max-w-xl leading-relaxed">
              Welcome back to your institutional portal. Stay connected with your teachers, monitor your batchmates across global chapters, and track your IFLAH Fund collection.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2 text-xs">
              <span className="px-3 py-1 rounded-xl bg-white/10 border border-white/15 font-semibold">
                Batch: <strong>{currentAlumni?.passoutBatchYear || '2024'}</strong>
              </span>
              {currentAlumni?.zoneName && (
                <span className="px-3 py-1 rounded-xl bg-white/10 border border-white/15 flex items-center gap-1.5 font-semibold">
                  <MapPin className="w-3.5 h-3.5 text-amber-300" />
                  <span>{currentAlumni.zoneName}</span>
                </span>
              )}
            </div>
          </div>

          <div className="flex md:flex-col items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => onNavigate('directory')}
              className="px-5 py-2.5 rounded-xl bg-white text-indigo-900 text-xs font-bold hover:bg-indigo-50 transition-all shadow-md transform active:scale-95"
            >
              Explore Directory
            </button>
            <button
              type="button"
              onClick={() => onNavigate('donations')}
              className="px-5 py-2.5 rounded-xl bg-indigo-600/60 hover:bg-indigo-600 border border-white/20 text-white text-xs font-bold transition-all"
            >
              IFLAH Fund Tracker
            </button>
          </div>
        </div>
      </div>

      {/* Profile Incomplete Callout (if missing zone/address) */}
      {!isProfileComplete && (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/20 border border-amber-200 dark:border-amber-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center shrink-0">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                Complete Your Profile Onboarding
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                Select your Regional Zone, verify your address, and upload an optional photo to unlock full directory features.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenOnboarding}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-md shadow-amber-600/20 shrink-0 self-start sm:self-auto"
          >
            <span>Complete Setup</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Grid: Half-Yearly Donation Progress & Quick Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <DonationProgressCard
            metrics={metrics}
            onViewReceipt={() => onNavigate('donations')}
          />
        </div>

        {/* Quick Institutional Stats */}
        <div className="space-y-4">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Building className="w-4 h-4 text-indigo-500" />
              <span>Network Overview</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                <span className="text-slate-500">Registered Alumni:</span>
                <span className="font-bold text-slate-900 dark:text-white">{alumniCount} Members</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                <span className="text-slate-500">Your Batch:</span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400">
                  Batch {currentAlumni?.passoutBatchYear || '2024'}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                <span className="text-slate-500">Regional Chapter:</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {currentAlumni?.zoneName || 'Pending Selection'}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onNavigate('profile')}
              className="w-full py-2 text-xs font-semibold text-center text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              Update My Dossier &rarr;
            </button>
          </div>
        </div>
      </div>

      {/* Latest Institute Broadcasts Feed */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Bell className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Recent Institute Broadcasts & Circulars
            </h3>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('announcements')}
            className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            View All Circulars &rarr;
          </button>
        </div>

        {announcements.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-4">No recent circulars broadcasted.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {announcements.map((ann) => (
              <div
                key={ann.id}
                onClick={() => onNavigate('announcements')}
                className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 bg-slate-50/50 dark:bg-slate-800/20 transition-all cursor-pointer space-y-2 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                    <Badge variant="primary" size="sm">{ann.category}</Badge>
                    <span>{new Date(ann.publishedAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}</span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">
                    {ann.title}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">
                    {ann.content}
                  </p>
                </div>
                <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold block pt-2">
                  Read Circular &rarr;
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
