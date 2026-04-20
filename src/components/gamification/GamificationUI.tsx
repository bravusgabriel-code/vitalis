import React from 'react';
import { motion } from 'framer-motion';
import { Zap, Target, Award, Trophy, Star, ChevronRight } from 'lucide-react';
import { getStatusRank } from '../../lib/gamification';
import { cn } from '../../lib/utils';

interface XPProgressProps {
  level: number;
  xp: number;
  nextLevelXP: number;
  currentLevelXP: number;
  className?: string;
}

export const XPProgress: React.FC<XPProgressProps> = ({ level, xp, nextLevelXP, currentLevelXP, className }) => {
  const progress = ((xp - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100;
  const status = getStatusRank(level);

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex justify-between items-end px-1">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
             <span className="text-[10px] font-bold text-vibrant-orange uppercase tracking-[1.5px]">Nível {level}</span>
             <span className="h-0.5 w-0.5 bg-white/20 rounded-full" />
             <span className="text-[10px] font-medium text-muted-text uppercase tracking-widest opacity-60">{status}</span>
          </div>
          <h4 className="text-xl font-bold tracking-tight text-premium">Evolução</h4>
        </div>
        <div className="text-right">
           <p className="text-[11px] font-medium text-muted-text tabular-nums tracking-wide">
             {Math.round(xp - currentLevelXP)} 
             <span className="opacity-30 ml-1">/ {nextLevelXP - currentLevelXP} XP</span>
            </p>
        </div>
      </div>

      <div className="h-[3px] bg-white/[0.03] rounded-full overflow-hidden">
         <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            className="h-full bg-vibrant-orange shadow-[0_0_8px_rgba(255,77,0,0.4)]"
         />
      </div>
    </div>
  );
};

export const LevelUpModal: React.FC<{ level: number; onClose: () => void }> = ({ level, onClose }) => {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-8 bg-black/90 backdrop-blur-md"
    >
      <motion.div 
        initial={{ scale: 0.98, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="max-w-sm w-full bg-dark-surface p-10 md:p-12 rounded-[24px] border border-white/[0.05] text-center relative overflow-hidden shadow-premium"
      >
        <div className="absolute top-0 inset-x-0 h-1 bg-vibrant-orange/40" />
        
        <div className="h-24 w-24 bg-vibrant-orange/10 border border-vibrant-orange/20 rounded-[24px] mx-auto flex items-center justify-center mb-8">
          <Trophy size={48} fill="currentColor" className="text-vibrant-orange opacity-80" />
        </div>

        <h2 className="text-3xl font-bold tracking-tight mb-2 text-premium">Upgrade de Nível</h2>
        <p className="text-muted-text text-[11px] font-bold uppercase tracking-[0.2em] mb-12">Protocolo Nível {level} Ativo</p>

        <div className="space-y-4 mb-12">
           <div className="p-6 bg-white/[0.02] rounded-2xl border border-white/[0.04] text-left relative overflow-hidden group">
              <div className="flex gap-5 items-center relative z-10">
                 <div className="h-12 w-12 bg-vibrant-orange/10 rounded-xl flex items-center justify-center text-vibrant-orange">
                    <Star size={20} fill="currentColor" className="opacity-40" />
                 </div>
                 <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-vibrant-orange mb-1 opacity-80">Novo Ranking</p>
                    <p className="text-lg font-bold text-premium">{getStatusRank(level)}</p>
                 </div>
              </div>
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <Award size={48} />
              </div>
           </div>
        </div>

        <button 
          onClick={onClose}
          className="w-full py-4.5 bg-vibrant-orange text-white rounded-xl font-bold uppercase text-[10px] tracking-[0.2em] hover:bg-vibrant-orange/90 transition-all shadow-lg shadow-vibrant-orange/10 active:scale-95"
        >
          Continuar Jornada
        </button>
      </motion.div>
    </motion.div>
  );
};
