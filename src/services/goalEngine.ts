import { supabase } from '../lib/supabase';
import { DailyFitnessLog, UserProfile } from '../types';

/**
 * Goal Engine
 * Gerencia a seleção de objetivos e estratégias calóricas.
 */

export const GOAL_OPTIONS = [
  { id: 'lose', label: 'Perder Peso', icon: '🔻', description: 'Foco em queima de gordura preservando massa.' },
  { id: 'gain', label: 'Ganhar Músculos', icon: '💪', description: 'Superávit calórico para hipertrofia.' },
  { id: 'recomp', label: 'Recomp Corporal', icon: '⚖️', description: 'Perder gordura e ganhar massa simultaneamente.' },
  { id: 'maintain', label: 'Manutenção', icon: '🔁', description: 'Manter o peso atual com estabilidade.' },
  { id: 'gain_healthy', label: 'Ganho Saudável', icon: '🔺', description: 'Aumento de peso gradual e controlado.' },
];

export const ACTIVITY_LEVELS = [
  { value: 1.2, label: 'Sedentário', sub: 'Pouco ou nenhum exercício | 0x semana' },
  { value: 1.375, label: 'Levemente Ativo', sub: 'Exercício leve | 1 a 2x semana' },
  { value: 1.55, label: 'Moderadamente Ativo', sub: 'Treino regular | 3 a 4x semana' },
  { value: 1.725, label: 'Muito Ativo', sub: 'Treino intenso | 5 a 6x semana' },
  { value: 1.9, label: 'Extremamente Ativo', sub: 'Treinos diários pesados ou trabalho físico' },
];

export const getCalorieStrategies = (goal: string) => {
  if (goal === 'lose') {
    return [
      { id: 'deficit_light', label: 'Leve (-300 kcal)', desc: 'Mais sustentável longo prazo.' },
      { id: 'deficit_moderate', label: 'Moderado (-500 kcal)', desc: 'Equilíbrio entre resultado e conforto.' },
      { id: 'deficit_aggressive', label: 'Agressivo (-700 kcal)', desc: 'Rápido, exige maior disciplina.' },
    ];
  }
  if (goal === 'gain') {
    return [
      { id: 'surplus_light', label: 'Leve (+250 kcal)', desc: 'Foco em ganho limpo.' },
      { id: 'surplus_moderate', label: 'Moderado (+400 kcal)', desc: 'Máximo potencial de hipertrofia.' },
    ];
  }
  return [{ id: 'maintain', label: 'Padrão', desc: 'Baseado no seu gasto total.' }];
};
