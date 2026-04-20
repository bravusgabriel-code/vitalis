export type GoalType = 'lose' | 'gain' | 'maintain';

export interface UserProfile {
  id?: number;
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
  targetCalories: number;
  manualCalories?: number; // Added for manual override
  waterGoal: number; // in ml
  isAuthenticated?: boolean;
  
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

export interface FoodItem {
  id?: number;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  servingSize: string;
}

export interface LoggedMeal {
  id?: number;
  date: string; // ISO string
  type: 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'custom';
  customTypeName?: string; // Added for custom meal names
  name: string;
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
  duration: number; // seconds
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
