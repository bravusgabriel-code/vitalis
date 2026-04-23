import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validateCPF(cpf: string): boolean {
  const cleanCPF = cpf.replace(/[^\d]/g, '');
  if (cleanCPF.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cleanCPF)) return false;

  let sum = 0;
  let remainder;

  for (let i = 1; i <= 9; i++) sum += parseInt(cleanCPF.substring(i - 1, i)) * (11 - i);
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF.substring(9, 10))) return false;

  sum = 0;
  for (let i = 1; i <= 10; i++) sum += parseInt(cleanCPF.substring(i - 1, i)) * (12 - i);
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF.substring(10, 11))) return false;

  return true;
}

export function maskCPF(value: string): string {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})/, '$1-$2')
    .replace(/(-\d{2})\d+?$/, '$1');
}

export function calculateAge(birthDate: string): number {
  if (!birthDate) return 0;
  const hoy = new Date();
  const nacimiento = new Date(birthDate);
  let edad = hoy.getFullYear() - nacimiento.getFullYear();
  const mes = hoy.getMonth() - nacimiento.getMonth();

  if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
    edad--;
  }

  return edad;
}

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}min ${s}s`;
}

export function calculatePace(distanceKm: number, timeSeconds: number): string {
  if (distanceKm === 0) return '0:00';
  const paceTotalSeconds = timeSeconds / distanceKm;
  const m = Math.floor(paceTotalSeconds / 60);
  const s = Math.floor(paceTotalSeconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function calculateCaloriesBurned(type: string, distanceKm: number, durationSeconds: number, weightKg: number = 70): number {
  // Very rough MET-based estimation
  // MET values: Walking (3.5), Running (9.8), Cycling (7.5)
  let met = 7.0;
  const lowerType = type.toLowerCase();
  if (lowerType.includes('caminhada') || lowerType.includes('walk')) met = 3.5;
  if (lowerType.includes('corrida') || lowerType.includes('run')) met = 10.0;
  if (lowerType.includes('ciclismo') || lowerType.includes('cycl')) met = 8.0;
  
  const durationHours = durationSeconds / 3600;
  return Math.round(met * weightKg * durationHours);
}
