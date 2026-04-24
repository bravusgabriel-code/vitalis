import { UserProfile } from '../types';

/**
 * Metabolic Service
 * Responsável por cálculos de BMR, TDEE e macros.
 */

export const calculateBMR = (weight: number, height: number, age: number, gender: 'male' | 'female' | 'other'): number => {
  if (!weight || !height || !age) return 0;
  
  // Fórmula de Mifflin-St Jeor
  const base = (10 * weight) + (6.25 * height) - (5 * age);
  if (gender === 'male') return Math.round(base + 5);
  return Math.round(base - 161);
};

export const calculateTDEE = (bmr: number, activityLevel: number): number => {
  return Math.round(bmr * activityLevel);
};

export interface MacroDistribution {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export const calculateMacros = (
  targetCalories: number, 
  weight: number, 
  goal: string,
  strategy?: string
): MacroDistribution => {
  let proteinPerKg = 1.8; // default
  let fatPercentage = 0.25; // default 25%

  // Protein adjustments based on strategy/goal
  if (strategy?.includes('deficit')) {
    proteinPerKg = 2.0; // High protein to preserve muscle in deficit
    fatPercentage = 0.22; // Slightly lower fat
  } else if (strategy?.includes('surplus')) {
    proteinPerKg = 1.7; // Moderate protein in surplus
    fatPercentage = 0.25;
  } else if (goal === 'lose') {
    proteinPerKg = 2.0;
    fatPercentage = 0.22;
  } else if (goal === 'gain') {
    proteinPerKg = 1.8;
  }

  const proteinGrams = Math.round(weight * proteinPerKg);
  const proteinCalories = proteinGrams * 4;
  
  const fatCalories = Math.round(targetCalories * fatPercentage);
  const fatGrams = Math.round(fatCalories / 9);
  
  const remainingCalories = targetCalories - proteinCalories - fatCalories;
  const carbsGrams = Math.max(0, Math.round(remainingCalories / 4));

  return {
    calories: targetCalories,
    protein: proteinGrams,
    carbs: carbsGrams,
    fat: fatGrams
  };
};

export const getCalorieTarget = (tdee: number, strategy: string): number => {
  switch (strategy) {
    case 'deficit_light': return tdee - 300;
    case 'deficit_moderate': return tdee - 500;
    case 'deficit_aggressive': return tdee - 700;
    case 'surplus_light': return tdee + 250;
    case 'surplus_moderate': return tdee + 400;
    case 'recomp': return tdee;
    case 'gain_healthy': return tdee + 300;
    case 'maintain': return tdee;
    default: return tdee;
  }
};

export const getTargetBalance = (strategy: string): number => {
  switch (strategy) {
    case 'deficit_light': return 300;
    case 'deficit_moderate': return 500;
    case 'deficit_aggressive': return 700;
    case 'surplus_light': return -250;
    case 'surplus_moderate': return -400;
    case 'recomp': return 100; // Light deficit for recomp
    case 'gain_healthy': return -300;
    case 'maintain': return 0;
    default: return 0;
  }
};

export const generateFullPlan = (profile: Partial<UserProfile>): Partial<UserProfile> => {
  const { weight = 0, height = 0, age = 0, gender = 'other', activityLevel = 1.2, goal = 'maintain', calorieStrategy = 'maintain' } = profile;
  
  const bmr = calculateBMR(weight, height, age, gender);
  const tdee = calculateTDEE(bmr, activityLevel);
  const targetCalories = getCalorieTarget(tdee, calorieStrategy);
  const macros = calculateMacros(targetCalories, weight, goal, calorieStrategy);
  const targetBalance = getTargetBalance(calorieStrategy);
  
  return {
    ...profile,
    bmr,
    tdee,
    targetCalories,
    targetProtein: macros.protein,
    targetCarbs: macros.carbs,
    targetFat: macros.fat,
    targetBalance
  };
};
