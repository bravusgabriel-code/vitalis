import React, { useState } from 'react';
import { GoogleGenAI } from "@google/genai";
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { useUser } from '../hooks/useUser';
import { Card, Button } from './UI';
import { Sparkles, X, Brain, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const VitalisAI: React.FC = () => {
  const { profile } = useUser();
  const [isOpen, setIsOpen] = useState(false);
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const meals = useLiveQuery(() => db.meals.limit(20).toArray());
  const workouts = useLiveQuery(() => db.workouts.limit(10).toArray());

  const generateSuggestion = async () => {
    setIsGenerating(true);
    setSuggestion(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const prompt = `
        Você é o Vitalis AI, a inteligência central do aplicativo Vitalis OS. 
        Com base nos dados biométricos e histórico do atleta, forneça um "Protocolo de Otimização" conciso (no máximo 3 sentenças).
        Seja técnico, premium e extremamente direto. Use termos como "Otimização", "Protocolo", "Meta" e "Performance".
        
        Perfil: ${JSON.stringify(profile)}
        Nutrição Recente: ${JSON.stringify(meals?.map(m => ({ name: m.name, cal: m.calories })))}
        Treinos: ${JSON.stringify(workouts)}
        
        Tom: Alta performance, minimalista, técnico.
        Idioma: Português do Brasil (pt-BR).
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });

      setSuggestion(response.text || "PROTOCOLADO: MANTER CONSISTÊNCIA EM ALTA INTENSIDADE.");
    } catch (error) {
      console.error(error);
      setSuggestion("STATUS: PERFORMANCE ÓTIMA. RECOMENDADO MANTER PROTOCOLO DE HIDRATAÇÃO.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
      <div className="fixed bottom-32 right-6 z-40">
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            setIsOpen(true);
            if (!suggestion) generateSuggestion();
          }}
          className="glass border-vibrant-orange/30 shadow-[0_10px_30px_rgba(255,106,0,0.2)] p-4 rounded-3xl flex items-center gap-3 transition-all text-[10px] font-black uppercase tracking-[0.2em] group"
        >
          <Zap size={20} className="text-vibrant-orange group-hover:animate-pulse" fill="currentColor" />
          <span className="text-white">Vitalis OS AI</span>
        </motion.button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-dark-bg/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              className="relative w-full max-w-lg glass bg-dark-card border-white/5 rounded-[3rem] p-10 shadow-2xl overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-vibrant-orange/5 blur-[100px] rounded-full -mr-32 -mt-32" />
              
              <div className="flex justify-between items-center mb-10 relative z-10">
                <div className="flex items-center gap-4">
                  <div className="bg-vibrant-orange/10 p-3 rounded-2xl border border-vibrant-orange/20">
                    <Brain size={32} className="text-vibrant-orange" />
                  </div>
                  <div>
                    <h3 className="font-black text-2xl tracking-tighter">Vitalis AI</h3>
                    <p className="text-[10px] text-muted-text uppercase font-black tracking-[0.3em]">Protocolo Analítico</p>
                  </div>
                </div>
                <button onClick={() => setIsOpen(false)} className="p-3 hover:bg-white/5 rounded-2xl transition-all">
                  <X size={24} className="text-white/20" />
                </button>
              </div>

              <div className="min-h-[160px] flex items-center justify-center relative z-10">
                {isGenerating ? (
                  <div className="flex flex-col items-center gap-4">
                    <div className="flex gap-2">
                      <motion.div 
                        animate={{ scale: [1, 1.5, 1], backgroundColor: ['#FF6A00', '#FFC500', '#FF6A00'] }} 
                        transition={{ repeat: Infinity, duration: 1.2 }} 
                        className="w-3 h-3 rounded-full" 
                      />
                      <motion.div 
                        animate={{ scale: [1, 1.5, 1], backgroundColor: ['#FF6A00', '#FFC500', '#FF6A00'] }} 
                        transition={{ repeat: Infinity, duration: 1.2, delay: 0.2 }} 
                        className="w-3 h-3 rounded-full" 
                      />
                      <motion.div 
                        animate={{ scale: [1, 1.5, 1], backgroundColor: ['#FF6A00', '#FFC500', '#FF6A00'] }} 
                        transition={{ repeat: Infinity, duration: 1.2, delay: 0.4 }} 
                        className="w-3 h-3 rounded-full" 
                      />
                    </div>
                    <p className="text-[10px] font-black text-vibrant-orange uppercase tracking-[0.4em] opacity-60">Sincronizando Dados...</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <span className="text-[10px] font-black text-vibrant-orange uppercase tracking-[0.3em] opacity-40">Insight de Atleta:</span>
                    <p className="text-white text-lg leading-relaxed font-black uppercase italic tracking-tight opacity-90">
                      "{suggestion}"
                    </p>
                  </div>
                )}
              </div>

              <Button 
                onClick={generateSuggestion} 
                variant="secondary" 
                className="w-full mt-10 h-16 rounded-[2rem] border-white/5"
                disabled={isGenerating}
              >
                RECALIBRAR PROTOCOLO
              </Button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
