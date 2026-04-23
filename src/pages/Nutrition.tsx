import React, { useState, useEffect, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { Card, SectionTitle, Button } from '../components/UI';
import { useUser } from '../hooks/useUser';
import { startOfDay } from 'date-fns';
import { Plus, Trash2, Droplet, Utensils, Zap, GlassWater, Beef, Candy, RotateCcw, Heart } from 'lucide-react';
import { LoggedMeal } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';

import { useGamification } from '../hooks/useGamification';

export const Nutrition: React.FC<{ action?: string | null, onActionHandled?: () => void }> = ({ action, onActionHandled }) => {
  const { addXP, updateStats } = useGamification();
  const { profile } = useUser();
  const mealInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLDivElement>(null);
  
  const today = startOfDay(new Date()).toISOString();
  const meals = useLiveQuery(() => db.meals.where('date').equals(today).toArray());
  const allMeals = useLiveQuery(() => db.meals.toArray());
  const waterHistory = useLiveQuery(() => db.waterLogs.where('date').equals(today).toArray());

  useEffect(() => {
    if (action === 'add-meal') {
      setTimeout(() => {
        formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        mealInputRef.current?.focus();
        onActionHandled?.();
      }, 300);
    }
  }, [action, onActionHandled]);

  const [mealName, setMealName] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [mealType, setMealType] = useState<LoggedMeal['type']>('lunch');

  const [customWater, setCustomWater] = useState('');
  const [customMealTypeName, setCustomMealTypeName] = useState('');

  const addMeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mealName || !calories) return;

    await db.meals.add({
      date: today,
      name: mealName,
      type: mealType,
      customTypeName: mealType === 'custom' ? customMealTypeName : undefined,
      calories: parseInt(calories),
      protein: parseInt(protein) || 0,
      carbs: parseInt(carbs) || 0,
      fat: parseInt(fat) || 0,
    });

    addXP(10);
    
    if (meals && meals.length === 2) { // Adding the 3rd meal now
       updateStats({ nutritionDayFinished: true });
    }

    setMealName('');
    setCalories('');
    setProtein('');
    setCarbs('');
    setFat('');
    setCustomMealTypeName('');
  };

  const repeatMeal = async (meal: any) => {
    const { id, date, ...rest } = meal;
    await db.meals.add({
      ...rest,
      date: today
    });
  };

  const addWater = async (amount: number) => {
    if (isNaN(amount) || amount <= 0) return;
    await db.waterLogs.add({
      date: today,
      amount,
    });
    
    // Check if goal was just reached
    const currentTotal = waterHistory?.reduce((sum, w) => sum + w.amount, 0) || 0;
    const newTotal = currentTotal + amount;
    const goal = profile?.waterGoal || 2500;
    
    if (currentTotal < goal && newTotal >= goal) {
      updateStats({ waterDayFinished: true });
    }
    
    setCustomWater('');
  };

  const deleteMeal = async (id: number) => {
    await db.meals.delete(id);
  };

  const totalCalories = meals?.reduce((sum, m) => sum + m.calories, 0) || 0;
  const totalWater = waterHistory?.reduce((sum, w) => sum + w.amount, 0) || 0;
  const waterGoal = profile?.waterGoal || 2500;
  const waterCompletion = Math.min((totalWater / waterGoal) * 100, 100);

  // Get distinct recent meals to suggest for repetition
  const recentSuggestions = Array.from(new Set(allMeals?.map(m => m.name)))
    .slice(0, 4)
    .map(name => allMeals?.find(m => m.name === name));

  return (
    <div className="space-y-10 pb-10">
      <SectionTitle subtitle="Nutrição & Hidratação Inteligente">Dieta</SectionTitle>

      {/* Refined Water Tracker */}
      <Card variant="glass" className="relative overflow-hidden group py-10">
        <div className="flex flex-col gap-10">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-5">
              <div className="h-14 w-14 bg-vibrant-orange/10 rounded-2xl flex items-center justify-center text-vibrant-orange border border-vibrant-orange/5 shadow-premium">
                <Droplet size={24} fill="currentColor" className="opacity-40" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-muted-text uppercase tracking-[0.2em] block mb-1.5 opacity-50">Log de Hidratação</span>
                <p className="text-4xl font-bold tabular-nums tracking-tighter text-white">{totalWater} <span className="text-[11px] font-bold opacity-20 ml-1 uppercase tracking-[0.1em]">/ {waterGoal} ml total</span></p>
              </div>
            </div>
          </div>
          
          <div className="h-[3px] bg-white/[0.03] rounded-full overflow-hidden relative">
            <motion.div 
               initial={{ width: 0 }}
               animate={{ width: `${waterCompletion}%` }}
               className="h-full bg-vibrant-orange shadow-[0_0_8px_rgba(255,77,0,0.4)]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={() => addWater(250)} 
              className="h-16 rounded-xl flex items-center justify-center gap-3 bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] transition-all group"
            >
               <Plus size={14} className="text-vibrant-orange opacity-40 group-hover:opacity-100" />
               <span className="text-xs font-bold tracking-widest uppercase">250 ml</span>
            </button>
            <button 
              onClick={() => addWater(500)} 
              className="h-16 rounded-xl flex items-center justify-center gap-3 bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] transition-all group"
            >
               <Plus size={14} className="text-vibrant-orange opacity-40 group-hover:opacity-100" />
               <span className="text-xs font-bold tracking-widest uppercase">500 ml</span>
            </button>
          </div>

          <div className="flex gap-4 pt-2">
            <input 
              type="number"
              placeholder="Dosagem Custom (ml)"
              className="flex-1 px-6 py-4.5 bg-white/[0.015] rounded-[16px] border border-white/[0.04] focus:border-vibrant-orange/20 outline-none text-sm transition-all font-bold text-white placeholder:text-muted-text/20 tabular-nums"
              value={customWater}
              onChange={(e) => setCustomWater(e.target.value)}
            />
            <Button variant="primary" onClick={() => addWater(parseInt(customWater))} className="rounded-xl px-10 font-bold uppercase text-[10px] tracking-widest">Registrar</Button>
          </div>
        </div>
      </Card>

      {/* Suggested / Favorite Meals */}
      {recentSuggestions.length > 0 && (
        <div className="space-y-5">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-[10px] font-bold text-muted-text uppercase tracking-[0.2em] opacity-60">Repetir Recente</h3>
            <RotateCcw size={14} className="text-vibrant-orange" />
          </div>
          <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
            {recentSuggestions.map((meal, i) => meal && (
              <motion.button
                key={i}
                whileTap={{ scale: 0.98 }}
                onClick={() => repeatMeal(meal)}
                className="flex-shrink-0 w-32 h-32 bg-white/[0.02] border border-white/[0.05] rounded-2xl p-4 flex flex-col justify-between items-center text-center group hover:border-vibrant-orange/30 transition-all"
              >
                <div className="h-10 w-10 bg-white/[0.04] rounded-xl flex items-center justify-center text-white/40 mb-2 group-hover:text-vibrant-orange group-hover:bg-vibrant-orange/10 transition-colors">
                  <Utensils size={18} />
                </div>
                <p className="text-[10px] font-bold text-white leading-tight uppercase tracking-tight line-clamp-2">{meal.name}</p>
                <p className="text-[9px] font-medium text-muted-text mt-1">{meal.calories} kcal</p>
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {/* Refined Meal Log Form */}
      <div ref={formRef}>
        <Card variant="solid" className="relative group p-8 md:p-10 bg-dark-surface shadow-premium">
           <div className="flex items-center gap-4 mb-12">
              <div className="h-11 w-11 bg-vibrant-orange/10 border border-vibrant-orange/5 rounded-xl flex items-center justify-center text-vibrant-orange">
                <Beef size={22} fill="currentColor" className="opacity-40" />
              </div>
              <h3 className="font-bold text-xl tracking-tight text-premium">Registrar Nutrição</h3>
           </div>
           <form onSubmit={addMeal} className="space-y-8">
              <div>
                <label className="text-[10px] font-bold text-muted-text uppercase tracking-[0.2em] ml-1 mb-3 block opacity-50">Nome do Alimento / Refeição</label>
                <input
                  ref={mealInputRef}
                  type="text"
                  placeholder="Ex: Peito de Frango + Batata Doce"
                  className="w-full px-6 py-4.5 bg-white/[0.015] rounded-xl border border-white/[0.04] focus:border-vibrant-orange/20 transition-all outline-none text-white font-semibold placeholder:text-muted-text/20"
                  value={mealName}
                  onChange={(e) => setMealName(e.target.value)}
                />
              </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="text-[10px] font-bold text-muted-text uppercase tracking-[0.2em] ml-1 mb-3 block opacity-50">Energia (Kcal)</label>
                <input
                  type="number"
                  placeholder="0"
                  className="w-full px-6 py-4.5 bg-white/[0.015] rounded-xl border border-white/[0.04] focus:border-vibrant-orange/20 outline-none font-bold text-vibrant-orange text-xl tabular-nums"
                  value={calories}
                  onChange={(e) => setCalories(e.target.value)}
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-muted-text uppercase tracking-[0.2em] ml-1 mb-3 block opacity-50">Categoria</label>
                <select 
                  className="w-full px-6 py-[21px] bg-white/[0.015] rounded-xl border border-white/[0.04] focus:border-vibrant-orange/20 outline-none appearance-none font-bold text-[11px] uppercase tracking-[1.5px] cursor-pointer text-white text-center"
                  value={mealType}
                  onChange={(e) => setMealType(e.target.value as any)}
                >
                  <option value="breakfast">CAFÉ DA MANHÃ</option>
                  <option value="lunch">ALMOÇO</option>
                  <option value="dinner">JANTAR</option>
                  <option value="snack">LANCHE</option>
                  <option value="custom">PERSONALIZADO</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Prot (g)', val: protein, set: setProtein },
                { label: 'Carb (g)', val: carbs, set: setCarbs },
                { label: 'Gord (g)', val: fat, set: setFat }
              ].map((m, i) => (
                <div key={i}>
                  <label className="text-[9px] font-bold text-muted-text uppercase tracking-[0.2em] text-center block mb-3 opacity-40">{m.label}</label>
                  <input
                    type="number"
                    placeholder="0"
                    className="w-full px-3 py-4 bg-white/[0.015] rounded-xl border border-white/[0.04] focus:border-white/10 text-center outline-none text-xs font-bold text-white tabular-nums"
                    value={m.val}
                    onChange={(e) => m.set(e.target.value)}
                  />
                </div>
              ))}
            </div>

            <Button type="submit" size="lg" className="w-full mt-6 py-5 font-bold tracking-[0.2em] uppercase text-[10px]">
               Confirmar Registro
            </Button>
         </form>
      </Card>
      </div>

      {/* History List */}
      <div className="space-y-6">
        <div className="flex items-center justify-between px-1">
          <h3 className="font-bold text-xl tracking-tight">Resumo do Dia</h3>
          <span className="text-[9px] font-bold text-vibrant-orange uppercase tracking-widest bg-vibrant-orange/10 px-3 py-1.5 rounded-lg border border-vibrant-orange/10">{totalCalories} KCAL</span>
        </div>
        
        <AnimatePresence mode="popLayout">
          {meals?.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Card variant="outline" className="flex flex-col items-center justify-center py-16 opacity-30 border-dashed">
                <Utensils size={32} className="mb-4" />
                <p className="text-[10px] font-bold uppercase tracking-widest">Aguardando registros</p>
              </Card>
            </motion.div>
          ) : (
            <div className="space-y-4">
              {meals?.map((meal, idx) => (
                <motion.div 
                  key={meal.id}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Card variant="outline" className="px-5 py-5 group hover:border-vibrant-orange/20 transition-all bg-white/[0.01]">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "h-10 w-10 rounded-lg flex items-center justify-center",
                          meal.type === 'breakfast' ? 'text-vibrant-orange bg-vibrant-orange/10' : 'text-white/40 bg-white/[0.03]'
                        )}>
                          {meal.type === 'breakfast' ? <Candy size={18} /> : <Beef size={18} />}
                        </div>
                        <div>
                          <p className="font-bold text-white tracking-tight group-hover:text-vibrant-orange transition-colors">{meal.name}</p>
                          <div className="flex gap-2.5 text-[9px] text-muted-text uppercase font-bold tracking-widest mt-1 opacity-40">
                            <span>{meal.calories} kcal</span>
                            <span className="opacity-20">•</span>
                            <span>{meal.protein}g P</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                         <Button variant="ghost" size="icon" onClick={() => repeatMeal(meal)} className="h-8 w-8 opacity-0 group-hover:opacity-100">
                            <RotateCcw size={14} />
                         </Button>
                         <button 
                          onClick={() => meal.id && deleteMeal(meal.id)}
                          className="h-8 w-8 flex items-center justify-center text-red-500/40 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
