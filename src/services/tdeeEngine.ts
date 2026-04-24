/**
 * TDEE Engine
 * Calcula o gasto total dinâmico baseado no BMR e atividade real.
 */

/**
 * Calcula o TDEE dinâmico
 * TDEE = BMR + Calorias gastas em treinos do dia
 * 
 * @param bmr Metabolismo basal
 * @param workoutCalories Soma das calorias de todos os treinos do dia
 */
export const calculateDynamicTDEE = (bmr: number, workoutCalories: number): number => {
  return Math.round(bmr + workoutCalories);
};

/**
 * Calcula o balanço calórico do dia
 * Balanço = TDEE - Calorias Consumidas
 * 
 * @param dynamicTdee Gasto total dinâmico (BMR + Workouts)
 * @param consumedCalories Calorias ingeridas
 */
export const calculateCaloricBalance = (dynamicTdee: number, consumedCalories: number) => {
  const balance = dynamicTdee - consumedCalories;
  return {
    balance,
    isDeficit: balance > 0,
    isSurplus: balance < 0,
    percentage: dynamicTdee > 0 ? (consumedCalories / dynamicTdee) * 100 : 0
  };
};
