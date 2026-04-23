import React, { useState } from 'react';
import { Button, Card, SectionTitle } from '../../components/UI';
import { useUser } from '../../hooks/useUser';
import { validateEmail } from '../../lib/utils';
import { ChevronLeft, Mail, Lock, AlertCircle, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface LoginProps {
  onBack: () => void;
}

export const Login: React.FC<LoginProps> = ({ onBack }) => {
  const { login } = useUser();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateEmail(email)) {
      setError('E-MAIL PARECE INVÁLIDO');
      return;
    }

    if (password.length < 6) {
      setError('SENHA MUITO CURTA (MIN 6)');
      return;
    }

    setIsLoggingIn(true);
    try {
      const success = await login(email, password);
      if (!success) {
        setError('CREDENCIAIS INCORRETAS');
      }
    } catch (err: any) {
      setError(err.message || 'ERRO AO AUTENTICAR');
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-bg p-8 pt-12 relative overflow-hidden">
      {/* Background Decorative Glows */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-vibrant-orange/5 blur-[120px] rounded-full pointer-events-none" />

      <motion.button 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        onClick={onBack} 
        className="mb-14 h-12 w-12 glass rounded-2xl flex items-center justify-center text-white/40 hover:text-white transition-all border-white/5"
      >
        <ChevronLeft size={24} />
      </motion.button>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 max-w-sm mx-auto"
      >
        <header className="mb-14">
          <SectionTitle subtitle="Bem-vindo de volta ao protocolo">Acessar Sessão</SectionTitle>
        </header>

        <form onSubmit={handleSubmit} className="space-y-10">
          <div className="space-y-6">
            <div className="group">
              <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] ml-1 mb-3 block">Identificador Digital</label>
              <div className="relative">
                <div className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-vibrant-orange transition-colors">
                  <Mail size={20} />
                </div>
                <input
                  type="email"
                  placeholder="Seu e-mail de atleta"
                  className="w-full pl-16 pr-6 py-6 glass rounded-[2rem] border-white/5 focus:border-vibrant-orange/30 outline-none transition-all font-bold text-white placeholder:text-white/5"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="group">
              <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] ml-1 mb-3 block">Chave de Acesso</label>
              <div className="relative">
                <div className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-vibrant-orange transition-colors">
                  <Lock size={20} />
                </div>
                <input
                  type="password"
                  placeholder="••••••••"
                  className="w-full pl-16 pr-6 py-6 glass rounded-[2rem] border-white/5 focus:border-vibrant-orange/30 outline-none transition-all font-bold text-white placeholder:text-white/5"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                className="flex items-center gap-3 p-5 glass border-red-500/20 text-red-500 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest leading-none"
              >
                <AlertCircle size={18} />
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-6 pt-4">
            <Button 
              type="submit" 
              variant="premium" 
              size="xl" 
              disabled={isLoggingIn}
              className="w-full h-18 rounded-[2.5rem] shadow-glow flex items-center justify-center gap-3"
            >
              {isLoggingIn ? "PROCESSANDO..." : "AUTENTICAR"} <Zap size={20} fill="currentColor" />
            </Button>
            <button 
              type="button" 
              className="w-full text-center text-[10px] font-bold text-muted-text hover:text-white transition-all uppercase tracking-[0.4em] py-2"
            >
              Esqueci a chave
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
