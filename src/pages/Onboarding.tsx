import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowRight, 
  ArrowLeft, 
  Check, 
  Target, 
  Flame, 
  Scale, 
  Calendar,
  ChevronRight
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useUser } from '../hooks/useUser';
import { GOAL_OPTIONS, ACTIVITY_LEVELS, getCalorieStrategies } from '../services/goalEngine';
import { generateFullPlan as calculateFullPlan } from '../services/metabolicService';
import { UserProfile } from '../types';

interface OnboardingProps {
  onComplete: () => void;
}

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const { profile, updateProfile } = useUser();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<Partial<UserProfile>>({
    weight: profile?.weight || 70,
    height: profile?.height || 170,
    age: profile?.age || 25,
    gender: profile?.gender || 'male',
    activityLevel: profile?.activityLevel || 1.2,
    goal: profile?.goal || 'maintain',
    calorieStrategy: profile?.calorieStrategy || 'maintain'
  });

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => s - 1);

  const handleComplete = async () => {
    const fullPlan = calculateFullPlan(formData);
    await updateProfile(fullPlan);
    onComplete();
  };

  const steps = [
    { title: 'Dados Físicos', id: 1 },
    { title: 'Nível de Atividade', id: 2 },
    { title: 'Seu Objetivo', id: 3 },
    { title: 'Estratégia', id: 4 },
    { title: 'Resumo', id: 5 },
  ];

  return (
    <div className="min-h-screen bg-dark-bg flex flex-col p-8 max-w-md mx-auto">
      {/* Progress Bar */}
      <div className="flex gap-1.5 mb-12">
        {steps.map((s) => (
          <div 
            key={s.id} 
            className={cn(
              "h-1 px-1 flex-1 rounded-full transition-all duration-500",
              step >= s.id ? "bg-vibrant-orange shadow-[0_0_10px_rgba(255,77,0,0.3)]" : "bg-white/5"
            )} 
          />
        ))}
      </div>

      <div className="flex-1">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div 
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">Vamos começar com o básico.</h1>
                <p className="text-muted-text text-sm">Precisamos dos seus dados físicos para calcular seu metabolismo real.</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-muted-text uppercase tracking-widest ml-1 opacity-50">Peso (kg)</label>
                  <input 
                    type="number" 
                    value={formData.weight || ''} 
                    onChange={(e) => setFormData({ ...formData, weight: parseFloat(e.target.value) })}
                    className="w-full bg-white/[0.02] border border-white/5 rounded-2xl p-6 text-2xl font-bold text-center outline-none focus:border-vibrant-orange/50 transition-all tabular-nums"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-muted-text uppercase tracking-widest ml-1 opacity-50">Altura (cm)</label>
                  <input 
                    type="number" 
                    value={formData.height || ''} 
                    onChange={(e) => setFormData({ ...formData, height: parseInt(e.target.value) })}
                    className="w-full bg-white/[0.02] border border-white/5 rounded-2xl p-6 text-2xl font-bold text-center outline-none focus:border-vibrant-orange/50 transition-all tabular-nums"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-muted-text uppercase tracking-widest ml-1 opacity-50">Idade</label>
                <input 
                  type="number" 
                  value={formData.age || ''} 
                  onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) })}
                  className="w-full bg-white/[0.02] border border-white/5 rounded-2xl p-6 text-2xl font-bold text-center outline-none focus:border-vibrant-orange/50 transition-all tabular-nums"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-muted-text uppercase tracking-widest ml-1 opacity-50">Sexo Biológico</label>
                <div className="grid grid-cols-2 gap-3">
                  {['male', 'female'].map((g) => (
                    <button
                      key={g}
                      onClick={() => setFormData({ ...formData, gender: g as any })}
                      className={cn(
                        "p-5 rounded-2xl border font-bold text-sm transition-all",
                        formData.gender === g 
                          ? "bg-vibrant-orange/10 border-vibrant-orange text-vibrant-orange" 
                          : "bg-white/[0.02] border-white/5 text-muted-text hover:bg-white/[0.04]"
                      )}
                    >
                      {g === 'male' ? 'Masculino' : 'Feminino'}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div 
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">Qual seu nível de atividade?</h1>
                <p className="text-muted-text text-sm">Seja honesto. Isso define o fator multiplicador do seu gasto diário.</p>
              </div>

              <div className="space-y-3">
                {ACTIVITY_LEVELS.map((level) => (
                  <button
                    key={level.value}
                    onClick={() => setFormData({ ...formData, activityLevel: level.value })}
                    className={cn(
                      "w-full p-6 rounded-2xl border text-left transition-all group",
                      formData.activityLevel === level.value 
                        ? "bg-vibrant-orange/10 border-vibrant-orange shadow-[0_0_20px_rgba(255,77,0,0.1)]" 
                        : "bg-white/[0.02] border-white/5 hover:bg-white/[0.04]"
                    )}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className={cn(
                          "font-bold text-lg",
                          formData.activityLevel === level.value ? "text-white" : "text-muted-text"
                        )}>{level.label}</p>
                        <p className="text-xs text-muted-text/60 mt-1">{level.sub}</p>
                      </div>
                      <div className={cn(
                        "h-6 w-6 rounded-full border-2 flex items-center justify-center transition-all",
                        formData.activityLevel === level.value ? "border-vibrant-orange bg-vibrant-orange" : "border-white/10"
                      )}>
                        {formData.activityLevel === level.value && <Check size={14} className="text-white" />}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div 
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">Qual o foco agora?</h1>
                <p className="text-muted-text text-sm">Onde você quer chegar nos próximos meses?</p>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {GOAL_OPTIONS.map((goal) => (
                  <button
                    key={goal.id}
                    onClick={() => setFormData({ ...formData, goal: goal.id as any, calorieStrategy: goal.id === 'lose' ? 'deficit_moderate' : goal.id === 'gain' ? 'surplus_light' : 'maintain' })}
                    className={cn(
                      "w-full p-6 rounded-3xl border text-left transition-all p-relative overflow-hidden group",
                      formData.goal === goal.id 
                        ? "bg-white/[0.03] border-vibrant-orange shadow-[0_10px_30px_rgba(255,77,0,0.1)]" 
                        : "bg-white/[0.02] border-white/5 hover:border-white/10"
                    )}
                  >
                    <div className="flex gap-6 items-center">
                      <div className="text-4xl">{goal.icon}</div>
                      <div>
                        <p className="font-bold text-xl">{goal.label}</p>
                        <p className="text-xs text-muted-text/60 mt-1">{goal.description}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div 
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">Ritmo da Estratégia</h1>
                <p className="text-muted-text text-sm">Quão rápido você quer atingir sua meta?</p>
              </div>

              <div className="space-y-4">
                {getCalorieStrategies(formData.goal || 'maintain').map((strat) => (
                  <button
                    key={strat.id}
                    onClick={() => setFormData({ ...formData, calorieStrategy: strat.id as any })}
                    className={cn(
                      "w-full p-6 rounded-2xl border text-left transition-all",
                      formData.calorieStrategy === strat.id 
                        ? "bg-vibrant-orange/10 border-vibrant-orange" 
                        : "bg-white/[0.02] border-white/5 hover:bg-white/[0.04]"
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all",
                        formData.calorieStrategy === strat.id ? "border-vibrant-orange bg-vibrant-orange" : "border-white/20"
                      )}>
                        {formData.calorieStrategy === strat.id && <Check size={12} className="text-white" />}
                      </div>
                      <div>
                        <p className="font-bold">{strat.label}</p>
                        <p className="text-xs text-muted-text/60 mt-1">{strat.desc}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              <div className="pt-4 border-t border-white/5">
                <div className="bg-white/[0.02] rounded-2xl p-6 border border-white/5">
                  <div className="flex items-center gap-3 mb-4">
                    <Flame className="text-vibrant-orange" size={20} />
                    <p className="text-sm font-bold uppercase tracking-widest text-muted-text opacity-60">Estimativa Base</p>
                  </div>
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-4xl font-bold tracking-tighter tabular-nums">
                        {calculateFullPlan(formData).targetCalories}
                      </p>
                      <p className="text-[10px] font-bold text-muted-text uppercase tracking-widest mt-1">kcal diárias</p>
                    </div>
                    <p className="text-xs text-muted-text italic">Sugerido p/ seu perfil</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {step === 5 && (
            <motion.div 
              key="step5"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-8"
            >
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">Tudo pronto!</h1>
                <p className="text-muted-text text-sm">Aqui está o seu plano metabólico personalizado.</p>
              </div>

              <div className="bg-white/[0.02] border border-white/5 rounded-[32px] p-8 space-y-8">
                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <p className="text-[10px] font-bold text-muted-text uppercase tracking-widest opacity-40 mb-2">Meta Calórica</p>
                    <p className="text-4xl font-bold tracking-tighter text-vibrant-orange">
                      {calculateFullPlan(formData).targetCalories}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-muted-text uppercase tracking-widest opacity-40 mb-2">Gasto Total (TDEE)</p>
                    <p className="text-4xl font-bold tracking-tighter">
                      {calculateFullPlan(formData).tdee}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                   <p className="text-[10px] font-bold text-muted-text uppercase tracking-widest opacity-40">Divisão de Macros (g)</p>
                   <div className="grid grid-cols-3 gap-2">
                      <div className="bg-white/[0.02] p-4 rounded-2xl text-center border border-white/5">
                        <p className="text-lg font-bold text-vibrant-orange">{calculateFullPlan(formData).targetProtein}</p>
                        <p className="text-[9px] font-bold text-muted-text uppercase">Prot</p>
                      </div>
                      <div className="bg-white/[0.02] p-4 rounded-2xl text-center border border-white/5">
                        <p className="text-lg font-bold text-white/80">{calculateFullPlan(formData).targetCarbs}</p>
                        <p className="text-[9px] font-bold text-muted-text uppercase">Carb</p>
                      </div>
                      <div className="bg-white/[0.02] p-4 rounded-2xl text-center border border-white/5">
                        <p className="text-lg font-bold text-white/40">{calculateFullPlan(formData).targetFat}</p>
                        <p className="text-[9px] font-bold text-muted-text uppercase">Gord</p>
                      </div>
                   </div>
                </div>

                <div className="pt-4 space-y-3">
                   <div className="flex items-center gap-2 text-xs text-muted-text">
                      <Check size={14} className="text-vibrant-orange" />
                      <span>Metabolismo Basal: <b>{calculateFullPlan(formData).bmr} kcal</b></span>
                   </div>
                   <div className="flex items-center gap-2 text-xs text-muted-text">
                      <Check size={14} className="text-vibrant-orange" />
                      <span>Estratégia: <b>{formData.calorieStrategy}</b></span>
                   </div>
                </div>
              </div>

              <div className="bg-vibrant-orange/5 border border-vibrant-orange/10 rounded-2xl p-6">
                <p className="text-xs text-vibrant-orange/80 leading-relaxed">
                  <b>Nota:</b> Estes valores são estimativas baseadas em fórmulas científicas. Seu corpo pode reagir de forma diferente. Recomendamos monitorar o peso semanalmente para ajustes.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation Controls */}
      <div className="mt-12 flex gap-4">
        {step > 1 && (
          <button 
            onClick={prevStep}
            className="h-16 w-16 bg-white/[0.02] border border-white/5 rounded-2xl flex items-center justify-center text-muted-text hover:bg-white/[0.04] transition-all"
          >
            <ArrowLeft size={20} />
          </button>
        )}
        
        {step < 5 ? (
          <button 
            onClick={nextStep}
            className="flex-1 h-16 bg-vibrant-orange rounded-2xl font-bold flex items-center justify-center gap-2 text-white shadow-lg shadow-vibrant-orange/20 active:scale-95 transition-all"
          >
            Continuar <ArrowRight size={18} />
          </button>
        ) : (
          <button 
            onClick={handleComplete}
            className="flex-1 h-16 bg-vibrant-orange rounded-2xl font-bold flex items-center justify-center gap-2 text-white shadow-lg shadow-vibrant-orange/20 active:scale-95 transition-all"
          >
            Começar Agora <Check size={18} />
          </button>
        )}
      </div>
    </div>
  );
};
