import React, { useEffect, useState } from 'react';
import { Button, Card } from '../../components/UI';
import { motion } from 'framer-motion';
import { Activity, Zap, TrendingUp, ShieldCheck, Database, AlertTriangle, Check } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { cn } from '../../lib/utils';

interface WelcomeProps {
  onLogin: () => void;
  onRegister: () => void;
}

export const Welcome: React.FC<WelcomeProps> = ({ onLogin, onRegister }) => {
  const [isConfigured, setIsConfigured] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'testing' | 'ok' | 'error'>('idle');
  const [diagInfo, setDiagInfo] = useState<string>('');

  const testConnection = async () => {
    setConnectionStatus('testing');
    try {
      const diag = supabase.getDiagnosticInfo();
      if (!diag.isConfigured) {
        setConnectionStatus('error');
        setDiagInfo('Chaves Supabase ausentes nos Secrets.');
        return;
      }

      // Test simple query to see if table exists
      const { error } = await supabase.from('profiles').select('id').limit(1);
      
      if (error) {
        setConnectionStatus('error');
        if (error.message.includes('relation "public.profiles" does not exist')) {
          setDiagInfo('Tabela "profiles" não encontrada. Execute o SQL de setup.');
        } else {
          setDiagInfo(`Erro Supabase: ${error.message}`);
        }
      } else {
        setConnectionStatus('ok');
        setDiagInfo('Conexão estabelecida e tabela detectada!');
      }
    } catch (e: any) {
      setConnectionStatus('error');
      setDiagInfo(`Exceção: ${e.message}`);
    }
  };

  useEffect(() => {
    setIsConfigured(supabase.isConfigured);
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-10 bg-dark-bg relative overflow-hidden">
      {/* Diagnostics */}
      <div className="absolute top-6 left-6 z-50 flex flex-col gap-2">
        {!isConfigured && (
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass border-red-500/20 p-3 rounded-xl flex items-center gap-3"
          >
            <AlertTriangle size={16} className="text-red-500" />
            <span className="text-[9px] font-black text-red-500 uppercase tracking-widest">Supabase não configurado</span>
          </motion.div>
        )}

        <motion.button
          onClick={testConnection}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={cn(
            "glass p-3 rounded-xl flex items-center gap-3 transition-colors",
            "border-white/5",
            connectionStatus === 'ok' && "border-green-500/20 bg-green-500/5",
            connectionStatus === 'error' && "border-red-500/20 bg-red-500/5"
          )}
        >
          {connectionStatus === 'testing' ? (
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}>
              <Zap size={14} className="text-vibrant-orange" />
            </motion.div>
          ) : connectionStatus === 'ok' ? (
            <Check size={14} className="text-green-500" />
          ) : (
            <Database size={14} className="text-white/40" />
          )}
          <span className="text-[9px] font-black text-white/60 uppercase tracking-widest">
            {connectionStatus === 'idle' ? 'Testar Conexão' : 
             connectionStatus === 'testing' ? 'Verificando...' : 
             connectionStatus === 'ok' ? 'Conectado' : 'Falha na Conexão'}
          </span>
        </motion.button>
        
        {diagInfo && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass p-3 rounded-xl max-w-[200px]"
          >
            <p className="text-[8px] text-white/40 font-mono break-words">{diagInfo}</p>
          </motion.div>
        )}
      </div>

      {/* Visual Identity Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-vibrant-orange/5 blur-[150px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-vibrant-orange/10 blur-[100px] rounded-full" />
      </div>

      {!isConfigured && (
        <motion.div 
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-10 left-10 right-10 z-50 glass border-red-500/20 p-4 rounded-2xl flex items-center gap-4"
        >
          <div className="h-10 w-10 bg-red-500/10 rounded-xl flex items-center justify-center text-red-500">
            <AlertTriangle size={20} />
          </div>
          <div className="flex-1">
            <p className="text-[10px] font-black text-red-500 uppercase tracking-widest leading-tight">Supabase não configurado</p>
            <p className="text-[9px] text-white/40 font-medium leading-tight mt-1">Configure VITE_SUPABASE_URL e KEY nos Secrets.</p>
          </div>
        </motion.div>
      )}

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 flex flex-col items-center text-center w-full max-w-sm"
      >
        <div className="relative group mb-12">
          <motion.div 
            animate={{ 
              rotate: 360,
              scale: [1, 1.1, 1]
            }}
            transition={{ 
              rotate: { duration: 30, repeat: Infinity, ease: "linear" },
              scale: { duration: 5, repeat: Infinity, ease: "easeInOut" }
            }}
            className="absolute -inset-10 bg-orange-gradient rounded-full opacity-10 blur-3xl group-hover:opacity-20 transition-opacity"
          />
          <div className="h-32 w-32 glass rounded-[3rem] border-white/10 flex items-center justify-center shadow-[0_30px_60px_-15px_rgba(255,106,0,0.3)] relative transition-transform group-hover:scale-105 duration-500">
            <Zap size={56} className="text-vibrant-orange fill-vibrant-orange drop-shadow-[0_0_20px_rgba(255,106,0,0.8)]" />
          </div>
        </div>
        
        <h1 className="text-7xl font-black tracking-tighter mb-4 italic">
          VITALIS<span className="text-vibrant-orange">OS</span>
        </h1>
        <p className="text-muted-text text-xs font-black uppercase tracking-[0.5em] mb-20 opacity-40">Next Gen Fitness Protocol</p>
        
        <div className="w-full space-y-5">
          <Button variant="premium" size="xl" onClick={onLogin} className="w-full h-18 rounded-[2.5rem] shadow-glow text-lg">
            INICIAR PROTOCOLO
          </Button>
          <Button variant="secondary" size="xl" onClick={onRegister} className="w-full h-18 rounded-[2.5rem] border-white/5 opacity-80 hover:opacity-100">
            CADASTRAR ATLETA
          </Button>
        </div>

        <div className="flex gap-8 mt-16 text-white/5">
           <div className="flex flex-col items-center gap-2">
              <TrendingUp size={20} />
              <span className="text-[7px] font-black tracking-widest uppercase">Analytics</span>
           </div>
           <div className="flex flex-col items-center gap-2">
              <ShieldCheck size={20} />
              <span className="text-[7px] font-black tracking-widest uppercase">Seguro</span>
           </div>
           <div className="flex flex-col items-center gap-2">
              <Activity size={20} />
              <span className="text-[7px] font-black tracking-widest uppercase">Vitalidade</span>
           </div>
        </div>
      </motion.div>
      
      <div className="absolute bottom-12 text-center w-full">
        <p className="text-[8px] text-white/10 font-black uppercase tracking-[0.8em]">Bravus Lab • Elite Series</p>
      </div>
    </div>
  );
};
