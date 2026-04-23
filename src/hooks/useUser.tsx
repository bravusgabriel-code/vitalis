import React, { createContext, useContext, useEffect, useState } from 'react';
import { UserProfile } from '../types';
import { db } from '../db/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { supabase } from '../lib/supabase';
import { Session } from '@supabase/supabase-js';

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

  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const updateProfile = async (changes: Partial<UserProfile>) => {
    const existing = await db.userProfile.toCollection().first();
    const updated = existing ? { ...existing, ...changes } : changes as UserProfile;
    
    if (existing?.id) {
      await db.userProfile.update(existing.id, changes);
    } else if (updated.name) {
      await db.userProfile.add(updated);
    }

    // Sync with Supabase if authenticated
    if (session?.user) {
      await supabase
        .from('profiles')
        .upsert({
          id: session.user.id,
          ...changes,
          updated_at: new Date().toISOString(),
        });
    }
  };

  const login = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('Login error:', error.message);
      return false;
    }

    if (data.user) {
      // Fetch profile from Supabase
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();
      
      if (profileData) {
        await db.userProfile.clear();
        await db.userProfile.add({ ...profileData, isAuthenticated: true });
      }
      return true;
    }
    return false;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    if (profile) {
      await db.userProfile.update(profile.id!, { isAuthenticated: false });
    }
    await db.userProfile.clear();
  };

  const register = async (newProfile: UserProfile) => {
    const { data, error } = await supabase.auth.signUp({
      email: newProfile.email,
      password: newProfile.password!,
      options: {
        data: {
          name: newProfile.name,
          cpf: newProfile.cpf
        }
      }
    });

    if (error) throw error;

    if (data.user) {
      const profileToSave = { 
        ...newProfile, 
        id: data.user.id,
        isAuthenticated: true 
      };
      delete (profileToSave as any).password; // Don't store password in public table

      await db.userProfile.clear();
      await db.userProfile.add(profileToSave);

      // Explicitly insert into profiles table (though trigger should handle it, 
      // this ensures immediate data consistency for the client)
      await supabase.from('profiles').upsert({
        id: data.user.id,
        ...profileToSave,
        updated_at: new Date().toISOString()
      });
    }
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
