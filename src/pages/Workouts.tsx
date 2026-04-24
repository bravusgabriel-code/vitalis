import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { Card, SectionTitle, Button } from '../components/UI';
import { startOfDay } from 'date-fns';
import { 
  Plus, 
  Trash2, 
  Dumbbell, 
  Activity, 
  Clock, 
  Flame,
  Zap,
  ChevronRight,
  TrendingUp,
  Scale,
  Bike,
  Navigation,
  Wind,
  Layers,
  CheckCircle2,
  Copy
} from 'lucide-react';
import { calculatePace, calculateAge } from '../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { calculateWorkoutCalories, WorkoutIntensity } from '../services/workoutCalorieService';
import { useUser } from '../hooks/useUser';

import { useGamification } from '../hooks/useGamification';

export const Workouts: React.FC = () => {
  const { profile } = useUser();
  const { updateStats } = useGamification();
  const today = startOfDay(new Date()).toISOString();
  
  // Strength states
  const [strengthDuration, setStrengthDuration] = useState('60');
  const [strengthIntensity, setStrengthIntensity] = useState<WorkoutIntensity>('moderate');

  // Cardio states 
  const [cardioIntensity, setCardioIntensity] = useState<WorkoutIntensity>('moderate');

  const strengthWorkouts = useLiveQuery(() => 
    db.workouts
      .where('date')
      .equals(today)
      .toArray()
      .then(workouts => workouts.filter(w => !w.isPlanned))
  );
  const plannedWorkouts = useLiveQuery(() => 
    db.workouts
      .where('isPlanned')
      .equals(1)
      .toArray()
  );
  const cardioLogs = useLiveQuery(() => db.cardioLogs.where('date').equals(today).toArray());
  const availableExercises = useLiveQuery(() => db.exercises.toArray());

  const [activeTab, setActiveTab] = useState<'strength' | 'cardio' | 'planned'>('strength');
  
  // States for Cardio Log
  const [cardioType, setCardioType] = useState('Corrida');
  const [distance, setDistance] = useState('');
  const [minutes, setMinutes] = useState('');
  const [cardioNotes, setCardioNotes] = useState('');

  // States for Strength Log
  const [selectedEx, setSelectedEx] = useState<number>(0);
  const [plannedName, setPlannedName] = useState('');
  const [setsInput, setSetsInput] = useState<{ reps: string; weight: string }[]>([
    { reps: '', weight: '' }
  ]);

  const addSetToInput = () => {
    setSetsInput([...setsInput, { reps: '', weight: '' }]);
  };

  const removeSetFromInput = (index: number) => {
    if (setsInput.length === 1) return;
    setSetsInput(setsInput.filter((_, i) => i !== index));
  };

  const updateSetInput = (index: number, field: 'reps' | 'weight', value: string) => {
    const newSets = [...setsInput];
    newSets[index][field] = value;
    setSetsInput(newSets);
  };

  const logCardio = async () => {
    if (!distance || !minutes) return;
    const durationMinutes = parseInt(minutes);
    const durationSeconds = durationMinutes * 60;
    const distanceKm = parseFloat(distance);
    
    const calories = calculateWorkoutCalories(
      'cardio',
      cardioIntensity,
      profile?.weight || 70,
      durationMinutes
    );
    
    await db.cardioLogs.add({
      date: today,
      type: cardioType,
      distance: distanceKm,
      duration: durationMinutes,
      intensity: cardioIntensity,
      calories: calories,
      pace: calculatePace(distanceKm, durationSeconds),
      notes: cardioNotes
    });
    
    updateStats({ cardioKm: distanceKm });
    
    setDistance('');
    setMinutes('');
    setCardioNotes('');
  };

  const logStrength = async (isPlanned = false) => {
    if (!selectedEx) return;
    const validSets = setsInput
      .filter(s => s.reps && s.weight)
      .map(s => ({ reps: parseInt(s.reps), weight: parseInt(s.weight) }));
    
    if (validSets.length === 0) return;
    
    if (isPlanned) {
      await db.workouts.add({
        date: today,
        name: plannedName || 'Treino Planejado',
        isPlanned: true as any,
        exercises: [{ exerciseId: selectedEx, sets: validSets }]
      });
      setPlannedName('');
    } else {
      const existing = strengthWorkouts?.[0];
      const durationNum = parseInt(strengthDuration) || 0;
      const calories = calculateWorkoutCalories(
        'strength',
        strengthIntensity,
        profile?.weight || 70,
        durationNum
      );

      if (existing && existing.id) {
        const newExercises = [...existing.exercises];
        const exIndex = newExercises.findIndex(e => e.exerciseId === selectedEx);
        if (exIndex > -1) {
          newExercises[exIndex].sets.push(...validSets);
        } else {
          newExercises.push({ exerciseId: selectedEx, sets: validSets });
        }
        
        // Re-calculate or add up calories if session keeps growing?
        // User asked for "Gasto com treino (hoje)". Usually sessions are grouped by day.
        await db.workouts.update(existing.id, { 
          exercises: newExercises,
          duration: (existing.duration || 0) + durationNum,
          caloriesBurned: (existing.caloriesBurned || 0) + calories
        });
      } else {
        await db.workouts.add({
          date: today,
          duration: durationNum,
          intensity: strengthIntensity,
          caloriesBurned: calories,
          type: 'strength',
          exercises: [{ exerciseId: selectedEx, sets: validSets }]
        });
      }

      const totalWeight = validSets.reduce((sum, s) => sum + (s.weight * s.reps), 0);
      updateStats({ weight: totalWeight });
    }
    
    setSetsInput([{ reps: '', weight: '' }]);
    setSelectedEx(0);
    setActiveTab('strength');
  };

  const confirmPlanned = async (workout: any) => {
    const { id, ...data } = workout;
    await db.workouts.add({
      ...data,
      date: today,
      isPlanned: false as any
    });
    
    let totalWeight = 0;
    workout.exercises.forEach((ex: any) => {
      ex.sets.forEach((s: any) => {
        totalWeight += (s.weight * s.reps);
      });
    });
    updateStats({ weight: totalWeight });
    
    setActiveTab('strength');
  };

  const duplicatePlanned = async (workout: any) => {
    const { id, ...data } = workout;
    await db.workouts.add({
      ...data,
      name: `${data.name} (Cópia)`
    });
  };

  const deleteWorkout = async (id: number) => {
    await db.workouts.delete(id);
  };

  return (
    <div className="space-y-10 pb-10">
      <SectionTitle subtitle="Supere Seus Limites Antigos">Performance</SectionTitle>

      {/* Refined Tabs */}
      <div className="flex bg-dark-surface p-1.5 rounded-[18px] border border-white/[0.04] shadow-premium">
        {[
          { id: 'strength', label: 'Força', icon: Dumbbell },
          { id: 'cardio', label: 'Cardio', icon: Activity },
          { id: 'planned', label: 'Planos', icon: Layers }
        ].map((tab) => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "flex-1 py-3.5 px-4 rounded-[14px] text-[11px] font-bold transition-all uppercase tracking-[2px] flex items-center justify-center gap-3 relative z-10",
              activeTab === tab.id ? "text-vibrant-orange" : "text-muted-text/40 hover:text-white/40"
            )}
          >
            {activeTab === tab.id && (
              <motion.div 
                layoutId="activeTabBg"
                className="absolute inset-0 bg-vibrant-orange/10 border border-vibrant-orange/20 rounded-[14px] -z-10"
                transition={{ type: "spring", bounce: 0, duration: 0.5 }}
              />
            )}
            <tab.icon size={16} strokeWidth={activeTab === tab.id ? 2.5 : 2} />
            <span className="hidden xs:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'strength' && (
          <motion.div 
            key="strength"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="space-y-10"
          >
            <Card variant="solid" className="p-8 md:p-10 bg-dark-surface shadow-premium">
              <div className="flex items-center gap-4 mb-12">
                <div className="h-11 w-11 bg-vibrant-orange/10 border border-vibrant-orange/5 rounded-xl flex items-center justify-center text-vibrant-orange">
                  <Plus size={22} strokeWidth={2.5} />
                </div>
                <h3 className="font-bold text-xl tracking-tight text-premium">Registrar Força</h3>
              </div>
              
              <div className="space-y-10">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="text-[10px] font-bold text-muted-text uppercase tracking-[0.2em] ml-1 mb-3.5 block opacity-50">Duração (minutos)</label>
                    <input 
                      type="number"
                      className="w-full px-6 py-[18px] bg-white/[0.015] rounded-xl border border-white/[0.04] focus:border-vibrant-orange/20 transition-all outline-none font-bold text-center tabular-nums text-white"
                      value={strengthDuration}
                      onChange={(e) => setStrengthDuration(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-muted-text uppercase tracking-[0.2em] ml-1 mb-3.5 block opacity-50">Intensidade</label>
                    <select 
                      className="w-full px-6 py-[18px] bg-white/[0.015] rounded-xl border border-white/[0.04] focus:border-vibrant-orange/20 transition-all outline-none font-bold text-[10px] uppercase tracking-[1.5px] cursor-pointer text-white text-center"
                      value={strengthIntensity}
                      onChange={(e) => setStrengthIntensity(e.target.value as any)}
                    >
                      <option value="low">Baixa (3.5 MET)</option>
                      <option value="moderate">Moderada (5.0 MET)</option>
                      <option value="intense">Alta (7.0 MET)</option>
                    </select>
                  </div>
                </div>

                <div>
                   <label className="text-[10px] font-bold text-muted-text uppercase tracking-[0.2em] ml-1 mb-3.5 block opacity-50">Exercício Selecionado</label>
                   <select 
                    className="w-full px-6 py-[21px] bg-white/[0.015] rounded-xl border border-white/[0.04] focus:border-vibrant-orange/20 transition-all outline-none font-bold text-[11px] uppercase tracking-[1.5px] cursor-pointer text-white text-center"
                    value={selectedEx}
                    onChange={(e) => setSelectedEx(parseInt(e.target.value))}
                  >
                    <option value={0}>SELECIONE O EXERCÍCIO</option>
                    {availableExercises?.filter(e => e.category === 'strength').map(ex => (
                      <option key={ex.id} value={ex.id}>{ex.name.toUpperCase()}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-5">
                  <div className="flex justify-between items-center px-1">
                    <label className="text-[10px] font-bold text-muted-text uppercase tracking-[0.2em] opacity-40">Séries, Carga (kg) & Reps</label>
                  </div>
                  {setsInput.map((setInput, idx) => (
                    <motion.div 
                      key={idx} 
                      className="flex items-center gap-4"
                    >
                      <div className="w-11 h-14 rounded-xl bg-white/[0.02] flex items-center justify-center text-[11px] font-bold text-vibrant-orange border border-vibrant-orange/10 shadow-sm">
                        {idx + 1}
                      </div>
                      <input
                        type="number"
                        placeholder="KG"
                        className="flex-1 px-4 py-[18px] bg-white/[0.015] rounded-xl border border-white/[0.04] focus:border-vibrant-orange/20 transition-all outline-none text-center font-bold text-vibrant-orange text-lg tabular-nums"
                        value={setInput.weight}
                        onChange={(e) => updateSetInput(idx, 'weight', e.target.value)}
                      />
                      <input
                        type="number"
                        placeholder="REPS"
                        className="flex-1 px-4 py-[18px] bg-white/[0.015] rounded-xl border border-white/[0.04] focus:border-vibrant-orange/20 transition-all outline-none text-center font-bold text-lg text-white tabular-nums"
                        value={setInput.reps}
                        onChange={(e) => updateSetInput(idx, 'reps', e.target.value)}
                      />
                      <button 
                        onClick={() => removeSetFromInput(idx)}
                        className="p-2.5 text-muted-text/30 hover:text-red-500 transition-all active:scale-90"
                      >
                        <Trash2 size={18} />
                      </button>
                    </motion.div>
                  ))}
                </div>

                <div className="pt-6 space-y-6">
                  <button 
                    onClick={addSetToInput}
                    className="w-full py-5 border border-dashed border-white/5 rounded-xl text-[10px] font-bold uppercase tracking-[0.2em] text-muted-text hover:text-white/40 hover:border-white/10 transition-all flex items-center justify-center gap-3 bg-white/[0.01]"
                  >
                    <Plus size={14} /> ADICIONAR NOVA SÉRIE
                  </button>
                  
                  <div className="flex gap-4 pt-4">
                     <Button size="lg" onClick={() => logStrength(false)} className="flex-1 font-bold uppercase text-[10px] tracking-[0.2em] py-5">Registrar Hoje</Button>
                     <Button variant="secondary" size="lg" onClick={() => {
                        const name = prompt('NOME DO TREINO PLANEJADO:');
                        if (name) {
                          setPlannedName(name);
                          logStrength(true);
                        }
                     }} className="flex-1 font-bold uppercase text-[10px] tracking-[0.2em] py-5">Criar Plano</Button>
                  </div>
                </div>
              </div>
            </Card>

            <div className="space-y-8 px-1">
              <div className="flex items-center justify-between">
                 <h3 className="font-bold text-xl tracking-tight text-premium">Registros Diários</h3>
                 <span className="text-[10px] font-bold text-muted-text uppercase tracking-[0.2em] opacity-40">Timeline Performance</span>
              </div>
              
              {strengthWorkouts?.length === 0 && (
                <Card variant="outline" className="flex flex-col items-center justify-center py-20 opacity-20 border-dashed bg-white/[0.01]">
                  <Dumbbell size={36} strokeWidth={1.5} />
                  <p className="text-[10px] font-bold tracking-[0.3em] mt-5 uppercase">Aguardando Protocolo de Treino</p>
                </Card>
              )}

              <AnimatePresence>
                {strengthWorkouts?.map((workout) => (
                  <div key={workout.id} className="space-y-5">
                    {workout.exercises.map((exGroup, idx) => {
                      const exName = availableExercises?.find(e => e.id === exGroup.exerciseId)?.name;
                      const totalVol = exGroup.sets.reduce((sum, s) => sum + (s.weight * s.reps), 0);
                      return (
                        <motion.div key={idx} initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }}>
                          <Card variant="outline" className="px-8 py-8 group hover:border-white/10 transition-all bg-white/[0.01] shadow-premium">
                            <div className="flex justify-between items-start mb-8">
                              <div>
                                <span className="text-[9px] font-bold text-vibrant-orange uppercase tracking-[.2em] bg-vibrant-orange/10 px-3 py-1.5 rounded-lg mb-3 inline-block border border-vibrant-orange/10 shadow-sm">VOL {totalVol} KG</span>
                                {workout.caloriesBurned && (
                                  <button 
                                    onClick={() => {
                                      const newVal = prompt("Editar calorias:", Math.round(workout.caloriesBurned || 0).toString());
                                      if (newVal !== null && !isNaN(parseInt(newVal))) {
                                        db.workouts.update(workout.id!, { caloriesBurned: parseInt(newVal) });
                                      }
                                    }}
                                    className="ml-2 text-[9px] font-bold text-white uppercase tracking-[.2em] bg-white/5 px-3 py-1.5 rounded-lg mb-3 inline-block border border-white/5 shadow-sm hover:bg-white/10 transition-colors"
                                  >
                                    {Math.round(workout.caloriesBurned)} KCAL <span className="opacity-40">✎</span>
                                  </button>
                                )}
                                <h4 className="text-2xl font-bold tracking-tight text-white">{exName}</h4>
                              </div>
                              <div className="text-[10px] font-bold text-muted-text opacity-30 uppercase tracking-[0.1em]">{exGroup.sets.length} SÉRIES</div>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                              {exGroup.sets.map((set, sIdx) => (
                                <div key={sIdx} className="bg-white/[0.015] border border-white/[0.03] px-5 py-4 rounded-xl flex flex-col justify-center items-center group-hover:border-white/5 transition-all">
                                  <span className="text-[8px] font-bold text-muted-text uppercase tracking-widest mb-1.5 opacity-40">SET {sIdx+1}</span>
                                  <span className="text-[13px] font-bold tracking-tight text-white tabular-nums leading-none">{set.weight}<span className="text-[9px] opacity-30 ml-0.5">kg</span> <span className="opacity-10 mx-1">×</span> {set.reps}<span className="text-[9px] opacity-30 ml-0.5">rp</span></span>
                                </div>
                              ))}
                            </div>
                          </Card>
                        </motion.div>
                      );
                    })}
                  </div>
                ))}
              </AnimatePresence>
            </div>
          </motion.div>
        )}

        {activeTab === 'cardio' && (
          <motion.div 
            key="cardio"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="space-y-10"
          >
            <Card variant="glass" className="p-8 md:p-10 bg-dark-surface shadow-premium">
               <div className="flex items-center gap-4 mb-12">
                <div className="h-11 w-11 bg-vibrant-orange/10 border border-vibrant-orange/5 rounded-xl flex items-center justify-center text-vibrant-orange">
                  <Activity size={22} strokeWidth={2.5} />
                </div>
                <h3 className="font-bold text-xl tracking-tight text-premium">Resistência & Cardio</h3>
              </div>
              <div className="space-y-10">
                <div>
                  <label className="text-[10px] font-bold text-muted-text uppercase tracking-[0.2em] ml-1 mb-4 block opacity-50">Modalidade de Performance</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                     {['Corrida', 'Bike', 'Natação', 'Esteira'].map(t => (
                       <button
                         key={t}
                         onClick={() => setCardioType(t)}
                         className={cn(
                           "py-4 rounded-xl text-[10px] font-bold uppercase tracking-[1.5px] border transition-all",
                           cardioType === t 
                             ? 'bg-vibrant-orange/10 border-vibrant-orange/20 text-vibrant-orange shadow-lg shadow-vibrant-orange/5' 
                             : 'bg-white/[0.015] border-white/[0.04] text-muted-text/30 hover:text-white/40'
                         )}
                       >
                         {t}
                       </button>
                     ))}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-muted-text uppercase tracking-[0.2em] ml-1 mb-4 block opacity-50">Intensidade do Esforço</label>
                  <div className="grid grid-cols-3 gap-3">
                     {[
                       { id: 'low', label: 'Leve (3.5)' },
                       { id: 'moderate', label: 'Moderada (7.0)' },
                       { id: 'intense', label: 'Alta/HIIT (11.0)' }
                     ].map(i => (
                       <button
                         key={i.id}
                         onClick={() => setCardioIntensity(i.id as any)}
                         className={cn(
                           "py-4 rounded-xl text-[10px] font-bold uppercase tracking-[1.5px] border transition-all",
                           cardioIntensity === i.id 
                             ? 'bg-vibrant-orange/10 border-vibrant-orange/20 text-vibrant-orange shadow-lg shadow-vibrant-orange/5' 
                             : 'bg-white/[0.015] border-white/[0.04] text-muted-text/30 hover:text-white/40'
                         )}
                       >
                         {i.label}
                       </button>
                     ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                   <div>
                      <label className="text-[10px] font-bold text-muted-text uppercase tracking-[0.2em] ml-1 mb-3.5 block opacity-50">Distância Total</label>
                      <div className="relative">
                        <input
                          type="number"
                          placeholder="0,00"
                          className="w-full px-6 py-[21px] bg-white/[0.015] rounded-xl border border-white/[0.04] focus:border-vibrant-orange/20 transition-all outline-none font-bold text-vibrant-orange text-2xl tabular-nums"
                          value={distance}
                          onChange={(e) => setDistance(e.target.value)}
                        />
                        <span className="absolute right-6 top-1/2 -translate-y-1/2 text-[9px] font-bold text-muted-text uppercase tracking-[0.2em] opacity-20">KM</span>
                      </div>
                   </div>
                   <div>
                      <label className="text-[10px] font-bold text-muted-text uppercase tracking-[0.2em] ml-1 mb-3.5 block opacity-50">Tempo de Atividade</label>
                      <div className="relative">
                        <input
                          type="number"
                          placeholder="0"
                          className="w-full px-6 py-[21px] bg-white/[0.015] rounded-xl border border-white/[0.04] focus:border-vibrant-orange/20 transition-all outline-none font-bold text-white text-2xl tabular-nums"
                          value={minutes}
                          onChange={(e) => setMinutes(e.target.value)}
                        />
                        <span className="absolute right-6 top-1/2 -translate-y-1/2 text-[9px] font-bold text-muted-text uppercase tracking-[0.2em] opacity-20">MIN</span>
                      </div>
                   </div>
                </div>
                
                <div>
                  <label className="text-[10px] font-bold text-muted-text uppercase tracking-[0.2em] ml-1 mb-3 block opacity-50">Notas do Atleta</label>
                  <textarea 
                    placeholder="Condições, clima, ou percepção de esforço..."
                    className="w-full px-6 py-4.5 bg-white/[0.015] rounded-xl border border-white/[0.04] focus:border-vibrant-orange/10 outline-none text-xs font-medium resize-none text-white placeholder:text-muted-text/10"
                    rows={2}
                    value={cardioNotes}
                    onChange={(e) => setCardioNotes(e.target.value)}
                  />
                </div>

                <Button size="lg" onClick={logCardio} className="w-full mt-4 py-5 font-bold tracking-[0.2em] uppercase text-[10px]">Registrar Performance</Button>
              </div>
            </Card>

            <div className="space-y-8 px-1">
              <h3 className="font-bold text-xl tracking-tight text-premium">Sessões de Cardio</h3>
              {cardioLogs?.map((log, idx) => (
                <motion.div key={log.id} initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }}>
                  <Card variant="outline" className="px-8 py-10 relative group overflow-hidden bg-white/[0.01] hover:border-white/10 transition-all shadow-premium">
                    <div className="flex justify-between items-start">
                      <div className="space-y-10 w-full">
                        <div className="flex items-center gap-4">
                          <span className="text-[9px] font-bold text-vibrant-orange uppercase tracking-[.2em] bg-vibrant-orange/10 px-4 py-1.5 rounded-lg border border-vibrant-orange/10 shadow-sm">{log.type}</span>
                          <div className="flex items-center gap-2 text-[10px] font-bold text-muted-text opacity-30 uppercase tracking-[.15em]">
                             <Clock size={14} />
                             <span>{Math.floor(log.duration / 60)} MINUTOS</span>
                          </div>
                        </div>
                        
                        <div className="flex items-baseline gap-2.5">
                           <p className="text-5xl font-bold tracking-tighter text-white tabular-nums leading-none">{log.distance.toString().replace('.', ',')}</p>
                           <span className="text-[12px] font-bold text-muted-text uppercase tracking-widest opacity-20">quilômetros</span>
                        </div>

                        <div className="flex gap-10 border-t border-white/[0.03] pt-8">
                           <div className="flex flex-col gap-1.5">
                             <span className="text-[9px] font-bold text-muted-text uppercase tracking-widest opacity-40">Ritmo Médio</span>
                             <div className="flex items-center gap-2.5">
                               <Navigation size={15} className="text-vibrant-orange opacity-40" />
                               <span className="text-[16px] font-bold text-white tabular-nums tracking-tight">{log.pace} <span className="text-[10px] font-bold text-muted-text opacity-30 uppercase tracking-[0.1em]">/km</span></span>
                             </div>
                           </div>
                           <div className="flex flex-col gap-1.5">
                             <span className="text-[9px] font-bold text-muted-text uppercase tracking-widest opacity-40">Energia Burn</span>
                             <button 
                               onClick={() => {
                                 const newVal = prompt("Editar calorias:", log.calories.toString());
                                 if (newVal !== null && !isNaN(parseInt(newVal))) {
                                   db.cardioLogs.update(log.id!, { calories: parseInt(newVal) });
                                 }
                               }}
                               className="flex items-center gap-2.5 hover:bg-white/5 rounded-lg transition-colors p-1 -ml-1"
                             >
                               <Flame size={15} className="text-vibrant-orange opacity-40" />
                               <span className="text-[16px] font-bold text-white tabular-nums tracking-tight">{log.calories} <span className="text-[10px] font-bold text-muted-text opacity-30 uppercase tracking-[0.1em]">kcal ✎</span></span>
                             </button>
                           </div>
                        </div>
                      </div>
                      <button 
                        onClick={() => log.id && db.cardioLogs.delete(log.id)}
                        className="p-3 text-muted-text/20 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100 active:scale-95 absolute top-8 right-8"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {activeTab === 'planned' && (
          <motion.div 
            key="planned"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="space-y-10"
          >
            {plannedWorkouts?.length === 0 && (
              <Card variant="outline" className="flex flex-col items-center justify-center py-24 opacity-20 border-dashed bg-white/[0.01]">
                <Layers size={44} strokeWidth={1.5} className="mb-6" />
                <p className="font-bold text-[10px] uppercase tracking-[0.3em]">Protocolos Inativos</p>
              </Card>
            )}
            <div className="grid gap-8">
              {plannedWorkouts?.map((workout, idx) => (
                <motion.div key={workout.id} initial={{ opacity: 0, scale: 0.99 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: idx * 0.1 }}>
                  <Card variant="solid" className="p-10 group hover:border-white/10 relative transition-all bg-dark-surface shadow-premium">
                    <div className="flex justify-between items-start mb-10">
                      <div className="space-y-4">
                        <div className="h-1 w-12 bg-vibrant-orange rounded-full mb-6 opacity-40 shadow-[0_0_8px_rgba(255,77,0,0.3)]" />
                        <h4 className="text-3xl font-bold tracking-tighter text-white">{workout.name}</h4>
                        <div className="flex items-center gap-4 pt-2">
                           <div className="flex items-center gap-2 text-[10px] font-bold text-muted-text uppercase tracking-widest opacity-40">
                             <Dumbbell size={14} className="text-vibrant-orange" />
                             <span>{workout.exercises.length} Módulos</span>
                           </div>
                           <span className="w-1 h-1 bg-white/[0.05] rounded-full" />
                           <span className="text-[10px] font-bold text-vibrant-orange/40 uppercase tracking-[0.2em] px-3 py-1 rounded-full border border-vibrant-orange/10">Dossier Ativo</span>
                        </div>
                      </div>
                      <button 
                        onClick={() => workout.id && deleteWorkout(workout.id)}
                        className="p-3 text-muted-text/10 hover:text-red-500 transition-all active:scale-90"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>

                    <div className="flex gap-4">
                       <Button size="lg" onClick={() => confirmPlanned(workout)} className="flex-1 font-bold flex gap-3 uppercase text-[10px] tracking-[0.2em] py-5">
                          <CheckCircle2 size={16} strokeWidth={2.5} /> Executar Protocolo
                       </Button>
                       <Button variant="secondary" size="lg" onClick={() => duplicatePlanned(workout)} className="px-8 flex items-center justify-center opacity-40 hover:opacity-100 transition-all border border-white/[0.04]">
                          <Copy size={18} />
                       </Button>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
