
/**
 * Fitness Balance Service
 * Re-exporting core logic from specialized services
 */
import { calculateBMR, calculateTDEE } from '../services/metabolicService';

export { calculateBMR, calculateTDEE };

export const calculateCaloricBalance = (target: number, consumed: number) => {
  const balance = target - consumed;
  const tolerance = 50; // tolerance for "maintenance"
  
  let statusColor = "text-white";
  let statusText = "Manutenção";
  
  if (balance > tolerance) {
    statusColor = "text-green-500";
    statusText = "Déficit";
  } else if (balance < -tolerance) {
    statusColor = "text-red-500";
    statusText = "Superávit";
  } else {
    statusColor = "text-blue-400";
    statusText = "Manutenção";
  }

  return {
    balance,
    isDeficit: balance > 0,
    isSurplus: balance < 0,
    statusColor,
    statusText,
    percentage: target > 0 ? (consumed / target) * 100 : 0
  };
};

export const getAgeFromBirthDate = (birthDate: string): number => {
  if (!birthDate) return 0;
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
};
