'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User, Alumni } from '../types';

interface AuthContextType {
  currentUser: User | null;
  currentAlumni: Alumni | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password?: string) => Promise<{ success: boolean; error?: string; user?: User; alumni?: Alumni }>;
  logout: () => void;
  updateCurrentAlumni: (updated: Partial<Alumni>) => void;
  refreshAlumni: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_USER_KEY = 'dhdc_alumni_user';
const AUTH_ALUMNI_KEY = 'dhdc_alumni_profile';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentAlumni, setCurrentAlumni] = useState<Alumni | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem(AUTH_USER_KEY);
      const storedAlumni = localStorage.getItem(AUTH_ALUMNI_KEY);
      if (storedUser) {
        setCurrentUser(JSON.parse(storedUser));
      }
      if (storedAlumni) {
        setCurrentAlumni(JSON.parse(storedAlumni));
      }
    } catch (e) {
      console.error('Failed to load session:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = async (username: string, password?: string) => {
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Authentication failed' };
      }

      setCurrentUser(data.user);
      setCurrentAlumni(data.alumni || null);

      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(data.user));
      if (data.alumni) {
        localStorage.setItem(AUTH_ALUMNI_KEY, JSON.stringify(data.alumni));
      } else {
        localStorage.removeItem(AUTH_ALUMNI_KEY);
      }

      return { success: true, user: data.user, alumni: data.alumni };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Network error during login' };
    }
  };

  const logout = () => {
    setCurrentUser(null);
    setCurrentAlumni(null);
    localStorage.removeItem(AUTH_USER_KEY);
    localStorage.removeItem(AUTH_ALUMNI_KEY);
  };

  const updateCurrentAlumni = (updated: Partial<Alumni>) => {
    if (!currentAlumni) return;
    const merged = { ...currentAlumni, ...updated } as Alumni;
    setCurrentAlumni(merged);
    localStorage.setItem(AUTH_ALUMNI_KEY, JSON.stringify(merged));
  };

  const refreshAlumni = async () => {
    if (!currentUser?.admissionNumber && !currentUser?.alumniId) return;
    try {
      const idOrAdm = currentUser.alumniId || currentUser.admissionNumber;
      const res = await fetch(`/api/alumni?id=${encodeURIComponent(idOrAdm!)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.alumni) {
          setCurrentAlumni(data.alumni);
          localStorage.setItem(AUTH_ALUMNI_KEY, JSON.stringify(data.alumni));
        }
      }
    } catch (e) {
      console.warn('Could not refresh alumni profile:', e);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        currentAlumni,
        isAuthenticated: !!currentUser,
        isLoading,
        login,
        logout,
        updateCurrentAlumni,
        refreshAlumni,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
