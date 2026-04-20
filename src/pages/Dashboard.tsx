import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { Card, SectionTitle, Button } from '../components/UI';
import { format, startOfDay } from 'date-fns';
import { 
  Flame, 
  Droplet, 
  Dumbbell, 
  Plus, 
  Zap,
  Activity,
  ChevronRight,
  TrendingUp,
  Clock,
  Calendar
} from 'lucide-react';
import { useUser } from '../hooks/useUser';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  Tooltip 
} from 'recharts';

import { XPProgress } from '../components/gamification/GamificationUI';
import { getXPForLevel } from '../lib/gamification';

export const Dashboard: React.FC = () => {
  const { profile } = useUser();
  const today = startOfDay(new Date()).toISOString();
  
  const todayMeals = useLiveQuery(() => db.meals.where('date').equals(today).toArray());
  const todayWater = useLiveQuery(() => db.waterLogs.where('date').equals(today).toArray());
  const todayWorkouts = useLiveQuery(() => db.workouts.where('date').equals(today).toArray());

  const firstName = profile?.name?.split(' ')[0] || 'Atleta';
  const consumedCalories = todayMeals?.reduce((sum, m) => sum + m.calories, 0) || 0;
  const consumedWater = todayWater?.reduce((sum, w) => sum + w.amount, 0) || 0;
  const calorieGoal = profile?.manualCalories || profile?.targetCalories || 2000;
  const waterGoal = profile?.waterGoal || 2500;

  const macroTotals = todayMeals?.reduce(
    (acc, m) => ({
      p: acc.p + m.protein,
      c: acc.c + m.carbs,
      f: acc.f + m.fat
    }),
    { p: 0, c: 0, f: 0 }
  ) || { p: 0, c: 0, f: 0 };

  const calCompletion = Math.min((consumedCalories / calorieGoal) * 100, 100);
  const waterCompletion = Math.min((consumedWater / waterGoal) * 100, 100);

  const pieData = [
    { name: 'Consumido', value: consumedCalories },
    { name: 'Restante', value: Math.max(calorieGoal - consumedCalories, 0) },
  ];

  return (
    <div className="space-y-10 pb-10">
      {/* Refined Header */}
      <header className="flex justify-between items-center py-4">
        <div>
          <motion.h1 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-3xl tracking-tight text-white mb-2"
          >
            <span className="font-light opacity-60">Olá, </span>
            <span className="font-bold">{firstName}</span>
          </motion.h1>
          <div className="flex items-center gap-2 opacity-50">
            <Calendar size={12} className="text-vibrant-orange" />
            <p className="text-muted-text text-[11px] font-semibold uppercase tracking-[0.1em] leading-none">
              {format(new Date(), 'EEEE, d MMMM')}
            </p>
          </div>
        </div>
        <button className="h-11 w-11 bg-white/[0.02] border border-white/[0.04] rounded-xl flex items-center justify-center text-vibrant-orange hover:bg-white/[0.04] transition-colors shadow-premium">
          <Zap size={20} fill="currentColor" className="opacity-40" />
        </button>
      </header>

      {profile && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <XPProgress 
            level={profile.level}
            xp={profile.xp}
            currentLevelXP={getXPForLevel(profile.level)}
            nextLevelXP={getXPForLevel(profile.level + 1)}
            className="mb-8"
          />
        </motion.div>
      )}

      {/* Main Calorie Summary */}
      <Card variant="glass" className="overflow-hidden py-12 md:py-16">
        <div className="flex flex-col lg:flex-row items-center justify-around gap-16">
          <div className="relative h-60 w-60">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={82}
                  outerRadius={98}
                  paddingAngle={1}
                  dataKey="value"
                  stroke="none"
                  startAngle={90}
                  endAngle={450}
                >
                  <Cell fill="#FF4D00" />
                  <Cell fill="rgba(255,255,255,0.02)" />
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-[10px] font-bold text-muted-text uppercase tracking-[0.2em] mb-2 opacity-40">Restantes</span>
              <motion.span 
                key={calorieGoal - consumedCalories}
                className="text-5xl font-bold tracking-tighter tabular-nums leading-none"
              >
                {Math.max(calorieGoal - consumedCalories, 0)}
              </motion.span>
              <span className="text-[11px] font-bold text-muted-text mt-2 opacity-40 uppercase tracking-[0.1em]">kcal total</span>
            </div>
          </div>

          <div className="flex-1 w-full max-w-sm space-y-12">
            <div className="grid grid-cols-3 gap-10">
              {[
                { label: 'Proteína', val: macroTotals.p, p: '45%', color: 'bg-vibrant-orange' },
                { label: 'Carbos', val: macroTotals.c, p: '65%', color: 'bg-white/40' },
                { label: 'Gorduras', val: macroTotals.f, p: '30%', color: 'bg-white/20' }
              ].map((m, i) => (
                <div key={i} className="space-y-4">
                  <p className="text-[10px] font-bold text-muted-text uppercase tracking-widest opacity-60">{m.label}</p>
                  <p className="text-xl font-bold tabular-nums tracking-tight">{Math.round(m.val)}<span className="text-[10px] font-medium opacity-40 ml-0.5">g</span></p>
                  <div className="h-[3px] w-full bg-white/[0.04] rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: m.p }}
                      className={cn("h-full rounded-full", m.color, m.label === 'Proteína' && "shadow-[0_0_8px_rgba(255,77,0,0.4)]")}
                    />
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex gap-4">
              <Button size="md" className="flex-1 font-bold tracking-widest uppercase text-[10px]">
                Registrar Refeição
              </Button>
              <Button variant="secondary" size="md" className="flex-1 font-bold tracking-widest uppercase text-[10px]">
                Histórico
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Grid Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card variant="outline" className="flex flex-col justify-between h-56">
           <div className="flex justify-between items-start">
              <div className="h-10 w-10 bg-vibrant-orange/10 rounded-lg flex items-center justify-center text-vibrant-orange">
                <Droplet size={20} />
              </div>
              <Button variant="ghost" size="sm" className="h-8 w-8 !p-0">
                 <Plus size={16} />
              </Button>
           </div>
           <div>
              <p className="text-[10px] font-bold text-muted-text uppercase tracking-widest mb-1.5 opacity-60">Hidratação</p>
              <h3 className="text-3xl font-bold tabular-nums tracking-tight">
                {consumedWater} <span className="text-sm font-medium text-muted-text opacity-40 ml-1">/ {waterGoal}ml</span>
              </h3>
              <div className="mt-5 h-1 bg-white/5 rounded-full overflow-hidden">
                 <motion.div 
                   initial={{ width: 0 }}
                   animate={{ width: `${waterCompletion}%` }}
                   className="h-full bg-vibrant-orange"
                 />
              </div>
           </div>
        </Card>

        <Card variant="outline" className="flex flex-col justify-between h-56">
           <div className="flex justify-between items-start">
              <div className="h-10 w-10 bg-vibrant-orange/10 rounded-lg flex items-center justify-center text-vibrant-orange">
                <Dumbbell size={20} />
              </div>
              <Button variant="secondary" size="sm" className="h-8 py-0 px-3 text-[10px]">
                 Relatórios
              </Button>
           </div>
           <div>
              <p className="text-[10px] font-bold text-muted-text uppercase tracking-widest mb-1.5 opacity-60">Atividade</p>
              <h3 className="text-3xl font-bold tabular-nums tracking-tight">
                {todayWorkouts?.length || 0} <span className="text-sm font-medium text-muted-text opacity-40 ml-1">Sessões</span>
              </h3>
              <div className="mt-5 flex gap-1.5">
                 {[1, 2, 3, 4, 5, 6].map(i => (
                   <div key={i} className={cn(
                     "h-1 px-1 flex-1 rounded-full transition-all duration-300",
                     i <= (todayWorkouts?.length || 0) ? "bg-vibrant-orange" : "bg-white/5"
                   )} />
                 ))}
              </div>
           </div>
        </Card>
      </div>

      {/* Simplified Weekly Evolution */}
      <div className="space-y-6">
        <div className="flex items-center justify-between px-1">
           <h3 className="text-lg font-bold tracking-tight">Evolução Semanal</h3>
           <TrendingUp size={16} className="text-vibrant-orange" />
        </div>
        
        <Card variant="solid" className="p-8">
          <div className="h-48 w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[
                { d: 'Seg', v: 2100 },
                { d: 'Ter', v: 1800 },
                { d: 'Qua', v: 2400 },
                { d: 'Qui', v: 1900 },
                { d: 'Sex', v: 2200 },
                { d: 'Sáb', v: 2800 },
                { d: 'Dom', v: 1500 },
              ]}>
                <XAxis 
                  dataKey="d" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#8E8E93', fontSize: 10, fontWeight: 500 }} 
                  dy={10} 
                />
                <Tooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                  contentStyle={{ backgroundColor: '#141414', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px' }}
                />
                <Bar 
                  dataKey="v" 
                  fill="#FF4D00" 
                  radius={[4, 4, 0, 0]} 
                  barSize={16}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
};
