'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Badge } from '../common/Badge';
import { PhotoUploadCropper } from '../common/PhotoUploadCropper';
import {
  User,
  Camera,
  MapPin,
  Home,
  Briefcase,
  Phone,
  Mail,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Save,
  GraduationCap,
  Building,
  Sparkles,
} from 'lucide-react';
import type { AlumniZone } from '../../types';

export const AlumniProfileView: React.FC = () => {
  const { currentUser, currentAlumni, updateCurrentAlumni, refreshAlumni } = useAuth();

  const [zones, setZones] = useState<AlumniZone[]>([]);
  const [photoUrl, setPhotoUrl] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [email, setEmail] = useState('');
  const [zoneId, setZoneId] = useState('');
  const [permanentAddress, setPermanentAddress] = useState('');
  const [currentCity, setCurrentCity] = useState('');
  const [currentState, setCurrentState] = useState('Kerala');
  const [currentCountry, setCurrentCountry] = useState('India');
  const [postalCode, setPostalCode] = useState('');
  const [currentStatus, setCurrentStatus] = useState('Higher Studies');
  const [currentInstitution, setCurrentInstitution] = useState('');
  const [courseOrDegree, setCourseOrDegree] = useState('');
  const [organizationOrCompany, setOrganizationOrCompany] = useState('');
  const [designation, setDesignation] = useState('');
  const [bio, setBio] = useState('');
  const [showContactNumber, setShowContactNumber] = useState(false);
  const [willingToMentor, setWillingToMentor] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // IFLAH Fund status for the current alumnus
  const [fundMetrics, setFundMetrics] = useState<any>(null);

  useEffect(() => {
    if (currentAlumni?.id) {
      fetch(`/api/donations?alumniId=${encodeURIComponent(currentAlumni.id)}`)
        .then((r) => r.json())
        .then((d) => {
          if (d.success && d.alumnusCurrentMetrics) {
            setFundMetrics(d.alumnusCurrentMetrics);
          }
        })
        .catch(() => {});
    }
  }, [currentAlumni?.id]);

  useEffect(() => {
    fetch('/api/zones')
      .then((r) => r.json())
      .then((d) => {
        if (d.zones) setZones(d.zones);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (currentAlumni) {
      setPhotoUrl(currentAlumni.photoUrl || '');
      setName(currentAlumni.name || '');
      setPhone(currentAlumni.phone || '');
      setWhatsappNumber(currentAlumni.whatsappNumber || '');
      setEmail(currentAlumni.email || '');
      setZoneId(currentAlumni.zoneId || '');
      setPermanentAddress(currentAlumni.permanentAddress || '');
      setCurrentCity(currentAlumni.currentCity || '');
      setCurrentState(currentAlumni.currentState || 'Kerala');
      setCurrentCountry(currentAlumni.currentCountry || 'India');
      setPostalCode(currentAlumni.postalCode || '');
      setCurrentStatus(currentAlumni.currentStatus || 'Higher Studies');
      setCurrentInstitution(currentAlumni.currentInstitution || '');
      setCourseOrDegree(currentAlumni.courseOrDegree || '');
      setOrganizationOrCompany(currentAlumni.organizationOrCompany || '');
      setDesignation(currentAlumni.designation || '');
      setBio(currentAlumni.bio || '');
      setShowContactNumber(currentAlumni.showContactNumber === true);
      setWillingToMentor(currentAlumni.willingToMentor === true);
    }
  }, [currentAlumni]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentAlumni) return;

    setIsSaving(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/alumni', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: currentAlumni.id,
          admissionNumber: currentAlumni.admissionNumber,
          name,
          passoutBatchYear: currentAlumni.passoutBatchYear,
          photoUrl: photoUrl.trim() || null,
          phone: phone.trim() || null,
          whatsappNumber: whatsappNumber.trim() || null,
          email: email.trim() || null,
          zoneId: zoneId || null,
          permanentAddress: permanentAddress.trim() || null,
          currentCity: currentCity.trim() || null,
          currentState: currentState.trim() || 'Kerala',
          currentCountry: currentCountry.trim() || 'India',
          postalCode: postalCode.trim() || null,
          currentStatus,
          currentInstitution: currentInstitution.trim() || null,
          courseOrDegree: courseOrDegree.trim() || null,
          organizationOrCompany: organizationOrCompany.trim() || null,
          designation: designation.trim() || null,
          bio: bio.trim() || null,
          showContactNumber,
          willingToMentor,
          isProfileCompleted: true,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save profile');

      updateCurrentAlumni(data.alumni);
      await refreshAlumni();
      setSuccessMsg('Your profile has been saved successfully!');
    } catch (err: any) {
      setErrorMsg(err.message || 'Error saving profile');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>My Dossier & Profile</span>
            <Badge variant="primary" size="sm">
              Batch of {currentAlumni?.passoutBatchYear || 'Alumni'}
            </Badge>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manage your personal contact info, regional chapter, and academic/career updates.
          </p>
        </div>
      </div>

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

      {/* IFLAH Fund Collection Status Card with RED BADGE if unpaid */}
      {fundMetrics && (
        <div
          className={`p-5 rounded-2xl border shadow-sm transition-all ${
            fundMetrics.status === 'COMPLETED'
              ? 'bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60'
              : fundMetrics.status === 'PARTIAL'
              ? 'bg-amber-50/70 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/60'
              : 'bg-rose-50/70 dark:bg-rose-950/25 border-rose-200 dark:border-rose-800/80 ring-1 ring-rose-500/20'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2.5">
              <span
                className={`w-3 h-3 rounded-full shrink-0 ${
                  fundMetrics.status === 'COMPLETED'
                    ? 'bg-emerald-500 ring-4 ring-emerald-500/20'
                    : fundMetrics.status === 'PARTIAL'
                    ? 'bg-amber-500 ring-4 ring-amber-500/20'
                    : 'bg-rose-500 ring-4 ring-rose-500/20 animate-pulse'
                }`}
              />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>IFLAH Fund Collection Status</span>
                <span className="text-xs font-normal text-slate-500 dark:text-slate-400 font-mono">
                  ({fundMetrics.cycleLabel})
                </span>
              </h3>
            </div>

            <div>
              {fundMetrics.status === 'COMPLETED' ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-600 text-white shadow-sm">
                  🟢 Fully Paid &amp; Cleared (₹{fundMetrics.paidAmount})
                </span>
              ) : fundMetrics.status === 'PARTIAL' ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500 text-white shadow-sm">
                  🟠 Partially Paid (₹{fundMetrics.paidAmount} / ₹{fundMetrics.targetAmount})
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-600 text-white shadow-sm animate-pulse ring-2 ring-rose-600/30">
                  🔴 Unpaid • Due: ₹{fundMetrics.balanceAmount}
                </span>
              )}
            </div>
          </div>

          {fundMetrics.levelsBreakdown && fundMetrics.levelsBreakdown.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 pt-2 border-t border-slate-200/50 dark:border-slate-800/80">
              {fundMetrics.levelsBreakdown.map((l: any) => (
                <div
                  key={l.levelId}
                  className={`p-2.5 rounded-xl border flex items-center justify-between text-xs ${
                    l.isPaid
                      ? 'bg-white/80 dark:bg-slate-900/60 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-300'
                      : 'bg-white/80 dark:bg-slate-900/60 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-300'
                  }`}
                >
                  <div>
                    <span className="font-bold block">{l.levelName}</span>
                    <span className="text-[11px] opacity-75">Target: ₹{l.target}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold block">₹{l.paid}</span>
                    <span className={`text-[10px] font-bold ${l.isPaid ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {l.isPaid ? 'Paid ✓' : `Due: ₹${l.balance}`}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {fundMetrics.status !== 'COMPLETED' && (
            <p className="text-[11px] text-rose-700 dark:text-rose-300 mt-2 font-medium">
              ⚠️ All registered alumni are required to pay the IFLAH Fund collection across Rabee&apos; &amp; Ramadan instalments.
            </p>
          )}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Photo and Identity */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <PhotoUploadCropper
            photoUrl={photoUrl}
            onPhotoChange={setPhotoUrl}
            name={name}
            label="Profile Photo"
            helperText="Upload a personal photo. You can drag to position and zoom to crop a clear circular avatar."
          />

          <div className="flex flex-wrap items-center gap-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 text-xs text-slate-500">
            <span>Admission No: <strong className="text-slate-800 dark:text-slate-200">{currentAlumni?.admissionNumber}</strong></span>
            <span>Batch: <strong className="text-slate-800 dark:text-slate-200">{currentAlumni?.passoutBatchYear}</strong></span>
            <span>Class: <strong className="text-slate-800 dark:text-slate-200">{currentAlumni?.completedClass || '10th Standard'}</strong></span>
          </div>
        </div>

        {/* Basic & Zone Info */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <User className="w-4 h-4 text-indigo-500" />
            <span>Basic & Regional Chapter Information</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Regional Zone / Chapter *
              </label>
              <select
                required
                value={zoneId}
                onChange={(e) => setZoneId(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 outline-none"
              >
                <option value="">Select Your Chapter</option>
                {zones.map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.name} ({z.region})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 9847000000"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                WhatsApp Number
              </label>
              <input
                type="tel"
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                placeholder="+91 9847000000"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="alumni@example.com"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Addresses */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Home className="w-4 h-4 text-emerald-500" />
            <span>Addresses & Geography</span>
          </h3>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Permanent Address (House name, Post Office, Locality)
              </label>
              <textarea
                rows={2}
                value={permanentAddress}
                onChange={(e) => setPermanentAddress(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Current City
                </label>
                <input
                  type="text"
                  value={currentCity}
                  onChange={(e) => setCurrentCity(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 outline-none"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Current State
                </label>
                <input
                  type="text"
                  value={currentState}
                  onChange={(e) => setCurrentState(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 outline-none"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Current Country
                </label>
                <input
                  type="text"
                  value={currentCountry}
                  onChange={(e) => setCurrentCountry(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Current Activity & Higher Studies */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-indigo-500" />
            <span>Higher Education & Professional Activity</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Current Status
              </label>
              <select
                value={currentStatus}
                onChange={(e) => setCurrentStatus(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 outline-none"
              >
                <option value="Higher Studies">Higher Studies</option>
                <option value="Employed">Employed / Job</option>
                <option value="Business">Business / Entrepreneur</option>
                <option value="Research">Research & Academics</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                College / University / Organization
              </label>
              <input
                type="text"
                value={currentInstitution || organizationOrCompany}
                onChange={(e) => {
                  setCurrentInstitution(e.target.value);
                  setOrganizationOrCompany(e.target.value);
                }}
                placeholder="e.g. Farook College, Darul Huda, or Company name"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Course / Degree / Designation
              </label>
              <input
                type="text"
                value={courseOrDegree || designation}
                onChange={(e) => {
                  setCourseOrDegree(e.target.value);
                  setDesignation(e.target.value);
                }}
                placeholder="e.g. Plus Two Science, B.A. English, Software Engineer"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Bio / Personal Note
              </label>
              <input
                type="text"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Short bio or aspirations"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving Changes...' : 'Save Profile Changes'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
