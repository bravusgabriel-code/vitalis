import React, { createContext, useContext, useEffect, useState } from 'react';
import { UserProfile } from '../types';
import { db } from '../db/db';
import { useLiveQuery } from 'dexie-react-hooks';

interface UserContextType {
  profile: UserProfile | undefined;
  isLoading: boolean;
  updateProfile: (profile: Partial<UserProfile>) => Promise<void>;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  register: (profile: UserProfile) => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const profile = useLiveQuery(
    () => db.userProfile.toCollection().first(),
    [],
    "LOADING" as any
  );
  const isLoading = profile === "LOADING";

  const updateProfile = async (changes: Partial<UserProfile>) => {
    const existing = await db.userProfile.toCollection().first();
    if (existing?.id) {
      await db.userProfile.update(existing.id, changes);
    } else if ('name' in changes) {
      await db.userProfile.add(changes as UserProfile);
    }
  };

  const login = async (email: string, password: string) => {
    // In a real app, this would verify with backend
    if (profile && profile.email === email && profile.password === password) {
      await updateProfile({ ...profile, isAuthenticated: true });
      return true;
    }
    return false;
  };

  const logout = async () => {
    if (profile) {
      await updateProfile({ ...profile, isAuthenticated: false });
    }
  };

  const register = async (newProfile: UserProfile) => {
    await db.userProfile.clear(); // Clear old profiles for simplicity in this demo
    await db.userProfile.add({ ...newProfile, isAuthenticated: true });
  };

  return (
    <UserContext.Provider value={{ 
      profile: profile === "LOADING" ? undefined : profile, 
      isLoading, 
      updateProfile, 
      login, 
      logout, 
      register 
    }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
