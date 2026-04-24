/**
 * Workout Calorie Service
 * Estimativa de gasto calórico baseado em MET (Metabolic Equivalent of Task)
 */

export type WorkoutIntensity = 'low' | 'moderate' | 'intense';
export type WorkoutType = 'strength' | 'cardio';

// MET Values
const MET_VALUES = {
  strength: {
    low: 3.5,
    moderate: 5.0,
    intense: 7.0,
  },
  cardio: {
    low: 3.5,    // Walking
    moderate: 7.0, // Jogging
    intense: 11.0, // High intensity / HIIT
  }
};

/**
 * Calcula as calorias gastas em um treino
 * Fórmula: Calorias = MET * peso (kg) * duração (horas)
 * 
 * @param type Tipo do treino (strength ou cardio)
 * @param intensity Intensidade (low, moderate, intense)
 * @param weightPeso Peso do usuário em kg
 * @param durationMinutes Duração em minutos
 */
export const calculateWorkoutCalories = (
  type: WorkoutType,
  intensity: WorkoutIntensity,
  weight: number,
  durationMinutes: number
): number => {
  if (!weight || !durationMinutes) return 0;
  
  const met = MET_VALUES[type][intensity];
  const durationHours = durationMinutes / 60;
  
  return Math.round(met * weight * durationHours);
};
