'use client';

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import {
  GraduationCap,
  Lock,
  User,
  ArrowRight,
  Sparkles,
  AlertCircle,
  Building,
  Sun,
  Moon,
  ShieldCheck,
} from 'lucide-react';

export const LoginView: React.FC = () => {
  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;

    setIsLoading(true);
    setErrorMsg(null);

    const res = await login(username.trim(), password.trim());
    if (!res.success) {
      setErrorMsg(res.error || 'Authentication failed. Please verify credentials.');
      setIsLoading(false);
    }
  };

  const handleQuickDemoAlumni = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const checkRes = await fetch('/api/alumni');
      const checkData = await checkRes.json();
      if (checkData.alumni && checkData.alumni.length > 0) {
        const firstAlm = checkData.alumni[0];
        const adm = firstAlm.admissionNumber;
        const pass = `${adm}${adm}${adm}`;
        setUsername(adm);
        setPassword(pass);
        const res = await login(adm, pass);
        if (!res.success) {
          setErrorMsg(res.error || 'Failed to authenticate alumni demo.');
        }
      } else {
        setErrorMsg('No alumni records in the database yet. Log in as Super Admin and use the Excel Bulk Import tool to import alumni!');
      }
    } catch {
      setErrorMsg('Alumni records not initialized yet. Please import via Admin Excel tool.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemoAdmin = async () => {
    setUsername('admin');
    setPassword('26-27ofdhdcportal');
    setIsLoading(true);
    setErrorMsg(null);
    let res = await login('admin', '26-27ofdhdcportal');
    if (!res.success) {
      res = await login('admin', 'admin123');
    }
    if (!res.success) {
      setErrorMsg(res.error || 'Admin login failed');
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 sm:p-6 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors relative overflow-hidden">
      {/* Decorative gradient blurs */}
      <div className="absolute top-0 -left-20 w-96 h-96 bg-indigo-500/10 dark:bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 -right-20 w-96 h-96 bg-violet-500/10 dark:bg-violet-500/15 rounded-full blur-3xl pointer-events-none" />

      {/* Theme Toggle Top Right */}
      <div className="absolute top-4 right-4 z-10">
        <button
          onClick={toggleTheme}
          className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 shadow-sm"
          aria-label="Toggle Theme"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
        </button>
      </div>

      <div className="w-full max-w-md space-y-6 relative z-10">
        {/* Institutional Crest */}
        <div className="text-center space-y-2.5">
          <div className="w-20 h-24 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center justify-center p-2 mx-auto shadow-xl shadow-teal-950/10 ring-4 ring-[#117980]/15">
            <img
              src="/logo.png"
              alt="FALAH DHDC Logo"
              className="h-20 w-auto object-contain filter drop-shadow-md"
            />
          </div>

          <div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white uppercase flex items-center justify-center gap-2">
              <span className="text-[#117980] dark:text-[#40a3ac]">FALAH</span>
              <span className="text-[#aa762b] dark:text-[#dec18e]">DHDC</span>
            </h1>
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mt-0.5">
              Alumni of Darul Hidaya Da&apos;wa College, Manoor
            </p>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 dark:bg-teal-950/50 border border-[#117980]/20 text-[#117980] dark:text-[#7dc5cb] text-[10px] font-bold uppercase tracking-wider mt-2">
              <Sparkles className="w-3 h-3 text-[#aa762b]" />
              <span>Official Alumni Network Portal</span>
            </div>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
              Manoor, P.O. Edappal, Malappuram Dt., Kerala 679578
            </p>
          </div>
        </div>

        {/* Card */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none space-y-5">
          {errorMsg && (
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Alumni Portal Banner */}
          <div className="p-2.5 rounded-xl bg-teal-50/60 dark:bg-teal-950/30 border border-[#117980]/20 text-[11px] text-[#0e646a] dark:text-[#7dc5cb] text-center font-medium">
            Exclusively for registered DHDC Alumni. Student logins are disabled.
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Alumni Admission Number / Username
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. 1001 or admin"
                  className="w-full pl-10 pr-3.5 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-[#117980] outline-none transition-all font-medium"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Password
                </label>
                <span className="text-[11px] text-slate-400">
                  Default: repeat Admission No 3x
                </span>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-3.5 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-[#117980] outline-none transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-[#117980] to-[#0e646a] hover:from-[#0e646a] hover:to-[#0b5156] text-white text-xs font-bold shadow-lg shadow-[#117980]/25 transition-all transform active:scale-95 disabled:opacity-50"
            >
              {isLoading ? (
                <span>Signing in...</span>
              ) : (
                <>
                  <span>Sign In to Alumni Portal</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Access Buttons */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 space-y-2">
            <p className="text-[11px] text-center font-semibold text-slate-400 uppercase tracking-wider">
              Quick One-Click Test Login
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={handleQuickDemoAdmin}
                className="py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold transition-colors text-center"
              >
                Super Admin
              </button>
              <button
                type="button"
                onClick={handleQuickDemoAlumni}
                className="py-2 px-3 rounded-xl bg-teal-50 dark:bg-teal-950/60 hover:bg-teal-100 dark:hover:bg-teal-900 text-[#117980] dark:text-[#7dc5cb] font-semibold transition-colors text-center border border-[#117980]/30"
              >
                Demo Alumnus (1001)
              </button>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <p className="text-center text-[11px] text-slate-400 dark:text-slate-500">
          FALAH DHDC • Alumni of Darul Hidaya Da&apos;wa College, Manoor
        </p>
      </div>
    </div>
  );
};
