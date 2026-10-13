'use client';

import React from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  Wallet,
  Bell,
  UserCheck,
  FileSpreadsheet,
  Settings,
  Sparkles,
  ArrowRightLeft,
  X,
  CreditCard,
  Building,
  HeartHandshake,
} from 'lucide-react';

export type AlumniNavSection =
  | 'dashboard'
  | 'directory'
  | 'donations'
  | 'announcements'
  | 'profile'
  | 'transition'
  | 'excel-import'
  | 'admin-donations';

interface SidebarProps {
  currentSection: AlumniNavSection;
  onSelectSection: (section: AlumniNavSection) => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
  unreadCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentSection,
  onSelectSection,
  isOpenMobile = false,
  onCloseMobile,
  unreadCount = 0,
}) => {
  const { currentUser, currentAlumni } = useAuth();
  const isAdmin = currentUser?.role === 'super_admin';

  const [hasUnpaidFund, setHasUnpaidFund] = React.useState(false);
  const [unpaidDueAmount, setUnpaidDueAmount] = React.useState(0);

  React.useEffect(() => {
    if (currentAlumni?.id) {
      fetch(`/api/donations?alumniId=${encodeURIComponent(currentAlumni.id)}`)
        .then((r) => r.json())
        .then((d) => {
          if (d.success && d.alumnusCurrentMetrics) {
            const m = d.alumnusCurrentMetrics;
            if (m.status !== 'COMPLETED' && m.balanceAmount > 0) {
              setHasUnpaidFund(true);
              setUnpaidDueAmount(m.balanceAmount);
            } else {
              setHasUnpaidFund(false);
            }
          }
        })
        .catch(() => {});
    }
  }, [currentAlumni?.id]);

  const alumniNavItems = [
    {
      id: 'dashboard' as AlumniNavSection,
      label: 'Portal Overview',
      icon: LayoutDashboard,
      description: 'Activity & Highlights',
    },
    {
      id: 'directory' as AlumniNavSection,
      label: 'Alumni Directory',
      icon: Users,
      description: 'Search Batches & Zones',
    },
    {
      id: 'donations' as AlumniNavSection,
      label: 'IFLAH Fund Collection',
      icon: Wallet,
      description: "Rabee' & Ramadan Collection",
      highlight: true,
      badgeText: hasUnpaidFund ? 'Due' : undefined,
      badgeVariant: 'danger',
    },
    {
      id: 'announcements' as AlumniNavSection,
      label: 'Institute Notices',
      icon: Bell,
      description: 'Circulars & Announcements',
      badge: unreadCount > 0 ? unreadCount : undefined,
    },
    {
      id: 'profile' as AlumniNavSection,
      label: 'My Dossier & Profile',
      icon: UserCheck,
      description: 'Personal & Career Info',
    },
  ];

  const adminNavItems = [
    {
      id: 'transition' as AlumniNavSection,
      label: '10th Class Transition',
      icon: ArrowRightLeft,
      description: 'Promote 10th to Alumni',
      badgeText: 'Action',
    },
    {
      id: 'excel-import' as AlumniNavSection,
      label: 'Excel Bulk Import',
      icon: FileSpreadsheet,
      description: 'Download Demo & Upload',
    },
    {
      id: 'admin-donations' as AlumniNavSection,
      label: 'IFLAH Fund Ledger',
      icon: CreditCard,
      description: 'Cycles, Levels & Payment Ledger',
    },
  ];

  const handleSelect = (section: AlumniNavSection) => {
    onSelectSection(section);
    if (onCloseMobile) onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        id="portal-sidebar"
        className={`fixed top-0 bottom-0 left-0 z-40 w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header on Mobile */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800 lg:hidden">
          <div className="flex items-center gap-2.5">
            <img src="/logo.png" alt="FALAH DHDC" className="h-7 w-auto object-contain" />
            <span className="font-extrabold text-sm text-slate-900 dark:text-white">FALAH DHDC</span>
          </div>
          <button
            onClick={onCloseMobile}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Institution Info Badge */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/30">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center p-1 shadow-sm shrink-0">
              <img
                src="/logo.png"
                alt="FALAH DHDC"
                className="h-9 w-auto max-w-[36px] object-contain"
              />
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-black tracking-tight text-slate-900 dark:text-slate-100 truncate">
                <span className="text-[#117980] dark:text-[#40a3ac]">FALAH</span>{' '}
                <span className="text-[#aa762b] dark:text-[#dec18e]">DHDC</span>
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate">
                Alumni of Darul Hidaya Da&apos;wa College, Manoor
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {/* Main Alumni Navigation */}
          <div>
            <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Alumni Portal
            </div>
            <div className="space-y-1">
              {alumniNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentSection === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelect(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left font-medium transition-all group ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-3 truncate">
                      <Icon
                        className={`w-5 h-5 shrink-0 transition-colors ${
                          isActive
                            ? 'text-white'
                            : item.highlight
                            ? 'text-amber-500 dark:text-amber-400'
                            : 'text-slate-400 group-hover:text-indigo-500'
                        }`}
                      />
                      <div className="truncate">
                        <div className="text-xs font-semibold leading-snug truncate">{item.label}</div>
                        <div
                          className={`text-[10px] truncate ${
                            isActive ? 'text-indigo-100' : 'text-slate-400 dark:text-slate-500'
                          }`}
                        >
                          {item.description}
                        </div>
                      </div>
                    </div>

                    {(item.badge !== undefined || (item as any).badgeText !== undefined) && (
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                          isActive
                            ? 'bg-white text-indigo-600'
                            : (item as any).badgeVariant === 'danger'
                            ? 'bg-rose-500 text-white shadow-sm ring-2 ring-rose-500/20'
                            : 'bg-rose-500 text-white shadow-sm'
                        }`}
                      >
                        {item.badge !== undefined ? item.badge : (item as any).badgeText}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Admin Suite */}
          {isAdmin && (
            <div>
              <div className="px-3 mb-2 flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Institutional Admin
                </span>
                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  Admin
                </span>
              </div>
              <div className="space-y-1">
                {adminNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentSection === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSelect(item.id)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left font-medium transition-all group ${
                        isActive
                          ? 'bg-slate-900 text-white dark:bg-indigo-600 shadow-md'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-3 truncate">
                        <Icon
                          className={`w-5 h-5 shrink-0 transition-colors ${
                            isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200'
                          }`}
                        />
                        <div className="truncate">
                          <div className="text-xs font-semibold leading-snug truncate">{item.label}</div>
                          <div
                            className={`text-[10px] truncate ${
                              isActive ? 'text-slate-300 dark:text-indigo-100' : 'text-slate-400 dark:text-slate-500'
                            }`}
                          >
                            {item.description}
                          </div>
                        </div>
                      </div>

                      {item.badgeText && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                          {item.badgeText}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 text-center">
          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
            DHDC Portal Ecosystem &copy; 2026
          </p>
        </div>
      </aside>
    </>
  );
};
