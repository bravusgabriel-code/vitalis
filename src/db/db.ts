import Dexie, { type Table } from 'dexie';
import { 
  UserProfile, 
  FoodItem, 
  LoggedMeal, 
  Exercise, 
  WorkoutSession, 
  CardioLog, 
  WaterLog, 
  PlannerTask 
} from '../types';

export class VitalisDB extends Dexie {
  userProfile!: Table<UserProfile>;
  foodHistory!: Table<FoodItem>;
  meals!: Table<LoggedMeal>;
  exercises!: Table<Exercise>;
  workouts!: Table<WorkoutSession>;
  cardioLogs!: Table<CardioLog>;
  waterLogs!: Table<WaterLog>;
  plannerTasks!: Table<PlannerTask>;

  constructor() {
    super('VitalisDB');
    this.version(1).stores({
      userProfile: '++id',
      foodHistory: '++id, name',
      meals: '++id, date, type',
      exercises: '++id, name, category',
      workouts: '++id, date',
      cardioLogs: '++id, date, type',
      waterLogs: '++id, date',
      plannerTasks: '++id, date, type'
    });

    this.version(2).stores({
      workouts: '++id, date, isPlanned'
    });
  }
}

export const db = new VitalisDB();

// Seed data
export async function seedDatabase() {
  const count = await db.exercises.count();
  if (count === 0) {
    await db.exercises.bulkAdd([
      // Força
      { name: 'Supino Reto', category: 'strength' },
      { name: 'Supino Inclinado', category: 'strength' },
      { name: 'Agachamento Livre', category: 'strength' },
      { name: 'Leg Press 45', category: 'strength' },
      { name: 'Levantamento Terra', category: 'strength' },
      { name: 'Desenvolvimento com Halteres', category: 'strength' },
      { name: 'Elevação Lateral', category: 'strength' },
      { name: 'Barra Fixa', category: 'strength' },
      { name: 'Puxada Aberta', category: 'strength' },
      { name: 'Remada Curvada', category: 'strength' },
      { name: 'Rosca Direta', category: 'strength' },
      { name: 'Tríceps Pulley', category: 'strength' },
      { name: 'Afundo', category: 'strength' },
      { name: 'Stiff', category: 'strength' },
      { name: 'Cadeira Extensora', category: 'strength' },
      { name: 'Mesa Flexora', category: 'strength' },
      { name: 'Panturrilha em Pé', category: 'strength' },
      
      // Cardio
      { name: 'Corrida', category: 'cardio' },
      { name: 'Caminhada', category: 'cardio' },
      { name: 'Ciclismo', category: 'cardio' },
      { name: 'Esteira', category: 'cardio' },
      { name: 'Elíptico', category: 'cardio' },
      { name: 'Natação', category: 'cardio' },
      { name: 'Remo Ergométrico', category: 'cardio' },
      { name: 'Pular Corda', category: 'cardio' },
    ]);
  }
}
