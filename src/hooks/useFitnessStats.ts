import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useUser } from './useUser';
import { db } from '../db/db';
import { useLiveQuery } from 'dexie-react-hooks';

export const useFitnessStats = () => {
  const { profile } = useUser();
  const [weeklyHistory, setWeeklyHistory] = useState<any[]>([]);

  // Buscar dados do Dexie (local) para o dia atual
  const today = new Date().toISOString().split('T')[0];
  
  const todaysMeals = useLiveQuery(
    () => db.meals.where('date').startsWith(today).toArray(),
    [today]
  );

  const todaysWorkouts = useLiveQuery(
    () => db.workouts.where('date').startsWith(today).toArray(),
    [today]
  );

  const todaysCardio = useLiveQuery(
    () => db.cardioLogs.where('date').startsWith(today).toArray(),
    [today]
  );

  // Calcular valores de forma síncrona com os dados do LiveQuery para garantir reatividades instantânea
  const dailyCalories = todaysMeals ? todaysMeals.reduce((sum, m) => sum + m.calories, 0) : 0;
  
  const workoutCalories = (todaysWorkouts || []).reduce((sum, w) => sum + (w.caloriesBurned || 0), 0) + 
                         (todaysCardio || []).reduce((sum, c) => sum + (c.calories || 0), 0);

  const dynamicTdee = profile?.bmr ? (profile.bmr + workoutCalories) : 0;

  useEffect(() => {
    if (profile?.id) {
      syncDailyLog(profile.id, dailyCalories, profile.bmr || 0, dynamicTdee, profile.weight || 0, workoutCalories);
    }
  }, [profile?.id, profile?.bmr, dailyCalories, dynamicTdee, workoutCalories]);

  const syncDailyLog = async (userId: string, consumed: number, bmr: number, tdee: number, weight: number, workoutCal: number) => {
    const date = new Date().toISOString().split('T')[0];
    
    const protein = todaysMeals ? todaysMeals.reduce((sum, m) => sum + (m.protein || 0), 0) : 0;
    const carbs = todaysMeals ? todaysMeals.reduce((sum, m) => sum + (m.carbs || 0), 0) : 0;
    const fat = todaysMeals ? todaysMeals.reduce((sum, m) => sum + (m.fat || 0), 0) : 0;

    try {
      await supabase.from('daily_fitness_logs').upsert({
        user_id: userId,
        date,
        calories_consumed: consumed,
        protein_consumed: protein,
        carbs_consumed: carbs,
        fat_consumed: fat,
        bmr_snapshot: bmr,
        tdee_snapshot: tdee,
        target_calories: profile?.targetCalories || 0,
        target_balance: profile?.targetBalance || 0,
        weight_snapshot: weight
      }, { onConflict: 'user_id,date' });
    } catch (e) {
      console.error("Erro ao sincronizar log fitness:", e);
    }
  };

  const fetchWeeklyHistory = async () => {
    if (!profile?.id) return;
    
    const { data, error } = await supabase
      .from('daily_fitness_logs')
      .select('*')
      .eq('user_id', profile.id)
      .order('date', { ascending: false })
      .limit(7);

    if (error) {
      console.error("Erro ao buscar histórico:", error);
      return;
    }

    setWeeklyHistory(data || []);
  };

  useEffect(() => {
    fetchWeeklyHistory();
  }, [profile?.id, dailyCalories, workoutCalories]);

  return {
    dailyCalories,
    workoutCalories,
    dynamicTdee,
    weeklyHistory,
    refreshHistory: fetchWeeklyHistory
  };
};
