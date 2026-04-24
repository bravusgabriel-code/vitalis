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
      if (changes.hasDoctor !== undefined) supabaseChanges.has_doctor = changes.hasDoctor;
      if (changes.doctorName !== undefined) supabaseChanges.doctor_name = changes.doctorName;
      if (changes.doctorId !== undefined) supabaseChanges.doctor_id = changes.doctorId;
      if (changes.xp !== undefined) supabaseChanges.xp = changes.xp;
      if (changes.level !== undefined) supabaseChanges.nivel = changes.level;
      if (changes.streak !== undefined) supabaseChanges.streak = changes.streak;

      try {
        await supabase.from('profiles').upsert(supabaseChanges);
      } catch (e) {
        console.error("Erro na sincronização Supabase:", e);
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
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();
      
      if (profileData) {
        // Map snake_case from DB to camelCase in App
        const mappedProfile: UserProfile = {
          ...profileData,
          name: profileData.nome,
          birthDate: profileData.data_nascimento,
          city: profileData.cidade,
          state: profileData.estado,
          weight: profileData.peso,
          height: profileData.altura,
          gender: profileData.genero,
          hasDoctor: profileData.has_doctor,
          doctorName: profileData.doctor_name,
          doctorId: profileData.doctor_id,
          level: profileData.nivel,
          isAuthenticated: true
        };
        await db.userProfile.clear();
        await db.userProfile.add(mappedProfile);
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
      if (error.message.includes('Database error saving new user')) {
        throw new Error('Erro no Banco de Dados ao salvar usuário. Certifique-se de que a tabela "profiles" existe e o trigger está correto (ver SUPABASE_SETUP.sql).');
      }
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
      try {
        const supabaseUpdate: any = {
          id: data.user.id,
          nome: profileToSave.name,
          email: profileToSave.email,
          cpf: profileToSave.cpf,
          data_nascimento: profileToSave.birthDate || null,
          cidade: profileToSave.city || null,
          estado: profileToSave.state || null,
          peso: profileToSave.weight || null,
          altura: profileToSave.height || null,
          genero: profileToSave.gender || null,
          has_doctor: profileToSave.hasDoctor || false,
          doctor_name: profileToSave.doctorName || null,
          xp: profileToSave.xp || 0,
          nivel: profileToSave.level || 1,
          streak: profileToSave.streak || 0,
          updated_at: new Date().toISOString()
        };

        // Only add doctor_id if it's a valid non-empty string
        if (profileToSave.doctorId && profileToSave.doctorId.trim() !== '') {
          supabaseUpdate.doctor_id = profileToSave.doctorId;
        } else {
          // Explicitly null if empty to avoid empty string UUID error
          supabaseUpdate.doctor_id = null;
        }

        console.log("DEBUG Supabase Update Object:", supabaseUpdate);
        const { error: upsertError } = await supabase.from('profiles').upsert(supabaseUpdate);

        if (upsertError) {
          console.error("Erro no upsert profiles:", upsertError);
          // If code is PGRST204 (No rows returned) or similar, it might be a policy issue
          throw new Error(`Erro ao salvar perfil no Supabase: ${upsertError.message} (Code: ${upsertError.code})`);
        }
        console.log("Upsert concluído com sucesso.");
      } catch (e: any) {
        console.error("Exceção no registro Supabase:", e);
        throw e;
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
