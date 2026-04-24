export type GoalType = 'lose' | 'gain' | 'maintain' | 'recomp' | 'gain_healthy';

export interface UserProfile {
  id?: string | number; // Supabase uses UUID (string), Dexie uses local IDs
  name: string;
  email: string;
  password?: string;
  cpf: string;
  birthDate: string;
  city: string;
  state: string;
  weight: number; // in kg
  height: number; // in cm
  age: number;
  gender: 'male' | 'female' | 'other';
  goal: GoalType;
  activityLevel: number; // 1.2 to 1.9
  goalType?: string;
  goalValue?: number;
  goalTargetWeight?: number;
  targetCalories: number;
  manualCalories?: number; // Added for manual override
  waterGoal: number; // in ml
  isAuthenticated?: boolean;
  
  // Advanced Metabolic Fields
  bmr?: number; // Basal Metabolic Rate
  tdee?: number; // Total Daily Energy Expenditure
  targetProtein?: number;
  targetCarbs?: number;
  targetFat?: number;
  targetDeficit?: number;
  goalWeight?: number;
  goalDeadline?: string; // ISO Date
  calorieStrategy?: 'deficit_light' | 'deficit_moderate' | 'deficit_aggressive' | 'surplus_light' | 'surplus_moderate' | 'recomp' | 'maintain' | 'gain_healthy';
  targetBalance?: number; // Target deficit (+) or surplus (-)
  
  // Doctor/Medical Link
  hasDoctor?: boolean;
  doctorId?: string;
  doctorName?: string;
  
  // Gamification Fields
  xp: number;
  level: number;
  streak: number;
  lastActiveDate?: string; // ISO Date YYYY-MM-DD
  achievements: string[]; // List of Badge IDs
  totalWeightLifted: number;
  totalCardioDistance: number;
  waterDaysCount: number;
  nutritionDaysCount: number;
  missionsCompletedCount: number;
  appUsageDaysCount: number; // Total days logged in/active
}

export interface DailyFitnessLog {
  id?: string;
  user_id: string;
  date: string; // YYYY-MM-DD
  calories_consumed: number;
  bmr_snapshot: number;
  tdee_snapshot?: number;
  weight_snapshot: number;
  protein_consumed?: number;
  carbs_consumed?: number;
  fat_consumed?: number;
  target_calories?: number;
  target_balance?: number;
}

export interface Badge {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'strength' | 'cardio' | 'water' | 'nutrition' | 'consistency' | 'missions' | 'usage' | 'special';
  requirement: number;
}

export interface Mission {
  id: string;
  title: string;
  description: string;
  xpReward: number;
  type: 'daily' | 'weekly';
  category: 'workout' | 'nutrition' | 'water' | 'consistency' | 'cardio';
  requirement: number;
  currentProgress?: number;
  isCompleted?: boolean;
}

export interface Food {
  id: string | number; // Support both Supabase UUID (string) and Dexie (number) for migration
  name: string;
  name_normalized?: string;
  calories_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fat_per_100g: number;
}

export interface MealGroup {
  id?: number;
  userId?: string | number;
  date: string; // YYYY-MM-DD
  name?: string; // Optional name like "Café da Manhã"
  order: number; // 1, 2, 3...
  type: 'meal' | 'extra';
}

export interface LoggedMeal {
  id?: number;
  mealGroupId?: number; // Links to a MealGroup
  foodId?: string | number;
  date: string; // ISO string
  type: 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'custom'; // Legacy field for compat
  name: string;
  grams: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface Exercise {
  id?: number;
  name: string;
  category: 'strength' | 'cardio';
}

export interface StrengthSet {
  id?: string; // Helpful for UI management
  reps: number;
  weight: number;
}

export interface WorkoutSession {
  id?: number;
  date: string;
  name?: string; // For saving future/planned workouts
  isPlanned?: boolean; // To distinguish from completed ones
  duration?: number; // in minutes
  intensity?: 'low' | 'moderate' | 'intense';
  caloriesBurned?: number;
  type?: 'strength' | 'cardio';
  exercises: {
    exerciseId: number;
    sets: StrengthSet[];
  }[];
}

export interface CardioLog {
  id?: number;
  date: string;
  type: string;
  distance: number; // km
  duration: number; // minutes
  intensity?: 'low' | 'moderate' | 'intense';
  calories: number;
  pace?: string; // min/km
  notes?: string; 
}

export interface WaterLog {
  id?: number;
  date: string;
  amount: number; // ml
}

export interface PlannerTask {
  id?: number;
  date: string;
  title: string;
  completed: boolean;
  type: 'workout' | 'nutrition' | 'habit';
}
