'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Modal } from '../common/Modal';
import { Badge } from '../common/Badge';
import { PhotoUploadCropper } from '../common/PhotoUploadCropper';
import confetti from 'canvas-confetti';
import {
  Camera,
  MapPin,
  Home,
  Briefcase,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Upload,
  User,
  Phone,
  Building,
  GraduationCap,
  Globe,
} from 'lucide-react';
import type { AlumniZone } from '../../types';

interface OnboardingWizardModalProps {
  isOpen: boolean;
  onCompleted: () => void;
}

export const OnboardingWizardModal: React.FC<OnboardingWizardModalProps> = ({
  isOpen,
  onCompleted,
}) => {
  const { currentAlumni, updateCurrentAlumni, refreshAlumni } = useAuth();

  const [step, setStep] = useState(1);
  const [zones, setZones] = useState<AlumniZone[]>([]);
  const [isLoadingZones, setIsLoadingZones] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form State
  const [photoUrl, setPhotoUrl] = useState('');
  const [zoneId, setZoneId] = useState('');
  const [zoneSearch, setZoneSearch] = useState('');
  const [permanentAddress, setPermanentAddress] = useState('');
  const [currentCity, setCurrentCity] = useState('');
  const [currentState, setCurrentState] = useState('Kerala');
  const [currentCountry, setCurrentCountry] = useState('India');
  const [postalCode, setPostalCode] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');

  // Status & Profession
  const [currentStatus, setCurrentStatus] = useState<'Higher Studies' | 'Employed' | 'Business' | 'Research'>('Higher Studies');
  const [currentInstitution, setCurrentInstitution] = useState('');
  const [courseOrDegree, setCourseOrDegree] = useState('');
  const [designation, setDesignation] = useState('');
  const [organizationOrCompany, setOrganizationOrCompany] = useState('');

  // Pre-fill existing data if available
  useEffect(() => {
    if (currentAlumni) {
      setPhotoUrl(currentAlumni.photoUrl || '');
      setZoneId(currentAlumni.zoneId || '');
      setPermanentAddress(currentAlumni.permanentAddress || '');
      setCurrentCity(currentAlumni.currentCity || '');
      setCurrentState(currentAlumni.currentState || 'Kerala');
      setCurrentCountry(currentAlumni.currentCountry || 'India');
      setPostalCode(currentAlumni.postalCode || '');
      setWhatsappNumber(currentAlumni.whatsappNumber || currentAlumni.phone || '');
      if (currentAlumni.currentStatus) {
        setCurrentStatus(currentAlumni.currentStatus as any);
      }
      setCurrentInstitution(currentAlumni.currentInstitution || '');
      setCourseOrDegree(currentAlumni.courseOrDegree || '');
      setDesignation(currentAlumni.designation || '');
      setOrganizationOrCompany(currentAlumni.organizationOrCompany || '');
    }
  }, [currentAlumni]);

  // Load Zones
  useEffect(() => {
    if (isOpen) {
      setIsLoadingZones(true);
      fetch('/api/zones')
        .then((res) => res.json())
        .then((data) => {
          if (data.zones) setZones(data.zones);
        })
        .catch((e) => console.error('Failed to load zones:', e))
        .finally(() => setIsLoadingZones(false));
    }
  }, [isOpen]);

  const handleNextStep1 = () => {
    setErrorMsg(null);
    setStep(2); // Step 2 is Zone (REQUIRED)
  };

  const handleNextStep2 = () => {
    if (!zoneId) {
      setErrorMsg('Please select your Regional Zone / Chapter to proceed. This is mandatory.');
      return;
    }
    setErrorMsg(null);
    setStep(3); // Step 3 is Addresses
  };

  const handleNextStep3 = () => {
    setErrorMsg(null);
    setStep(4); // Step 4 is Higher Studies & Career
  };

  const handleSubmit = async () => {
    if (!currentAlumni) return;
    if (!zoneId) {
      setStep(2);
      setErrorMsg('Please select your Regional Zone / Chapter. This is mandatory.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          alumniId: currentAlumni.id,
          photoUrl: photoUrl.trim() || null,
          zoneId,
          permanentAddress: permanentAddress.trim() || null,
          currentCity: currentCity.trim() || null,
          currentState: currentState.trim() || 'Kerala',
          currentCountry: currentCountry.trim() || 'India',
          postalCode: postalCode.trim() || null,
          whatsappNumber: whatsappNumber.trim() || null,
          currentStatus,
          currentInstitution: currentInstitution.trim() || null,
          courseOrDegree: courseOrDegree.trim() || null,
          designation: designation.trim() || null,
          organizationOrCompany: organizationOrCompany.trim() || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to complete profile onboarding');
      }

      // Celebrate with Confetti!
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch (confettiErr) {
        // Ignore if unavailable
      }

      updateCurrentAlumni(data.alumni);
      await refreshAlumni();
      onCompleted();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error saving profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredZones = zones.filter((z) =>
    z.name.toLowerCase().includes(zoneSearch.toLowerCase()) ||
    z.region.toLowerCase().includes(zoneSearch.toLowerCase())
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {}} // Cannot dismiss without completing mandatory steps
      showCloseButton={false}
      maxWidth="2xl"
    >
      <div className="space-y-6">
        {/* Onboarding Header Banner */}
        <div className="text-center space-y-1.5 pb-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 dark:bg-teal-950/60 border border-[#117980]/20 text-[#117980] dark:text-[#7dc5cb] text-xs font-semibold mb-1">
            <Sparkles className="w-3.5 h-3.5 text-[#aa762b]" />
            <span>Welcome to FALAH DHDC Alumni Community</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            Complete Your Alumni Profile
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            Please complete these quick steps to set up your profile and connect with your regional chapter.
          </p>
        </div>

        {/* Step Progress Bar */}
        <div className="flex items-center justify-between relative px-2">
          <div className="absolute top-1/2 left-6 right-6 h-0.5 bg-slate-200 dark:bg-slate-800 -translate-y-1/2 -z-0" />
          {[
            { num: 1, label: 'Profile Photo', icon: Camera, optional: true },
            { num: 2, label: 'Select Zone', icon: MapPin, required: true },
            { num: 3, label: 'Address', icon: Home },
            { num: 4, label: 'Current Status', icon: Briefcase },
          ].map((s) => {
            const isDone = step > s.num;
            const isCurrent = step === s.num;
            const StepIcon = s.icon;
            return (
              <div key={s.num} className="flex flex-col items-center gap-1.5 z-10">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all ring-4 ${
                    isDone
                      ? 'bg-emerald-600 text-white ring-emerald-100 dark:ring-emerald-950/80 shadow-md'
                      : isCurrent
                      ? 'bg-[#117980] text-white ring-teal-100 dark:ring-teal-950/80 shadow-md scale-105'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-400 ring-transparent'
                  }`}
                >
                  {isDone ? <CheckCircle2 className="w-4 h-4" /> : <StepIcon className="w-4 h-4" />}
                </div>
                <span
                  className={`text-[11px] font-semibold text-center whitespace-nowrap ${
                    isCurrent
                      ? 'text-[#117980] dark:text-[#40a3ac] font-bold'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {s.label}
                  {s.required && <span className="text-rose-500 ml-0.5">*</span>}
                </span>
              </div>
            );
          })}
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* STEP 1: Profile Picture (Optional with Crop) */}
        {step === 1 && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800">
              <PhotoUploadCropper
                photoUrl={photoUrl}
                onPhotoChange={setPhotoUrl}
                name={currentAlumni?.name}
                label="Profile Picture (Optional)"
                helperText="Upload a portrait photo from your computer or phone and crop it into a neat circular avatar."
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={handleNextStep1}
                className="text-xs font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 py-2 px-3"
              >
                {photoUrl ? 'Keep Photo & Continue &rarr;' : 'Skip Photo For Now &rarr;'}
              </button>
              <button
                type="button"
                onClick={handleNextStep1}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#117980] hover:bg-[#0e646a] text-white text-xs font-bold shadow-md shadow-[#117980]/20 transition-colors"
              >
                <span>Continue to Select Zone</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Select Regional Zone / Chapter (REQUIRED) */}
        {step === 2 && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <span>Select Your Zone / Chapter</span>
                  <span className="text-rose-500">*</span>
                  <Badge variant="primary" size="sm">Required</Badge>
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Choose the chapter where you currently reside or work for localized networking and notices.
                </p>
              </div>
            </div>

            {/* Search Filter for Zones */}
            <input
              type="text"
              value={zoneSearch}
              onChange={(e) => setZoneSearch(e.target.value)}
              placeholder="Search zone (e.g. Malappuram, GCC, Edappal, UAE)..."
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none"
            />

            {/* Zones Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-60 overflow-y-auto pr-1">
              {isLoadingZones ? (
                <div className="col-span-2 py-8 text-center text-xs text-slate-400">
                  Loading institutional zones...
                </div>
              ) : filteredZones.length === 0 ? (
                <div className="col-span-2 py-6 text-center text-xs text-slate-400">
                  No zones match your search query.
                </div>
              ) : (
                filteredZones.map((z) => {
                  const isSelected = zoneId === z.id;
                  return (
                    <button
                      key={z.id}
                      type="button"
                      onClick={() => {
                        setZoneId(z.id);
                        setErrorMsg(null);
                      }}
                      className={`flex items-start gap-3 p-3 rounded-xl border text-left transition-all ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/80 dark:bg-indigo-950/60 ring-2 ring-indigo-600/30 shadow-sm'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900/60'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 mt-0.5 rounded-full border flex items-center justify-center shrink-0 ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-600 text-white'
                            : 'border-slate-300 dark:border-slate-600'
                        }`}
                      >
                        {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                      <div className="overflow-hidden">
                        <div className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                          {z.name}
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400">
                          {z.region} Chapter
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 py-2 px-3"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
              <button
                type="button"
                onClick={handleNextStep2}
                disabled={!zoneId}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md ${
                  zoneId
                    ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-600/20'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                }`}
              >
                <span>Continue to Address Details</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Addresses & Contact Details */}
        {step === 3 && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Residential & Contact Addresses
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Ensure the college administration can reach you for important circulars and community meets.
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Permanent / Home Address (House name, locality, post)
                </label>
                <textarea
                  rows={2}
                  value={permanentAddress}
                  onChange={(e) => setPermanentAddress(e.target.value)}
                  placeholder="e.g. Baitul Noor, Manoor PO, Edappal, Malappuram"
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Current Living City / Town
                  </label>
                  <input
                    type="text"
                    value={currentCity}
                    onChange={(e) => setCurrentCity(e.target.value)}
                    placeholder="e.g. Edappal, Calicut, Dubai"
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Current State / Province
                  </label>
                  <input
                    type="text"
                    value={currentState}
                    onChange={(e) => setCurrentState(e.target.value)}
                    placeholder="e.g. Kerala, Dubai"
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Country
                  </label>
                  <input
                    type="text"
                    value={currentCountry}
                    onChange={(e) => setCurrentCountry(e.target.value)}
                    placeholder="e.g. India, UAE, Saudi Arabia"
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    WhatsApp Number
                  </label>
                  <input
                    type="tel"
                    value={whatsappNumber}
                    onChange={(e) => setWhatsappNumber(e.target.value)}
                    placeholder="e.g. +91 9847123456"
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 py-2 px-3"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
              <button
                type="button"
                onClick={handleNextStep3}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 shadow-md shadow-indigo-600/20"
              >
                <span>Continue to Status</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: Higher Studies & Profession */}
        {step === 4 && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Current Activity & Professional Status
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Tell us what you are pursuing after graduating from Darul Hidaya Da&apos;wa College.
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Current Status
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(['Higher Studies', 'Employed', 'Business', 'Research'] as const).map((stat) => (
                    <button
                      key={stat}
                      type="button"
                      onClick={() => setCurrentStatus(stat)}
                      className={`px-3 py-2 text-xs font-semibold rounded-xl border text-center transition-all ${
                        currentStatus === stat
                          ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 shadow-sm'
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                      }`}
                    >
                      {stat}
                    </button>
                  ))}
                </div>
              </div>

              {currentStatus === 'Higher Studies' || currentStatus === 'Research' ? (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Current College / University
                    </label>
                    <input
                      type="text"
                      value={currentInstitution}
                      onChange={(e) => setCurrentInstitution(e.target.value)}
                      placeholder="e.g. Farook College, Darul Huda, Calicut University"
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Course / Degree / Major
                    </label>
                    <input
                      type="text"
                      value={courseOrDegree}
                      onChange={(e) => setCourseOrDegree(e.target.value)}
                      placeholder="e.g. Plus Two Science, B.A. Arabic, Degree Islamic Studies"
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Company / Organization / Workplace
                    </label>
                    <input
                      type="text"
                      value={organizationOrCompany}
                      onChange={(e) => setOrganizationOrCompany(e.target.value)}
                      placeholder="e.g. Al Zahra Logistics, Self-Employed"
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Designation / Role
                    </label>
                    <input
                      type="text"
                      value={designation}
                      onChange={(e) => setDesignation(e.target.value)}
                      placeholder="e.g. Software Engineer, Teacher, Accountant"
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                </>
              )}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setStep(3)}
                className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 py-2 px-3"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white text-xs font-bold shadow-lg shadow-indigo-600/25 transition-all transform active:scale-95 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>Saving Profile...</span>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Complete Profile Setup</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
