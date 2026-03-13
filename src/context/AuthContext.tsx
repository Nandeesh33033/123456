'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@/lib/types';
import { db } from '@/lib/db';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  loginWithGoogle: (email: string, name: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('examUser');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem('examUser');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    const foundUser = db.findUserByEmail(email);
    if (foundUser && foundUser.role === 'examiner') {
      setUser(foundUser);
      localStorage.setItem('examUser', JSON.stringify(foundUser));
      return true;
    }
    return false;
  };

  const loginWithGoogle = async (email: string, name: string): Promise<boolean> => {
    let foundUser = db.findUserByEmail(email);
    
    if (!foundUser) {
      foundUser = db.createUser({
        name,
        email,
        role: 'examiner',
        provider: 'google',
      });
    }

    setUser(foundUser);
    localStorage.setItem('examUser', JSON.stringify(foundUser));
    return true;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('examUser');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
