'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { User, Bike } from '@/types';

interface AuthContextType {
  user: User | null;
  bikes: Bike[];
  activeBike: Bike | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  switchActiveBike: (bikeId: string) => Promise<void>;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [bikes, setBikes] = useState<Bike[]>([]);
  const [activeBike, setActiveBike] = useState<Bike | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const refreshUserData = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setUser(json.data.user);
          setBikes(json.data.bikes || []);
          const active = (json.data.bikes || []).find((b: Bike) => b.isActive) || json.data.bikes?.[0] || null;
          setActiveBike(active);
          // Cache in local storage for offline PWA
          try {
            localStorage.setItem('ridefuel_user', JSON.stringify(json.data.user));
            localStorage.setItem('ridefuel_bikes', JSON.stringify(json.data.bikes || []));
          } catch (e) {}
          return;
        }
      }
      // If 401 or failed, check local storage for offline mode
      const cachedUser = localStorage.getItem('ridefuel_user');
      const cachedBikes = localStorage.getItem('ridefuel_bikes');
      if (cachedUser && !navigator.onLine) {
        const parsedUser = JSON.parse(cachedUser);
        const parsedBikes = cachedBikes ? JSON.parse(cachedBikes) : [];
        setUser(parsedUser);
        setBikes(parsedBikes);
        setActiveBike(parsedBikes.find((b: Bike) => b.isActive) || parsedBikes[0] || null);
      } else {
        setUser(null);
        setBikes([]);
        setActiveBike(null);
      }
    } catch (error) {
      // Network failed - attempt offline cached load
      try {
        const cachedUser = localStorage.getItem('ridefuel_user');
        const cachedBikes = localStorage.getItem('ridefuel_bikes');
        if (cachedUser) {
          const parsedUser = JSON.parse(cachedUser);
          const parsedBikes = cachedBikes ? JSON.parse(cachedBikes) : [];
          setUser(parsedUser);
          setBikes(parsedBikes);
          setActiveBike(parsedBikes.find((b: Bike) => b.isActive) || parsedBikes[0] || null);
        }
      } catch (e) {}
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUserData();
  }, [refreshUserData]);

  const login = async (email: string, password: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        return { success: false, error: json.error || 'Login failed' };
      }
      await refreshUserData();
      return { success: true };
    } catch (e: unknown) {
      return { success: false, error: 'Network error or offline mode' };
    }
  };

  const signup = async (name: string, email: string, password: string) => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        return { success: false, error: json.error || 'Registration failed' };
      }
      await refreshUserData();
      return { success: true };
    } catch (e: unknown) {
      return { success: false, error: 'Network error or offline mode' };
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {}
    try {
      localStorage.removeItem('ridefuel_user');
      localStorage.removeItem('ridefuel_bikes');
    } catch (e) {}
    setUser(null);
    setBikes([]);
    setActiveBike(null);
    router.push('/login');
  };

  const switchActiveBike = async (bikeId: string) => {
    try {
      const res = await fetch(`/api/bikes/${bikeId}/activate`, {
        method: 'POST',
      });
      if (res.ok) {
        await refreshUserData();
      }
    } catch (e) {
      console.warn('Failed to switch active bike online:', e);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        bikes,
        activeBike,
        loading,
        login,
        signup,
        logout,
        switchActiveBike,
        refreshUserData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
