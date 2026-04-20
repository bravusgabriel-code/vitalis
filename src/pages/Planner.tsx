import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { Card, SectionTitle, Button } from '../components/UI';
import { format, addDays, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CheckCircle2, Circle, Calendar as CalendarIcon, Clock, Bell, Plus, Trash2, Zap, Heart, Utensils, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';

export const Planner: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState(startOfDay(new Date()));
  const tasks = useLiveQuery(() => db.plannerTasks.where('date').equals(selectedDate.toISOString()).toArray(), [selectedDate]);

  const [newTask, setNewTask] = useState('');
  const [taskType, setTaskType] = useState<'workout' | 'nutrition' | 'habit'>('habit');

  const addTask = async () => {
    if (!newTask) return;
    await db.plannerTasks.add({
      date: selectedDate.toISOString(),
      title: newTask,
      completed: false,
      type: taskType
    });
    setNewTask('');
  };

  const toggleTask = async (id: number, current: boolean) => {
    await db.plannerTasks.update(id, { completed: !current });
  };

  const next14Days = Array.from({ length: 14 }, (_, i) => addDays(new Date(), i));

  return (
    <div className="space-y-10 pb-10">
      <SectionTitle subtitle="Planejamento & Estratégia Diária">Agenda</SectionTitle>

      {/* Refined Date Picker */}
      <div className="flex gap-4 overflow-x-auto pb-6 no-scrollbar -mx-4 px-4">
        {next14Days.map((date, i) => {
          const isSelected = startOfDay(date).getTime() === selectedDate.getTime();
          const isToday = startOfDay(date).getTime() === startOfDay(new Date()).getTime();
          return (
            <motion.button
              key={date.toISOString()}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.03 }}
              onClick={() => setSelectedDate(startOfDay(date))}
              className={cn(
                "flex-shrink-0 w-[72px] py-7 rounded-[22px] flex flex-col items-center justify-center transition-all relative border shadow-premium",
                isSelected 
                   ? "bg-vibrant-orange text-white border-vibrant-orange/50 shadow-vibrant-orange/10" 
                   : "bg-dark-surface border-white/[0.04] text-muted-text/50 hover:border-white/10 hover:text-white/60"
              )}
            >
              <span className={cn("text-[9px] font-bold uppercase tracking-[0.2em] mb-2.5", isSelected ? "text-white/80" : "text-white/20")}>
                {format(date, 'eee', { locale: ptBR })}
              </span>
              <span className="text-[22px] font-bold tabular-nums tracking-tighter">
                {format(date, 'd')}
              </span>
              {isToday && !isSelected && (
                <div className="absolute top-3 right-3 w-1.5 h-1.5 bg-vibrant-orange rounded-full shadow-[0_0_8px_rgba(255,77,0,0.5)]" />
              )}
            </motion.button>
          );
        })}
      </div>

      <Card variant="solid" className="p-10 bg-dark-surface shadow-premium">
        <div className="flex items-center gap-4 mb-12">
          <div className="h-11 w-11 bg-vibrant-orange/10 border border-vibrant-orange/5 rounded-xl flex items-center justify-center text-vibrant-orange">
            <Plus size={22} strokeWidth={2.5} />
          </div>
          <h3 className="font-bold text-xl tracking-tight text-premium">Estratégia Diária</h3>
        </div>
        <div className="space-y-10">
          <div>
             <label className="text-[10px] font-bold text-muted-text uppercase tracking-[0.2em] ml-1 mb-3.5 block opacity-50">Descrição do Objetivo</label>
             <input
                type="text"
                placeholder="Ex: Refeição livre, Treino A, etc."
                className="w-full px-6 py-4.5 bg-white/[0.015] rounded-xl border border-white/[0.04] focus:border-vibrant-orange/20 transition-all outline-none font-semibold text-white placeholder:text-muted-text/10"
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
              />
          </div>
          
          <div className="space-y-5">
             <label className="text-[10px] font-bold text-muted-text uppercase tracking-[0.2em] ml-1 block opacity-40">Classificação</label>
             <div className="flex gap-3">
              {[
                { id: 'habit', label: 'Hábito', icon: Heart },
                { id: 'workout', label: 'Treino', icon: Zap },
                { id: 'nutrition', label: 'Dieta', icon: Utensils }
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTaskType(t.id as any)}
                  className={cn(
                    "flex-1 py-5 px-3 rounded-[18px] text-[10px] font-bold uppercase tracking-[1.5px] transition-all border flex flex-col items-center gap-2.5",
                    taskType === t.id 
                      ? "bg-vibrant-orange/10 border-vibrant-orange/20 text-white shadow-sm" 
                      : "bg-white/[0.015] border-white/[0.04] text-muted-text/30"
                  )}
                >
                  <t.icon size={18} className={cn(taskType === t.id ? "text-vibrant-orange" : "opacity-20")} />
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <Button size="lg" onClick={addTask} className="w-full py-5 font-bold uppercase tracking-[0.2em] text-[10px] mt-4">
            Alocar no Protocolo
          </Button>
        </div>
      </Card>

      <div className="space-y-8">
        <div className="flex justify-between items-center px-1">
          <h3 className="font-bold text-xl tracking-tighter text-premium capitalize">{format(selectedDate, "d 'de' MMMM", { locale: ptBR })}</h3>
          <div className="bg-dark-surface px-4 py-2 rounded-xl border border-white/[0.04] shadow-premium">
             <span className="text-[10px] font-bold text-muted-text uppercase tracking-[0.15em] opacity-50">
               {tasks?.filter(t => t.completed).length || 0} <span className="opacity-20 mx-1">/</span> {tasks?.length || 0} CONCLUÍDOS
             </span>
          </div>
        </div>
        
        <AnimatePresence mode="popLayout">
          {tasks?.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Card variant="outline" className="flex flex-col items-center justify-center py-24 text-muted-text border-dashed border-white/5 opacity-20 bg-transparent">
                <Clock size={40} strokeWidth={1.5} className="mb-6" />
                <p className="text-[10px] font-bold uppercase tracking-[0.3em]">Horizonte Livre</p>
              </Card>
            </motion.div>
          ) : (
            <div className="space-y-4">
              {tasks?.map((task, i) => (
                <motion.div 
                  key={task.id} 
                  layout
                  initial={{ opacity: 0, x: -4 }}
                  animate={{ opacity: 1, x: 0 }}
                  onClick={() => task.id && toggleTask(task.id, task.completed)}
                  className="group"
                >
                  <Card 
                    variant="outline"
                    className={cn(
                      "px-8 py-8 flex items-center gap-6 transition-all cursor-pointer relative overflow-hidden bg-white/[0.01] shadow-premium",
                      task.completed ? "opacity-30 grayscale-[0.8] border-white/5 bg-transparent" : "hover:border-white/10"
                    )}
                  >
                    <div className={cn(
                      "h-12 w-12 rounded-[14px] flex items-center justify-center transition-all border shadow-sm",
                      task.completed ? "bg-white/[0.02] border-white/5" : "bg-vibrant-orange/5 border-vibrant-orange/10 text-vibrant-orange"
                    )}>
                      {task.completed ? (
                        <Check size={22} strokeWidth={2.5} />
                      ) : (
                        <div className="w-2.5 h-2.5 rounded-full bg-vibrant-orange/20 animate-pulse border border-vibrant-orange/20" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className={cn("text-lg font-bold tracking-tight transition-all text-white", task.completed && "line-through opacity-40")}>
                        {task.title}
                      </p>
                      <div className="flex items-center gap-4 mt-2">
                         <span className={cn(
                           "text-[9px] font-bold uppercase tracking-[0.2em]",
                           !task.completed ? "text-vibrant-orange" : "text-muted-text opacity-40"
                         )}>
                            {task.type === 'workout' ? 'TREINO' : task.type === 'nutrition' ? 'DIETA' : 'HÁBITO'}
                         </span>
                         {!task.completed && (
                           <div className="flex items-center gap-1.5 text-[9px] font-bold text-muted-text uppercase tracking-widest opacity-20">
                              <Bell size={12} /> Notificação Ativa
                           </div>
                         )}
                      </div>
                    </div>
                    
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        task.id && db.plannerTasks.delete(task.id);
                      }}
                      className="p-3 text-muted-text/10 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100 ml-2 active:scale-90"
                    >
                      <Trash2 size={18} />
                    </button>
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
