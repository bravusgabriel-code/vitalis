import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { supabase } from '../lib/supabase';
import { Card, SectionTitle, Button } from '../components/UI';
import { useUser } from '../hooks/useUser';
import { startOfDay, format } from 'date-fns';
import { 
  Plus, 
  Trash2, 
  Droplet, 
  Utensils, 
  Search, 
  ChevronDown, 
  ChevronUp, 
  Edit2, 
  Check, 
  X,
  Beef,
  Candy,
  RefreshCw,
  Zap,
  MoreVertical
} from 'lucide-react';
import { LoggedMeal, Food, MealGroup } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { useGamification } from '../hooks/useGamification';

// Component for adding/editing food in a meal group
const FoodInputForm: React.FC<{
  initialData?: Partial<LoggedMeal>;
  onSave: (data: Partial<LoggedMeal>) => void;
  onCancel: () => void;
}> = ({ initialData, onSave, onCancel }) => {
  const [mode, setMode] = useState<'search' | 'manual'>(initialData?.foodId ? 'search' : initialData ? 'manual' : 'search');
  const [searchTerm, setSearchTerm] = useState(initialData?.name || '');
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [grams, setGrams] = useState<string>(initialData?.grams?.toString() || '100');
  const [showResults, setShowResults] = useState(false);
  
  // Manual fields
  const [manualName, setManualName] = useState(initialData?.name || '');
  const [manualKcal, setManualKcal] = useState(initialData?.calories?.toString() || '');
  const [manualProt, setManualProt] = useState(initialData?.protein?.toString() || '');
  const [manualCarb, setManualCarb] = useState(initialData?.carbs?.toString() || '');
  const [manualFat, setManualFat] = useState(initialData?.fat?.toString() || '');

  // Load food details if editing a food from DB
  const [initialFood, setInitialFood] = useState<Food | null>(null);

  useEffect(() => {
    const loadInitialFood = async () => {
      if (!initialData?.foodId) return;

      // Check if it's a Supabase UUID (string) or Dexie ID (number)
      if (typeof initialData.foodId === 'string') {
        const { data, error } = await supabase
          .from('foods')
          .select('*')
          .eq('id', initialData.foodId)
          .single();
        if (!error && data) setInitialFood(data);
      } else {
        const food = await db.foods.get(initialData.foodId);
        if (food) setInitialFood(food);
      }
    };
    loadInitialFood();
  }, [initialData?.foodId]);

  useEffect(() => {
    if (initialFood && !selectedFood) {
      setSelectedFood(initialFood);
    }
  }, [initialFood]);

  const [foods, setFoods] = useState<Food[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const searchFoods = async () => {
      const term = searchTerm.toLowerCase().trim();
      if (!term || term.length < 2) {
        setFoods([]);
        return;
      }

      setIsSearching(true);
      try {
        // Try Supabase first
        if (supabase.isConfigured) {
          // Professional search logic: items starting with the term first, then items containing it
          const { data, error } = await supabase
            .from('foods')
            .select('*')
            .or(`name_normalized.ilike.${term}%,name_normalized.ilike.%${term}%`)
            .limit(15); // Fetch a bit more to allow frontend sorting
          
          if (!error && data && data.length > 0) {
            // Sort to ensure "starts with" comes first
            const sorted = [...data].sort((a, b) => {
              const aNorm = a.name_normalized || a.name.toLowerCase();
              const bNorm = b.name_normalized || b.name.toLowerCase();
              const aStarts = aNorm.startsWith(term);
              const bStarts = bNorm.startsWith(term);
              if (aStarts && !bStarts) return -1;
              if (!aStarts && bStarts) return 1;
              return aNorm.localeCompare(bNorm);
            }).slice(0, 10);

            setFoods(sorted);
            setIsSearching(false);
            return;
          }
        }

        // Fallback to local Dexie if Supabase not configured or no results
        const localFoods = await db.foods
          .filter(food => {
             const norm = (food.name_normalized || food.name).toLowerCase();
             return norm.includes(term);
          })
          .limit(20)
          .toArray();

        const sortedLocal = localFoods.sort((a, b) => {
          const aNorm = (a.name_normalized || a.name).toLowerCase();
          const bNorm = (b.name_normalized || b.name).toLowerCase();
          const aStarts = aNorm.startsWith(term);
          const bStarts = bNorm.startsWith(term);
          if (aStarts && !bStarts) return -1;
          if (!aStarts && bStarts) return 1;
          return aNorm.localeCompare(bNorm);
        }).slice(0, 10);

        setFoods(sortedLocal);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setIsSearching(false);
      }
    };

    const timer = setTimeout(searchFoods, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleSelect = (food: Food) => {
    setSelectedFood(food);
    setSearchTerm(food.name);
    setShowResults(false);
  };

  const handleConfirm = () => {
    if (mode === 'search') {
      const activeFood = selectedFood || initialFood;
      if (activeFood && grams) {
        const factor = parseFloat(grams) / 100;
        onSave({
          id: initialData?.id,
          foodId: activeFood.id,
          name: activeFood.name,
          grams: Math.max(0, parseFloat(grams)),
          calories: Math.round(activeFood.calories_per_100g * factor),
          protein: parseFloat((activeFood.protein_per_100g * factor).toFixed(1)),
          carbs: parseFloat((activeFood.carbs_per_100g * factor).toFixed(1)),
          fat: parseFloat((activeFood.fat_per_100g * factor).toFixed(1)),
        });
      }
    } else {
      if (manualName && manualKcal && grams) {
        onSave({
          id: initialData?.id,
          name: manualName,
          grams: Math.max(0, parseFloat(grams)),
          calories: Math.max(0, Math.round(parseInt(manualKcal))),
          protein: Math.max(0, parseFloat(manualProt) || 0),
          carbs: Math.max(0, parseFloat(manualCarb) || 0),
          fat: Math.max(0, parseFloat(manualFat) || 0),
        });
      }
    }
  };

  const currentStats = useMemo(() => {
    const g = parseFloat(grams || '0');
    if (mode === 'search') {
      const activeFood = selectedFood || initialFood;
      if (!activeFood) return null;
      const f = g / 100;
      return {
        kcal: Math.round(activeFood.calories_per_100g * f),
        prot: (activeFood.protein_per_100g * f).toFixed(1),
        carb: (activeFood.carbs_per_100g * f).toFixed(1),
        fat: (activeFood.fat_per_100g * f).toFixed(1),
      };
    } else {
      return {
        kcal: manualKcal || '0',
        prot: manualProt || '0',
        carb: manualCarb || '0',
        fat: manualFat || '0',
      };
    }
  }, [mode, selectedFood, initialFood, grams, manualKcal, manualProt, manualCarb, manualFat]);

  return (
    <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6 mt-4 space-y-6 shadow-2xl overflow-hidden relative">
      <div className="flex bg-black/40 p-1 rounded-xl border border-white/5">
        <button 
          onClick={() => setMode('search')}
          className={cn(
            "flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all",
            mode === 'search' ? "bg-vibrant-orange text-white shadow-lg" : "text-muted-text opacity-40 hover:opacity-100"
          )}
        >
          Pesquisar
        </button>
        <button 
          onClick={() => setMode('manual')}
          className={cn(
            "flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all",
            mode === 'manual' ? "bg-vibrant-orange text-white shadow-lg" : "text-muted-text opacity-40 hover:opacity-100"
          )}
        >
          Personalizado
        </button>
      </div>

      {mode === 'search' ? (
        <div className="space-y-4">
          <div className="relative">
            <label className="text-[10px] font-bold text-muted-text uppercase tracking-widest mb-2 block opacity-40">Buscar Alimento</label>
            <div className="relative">
              <input
                type="text"
                className="w-full bg-black/20 border border-white/5 rounded-xl px-12 py-4 text-sm font-semibold outline-none focus:border-vibrant-orange/30 transition-all text-white"
                placeholder="Ex: Arroz, Frango..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setShowResults(true);
                  if (!e.target.value) setSelectedFood(null);
                }}
              />
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-text opacity-30" />
            </div>

            <AnimatePresence>
              {showResults && searchTerm && !selectedFood && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute z-50 w-full mt-2 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl overflow-hidden max-h-60 overflow-y-auto"
                >
                  {foods && foods.length > 0 ? (
                    foods.map(food => (
                      <button
                        key={food.id}
                        onClick={() => handleSelect(food)}
                        className="w-full px-5 py-3.5 text-left hover:bg-white/5 border-b border-white/5 last:border-none flex justify-between items-center group"
                      >
                        <span className="font-bold text-sm tracking-tight text-white/80 group-hover:text-vibrant-orange transition-colors">{food.name}</span>
                        <span className="text-[10px] font-bold text-muted-text opacity-40 uppercase">{food.calories_per_100g} kcal / 100g</span>
                      </button>
                    ))
                  ) : (
                    <div className="px-5 py-4 text-center text-[10px] font-bold uppercase tracking-widest text-muted-text opacity-30">Nenhum resultado</div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {(selectedFood || initialData?.foodId) && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
               <div>
                  <label className="text-[10px] font-bold text-muted-text uppercase tracking-widest mb-2 block opacity-40">Quantidade (g ou ml)</label>
                  <input
                    type="number"
                    className="w-full bg-black/20 border border-vibrant-orange/20 rounded-xl px-5 py-4 text-lg font-black outline-none tabular-nums text-white"
                    value={grams}
                    onChange={(e) => setGrams(e.target.value)}
                    autoFocus
                  />
               </div>
          <div className="flex justify-around p-4 bg-white/[0.015] rounded-xl border border-white/[0.03]">
             <div className="text-center">
                <p className="text-[8px] font-bold text-muted-text uppercase mb-1 opacity-40">Kcal</p>
                <p className="text-sm font-bold text-vibrant-orange">{currentStats?.kcal}</p>
             </div>
             <div className="text-center">
                <p className="text-[8px] font-bold text-muted-text uppercase mb-1 opacity-40">Prot</p>
                <p className="text-sm font-bold text-emerald-400">{currentStats?.prot}g</p>
             </div>
             <div className="text-center">
                <p className="text-[8px] font-bold text-muted-text uppercase mb-1 opacity-40">Carb</p>
                <p className="text-sm font-bold text-amber-400">{currentStats?.carb}g</p>
             </div>
             <div className="text-center">
                <p className="text-[8px] font-bold text-muted-text uppercase mb-1 opacity-40">Gord</p>
                <p className="text-sm font-bold text-indigo-400">{currentStats?.fat}g</p>
             </div>
          </div>
            </motion.div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
           <div className="col-span-2">
              <label className="text-[10px] font-bold text-muted-text uppercase tracking-widest mb-2 block opacity-40">Nome do Alimento</label>
              <input
                type="text"
                className="w-full bg-black/20 border border-white/5 rounded-xl px-5 py-4 text-sm font-semibold outline-none text-white"
                value={manualName}
                onChange={(e) => setManualName(e.target.value)}
              />
           </div>
           <div>
              <label className="text-[10px] font-bold text-muted-text uppercase tracking-widest mb-2 block opacity-40">Quantidade (g/ml)</label>
              <input
                type="number"
                className="w-full bg-black/20 border border-white/5 rounded-xl px-5 py-4 text-sm font-semibold outline-none text-white text-center"
                value={grams}
                onChange={(e) => setGrams(e.target.value)}
              />
           </div>
           <div>
              <label className="text-[10px] font-bold text-muted-text uppercase tracking-widest mb-2 block opacity-40">Calorias</label>
              <input
                type="number"
                className="w-full bg-black/20 border border-white/5 rounded-xl px-5 py-4 text-sm font-semibold outline-none text-white text-center"
                value={manualKcal}
                onChange={(e) => setManualKcal(e.target.value)}
              />
           </div>
           <div>
              <label className="text-[10px] font-bold text-muted-text uppercase tracking-widest mb-2 block opacity-40">Proteína</label>
              <input
                type="number"
                className="w-full bg-black/20 border border-white/5 rounded-xl px-5 py-4 text-sm font-semibold outline-none text-white text-center"
                value={manualProt}
                onChange={(e) => setManualProt(e.target.value)}
              />
           </div>
           <div>
              <label className="text-[10px] font-bold text-muted-text uppercase tracking-widest mb-2 block opacity-40">Carbo</label>
              <input
                type="number"
                className="w-full bg-black/20 border border-white/5 rounded-xl px-5 py-4 text-sm font-semibold outline-none text-white text-center"
                value={manualCarb}
                onChange={(e) => setManualCarb(e.target.value)}
              />
           </div>
           <div>
              <label className="text-[10px] font-bold text-muted-text uppercase tracking-widest mb-2 block opacity-40">Gordura</label>
              <input
                type="number"
                className="w-full bg-black/20 border border-white/5 rounded-xl px-5 py-4 text-sm font-semibold outline-none text-white text-center"
                value={manualFat}
                onChange={(e) => setManualFat(e.target.value)}
              />
           </div>
        </div>
      )}

      <div className="flex gap-2 pt-2">
         <Button onClick={onCancel} variant="ghost" className="flex-1 h-[52px] border border-white/5">Cancelar</Button>
         <Button onClick={handleConfirm} className="flex-1 h-[52px] bg-vibrant-orange hover:bg-vibrant-orange/90 font-black uppercase text-[10px] tracking-widest">
           {initialData ? 'Atualizar' : 'Adicionar'}
         </Button>
      </div>
    </div>
  );
};

export const Nutrition: React.FC<{ action?: string | null, onActionHandled?: () => void }> = ({ action, onActionHandled }) => {
  const { addXP, updateStats } = useGamification();
  const { profile } = useUser();
  const today = format(new Date(), 'yyyy-MM-dd');
  
  const mealGroups = useLiveQuery(() => db.mealGroups.where('date').equals(today).sortBy('order'));
  const mealItems = useLiveQuery(() => db.meals.where('date').equals(today).toArray());
  const waterHistory = useLiveQuery(() => db.waterLogs.where('date').equals(today).toArray());

  const [addingToMealId, setAddingToMealId] = useState<number | null>(null);
  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  const [editingMealGroupId, setEditingMealGroupId] = useState<number | null>(null);
  const [editingMealNameText, setEditingMealNameText] = useState('');
  
  const [editingWaterId, setEditingWaterId] = useState<number | null>(null);
  const [editingWaterAmount, setEditingWaterAmount] = useState<string>('');

  // Initial check to ensure at least 1st meal exists
  const hasInitializedRef = useRef(false);
  useEffect(() => {
    const initMeal = async () => {
      if (mealGroups && mealGroups.length === 0 && !hasInitializedRef.current) {
        hasInitializedRef.current = true;
        const count = await db.mealGroups.where('date').equals(today).count();
        if (count === 0) {
          await db.mealGroups.add({
            date: today,
            order: 1,
            type: 'meal',
            userId: profile?.id
          });
          
          await db.mealGroups.add({
            date: today,
            order: 99, 
            type: 'extra',
            name: 'Extras do dia',
            userId: profile?.id
          });
        }
      }
    };
    if (mealGroups) initMeal();
  }, [mealGroups, today, profile?.id]);

  const addNewMeal = async () => {
    const nextOrder = (mealGroups?.filter(m => m.type === 'meal').length || 0) + 1;
    await db.mealGroups.add({
      date: today,
      order: nextOrder,
      type: 'meal',
      userId: profile?.id
    });
    addXP(5);
  };

  const startEditingMealName = (meal: MealGroup) => {
    setEditingMealGroupId(meal.id!);
    setEditingMealNameText(meal.name || '');
  };

  const saveMealName = async () => {
    if (editingMealGroupId) {
      await db.mealGroups.update(editingMealGroupId, { name: editingMealNameText });
      setEditingMealGroupId(null);
    }
  };

  const updateFoodItem = async (data: Partial<LoggedMeal>) => {
    if (data.id) {
      await db.meals.update(data.id, data);
      setEditingItemId(null);
    }
  };

  const addFoodToMeal = async (mealGroupId: number, data: Partial<LoggedMeal>) => {
    await db.meals.add({
      ...data as any,
      mealGroupId,
      date: today,
      type: 'custom'
    });
    
    addXP(10);
    setAddingToMealId(null);
    updateStats({ nutritionDayFinished: true });
  };

  const deleteMealItem = async (id: number) => {
    await db.meals.delete(id);
  };

  const deleteMealGroup = async (id: number) => {
    const items = mealItems?.filter(i => i.mealGroupId === id) || [];
    for (const item of items) {
      await db.meals.delete(item.id!);
    }
    await db.mealGroups.delete(id);
  };

  const totalCalories = mealItems?.reduce((sum, m) => sum + m.calories, 0) || 0;
  const waterGoal = profile?.waterGoal || 2500;
  const totalWater = waterHistory?.reduce((sum, w) => sum + w.amount, 0) || 0;
  const waterCompletion = Math.min((totalWater / waterGoal) * 100, 100);

  const addWater = async (amount: number) => {
    await db.waterLogs.add({ date: today, amount });
    if (totalWater + amount >= waterGoal) {
      updateStats({ waterDayFinished: true });
    }
  };

  const updateWater = async (id: number, amount: number) => {
    await db.waterLogs.update(id, { amount });
    setEditingWaterId(null);
  };

  const deleteWater = async (id: number) => {
    await db.waterLogs.delete(id);
  };

  const startEditingWater = (id: number, amount: number) => {
    setEditingWaterId(id);
    setEditingWaterAmount(amount.toString());
  };

  const [activeTab, setActiveTab] = useState<'meals' | 'extras'>('meals');

  // Filter groups per tab
  const filteredGroups = useMemo(() => {
    if (!mealGroups) return [];
    return activeTab === 'meals' 
      ? mealGroups.filter(g => g.type === 'meal')
      : mealGroups.filter(g => g.type === 'extra');
  }, [mealGroups, activeTab]);

  return (
    <div className="space-y-10 pb-20">
      <div className="flex justify-between items-end">
        <SectionTitle subtitle="Planejamento Profissional de Nutrição">Dieta</SectionTitle>
        <div className="bg-vibrant-orange/10 px-4 py-2 rounded-xl border border-vibrant-orange/10">
          <span className="text-[10px] font-bold text-muted-text uppercase tracking-widest opacity-60">Total Hoje</span>
          <p className="text-xl font-black text-vibrant-orange tabular-nums">{totalCalories} <span className="text-[10px] opacity-40">kcal</span></p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex bg-white/[0.03] border border-white/5 p-1 rounded-2xl">
        <button 
          onClick={() => setActiveTab('meals')}
          className={cn(
            "flex-1 py-4 text-[11px] font-black uppercase tracking-[0.2em] rounded-xl transition-all relative overflow-hidden",
            activeTab === 'meals' ? "text-white bg-vibrant-orange shadow-xl shadow-vibrant-orange/20" : "text-muted-text opacity-40 hover:opacity-100"
          )}
        >
          Refeições
        </button>
        <button 
          onClick={() => setActiveTab('extras')}
          className={cn(
            "flex-1 py-4 text-[11px] font-black uppercase tracking-[0.2em] rounded-xl transition-all relative overflow-hidden",
            activeTab === 'extras' ? "text-white bg-vibrant-orange shadow-xl shadow-vibrant-orange/20" : "text-muted-text opacity-40 hover:opacity-100"
          )}
        >
          Extras do dia
        </button>
      </div>

      {/* Water Section - Keep it visible or based on user preference, showing for now */}
      <Card variant="glass" className="p-8 group overflow-hidden relative">
        <div className="flex items-center justify-between gap-8 mb-8">
           <div className="flex items-center gap-4">
             <div className="h-12 w-12 bg-vibrant-orange/10 rounded-2xl flex items-center justify-center text-vibrant-orange border border-vibrant-orange/10">
               <Droplet size={24} fill="currentColor" className="opacity-40" />
             </div>
             <div>
               <h3 className="font-bold text-lg tracking-tight text-premium">Hidratação</h3>
               <p className="text-[10px] font-bold text-muted-text uppercase tracking-widest opacity-40">{totalWater} / {waterGoal} ml</p>
             </div>
           </div>
           <div className="flex gap-2">
             <Button variant="ghost" size="sm" onClick={() => addWater(250)} className="rounded-xl border border-white/5">+ 250ml</Button>
             <Button variant="ghost" size="sm" onClick={() => addWater(500)} className="rounded-xl border border-white/5">+ 500ml</Button>
           </div>
        </div>

        <div className="h-2 bg-white/5 rounded-full overflow-hidden mb-8">
           <motion.div 
             initial={{ width: 0 }}
             animate={{ width: `${waterCompletion}%` }}
             className="h-full bg-vibrant-orange shadow-[0_0_10px_rgba(255,77,0,0.5)]"
           />
        </div>

        {/* Recent Water Consumption List */}
        <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
           <AnimatePresence mode="popLayout">
             {waterHistory && waterHistory.length > 0 ? (
               waterHistory.map((item) => (
                 <motion.div 
                   key={item.id}
                   layout
                   initial={{ opacity: 0, x: -10 }}
                   animate={{ opacity: 1, x: 0 }}
                   exit={{ opacity: 0, x: 10 }}
                   className="flex items-center justify-between bg-white/[0.02] border border-white/[0.05] rounded-xl px-4 py-3 group/water"
                 >
                   {editingWaterId === item.id ? (
                     <div className="flex items-center gap-2 w-full">
                        <input 
                           type="number"
                           autoFocus
                           className="flex-1 bg-black/40 border border-vibrant-orange/30 rounded-lg px-3 py-1 text-sm font-black text-white outline-none"
                           value={editingWaterAmount}
                           onChange={(e) => setEditingWaterAmount(e.target.value)}
                           onKeyDown={(e) => e.key === 'Enter' && updateWater(item.id!, parseInt(editingWaterAmount))}
                        />
                        <button onClick={() => updateWater(item.id!, parseInt(editingWaterAmount))} className="p-1.5 text-emerald-400 hover:bg-emerald-400/10 rounded-lg transition-colors">
                           <Check size={16} />
                        </button>
                        <button onClick={() => setEditingWaterId(null)} className="p-1.5 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors">
                           <X size={16} />
                        </button>
                     </div>
                   ) : (
                     <>
                        <div className="flex items-center gap-3">
                           <div className="h-1.5 w-1.5 bg-vibrant-orange/60 rounded-full" />
                           <p className="font-bold text-sm text-white/80">{item.amount}ml</p>
                        </div>
                        <div className="flex items-center gap-2 opacity-0 group-hover/water:opacity-100 transition-opacity">
                           <button 
                             onClick={() => startEditingWater(item.id!, item.amount)}
                             className="p-1.5 text-muted-text hover:text-white transition-colors"
                           >
                              <Edit2 size={14} />
                           </button>
                           <button 
                             onClick={() => deleteWater(item.id!)}
                             className="p-1.5 text-muted-text hover:text-red-500 transition-colors"
                           >
                              <Trash2 size={14} />
                           </button>
                        </div>
                     </>
                   )}
                 </motion.div>
               ))
             ) : (
               <div className="py-4 text-center border border-dashed border-white/5 rounded-xl opacity-10">
                  <p className="text-[9px] font-bold uppercase tracking-widest">Nenhum registro hoje</p>
               </div>
             )}
           </AnimatePresence>
        </div>
      </Card>

      {/* MEAL GROUPS */}
      <div className="space-y-8">
        <AnimatePresence mode="popLayout">
          {filteredGroups.map((group) => {
             const items = mealItems?.filter(i => i.mealGroupId === group.id) || [];
             const mealKcal = items.reduce((s, i) => s + i.calories, 0);
             const mealProt = items.reduce((s, i) => s + i.protein, 0);
             const mealCarb = items.reduce((s, i) => s + i.carbs, 0);
             const mealFat = items.reduce((s, i) => s + i.fat, 0);
             
             return (
               <motion.div
                 key={group.id}
                 layout
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 exit={{ opacity: 0, scale: 0.95 }}
               >
                 <Card variant={group.type === 'extra' ? 'outline' : 'solid'} className={cn(
                   "p-8 relative overflow-visible border border-white/[0.04] group",
                   group.type === 'extra' ? "bg-white/[0.01] border-dashed border-white/10" : "bg-dark-surface shadow-premium"
                 )}>
                   {/* Card Header - Hierarchy: 1ª Refeição (static) > Name (editable) */}
                   <div className="flex justify-between items-start mb-8">
                      <div className="flex-1">
                        {group.type === 'meal' && (
                          <div className="mb-2">
                             <span className="text-[10px] font-black text-vibrant-orange uppercase tracking-[0.2em] opacity-60">
                               {group.order}ª Refeição
                             </span>
                          </div>
                        )}
                        
                        {editingMealGroupId === group.id ? (
                          <div className="flex items-center gap-2">
                            <input
                              autoFocus
                              className="bg-black/40 border border-vibrant-orange/30 rounded-lg px-4 py-2 text-xl font-black outline-none w-full max-w-xs text-white"
                              value={editingMealNameText}
                              onChange={(e) => setEditingMealNameText(e.target.value)}
                              onBlur={saveMealName}
                              onKeyDown={(e) => e.key === 'Enter' && saveMealName()}
                            />
                            <button onClick={saveMealName} className="p-2 text-emerald-400"><Check size={20} /></button>
                          </div>
                        ) : (
                          <div className="group/name flex items-center gap-3 cursor-pointer" onClick={() => startEditingMealName(group)}>
                             <h3 className="text-2xl font-black tracking-tighter text-white/90 flex items-center gap-2">
                               {group.name || 'Nutrição'}
                               <Edit2 size={14} className="text-vibrant-orange opacity-20 group-hover/name:opacity-100 transition-all" />
                             </h3>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-4">
                         <div className="text-right">
                            <p className="text-[10px] font-bold text-muted-text uppercase tracking-widest opacity-30">Total</p>
                            <p className="text-xl font-black text-white tabular-nums">{mealKcal} <span className="text-[10px] font-normal opacity-30">kcal</span></p>
                         </div>
                         <button 
                            onClick={() => group.id && deleteMealGroup(group.id)}
                            className="p-2 text-muted-text hover:text-red-500 opacity-20 hover:opacity-100 transition-all"
                          >
                            <Trash2 size={16} />
                         </button>
                      </div>
                   </div>

                   {/* Add Item Trigger */}
                   <div className="mb-8">
                      {addingToMealId === group.id ? (
                        <FoodInputForm 
                          onSave={(data) => addFoodToMeal(group.id!, data)}
                          onCancel={() => setAddingToMealId(null)}
                        />
                      ) : (
                        <button 
                          onClick={() => setAddingToMealId(group.id!)}
                          className="w-full h-14 bg-white/[0.02] border border-vibrant-orange/10 border-dashed rounded-xl flex items-center justify-center gap-2 text-vibrant-orange/60 hover:text-vibrant-orange hover:bg-vibrant-orange/10 hover:border-vibrant-orange/30 transition-all text-[10px] font-black uppercase tracking-widest"
                        >
                          <Plus size={16} />
                          Adicionar Alimento
                        </button>
                      )}
                   </div>

                   {/* Items List */}
                   <div className="space-y-3 mb-8">
                      {items.length > 0 ? (
                        items.map(item => (
                          <div key={item.id} className="flex items-center justify-between bg-white/[0.02] border border-white/[0.05] rounded-xl px-4 py-3 group/item">
                             {editingItemId === item.id ? (
                               <div className="w-full">
                                  <FoodInputForm 
                                    initialData={item}
                                    onSave={(data) => updateFoodItem(data)}
                                    onCancel={() => setEditingItemId(null)}
                                  />
                               </div>
                             ) : (
                               <>
                                 <div className="flex items-center gap-3 cursor-pointer" onClick={() => setEditingItemId(item.id!)}>
                                    <div className="h-2 w-2 bg-vibrant-orange/40 rounded-full" />
                                    <div>
                                       <div className="flex items-center gap-2">
                                          <p className="font-bold text-sm text-white/90">{item.name}</p>
                                          <Edit2 size={10} className="text-vibrant-orange opacity-20 group-hover/item:opacity-80 transition-opacity" />
                                       </div>
                                       <p className="text-[10px] font-medium text-muted-text opacity-40">{item.grams}g • {item.calories} kcal</p>
                                    </div>
                                 </div>
                                 <div className="flex items-center gap-4">
                                    <div className="flex gap-2 text-[9px] font-bold text-muted-text uppercase tracking-tighter opacity-20 group-hover/item:opacity-60 transition-opacity">
                                       <span className="text-emerald-400">{item.protein}P</span>
                                       <span className="text-amber-400">{item.carbs}C</span>
                                       <span className="text-indigo-400">{item.fat}G</span>
                                    </div>
                                    <button onClick={() => item.id && deleteMealItem(item.id)} className="text-red-500/20 hover:text-red-500 transition-colors">
                                       <Trash2 size={14} />
                                    </button>
                                 </div>
                               </>
                             )}
                          </div>
                        ))
                      ) : (
                        <div className="py-6 text-center border border-dashed border-white/5 rounded-xl opacity-10">
                           <Utensils size={20} className="mx-auto mb-2" />
                           <p className="text-[9px] font-bold uppercase tracking-widest">Aguardando Alimentos</p>
                        </div>
                      )}
                   </div>

                   {/* Meal Macros Summary Footer */}
                   {items.length > 0 && (
                     <div className="mt-8 pt-6 border-t border-white/5 grid grid-cols-4 gap-4">
                        <div className="text-center bg-white/[0.015] rounded-xl py-3 border border-white/[0.03]">
                           <p className="text-[8px] font-black text-emerald-400 uppercase tracking-widest mb-1 opacity-60">Prot</p>
                           <p className="text-sm font-black text-white tabular-nums">{mealProt.toFixed(0)}g</p>
                        </div>
                        <div className="text-center bg-white/[0.015] rounded-xl py-3 border border-white/[0.03]">
                           <p className="text-[8px] font-black text-amber-400 uppercase tracking-widest mb-1 opacity-60">Carb</p>
                           <p className="text-sm font-black text-white tabular-nums">{mealCarb.toFixed(0)}g</p>
                        </div>
                        <div className="text-center bg-white/[0.015] rounded-xl py-3 border border-white/[0.03]">
                           <p className="text-[8px] font-black text-indigo-400 uppercase tracking-widest mb-1 opacity-60">Gord</p>
                           <p className="text-sm font-black text-white tabular-nums">{mealFat.toFixed(0)}g</p>
                        </div>
                        <div className="text-center bg-vibrant-orange/10 rounded-xl py-3 border border-vibrant-orange/10">
                           <p className="text-[8px] font-black text-vibrant-orange uppercase tracking-widest mb-1">Kcal</p>
                           <p className="text-sm font-black text-vibrant-orange tabular-nums">{mealKcal}</p>
                        </div>
                     </div>
                   )}
                 </Card>
               </motion.div>
             );
          })}
        </AnimatePresence>

        {activeTab === 'meals' && (
          <button 
            onClick={addNewMeal}
            className="w-full h-16 bg-white/[0.02] border border-white/5 border-dashed rounded-2xl flex items-center justify-center gap-3 text-muted-text hover:text-white hover:border-vibrant-orange/20 hover:bg-vibrant-orange/[0.02] transition-all group"
          >
            <div className="bg-white/5 p-1 rounded-md group-hover:bg-vibrant-orange/20 transition-all group-hover:text-vibrant-orange">
              <Plus size={18} />
            </div>
            <span className="text-[11px] font-black uppercase tracking-[0.2em]">Adicionar Nova Refeição</span>
          </button>
        )}
      </div>

      {/* Overall Daily Summary */}
      <Card variant="glass" className="p-8 border-none bg-vibrant-orange/[0.01] shadow-2xl">
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-text opacity-30 mb-8">Resumo Consumo Diário</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
           <div className="space-y-3">
              <div className="flex justify-between items-end">
                <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400 opacity-60">Proteína</span>
                <span className="text-sm font-black text-white tabular-nums">{mealItems?.reduce((s,i) => s + i.protein, 0).toFixed(0)} <span className="text-[10px] font-normal opacity-40">g</span></span>
              </div>
              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min((mealItems?.reduce((s,i) => s + i.protein, 0) || 0) / (profile?.targetProtein || 150) * 100, 100)}%` }} className="h-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.3)]" />
              </div>
           </div>
           <div className="space-y-3">
              <div className="flex justify-between items-end">
                <span className="text-[9px] font-black uppercase tracking-widest text-amber-400 opacity-60">Carbo</span>
                <span className="text-sm font-black text-white tabular-nums">{mealItems?.reduce((s,i) => s + i.carbs, 0).toFixed(0)} <span className="text-[10px] font-normal opacity-40">g</span></span>
              </div>
              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min((mealItems?.reduce((s,i) => s + i.carbs, 0) || 0) / (profile?.targetCarbs || 250) * 100, 100)}%` }} className="h-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.3)]" />
              </div>
           </div>
           <div className="space-y-3">
              <div className="flex justify-between items-end">
                <span className="text-[9px] font-black uppercase tracking-widest text-indigo-400 opacity-60">Gordura</span>
                <span className="text-sm font-black text-white tabular-nums">{mealItems?.reduce((s,i) => s + i.fat, 0).toFixed(0)} <span className="text-[10px] font-normal opacity-40">g</span></span>
              </div>
              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min((mealItems?.reduce((s,i) => s + i.fat, 0) || 0) / (profile?.targetFat || 70) * 100, 100)}%` }} className="h-full bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.3)]" />
              </div>
           </div>
           <div className="space-y-3">
              <div className="flex justify-between items-end">
                <span className="text-[9px] font-black uppercase tracking-widest text-vibrant-orange">Energia</span>
                <span className="text-sm font-black text-white tabular-nums">{totalCalories} <span className="text-[10px] font-normal opacity-40">kcal</span></span>
              </div>
              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min((totalCalories / (profile?.targetCalories || 2000)) * 100, 100)}%` }} className="h-full bg-vibrant-orange shadow-[0_0_8px_rgba(255,77,0,0.3)]" />
              </div>
           </div>
        </div>
      </Card>
    </div>
  );
};
