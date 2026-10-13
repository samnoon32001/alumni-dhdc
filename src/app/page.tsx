'use client';

import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { ThemeProvider } from '../context/ThemeContext';
import { Navbar } from '../components/layout/Navbar';
import { Sidebar, type AlumniNavSection } from '../components/layout/Sidebar';
import { LoginView } from '../components/auth/LoginView';
import { OnboardingWizardModal } from '../components/onboarding/OnboardingWizardModal';

// Views
import { AlumniDashboardView } from '../components/dashboard/AlumniDashboardView';
import { AlumniDirectoryView } from '../components/directory/AlumniDirectoryView';
import { HalfYearlyDonationView } from '../components/donations/HalfYearlyDonationView';
import { AnnouncementsView } from '../components/announcements/AnnouncementsView';
import { AlumniProfileView } from '../components/profile/AlumniProfileView';

// Admin Views
import { AlumniBatchTransition } from '../components/admin/AlumniBatchTransition';
import { AlumniExcelImport } from '../components/admin/AlumniExcelImport';
import { DonationAdminView } from '../components/admin/DonationAdminView';

function AlumniApp() {
  const { currentUser, currentAlumni, isAuthenticated, isLoading } = useAuth();

  const [currentSection, setCurrentSection] = useState<AlumniNavSection>('dashboard');
  const [isSidebarMobileOpen, setIsSidebarMobileOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Check initial onboarding need for alumni
  useEffect(() => {
    if (isAuthenticated && currentAlumni) {
      if (!currentAlumni.isProfileCompleted || !currentAlumni.zoneId) {
        setShowOnboarding(true);
      }
    }
  }, [isAuthenticated, currentAlumni]);

  // Check unread announcements count
  const fetchUnreadCount = () => {
    if (!isAuthenticated) return;
    const query = new URLSearchParams();
    if (currentAlumni?.id) query.append('alumniId', currentAlumni.id);
    if (currentAlumni?.zoneId) query.append('zoneId', currentAlumni.zoneId);

    fetch(`/api/announcements?${query.toString()}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setUnreadCount(d.unreadCount || 0);
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchUnreadCount();
  }, [isAuthenticated, currentAlumni]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white">
        <div className="w-14 h-16 p-2 rounded-2xl bg-white/10 border border-white/20 mb-4 flex items-center justify-center animate-pulse">
          <img src="/logo.png" alt="FALAH DHDC" className="h-12 w-auto object-contain" />
        </div>
        <div className="w-8 h-8 border-3 border-[#117980] border-t-[#aa762b] rounded-full animate-spin mb-3" />
        <p className="text-slate-300 text-xs font-semibold tracking-wide">
          Connecting to FALAH DHDC Alumni Portal...
        </p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginView />;
  }

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      {/* Sidebar */}
      <Sidebar
        currentSection={currentSection}
        onSelectSection={setCurrentSection}
        isOpenMobile={isSidebarMobileOpen}
        onCloseMobile={() => setIsSidebarMobileOpen(false)}
        unreadCount={unreadCount}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-72">
        {/* Navbar */}
        <Navbar
          onToggleSidebar={() => setIsSidebarMobileOpen(!isSidebarMobileOpen)}
          unreadCount={unreadCount}
          onOpenNotifications={() => setCurrentSection('announcements')}
        />

        {/* Page Container */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {currentSection === 'dashboard' && (
            <AlumniDashboardView
              onNavigate={setCurrentSection}
              onOpenOnboarding={() => setShowOnboarding(true)}
            />
          )}

          {currentSection === 'directory' && <AlumniDirectoryView />}

          {currentSection === 'donations' && <HalfYearlyDonationView />}

          {currentSection === 'announcements' && (
            <AnnouncementsView onRefreshUnreadCount={fetchUnreadCount} />
          )}

          {currentSection === 'profile' && <AlumniProfileView />}

          {/* Admin Routes */}
          {currentSection === 'transition' && <AlumniBatchTransition />}

          {currentSection === 'excel-import' && <AlumniExcelImport />}

          {currentSection === 'admin-donations' && <DonationAdminView />}
        </main>
      </div>

      {/* Onboarding Wizard Modal */}
      <OnboardingWizardModal
        isOpen={showOnboarding}
        onCompleted={() => setShowOnboarding(false)}
      />
    </div>
  );
}

export default function Page() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AlumniApp />
      </AuthProvider>
    </ThemeProvider>
  );
}
