import React, { createContext, useContext, useEffect, useState } from 'react';
import { UserProfile } from '../types';
import { db } from '../db/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { supabase } from '../lib/supabase';
import { Session } from '@supabase/supabase-js';
import { getAgeFromBirthDate } from '../lib/fitnessUtils';
import { 
  calculateBMR, 
  calculateTDEE, 
  getCalorieTarget, 
  calculateMacros 
} from '../services/metabolicService';

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
    let updated = existing ? { ...existing, ...changes } : changes as UserProfile;
    
    // Recalcular TDEE e Macros se dados físicos ou objetivos mudarem
    if (
      changes.weight || changes.height || changes.birthDate || 
      changes.gender || changes.activityLevel || changes.goal || changes.calorieStrategy
    ) {
      const weight = changes.weight || existing?.weight || 0;
      const height = changes.height || existing?.height || 0;
      const birthDate = changes.birthDate || existing?.birthDate || '';
      const gender = changes.gender || existing?.gender || 'other';
      const activityLevel = changes.activityLevel || existing?.activityLevel || 1.2;
      const goal = changes.goal || existing?.goal || 'maintain';
      const strategy = changes.calorieStrategy || existing?.calorieStrategy || 'maintain';
      
      const age = getAgeFromBirthDate(birthDate);
      const bmr = calculateBMR(weight, height, age, gender);
      const tdee = calculateTDEE(bmr, activityLevel);
      const targetCalories = getCalorieTarget(tdee, strategy);
      const macros = calculateMacros(targetCalories, weight, goal, strategy);
      
      const calculatedChanges = {
        bmr,
        tdee,
        targetCalories,
        targetProtein: macros.protein,
        targetCarbs: macros.carbs,
        targetFat: macros.fat,
        age
      };

      updated = { ...updated, ...calculatedChanges };
      Object.assign(changes, calculatedChanges);
    }

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

      // Basic mapping - using same names now where possible
      if (changes.name) supabaseChanges.name = changes.name;
      if (changes.email) supabaseChanges.email = changes.email;
      if (changes.birthDate) supabaseChanges.birth_date = changes.birthDate;
      if (changes.city) supabaseChanges.city = changes.city;
      if (changes.state) supabaseChanges.state = changes.state;
      if (changes.weight) supabaseChanges.weight = changes.weight;
      if (changes.height) supabaseChanges.height = changes.height;
      if (changes.gender) supabaseChanges.gender = changes.gender;
      if (changes.age) supabaseChanges.age = changes.age;
      
      // Activity and Goals
      if (changes.activityLevel) {
        supabaseChanges.activity_multiplier = changes.activityLevel;
        // Map multiplier to text label
        if (changes.activityLevel <= 1.2) supabaseChanges.activity_level = 'sedentary';
        else if (changes.activityLevel <= 1.375) supabaseChanges.activity_level = 'light';
        else if (changes.activityLevel <= 1.55) supabaseChanges.activity_level = 'moderate';
        else if (changes.activityLevel <= 1.725) supabaseChanges.activity_level = 'active';
        else supabaseChanges.activity_level = 'very_active';
      }
      
      if (changes.goal) supabaseChanges.goal_type = changes.goal;
      if (changes.goalValue) supabaseChanges.goal_value = changes.goalValue;
      if (changes.goalTargetWeight) supabaseChanges.goal_target_weight = changes.goalTargetWeight;
      if (changes.goalDeadline) supabaseChanges.goal_deadline = changes.goalDeadline;
      if (changes.calorieStrategy) supabaseChanges.calorie_strategy = changes.calorieStrategy;
      
      // Metabolic fields
      if (changes.bmr !== undefined) supabaseChanges.bmr = changes.bmr;
      if (changes.tdee !== undefined) supabaseChanges.tdee = changes.tdee;
      if (changes.targetCalories !== undefined) supabaseChanges.target_calories = changes.targetCalories;
      if (changes.targetDeficit !== undefined) supabaseChanges.target_deficit = changes.targetDeficit;
      if (changes.targetProtein !== undefined) supabaseChanges.target_protein = changes.targetProtein;
      if (changes.targetCarbs !== undefined) supabaseChanges.target_carbs = changes.targetCarbs;
      if (changes.targetFat !== undefined) supabaseChanges.target_fat = changes.targetFat;
      if (changes.targetBalance !== undefined) supabaseChanges.target_balance = changes.targetBalance;
      
      // App Specific
      if (changes.waterGoal !== undefined) supabaseChanges.water_goal = changes.waterGoal;
      if (changes.hasDoctor !== undefined) supabaseChanges.has_doctor = changes.hasDoctor;
      if (changes.doctorName !== undefined) supabaseChanges.doctor_name = changes.doctorName;
      if (changes.doctorId !== undefined) supabaseChanges.doctor_id = changes.doctorId;
      if (changes.xp !== undefined) supabaseChanges.xp = changes.xp;
      if (changes.level !== undefined) supabaseChanges.level = changes.level;
      if (changes.streak !== undefined) supabaseChanges.streak = changes.streak;
      if (changes.achievements) supabaseChanges.achievements = changes.achievements;
      if (changes.totalWeightLifted !== undefined) supabaseChanges.total_weight_lifted = changes.totalWeightLifted;
      if (changes.totalCardioDistance !== undefined) supabaseChanges.total_cardio_distance = changes.totalCardioDistance;
      if (changes.waterDaysCount !== undefined) supabaseChanges.water_days_count = changes.waterDaysCount;
      if (changes.nutritionDaysCount !== undefined) supabaseChanges.nutrition_days_count = changes.nutritionDaysCount;
      if (changes.missionsCompletedCount !== undefined) supabaseChanges.missions_completed_count = changes.missionsCompletedCount;
      if (changes.appUsageDaysCount !== undefined) supabaseChanges.app_usage_days_count = changes.appUsageDaysCount;
      if (changes.lastActiveDate) supabaseChanges.last_active_date = changes.lastActiveDate;

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
        // Direct mapping now that we unified field names
        const mappedProfile: UserProfile = {
          ...profileData,
          name: profileData.name || profileData.nome, // Fallback for transition
          email: profileData.email,
          cpf: profileData.cpf,
          birthDate: profileData.birth_date || profileData.data_nascimento,
          city: profileData.city || profileData.cidade,
          state: profileData.state || profileData.estado,
          weight: profileData.weight || profileData.peso,
          height: profileData.height || profileData.altura,
          age: profileData.age || profileData.idade || getAgeFromBirthDate(profileData.birth_date || profileData.data_nascimento),
          gender: profileData.gender || profileData.genero,
          goal: profileData.goal_type || profileData.goal || 'maintain',
          activityLevel: profileData.activity_multiplier || profileData.activity_level || 1.2,
          waterGoal: profileData.water_goal || 2500,
          
          bmr: profileData.bmr,
          tdee: profileData.tdee,
          targetCalories: profileData.target_calories,
          targetProtein: profileData.target_protein,
          targetCarbs: profileData.target_carbs,
          targetFat: profileData.target_fat,
          targetDeficit: profileData.target_deficit,
          targetBalance: profileData.target_balance,
          
          goalValue: profileData.goal_value,
          goalTargetWeight: profileData.goal_target_weight,
          goalDeadline: profileData.goal_deadline,
          calorieStrategy: profileData.calorie_strategy,
          
          hasDoctor: profileData.has_doctor,
          doctorName: profileData.doctor_name,
          doctorId: profileData.doctor_id,
          
          xp: profileData.xp || 0,
          level: profileData.level || profileData.nivel || 1,
          streak: profileData.streak || 0,
          achievements: profileData.achievements || [],
          totalWeightLifted: profileData.total_weight_lifted || 0,
          totalCardioDistance: profileData.total_cardio_distance || 0,
          waterDaysCount: profileData.water_days_count || 0,
          nutritionDaysCount: profileData.nutrition_days_count || 0,
          missionsCompletedCount: profileData.missions_completed_count || 0,
          appUsageDaysCount: profileData.app_usage_days_count || 0,
          lastActiveDate: profileData.last_active_date,
          
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
      
      const age = getAgeFromBirthDate(newProfile.birthDate);
      const bmr = calculateBMR(newProfile.weight, newProfile.height, age, newProfile.gender);
      const tdee = calculateTDEE(bmr, newProfile.activityLevel);
      const targetCalories = getCalorieTarget(tdee, newProfile.calorieStrategy || 'maintain');
      const macros = calculateMacros(targetCalories, newProfile.weight, newProfile.goal);

      const profileToSave = { 
        ...newProfile, 
        id: data.user.id,
        age,
        bmr,
        tdee,
        targetCalories,
        targetProtein: macros.protein,
        targetCarbs: macros.carbs,
        targetFat: macros.fat,
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
          name: profileToSave.name,
          email: profileToSave.email,
          cpf: profileToSave.cpf,
          age: profileToSave.age,
          gender: profileToSave.gender,
          weight: profileToSave.weight,
          height: profileToSave.height,
          
          birth_date: profileToSave.birthDate || null,
          city: profileToSave.city || null,
          state: profileToSave.state || null,
          
          activity_multiplier: profileToSave.activityLevel,
          goal_type: profileToSave.goal,
          goal_value: profileToSave.goalValue || 0,
          goal_target_weight: profileToSave.goalTargetWeight || profileToSave.goalWeight || 0,
          goal_deadline: profileToSave.goalDeadline || null,
          calorie_strategy: profileToSave.calorieStrategy || 'maintain',
          
          bmr: profileToSave.bmr || 0,
          tdee: profileToSave.tdee || 0,
          target_calories: profileToSave.targetCalories || 0,
          target_deficit: profileToSave.targetDeficit || 0,
          target_protein: profileToSave.targetProtein || 0,
          target_carbs: profileToSave.targetCarbs || 0,
          target_fat: profileToSave.targetFat || 0,
          target_balance: profileToSave.targetBalance || 0,
          
          water_goal: profileToSave.waterGoal || 2500,
          xp: profileToSave.xp || 0,
          level: profileToSave.level || 1,
          streak: profileToSave.streak || 0,
          achievements: profileToSave.achievements || [],
          
          has_doctor: profileToSave.hasDoctor || false,
          doctor_name: profileToSave.doctorName || null,
          
          updated_at: new Date().toISOString()
        };

        // Activity level text mapping
        if (profileToSave.activityLevel <= 1.2) supabaseUpdate.activity_level = 'sedentary';
        else if (profileToSave.activityLevel <= 1.375) supabaseUpdate.activity_level = 'light';
        else if (profileToSave.activityLevel <= 1.55) supabaseUpdate.activity_level = 'moderate';
        else if (profileToSave.activityLevel <= 1.725) supabaseUpdate.activity_level = 'active';
        else supabaseUpdate.activity_level = 'very_active';

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
