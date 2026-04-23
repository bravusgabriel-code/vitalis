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
      console.log("Sincronizando mudanças com Supabase:", changes);
      const supabaseChanges: any = {
        id: session.user.id,
        updated_at: new Date().toISOString()
      };

      if (changes.name) supabaseChanges.nome = changes.name;
      if (changes.email) supabaseChanges.email = changes.email;
      if (changes.birthDate) supabaseChanges.data_nascimento = changes.birthDate;
      if (changes.city) supabaseChanges.cidade = changes.city;
      if (changes.state) supabaseChanges.estado = changes.state;
      if (changes.weight) supabaseChanges.peso = changes.weight;
      if (changes.height) supabaseChanges.altura = changes.height;
      if (changes.gender) supabaseChanges.genero = changes.gender;
      if (changes.xp !== undefined) supabaseChanges.xp = changes.xp;
      if (changes.level !== undefined) supabaseChanges.nivel = changes.level;
      if (changes.streak !== undefined) supabaseChanges.streak = changes.streak;

      try {
        const { error: syncError } = await supabase
          .from('profiles')
          .upsert(supabaseChanges);
          
        if (syncError) {
          console.error("Erro na sincronização silenciosa:", syncError);
        }
      } catch (e) {
        console.error("Exceção na sincronização:", e);
      }
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
    console.log("Chamando supabase.auth.signUp...");
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

    console.log("Resultado signUp:", { data, error });

    if (error) {
      console.error("Erro no signUp:", error);
      throw error;
    }

    if (data.user) {
      console.log("Usuário criado no Auth. ID:", data.user.id);
      const profileToSave = { 
        ...newProfile, 
        id: data.user.id,
        isAuthenticated: true 
      };
      delete (profileToSave as any).password; // Don't store password in public table

      console.log("Limpando Dexie e salvando perfil local...");
      await db.userProfile.clear();
      await db.userProfile.add(profileToSave);

      console.log("Upserting perfil no Supabase...");
      // Explicitly insert into profiles table (though trigger should handle it, 
      // this ensures immediate data consistency for the client)
      const { error: upsertError } = await supabase.from('profiles').upsert({
        id: data.user.id,
        nome: profileToSave.name,
        email: profileToSave.email,
        data_nascimento: profileToSave.birthDate,
        cidade: profileToSave.city,
        estado: profileToSave.state,
        peso: profileToSave.weight,
        altura: profileToSave.height,
        genero: profileToSave.gender,
        xp: profileToSave.xp,
        nivel: profileToSave.level,
        streak: profileToSave.streak,
        updated_at: new Date().toISOString()
      });

      if (upsertError) {
        console.error("Erro no upsert do perfil:", upsertError);
        // We don't necessarily throw here if Auth succeeded, but it's good to know
      } else {
        console.log("Perfil sincronizado com Supabase");
      }
    } else {
      console.warn("Nenhum usuário retornado no data. Talvez confirmação de e-mail pendente?");
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
