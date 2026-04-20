import { supabase } from '../lib/supabase';
import { UserProfile, LoggedMeal, WorkoutSession, CardioLog, WaterLog, PlannerTask } from '../types';

export const supabaseService = {
  // Profiles
  async getProfile(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    return { data, error };
  },

  async updateProfile(userId: string, profile: Partial<UserProfile>) {
    const { data, error } = await supabase
      .from('profiles')
      .update(profile)
      .eq('id', userId);
    return { data, error };
  },

  // Nutrition
  async logMeal(meal: Omit<LoggedMeal, 'id'> & { user_id: string }) {
    const { data, error } = await supabase
      .from('meal_logs')
      .insert([meal]);
    return { data, error };
  },

  async getMeals(userId: string, date: string) {
    const { data, error } = await supabase
      .from('meal_logs')
      .select('*')
      .eq('user_id', userId)
      .gte('date', `${date}T00:00:00`)
      .lte('date', `${date}T23:59:59`);
    return { data, error };
  },

  // Water
  async logWater(userId: string, amount: number) {
    const date = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase.rpc('increment_water', {
      u_id: userId,
      d: date,
      amt: amount
    });
    return { data, error };
  },

  // Workouts
  async saveWorkout(userId: string, workout: Omit<WorkoutSession, 'id'>) {
    // Note: complex nested inserts might require multiple calls or a stored procedure in Supabase
    // This is a simplified version
    const { data: session, error: sessionError } = await supabase
      .from('workout_sessions')
      .insert({
        user_id: userId,
        date: workout.date,
        name: workout.name,
        is_planned: workout.is_planned
      })
      .select()
      .single();

    if (sessionError) return { error: sessionError };

    // Insert exercises and sets...
    return { data: session };
  },

  // Cardio
  async logCardio(userId: string, log: Omit<CardioLog, 'id'>) {
    const { data, error } = await supabase
      .from('cardio_logs')
      .insert({
        user_id: userId,
        date: log.date,
        type: log.type,
        distance_km: log.distance,
        duration_seconds: log.duration,
        calories: log.calories,
        pace: log.pace,
        notes: log.notes
      });
    return { data, error };
  },

  // Planner
  async addTask(userId: string, task: Omit<PlannerTask, 'id'>) {
    const { data, error } = await supabase
      .from('planner_tasks')
      .insert({
        user_id: userId,
        date: task.date,
        title: task.title,
        completed: task.completed,
        type: task.type
      });
    return { data, error };
  }
};
