import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { Card, SectionTitle, Button } from '../components/UI';
import { format } from 'date-fns';
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
import { useFitnessStats } from '../hooks/useFitnessStats';
import { calculateCaloricBalance } from '../lib/fitnessUtils';
import { calculateMacros } from '../services/metabolicService';
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

export const Dashboard: React.FC<{ onNavigate?: (page: string, action?: string) => void }> = ({ onNavigate }) => {
  const { profile } = useUser();
  const { dailyCalories, workoutCalories, dynamicTdee, weeklyHistory } = useFitnessStats();
  const today = format(new Date(), 'yyyy-MM-dd');
  
  const todayWater = useLiveQuery(() => db.waterLogs.where('date').equals(today).toArray());
  const todayWorkouts = useLiveQuery(() => db.workouts.where('date').equals(today).toArray());
  const todayMeals = useLiveQuery(() => db.meals.where('date').equals(today).toArray());

  const firstName = profile?.name?.split(' ')[0] || 'Atleta';
  const consumedCalories = dailyCalories;
  const bmr = profile?.bmr || 0;
  
  // Use dynamic metrics
  const displayTdee = dynamicTdee || bmr; 
  const targetBalance = profile?.targetBalance || 0;
  const calorieTarget = displayTdee - targetBalance;
  const caloriesRemaining = calorieTarget - consumedCalories;
  
  // Feedback Logic
  let feedback = { 
    message: caloriesRemaining >= 0 ? "Você ainda pode consumir" : "Você ultrapassou a meta", 
    color: caloriesRemaining >= 0 ? "text-green-500" : "text-red-500", 
    opacity: caloriesRemaining >= 0 ? "bg-green-500/10" : "bg-red-500/10",
    label: caloriesRemaining >= 0 ? "Disponíveis" : "Acima da Meta"
  };

  const diffAbs = Math.abs(caloriesRemaining);

  const consumedWater = todayWater?.reduce((sum, w) => sum + w.amount, 0) || 0;
  const waterGoal = profile?.waterGoal || 2500;

  const macroTotals = todayMeals?.reduce(
    (acc, m) => ({
      p: acc.p + (m.protein || 0),
      c: acc.c + (m.carbs || 0),
      f: acc.f + (m.fat || 0)
    }),
    { p: 0, c: 0, f: 0 }
  ) || { p: 0, c: 0, f: 0 };

  // Calculate dynamic macronutrient targets for the day
  const dynamicMacros = calculateMacros(
    calorieTarget,
    profile?.weight || 70,
    profile?.goal || 'maintain',
    profile?.calorieStrategy
  );

  const calCompletion = calorieTarget > 0 ? (consumedCalories / calorieTarget) * 100 : 0;
  const waterCompletion = Math.min((consumedWater / waterGoal) * 100, 100);

  const pieData = [
    { name: 'Consumido', value: consumedCalories },
    { name: 'Restante', value: displayTdee > 0 ? Math.max(displayTdee - consumedCalories, 0) : 0 },
  ];

  return (
    <div className="space-y-10 pb-10">
      {/* ... header and progress same ... */}
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

      {/* Main Calorie Summary - Premium UI Redesign */}
      <Card variant="glass" className="relative overflow-hidden border-none bg-[#050505] p-0 md:p-0">
        {/* Glow Accent */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-vibrant-orange/10 blur-[100px] rounded-full pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-vibrant-orange/5 blur-[100px] rounded-full pointer-events-none" />

        <div className="p-10 md:p-14 space-y-14 relative z-10">
          {/* Header Stats - Softer & More Minimal */}
          <div className="grid grid-cols-3 gap-8">
            <div className="space-y-1.5">
              <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">Basal</p>
              <p className="text-lg font-bold text-white tracking-tight tabular-nums">{bmr}<span className="text-[10px] ml-1 opacity-20">kcal</span></p>
            </div>
            <div className="space-y-1.5 text-center">
              <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">Treino</p>
              <div className="flex items-center justify-center gap-1.5">
                <Flame size={12} className="text-vibrant-orange opacity-40" />
                <p className="text-lg font-bold text-vibrant-orange tabular-nums">+{workoutCalories}<span className="text-[10px] ml-1 opacity-40">kcal</span></p>
              </div>
            </div>
            <div className="space-y-1.5 text-right">
              <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">Total</p>
              <p className="text-lg font-bold text-white tracking-tight tabular-nums">{displayTdee}<span className="text-[10px] ml-1 opacity-20">kcal</span></p>
            </div>
          </div>

          {/* Central Hero Stats - Apple Fitness Style Depth */}
          <div className="flex flex-col items-center justify-center py-6">
             <header className="text-center space-y-1 mb-10">
                <p className="text-[11px] font-bold text-white/40 uppercase tracking-[0.4em] mb-4">Disponíveis</p>
                <div className="relative group">
                   {/* Background Glow */}
                   <div className={cn(
                     "absolute inset-0 blur-[60px] opacity-20 transition-opacity duration-1000",
                     caloriesRemaining >= 0 ? "bg-vibrant-orange" : "bg-red-500"
                   )} />
                   
                   <div className="relative flex items-baseline justify-center gap-2">
                      <motion.h2 
                        key={caloriesRemaining}
                        initial={{ scale: 0.95, opacity: 0, y: 10 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        className={cn(
                          "text-8xl font-black tracking-[-0.05em] tabular-nums leading-none",
                          caloriesRemaining >= 0 ? "text-white" : "text-red-500"
                        )}
                        style={{ textShadow: caloriesRemaining >= 0 ? '0 0 40px rgba(255,77,0,0.1)' : '0 0 40px rgba(239,68,68,0.1)' }}
                      >
                        {Math.abs(Math.round(caloriesRemaining))}
                      </motion.h2>
                      <span className="text-2xl font-bold text-white/10 italic">kcal</span>
                   </div>
                </div>
                <p className="text-[13px] font-medium text-white/40 tracking-tight mt-6">restantes para bater sua meta</p>
             </header>

             {/* Premium Progress Bar - Fluid & Organic */}
             <div className="w-full max-w-sm space-y-5">
                <div className="h-2 w-full bg-white/[0.03] rounded-full p-[2px] border border-white/[0.05]">
                   <motion.div 
                     initial={{ width: 0 }}
                     animate={{ width: `${Math.min(calCompletion, 100)}%` }}
                     className={cn(
                       "h-full rounded-full transition-all relative",
                       caloriesRemaining >= 0 ? "bg-vibrant-orange" : "bg-red-500"
                     )}
                   >
                     {/* Glow Tip */}
                     <div className="absolute right-0 top-1/2 -translate-y-1/2 h-4 w-4 bg-inherit rounded-full blur-[8px] opacity-50" />
                   </motion.div>
                </div>
                <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-[0.2em] px-1 opacity-40">
                   <p>{Math.round(consumedCalories)} consumidos</p>
                   <p>{Math.round(calorieTarget)} meta</p>
                </div>
             </div>
          </div>

          <div className="flex flex-col md:flex-row gap-10 items-center">
            {/* Feedback Badge - More Discreet */}
            <div className={cn(
              "px-5 py-2.5 rounded-2xl border flex items-center gap-3 transition-all backdrop-blur-md",
              feedback.color === 'text-green-500' ? "bg-green-500/[0.03] border-green-500/10 text-green-500" : "bg-red-500/[0.03] border-red-500/10 text-red-500"
            )}>
               <div className={cn("h-1.5 w-1.5 rounded-full", feedback.color === 'text-green-500' ? "bg-green-500 shadow-[0_0_8px_#22c55e]" : "bg-red-500 shadow-[0_0_8px_#ef4444]")} />
               <span className="text-[10px] font-black uppercase tracking-[0.2em]">{feedback.message}</span>
            </div>

            <div className="hidden md:block h-10 w-px bg-white/[0.06]" />

            {/* Dynamic Macros - Rounded & Modern */}
            <div className="flex-1 w-full grid grid-cols-3 gap-10">
              {[
                { label: 'Proteína', val: macroTotals.p, target: dynamicMacros.protein, color: 'bg-emerald-400' },
                { label: 'Carbos', val: macroTotals.c, target: dynamicMacros.carbs, color: 'bg-amber-400' },
                { label: 'Gorduras', val: macroTotals.f, target: dynamicMacros.fat, color: 'bg-indigo-400' }
              ].map((m, i) => (
                <div key={i} className="space-y-3.5">
                  <div className="flex justify-between items-baseline px-1">
                    <p className="text-[9px] font-bold text-white/30 uppercase tracking-[0.2em]">{m.label.substring(0, 4)}</p>
                    <p className="text-xs font-bold tabular-nums text-white/90">{Math.round(m.val)}<span className="text-[10px] opacity-20 font-medium ml-0.5">/{m.target}</span></p>
                  </div>
                  <div className="h-1.5 w-full bg-white/[0.03] rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min((m.val / m.target) * 100, 100)}%` }}
                      className={cn("h-full rounded-full transition-all", m.color)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="flex gap-4 pt-6">
             <Button 
               size="lg" 
               className="flex-1 font-black tracking-[0.2em] uppercase text-[11px] h-16 rounded-[20px] bg-vibrant-orange hover:bg-vibrant-orange/90 shadow-xl shadow-vibrant-orange/10"
               onClick={() => onNavigate?.('nutrition', 'add-meal')}
             >
               Registrar Refeição
             </Button>
             <Button 
               variant="secondary" 
               size="lg" 
               className="flex-1 font-black tracking-[0.2em] uppercase text-[11px] h-16 rounded-[20px] bg-white/[0.04] border-white/[0.06] text-white/60 hover:text-white"
               onClick={() => onNavigate?.('nutrition')}
             >
               Ver Diário
             </Button>
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
              <BarChart data={weeklyHistory.map(item => {
                const dayBalance = (item.tdee_snapshot || profile?.tdee || 2000) - item.calories_consumed;
                return {
                  d: format(new Date(item.date), 'EEE'),
                  v: Math.round(dayBalance),
                  target: item.target_balance || profile?.targetBalance || 0
                };
              }).reverse()}>
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
                  labelStyle={{ color: '#8E8E93', fontWeight: 'bold', fontSize: '10px', textTransform: 'uppercase' }}
                  formatter={(value: any) => [`${value} kcal`, 'Balanço']}
                />
                <Bar 
                  dataKey="v" 
                  radius={[4, 4, 0, 0]} 
                  barSize={16}
                >
                   {weeklyHistory.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={((entry.tdee_snapshot || 2000) - entry.calories_consumed) > 0 ? '#22c55e' : '#ef4444'} 
                        fillOpacity={0.8}
                      />
                   ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
};
