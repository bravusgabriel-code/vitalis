import React, { useState, useEffect } from 'react';
import { Card, SectionTitle, Button } from '../components/UI';
import { useUser } from '../hooks/useUser';
import { User, Scale, Ruler, Settings, Award, Camera, Zap, LogOut, CheckCircle2, Star } from 'lucide-react';
import { UserProfile, GoalType } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { getStatusRank } from '../lib/gamification';

export const Profile: React.FC = () => {
  const { profile, updateProfile, logout } = useUser();
  const [formData, setFormData] = useState<UserProfile>({
    name: '',
    email: '',
    cpf: '',
    birthDate: '',
    city: '',
    state: 'SP',
    weight: 70,
    height: 170,
    age: 25,
    gender: 'male',
    goal: 'maintain',
    activityLevel: 1.2,
    targetCalories: 2000,
    waterGoal: 2500,
    xp: 0,
    level: 1,
    streak: 0,
    achievements: [],
    totalWeightLifted: 0,
    totalCardioDistance: 0
  });

  const [isSuccessfullySaved, setIsSuccessfullySaved] = useState(false);

  useEffect(() => {
    if (profile) setFormData(profile);
  }, [profile]);

  const calculateTDEE = (data: UserProfile) => {
    let bmr = 0;
    if (data.gender === 'male') {
      bmr = 88.362 + (13.397 * data.weight) + (4.799 * data.height) - (5.677 * data.age);
    } else {
      bmr = 447.593 + (9.247 * data.weight) + (3.098 * data.height) - (4.33 * data.age);
    }
    
    const tdee = bmr * data.activityLevel;
    
    let target = tdee;
    if (data.goal === 'lose') target -= 500;
    if (data.goal === 'gain') target += 300;
    
    return Math.round(target);
  };

  const handleSave = async () => {
    const targetCalories = calculateTDEE(formData);
    const updated = { ...formData, targetCalories };
    await updateProfile(updated);
    setIsSuccessfullySaved(true);
    setTimeout(() => setIsSuccessfullySaved(false), 3000);
  };

  const firstName = formData.name?.split(' ')[0] || 'Atleta';

  return (
    <div className="space-y-10 pb-10">
      <SectionTitle subtitle="Dados & Biometria do Atleta">Perfil</SectionTitle>

      {/* Refined Hero Profile View */}
      <Card variant="solid" className="flex flex-col items-center py-14 relative overflow-hidden text-center bg-dark-surface shadow-premium">
        <div className="absolute top-0 inset-x-0 h-1 bg-vibrant-orange/10" />
        
        <div className="relative group mb-10">
           <motion.div 
            className="h-32 w-32 bg-dark-bg rounded-[32px] flex items-center justify-center border border-white/[0.04] relative z-10 shadow-2xl transition-all group-hover:border-vibrant-orange/20"
          >
            <User size={56} className="text-muted-text opacity-10" />
            <button className="absolute -bottom-2 -right-2 h-11 w-11 bg-vibrant-orange text-white rounded-[14px] flex items-center justify-center border-4 border-dark-surface transition-transform hover:scale-105 active:scale-95 shadow-premium">
               <Camera size={20} />
            </button>
          </motion.div>
        </div>

        <h3 className="text-3xl font-bold tracking-tight text-white mb-6 text-premium">
          {firstName}
        </h3>
        
        <div className="flex flex-wrap justify-center items-center gap-2.5">
           <div className="px-4 py-2 bg-white/[0.02] rounded-xl flex items-center gap-2.5 border border-white/[0.04]">
              <Zap size={14} fill="currentColor" className="text-vibrant-orange opacity-40" />
              <span className="text-[10px] font-bold uppercase tracking-[1.5px] text-muted-text">Nível {formData.level}</span>
           </div>
           <div className="px-4 py-2 bg-white/[0.02] rounded-xl flex items-center gap-2.5 border border-white/[0.04]">
              <Star size={14} fill="currentColor" className="text-vibrant-orange opacity-40" />
              <span className="text-[10px] font-bold uppercase tracking-[1.5px] text-muted-text">{getStatusRank(formData.level || 1)}</span>
           </div>
           <div className="px-4 py-2 bg-white/[0.02] rounded-xl flex items-center gap-2.5 border border-white/[0.04]">
              <Award size={14} className="text-vibrant-orange opacity-60" />
              <span className="text-[10px] font-bold uppercase tracking-[1.5px] text-muted-text">{formData.goal === 'lose' ? 'Cutting' : formData.goal === 'gain' ? 'Bulking' : 'Recomp'}</span>
           </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-8">
        <div className="grid grid-cols-2 gap-6">
           <Card variant="outline" className="flex flex-col items-center justify-center py-10 hover:border-vibrant-orange/10 transition-all bg-white/[0.01]">
              <Scale size={20} className="text-vibrant-orange opacity-20 mb-4" />
              <div className="flex items-baseline gap-1">
                 <input 
                   type="number" 
                   value={formData.weight}
                   onChange={(e) => setFormData({ ...formData, weight: parseFloat(e.target.value) })}
                   className="w-24 bg-transparent text-4xl font-bold text-center outline-none tabular-nums text-white tracking-tighter"
                 />
                 <span className="text-[10px] font-bold text-muted-text opacity-40 uppercase tracking-widest">kg</span>
              </div>
              <p className="text-[9px] font-bold text-muted-text uppercase tracking-[0.2em] mt-3 opacity-30">Peso Corporal</p>
           </Card>

           <Card variant="outline" className="flex flex-col items-center justify-center py-10 hover:border-vibrant-orange/10 transition-all bg-white/[0.01]">
              <Ruler size={20} className="text-vibrant-orange opacity-20 mb-4" />
              <div className="flex items-baseline gap-1">
                 <input 
                   type="number" 
                   value={formData.height}
                   onChange={(e) => setFormData({ ...formData, height: parseInt(e.target.value) })}
                   className="w-24 bg-transparent text-4xl font-bold text-center outline-none tabular-nums text-white tracking-tighter"
                 />
                 <span className="text-[10px] font-bold text-muted-text opacity-40 uppercase tracking-widest">cm</span>
              </div>
              <p className="text-[9px] font-bold text-muted-text uppercase tracking-[0.2em] mt-3 opacity-30">Estatura</p>
           </Card>
        </div>

        <Card variant="solid" className="p-8 md:p-10 bg-dark-surface shadow-premium">
          <div className="flex items-center gap-3.5 mb-12">
            <Settings size={22} className="text-vibrant-orange" />
            <h3 className="font-bold text-xl tracking-tight text-premium">Protocolo Pessoal</h3>
          </div>
          
          <div className="space-y-10">
            <div>
              <label className="text-[10px] font-bold text-muted-text uppercase tracking-[0.2em] ml-1 mb-3.5 block opacity-50">Nome de Identificação</label>
              <input
                type="text"
                className="w-full px-6 py-4.5 bg-white/[0.015] rounded-xl border border-white/[0.04] focus:border-vibrant-orange/20 transition-all outline-none font-semibold text-white tracking-wide"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-8">
               <div>
                <label className="text-[10px] font-bold text-muted-text uppercase tracking-[0.2em] ml-1 mb-3.5 block opacity-50">Idade cronológica</label>
                <input
                  type="number"
                  className="w-full px-6 py-4.5 bg-white/[0.015] rounded-xl border border-white/[0.04] focus:border-vibrant-orange/20 transition-all outline-none font-bold text-xl text-center text-white"
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) })}
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-muted-text uppercase tracking-[0.2em] ml-1 mb-3.5 block opacity-50">Gênero Bio</label>
                <select
                  className="w-full px-6 py-[21px] bg-white/[0.015] rounded-xl border border-white/[0.04] focus:border-vibrant-orange/20 transition-all outline-none appearance-none font-bold text-[11px] uppercase tracking-[1.5px] text-center cursor-pointer text-white"
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                >
                  <option value="male">Masculino</option>
                  <option value="female">Feminino</option>
                  <option value="other">Outro</option>
                </select>
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-bold text-muted-text uppercase tracking-[0.2em] ml-1 block text-center opacity-50">Diretriz de Composição</label>
              <select
                className="w-full px-6 py-[21px] bg-vibrant-orange/5 rounded-xl border border-vibrant-orange/10 focus:border-vibrant-orange/20 transition-all outline-none appearance-none font-bold text-[11px] uppercase tracking-[1.5px] text-center text-vibrant-orange cursor-pointer"
                value={formData.goal}
                onChange={(e) => setFormData({ ...formData, goal: e.target.value as GoalType })}
              >
                <option value="lose">PERDER PESO (CUTTING)</option>
                <option value="maintain">MANUTENÇÃO (RECOMP)</option>
                <option value="gain">GANHAR MÚSCULO (BULKING)</option>
              </select>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-bold text-muted-text uppercase tracking-[0.2em] ml-1 block opacity-50">Nível Metabólico (Atividade)</label>
              <select
                className="w-full px-6 py-[21px] bg-white/[0.015] rounded-xl border border-white/[0.04] focus:border-vibrant-orange/20 transition-all outline-none appearance-none font-bold text-[10px] uppercase tracking-[1.5px] text-center cursor-pointer text-white"
                value={formData.activityLevel}
                onChange={(e) => setFormData({ ...formData, activityLevel: parseFloat(e.target.value) })}
              >
                <option value={1.2}>Sedentário (Trabalho de escritório)</option>
                <option value={1.375}>Leve (Treino 1-3 dias)</option>
                <option value={1.55}>Moderado (Treino 3-5 dias)</option>
                <option value={1.725}>Intenso (Treino 6-7 dias)</option>
                <option value={1.9}>Elite (Treino Pesado Diário)</option>
              </select>
            </div>
            
            <div className="pt-10 border-t border-white/[0.04]">
               <div className="grid grid-cols-2 gap-6">
                  <div className="text-center space-y-3.5">
                    <label className="text-[10px] font-bold text-muted-text uppercase tracking-[0.2em] block opacity-40">Meta Hídrica (ml)</label>
                    <input
                      type="number"
                      className="w-full px-4 py-4 bg-white/[0.015] rounded-xl border border-white/[0.04] outline-none font-bold text-center text-vibrant-orange tabular-nums"
                      value={formData.waterGoal}
                      onChange={(e) => setFormData({ ...formData, waterGoal: parseInt(e.target.value) })}
                    />
                  </div>
                  <div className="text-center space-y-3.5">
                    <label className="text-[10px] font-bold text-muted-text uppercase tracking-[0.2em] block opacity-40">Calorias Custom</label>
                    <input
                      type="number"
                      placeholder={`Calc: ${calculateTDEE(formData)}`}
                      className="w-full px-4 py-4 bg-white/[0.015] rounded-xl border border-white/[0.04] outline-none font-bold text-center text-white tabular-nums opacity-60 focus:opacity-100 transition-opacity"
                      value={formData.manualCalories || ''}
                      onChange={(e) => setFormData({ ...formData, manualCalories: e.target.value ? parseInt(e.target.value) : undefined })}
                    />
                  </div>
               </div>
            </div>
          </div>
        </Card>
      </div>

      <div className="space-y-6 pt-10 max-w-[400px] mx-auto w-full px-4">
        <AnimatePresence mode="wait">
          {isSuccessfullySaved ? (
            <motion.div 
               key="saved" 
               initial={{ scale: 0.98, opacity: 0 }} 
               animate={{ scale: 1, opacity: 1 }} 
               exit={{ scale: 0.98, opacity: 0 }}
               className="w-full py-5 bg-vibrant-orange/10 border border-vibrant-orange/20 text-vibrant-orange rounded-xl flex items-center justify-center gap-3 font-bold uppercase text-[10px] tracking-[0.2em] shadow-premium"
            >
               <CheckCircle2 size={16} /> Protocolo Atualizado
            </motion.div>
          ) : (
            <Button onClick={handleSave} size="lg" className="w-full font-bold uppercase text-[10px] tracking-[0.2em] py-5">
              Confirmar Alterações
            </Button>
          )}
        </AnimatePresence>
        
        <Button onClick={logout} variant="ghost" size="lg" className="w-full font-bold flex gap-3 text-red-500/50 hover:bg-red-500/5 hover:text-red-500 transition-all grayscale hover:grayscale-0 py-5">
          <LogOut size={18} />
          <span className="uppercase text-[10px] tracking-[0.2em]">Sair do Sistema</span>
        </Button>

        <div className="pt-12 flex flex-col items-center gap-4">
           <div className="h-px w-8 bg-white/5" />
           <p className="text-[9px] font-bold text-white/10 uppercase tracking-[0.4em]">Vitalis Protocol • 4.0.1</p>
        </div>
      </div>
    </div>
  );
};
