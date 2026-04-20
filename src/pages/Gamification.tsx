import React from 'react';
import { useUser } from '../hooks/useUser';
import { useGamification } from '../hooks/useGamification';
import { Card, SectionTitle, Button } from '../components/UI';
import { XPProgress } from '../components/gamification/GamificationUI';
import { BADGES, DAILY_MISSIONS, WEEKLY_MISSIONS, getXPForLevel } from '../lib/gamification';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Star, Zap, Target, Lock, CheckCircle2, ChevronRight, Award, Dumbbell, Activity, Droplet, Utensils } from 'lucide-react';
import { cn } from '../lib/utils';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { startOfDay, startOfWeek } from 'date-fns';

export const Gamification: React.FC = () => {
  const { profile } = useUser();
  const today = startOfDay(new Date()).toISOString();
  const weekStart = startOfWeek(new Date()).toISOString();

  // Fetch data to calculate mission progress
  const todayWater = useLiveQuery(() => db.waterLogs.where('date').equals(today).toArray());
  const todayWorkouts = useLiveQuery(() => db.workouts.where('date').equals(today).filter(w => !w.isPlanned).toArray());
  const todayMeals = useLiveQuery(() => db.meals.where('date').equals(today).toArray());
  
  const weekWorkouts = useLiveQuery(() => db.workouts.where('date').aboveOrEqual(weekStart).filter(w => !w.isPlanned).toArray());
  const weekCardio = useLiveQuery(() => db.cardioLogs.where('date').aboveOrEqual(weekStart).toArray());

  if (!profile) return null;

  const getMissionProgress = (missionId: string) => {
    switch (missionId) {
      case 'm_water': return (todayWater?.reduce((s, w) => s + w.amount, 0) || 0) >= profile.waterGoal ? 1 : 0;
      case 'm_workout': return (todayWorkouts?.length || 0) >= 1 ? 1 : 0;
      case 'm_nutrition': return Math.min(todayMeals?.length || 0, 3);
      case 'w_workouts': return Math.min(weekWorkouts?.length || 0, 3);
      case 'w_cardio': return Math.min(Math.floor(weekCardio?.reduce((s, c) => s + c.distance, 0) || 0), 10);
      case 'w_consistency': return 0; // Placeholder for active days
      default: return 0;
    }
  };

  const [activeBadgeCategory, setActiveBadgeCategory] = React.useState<'strength' | 'cardio' | 'water' | 'nutrition' | 'consistency' | 'missions' | 'usage' | 'special'>('strength');

  const categories = [
    { id: 'strength', label: 'Força', icon: Dumbbell },
    { id: 'cardio', label: 'Cardio', icon: Activity },
    { id: 'water', label: 'Água', icon: Droplet },
    { id: 'nutrition', label: 'Dieta', icon: Utensils },
    { id: 'consistency', label: 'Foco', icon: Zap },
    { id: 'missions', label: 'Missões', icon: Target },
    { id: 'usage', label: 'Uso', icon: Award },
    { id: 'special', label: 'Especiais', icon: Trophy },
  ];

  // Filter badges to show: 
  // 1. All Unlocked
  // 2. The NEXT locked one in each sequence (to avoid clutter)
  const categoryBadges = BADGES.filter(b => b.category === activeBadgeCategory);
  
  const filteredBadges = React.useMemo(() => {
    const unlocked = categoryBadges.filter(b => profile.achievements.includes(b.id));
    // Find the current progress milestone (the first locked one)
    const locked = categoryBadges.filter(b => !profile.achievements.includes(b.id));
    
    // We want to show all unlocked + a few of the next ones to keep motivation
    // But since there are 500, let's just show unlocked + Top 4 upcoming
    return [...unlocked, ...locked.slice(0, 4)];
  }, [categoryBadges, profile.achievements]);

  return (
    <div className="space-y-10 pb-10">
      <SectionTitle subtitle="Evolução & Conquistas do Atleta">Protocolo XP</SectionTitle>

      <Card variant="glass" className="p-10 relative overflow-hidden group bg-dark-surface shadow-premium">
        <XPProgress 
          level={profile.level}
          xp={profile.xp}
          currentLevelXP={getXPForLevel(profile.level)}
          nextLevelXP={getXPForLevel(profile.level + 1)}
        />
        
        <div className="grid grid-cols-2 gap-6 mt-12 pt-10 border-t border-white/[0.03]">
           <div className="flex flex-col items-center p-6 bg-white/[0.015] rounded-[20px] border border-white/[0.04] shadow-sm">
              <span className="text-[9px] font-bold text-muted-text uppercase tracking-[0.2em] mb-2.5 opacity-40">Massa Mobilizada</span>
              <p className="text-2xl font-bold tabular-nums text-white tracking-tighter">{profile.totalWeightLifted || 0} <span className="text-[11px] text-muted-text opacity-40 ml-1 font-medium tracking-normal">kg total</span></p>
           </div>
           <div className="flex flex-col items-center p-6 bg-white/[0.015] rounded-[20px] border border-white/[0.04] shadow-sm">
              <span className="text-[9px] font-bold text-muted-text uppercase tracking-[0.2em] mb-2.5 opacity-40">Resistência Acumulada</span>
              <p className="text-2xl font-bold tabular-nums text-white tracking-tighter">{(profile.totalCardioDistance || 0).toFixed(1)} <span className="text-[11px] text-muted-text opacity-40 ml-1 font-medium tracking-normal">km total</span></p>
           </div>
        </div>
      </Card>

      <div className="space-y-8">
        <div className="flex items-center justify-between px-1">
           <h3 className="font-bold text-xl tracking-tight text-premium">Missões de Campo</h3>
           <div className="flex items-center gap-2.5">
              <Target size={15} className="text-vibrant-orange opacity-40" />
              <span className="text-[10px] font-bold text-muted-text uppercase tracking-[0.2em] opacity-30">Monitoramento Ativo</span>
           </div>
        </div>
        
        <div className="space-y-4">
          {[...DAILY_MISSIONS, ...WEEKLY_MISSIONS].map((mission, i) => {
            const current = getMissionProgress(mission.id);
            const isDone = current >= mission.requirement;
            return (
              <motion.div key={mission.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <Card variant="outline" className={cn("px-6 py-6 flex items-center gap-5 transition-all bg-white/[0.01] shadow-sm border-white/[0.03]", isDone ? "opacity-30 grayscale-[0.5]" : "hover:border-white/10")}>
                   <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center border shadow-inner transition-all duration-500", isDone ? "bg-vibrant-orange/10 text-vibrant-orange border-vibrant-orange/20" : "bg-white/[0.02] text-muted-text/20 border-white/[0.04]")}>
                      {isDone ? <CheckCircle2 size={20} strokeWidth={2.5} /> : <Zap size={18} />}
                   </div>
                   <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline mb-2.5">
                         <p className="text-[14px] font-bold tracking-tight truncate text-white uppercase tabular-nums">{mission.title}</p>
                         <span className="text-[9px] font-bold text-vibrant-orange uppercase tracking-[0.2em] opacity-40 ml-2">{mission.type}</span>
                      </div>
                      <div className="flex items-center gap-4">
                         <div className="flex-1 h-[3px] bg-white/[0.03] rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${Math.min((current / mission.requirement) * 100, 100)}%` }}
                              className={cn("h-full transition-all duration-700", isDone ? "bg-vibrant-orange shadow-[0_0_8px_rgba(255,77,0,0.4)]" : "bg-white/40")}
                            />
                         </div>
                         <span className="text-[11px] font-bold text-white tabular-nums opacity-20 tracking-tighter">{current}<span className="opacity-40 mx-0.5">/</span>{mission.requirement}</span>
                      </div>
                   </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>

      <div className="space-y-8">
        <div className="flex items-center justify-between px-1">
           <h3 className="font-bold text-xl tracking-tight text-premium">Arsenal de Conquistas</h3>
           <div className="flex items-center gap-2.5">
              <Trophy size={15} className="text-vibrant-orange opacity-40" />
              <span className="text-[11px] font-bold text-white tabular-nums tracking-wide">{profile.achievements.length} <span className="text-[9px] text-muted-text opacity-30 font-bold uppercase tracking-widest">/ {BADGES.length}</span></span>
           </div>
        </div>

        {/* Badge Category Tabs */}
        <div className="flex gap-2.5 p-1.5 bg-dark-surface rounded-[18px] overflow-x-auto no-scrollbar mb-10 snap-x border border-white/[0.04] shadow-premium">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveBadgeCategory(cat.id as any)}
              className={cn(
                "min-w-[95px] flex flex-col items-center py-4 rounded-[14px] transition-all snap-start shrink-0 border relative",
                activeBadgeCategory === cat.id 
                  ? "bg-vibrant-orange/10 text-vibrant-orange border-vibrant-orange/20 shadow-sm" 
                  : "text-muted-text border-transparent opacity-30 hover:opacity-100"
              )}
            >
               <cat.icon size={18} strokeWidth={activeBadgeCategory === cat.id ? 2.5 : 2} />
               <span className="text-[9px] font-bold uppercase tracking-[1.5px] mt-2">{cat.label}</span>
            </button>
          ))}
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <AnimatePresence mode="popLayout">
            {filteredBadges.map((badge, i) => {
              const isUnlocked = profile.achievements.includes(badge.id);
              return (
                <motion.div 
                   key={badge.id}
                   layout
                   initial={{ opacity: 0, scale: 0.95 }}
                   animate={{ opacity: 1, scale: 1 }}
                   exit={{ opacity: 0, scale: 0.95 }}
                   transition={{ delay: i * 0.05 }}
                >
                  <Card variant={isUnlocked ? "glow" : "outline"} className={cn(
                    "p-8 flex flex-col items-center text-center gap-5 relative overflow-hidden group h-full transition-all bg-dark-surface shadow-premium",
                    isUnlocked ? "border-vibrant-orange/10" : "opacity-20 grayscale bg-transparent border-dashed border-white/5"
                  )}>
                    {!isUnlocked && <Lock size={12} className="absolute top-5 right-5 text-white/5" />}
                    <div className={cn(
                      "h-16 w-16 rounded-[22px] flex items-center justify-center text-3xl transition-all duration-700 shadow-premium",
                      isUnlocked ? "bg-vibrant-orange/10 border border-vibrant-orange/5 text-white scale-110" : "bg-white/[0.015] border border-white/5 text-white/10"
                    )}>
                      {badge.icon}
                    </div>
                    <div>
                      <h4 className="text-[11px] font-bold tracking-[0.2em] mb-2 uppercase leading-none text-white">{badge.title}</h4>
                      <p className="text-[9px] font-bold text-muted-text uppercase tracking-widest leading-relaxed opacity-40">
                         {badge.description}
                      </p>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
        
        <p className="text-center text-[10px] font-bold text-muted-text uppercase tracking-[0.3em] pt-6 mb-12 opacity-20">
           Exibindo marcos históricos e progressão elite
        </p>

        {/* Elite Athlete Highlight */}
        <Card variant="solid" className="p-12 text-center relative overflow-hidden group bg-dark-surface shadow-premium border border-vibrant-orange/10">
           <div className="absolute top-0 left-0 w-full h-1 bg-vibrant-orange opacity-40" />
           <div className="relative z-10">
              <div className="h-24 w-24 rounded-[2.5rem] bg-vibrant-orange/10 border border-vibrant-orange/20 mx-auto flex items-center justify-center text-5xl mb-8 shadow-premium transform group-hover:scale-110 transition-all duration-700">
                 🎖️
              </div>
              <h3 className="text-3xl font-bold tracking-tighter text-white mb-3 uppercase">Elite 365: Protocolo Vitalis</h3>
              <p className="text-[11px] font-bold text-muted-text uppercase tracking-[0.25em] mb-12 max-w-[280px] mx-auto leading-loose opacity-50 underline underline-offset-8 decoration-vibrant-orange/10">
                 CONSISTÊNCIA ABSOLUTA DURANTE UM CICLO ANUAL.
              </p>
              
              <div className="flex flex-col items-center gap-4">
                 <div className="w-full h-[6px] bg-white/[0.03] rounded-full overflow-hidden max-w-[240px] shadow-inner">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(((profile.appUsageDaysCount || 0) / 365) * 100, 100)}%` }}
                      className="h-full bg-vibrant-orange shadow-[0_0_15px_rgba(255,77,0,0.5)]" 
                    />
                 </div>
                 <span className="text-[11px] font-bold text-vibrant-orange uppercase tracking-[0.25em] tabular-nums underline decoration-vibrant-orange/20 underline-offset-[6px]">
                    {profile.appUsageDaysCount || 0} <span className="opacity-20 mx-1">/</span> 365 DIAS DE ALTA PERFORMANCE
                 </span>
              </div>
           </div>
           
           {/* Abstract Background Element */}
           <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-vibrant-orange rounded-full blur-[100px] opacity-[0.05]" />
        </Card>
      </div>
      
      <div className="pt-8 text-center opacity-10">
         <p className="text-[9px] font-bold text-white uppercase tracking-[1em]">Protocolo Gamificado Ativo</p>
      </div>
    </div>
  );
};
