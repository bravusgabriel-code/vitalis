import React, { useState } from 'react';
import { Button, Card, SectionTitle } from '../../components/UI';
import { useUser } from '../../hooks/useUser';
import { validateEmail, validateCPF, maskCPF, calculateAge } from '../../lib/utils';
import { supabase } from '../../lib/supabase';
import { ChevronLeft, User, Calendar, MapPin, Scale, Ruler, Mail, Lock, Check, Sparkles, Activity, Zap, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';

interface RegisterProps {
  onBack: () => void;
}

const STATES = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

export const Register: React.FC<RegisterProps> = ({ onBack }) => {
  const { register } = useUser();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    birthDate: '',
    cpf: '',
    gender: 'male' as 'male' | 'female' | 'other',
    city: '',
    state: 'SP',
    weight: '',
    height: '',
    email: '',
    password: '',
    confirmPassword: '',
    hasDoctor: false,
    doctorId: '' as string | undefined,
    doctorName: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [doctorSuggestions, setDoctorSuggestions] = useState<{ id: string, nome: string }[]>([]);
  const [isSearchingDoctor, setIsSearchingDoctor] = useState(false);

  const searchDoctors = async (query: string) => {
    if (query.length < 3) {
      setDoctorSuggestions([]);
      return;
    }

    setIsSearchingDoctor(true);
    try {
      // In a real scenario, we'd have a 'role' or 'is_doctor' flag in profiles
      // For now, let's try to find in 'profiles' where name matches
      // If the table doesn't exist yet (reset), this will fail gracefully due to proxy
      const { data, error } = await supabase
        .from('profiles')
        .select('id, nome')
        .ilike('nome', `%${query}%`)
        .limit(5);

      if (!error && data) {
        setDoctorSuggestions(data);
      } else {
        // Mock fallback for demonstration if DB is empty/reset
        const mocks = [
          { id: 'doc1', nome: 'Dr. Silva Sauro' },
          { id: 'doc2', nome: 'Dra. Ana Maria' },
          { id: 'doc3', nome: 'Dr. Ricardo Santos' }
        ].filter(d => d.nome.toLowerCase().includes(query.toLowerCase()));
        setDoctorSuggestions(mocks);
      }
    } catch (e) {
      setDoctorSuggestions([]);
    } finally {
      setIsSearchingDoctor(false);
    }
  };

  const nextStep = () => {
    setError(null);
    if (step === 1) {
      if (!formData.name || !formData.birthDate || !formData.cpf || !formData.city || !formData.state) {
        setError('PREENCHA TODOS OS CAMPOS');
        return;
      }
      if (!validateCPF(formData.cpf)) {
        setError('CPF INVÁLIDO OU INCOMPLETO');
        return;
      }
    } else if (step === 2) {
      if (!formData.weight || !formData.height) {
        setError('PRECISAMOS DAS SUAS MEDIDAS');
        return;
      }
    }
    setStep(step + 1);
  };

  const prevStep = () => {
    setError(null);
    if (step === 1) {
      onBack();
    } else {
      setStep(step - 1);
    }
  };

  const handleFinish = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateEmail(formData.email)) {
      setError('E-MAIL INVÁLIDO');
      return;
    }
    if (formData.password.length < 6) {
      setError('SENHA MÍNIMA 6 DÍGITOS');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('SENHAS NÃO CONCORDAM');
      return;
    }

    if (!supabase.isConfigured) {
      const diag = supabase.getDiagnosticInfo();
      let msg = 'CONFIGURAÇÃO SUPABASE AUSENTE.';
      if (!diag.hasUrl) msg += ' URL faltando.';
      if (diag.hasUrl && !diag.isValidUrl) msg += ' URL inválida.';
      if (!diag.hasAnonKey) msg += ' Chave Anon faltando.';
      setError(msg + ' Verifique os Secrets no AI Studio.');
      return;
    }

    setIsRegistering(true);
    try {
      console.log("Iniciando registro para:", formData.email);
      await register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        cpf: formData.cpf,
        birthDate: formData.birthDate,
        city: formData.city,
        state: formData.state,
        weight: parseFloat(formData.weight),
        height: parseFloat(formData.height),
        age: calculateAge(formData.birthDate),
        gender: formData.gender,
        goal: 'maintain',
        activityLevel: 1.2,
        targetCalories: 2000,
        waterGoal: 2500,
        isAuthenticated: true,
        hasDoctor: formData.hasDoctor,
        doctorId: formData.doctorId,
        doctorName: formData.doctorName,
        
        // Gamification Init
        xp: 0,
        level: 1,
        streak: 0,
        achievements: [],
        totalWeightLifted: 0,
        totalCardioDistance: 0,
        waterDaysCount: 0,
        nutritionDaysCount: 0,
        missionsCompletedCount: 0,
        appUsageDaysCount: 0,
        lastActiveDate: ''
      });
      console.log("Registro solicitado com sucesso");
    } catch (err: any) {
      console.error("Erro capturado no Register.tsx:", err);
      setError(err.message || 'ERRO AO CRIAR CONTA. TENTE NOVAMENTE.');
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-bg p-8 pt-12 pb-40 relative overflow-y-auto no-scrollbar">
      {/* Background Decorative Glows */}
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-vibrant-orange/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="relative z-10 flex items-center gap-6 mb-14 max-w-sm mx-auto">
        <button onClick={prevStep} className="h-12 w-12 glass rounded-2xl flex items-center justify-center text-white/40 hover:text-white transition-all border-white/5 flex-shrink-0">
          <ChevronLeft size={24} />
        </button>
        <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-orange-gradient shadow-[0_0_15px_rgba(255,106,0,0.4)]"
            initial={{ width: '33%' }}
            animate={{ width: `${(step / 3) * 100}%` }}
          />
        </div>
        <span className="text-[10px] font-black text-white/20 w-8">{step}/3</span>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="relative z-10 max-w-sm mx-auto"
        >
          {step === 1 && (
            <div className="space-y-10">
              <SectionTitle subtitle="Inicie o protocolo Vitalis">Identificação</SectionTitle>
              <div className="space-y-6">
                  <InputWithIcon 
                    icon={<User size={20} />} 
                    label="Nome Completo"
                    placeholder="Digite seu nome" 
                    value={formData.name} 
                    onChange={(v) => setFormData({...formData, name: v})} 
                  />
                  <InputWithIcon 
                    icon={<Calendar size={20} />} 
                    label="Nascimento"
                    placeholder="dd/mm/aaaa" 
                    type="date"
                    value={formData.birthDate} 
                    onChange={(v) => setFormData({...formData, birthDate: v})} 
                  />
                <InputWithIcon 
                  icon={<Activity size={20} />} 
                  label="CPF"
                  placeholder="000.000.000-00" 
                  value={formData.cpf} 
                  onChange={(v) => setFormData({...formData, cpf: maskCPF(v)})} 
                />
                
                <div className="space-y-4">
                   <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] ml-1">Gênero Bio</label>
                   <div className="grid grid-cols-3 gap-3">
                    {(['male', 'female', 'other'] as const).map((g) => (
                      <button
                        key={g}
                        onClick={() => setFormData({...formData, gender: g})}
                        className={cn(
                          "py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border",
                          formData.gender === g 
                            ? 'bg-vibrant-orange/10 text-white border-vibrant-orange/30 shadow-lg' 
                            : 'glass border-white/5 text-white/10'
                        )}
                      >
                        {g === 'male' ? 'Homem' : g === 'female' ? 'Mulher' : 'Outro'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between px-1">
                    <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em]">Acompanhamento Médico</label>
                    <button 
                      type="button"
                      onClick={() => setFormData({...formData, hasDoctor: !formData.hasDoctor})}
                      className={cn(
                        "w-12 h-6 rounded-full transition-all relative p-1",
                        formData.hasDoctor ? "bg-vibrant-orange" : "bg-white/10"
                      )}
                    >
                      <motion.div 
                        animate={{ x: formData.hasDoctor ? 24 : 0 }}
                        className="w-4 h-4 bg-white rounded-full shadow-lg"
                      />
                    </button>
                  </div>

                  <AnimatePresence>
                    {formData.hasDoctor && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-4 overflow-hidden"
                      >
                        <div className="relative group">
                          <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] ml-2 mb-3 block">Nome do Médico</label>
                          <div className="relative">
                            <div className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-vibrant-orange transition-colors">
                              <Sparkles size={20} />
                            </div>
                            <input
                              type="text"
                              placeholder="Busque pelo nome..."
                              className="w-full pl-16 pr-6 py-6 glass rounded-[2rem] border-white/10 focus:border-vibrant-orange/50 outline-none transition-all font-bold text-white placeholder:text-white/30 tracking-wide text-base shadow-inner"
                              value={formData.doctorName}
                              onChange={(e) => {
                                setFormData({...formData, doctorName: e.target.value, doctorId: undefined});
                                searchDoctors(e.target.value);
                              }}
                            />
                            {isSearchingDoctor && (
                              <div className="absolute right-6 top-1/2 -translate-y-1/2">
                                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}>
                                  <Zap size={16} className="text-vibrant-orange" />
                                </motion.div>
                              </div>
                            )}
                          </div>

                          {doctorSuggestions.length > 0 && (
                            <motion.div 
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="absolute z-50 left-0 right-0 mt-2 p-2 glass border-white/10 rounded-2xl shadow-premium overflow-hidden"
                            >
                              {doctorSuggestions.map((doc) => (
                                <button
                                  key={doc.id}
                                  onClick={() => {
                                    setFormData({...formData, doctorName: doc.nome, doctorId: doc.id});
                                    setDoctorSuggestions([]);
                                  }}
                                  className="w-full text-left px-4 py-3 hover:bg-white/5 rounded-xl transition-colors text-sm font-bold text-white/80 hover:text-white flex items-center justify-between group"
                                >
                                  <span>{doc.nome}</span>
                                  <Check size={14} className="opacity-0 group-hover:opacity-100 text-vibrant-orange transition-opacity" />
                                </button>
                              ))}
                            </motion.div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="grid grid-cols-12 gap-4">
                  <div className="col-span-8">
                    <InputWithIcon 
                      icon={<MapPin size={20} />} 
                      label="Cidade"
                      placeholder="Nome da cidade" 
                      value={formData.city} 
                      onChange={(v) => setFormData({...formData, city: v})} 
                    />
                  </div>
                  <div className="col-span-4 group">
                    <label className="text-[11px] font-bold text-white/50 uppercase tracking-widest ml-2 mb-3 block">UF</label>
                    <div className="relative">
                      <select
                        className="w-full pl-6 pr-10 py-6 glass rounded-[2rem] border-white/10 focus:border-vibrant-orange/50 outline-none transition-all font-bold text-white tracking-wide text-base appearance-none cursor-pointer shadow-inner"
                        value={formData.state}
                        onChange={(e) => setFormData({...formData, state: e.target.value})}
                      >
                        {STATES.map(s => <option key={s} value={s} className="bg-dark-bg">{s}</option>)}
                      </select>
                      <div className="absolute right-6 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none group-focus-within:text-vibrant-orange">
                        <ChevronLeft size={16} className="rotate-270" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-10">
              <SectionTitle subtitle="Dados biométricos primários">Medidas</SectionTitle>
              <div className="grid grid-cols-1 gap-8">
                <InputWithIcon 
                  icon={<Scale size={20} />} 
                  label="Massa Corporal (KG)"
                  placeholder="00,0" 
                  type="number"
                  value={formData.weight} 
                  onChange={(v) => setFormData({...formData, weight: v})} 
                />
                <InputWithIcon 
                  icon={<Ruler size={20} />} 
                  label="Estatura (CM)"
                  placeholder="000" 
                  type="number"
                  value={formData.height} 
                  onChange={(v) => setFormData({...formData, height: v})} 
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-10">
              <SectionTitle subtitle="Acesso seguro e criptografado">Credenciais</SectionTitle>
              <div className="space-y-6">
                <InputWithIcon 
                  icon={<Mail size={20} />} 
                  label="E-mail de Cadastro"
                  placeholder="exemplo@vitalis.os" 
                  type="email"
                  value={formData.email} 
                  onChange={(v) => setFormData({...formData, email: v})} 
                />
                <InputWithIcon 
                  icon={<Lock size={20} />} 
                  label="Senha Maestra"
                  placeholder="Mínimo 6 dígitos" 
                  type="password"
                  value={formData.password} 
                  onChange={(v) => setFormData({...formData, password: v})} 
                />
                <InputWithIcon 
                  icon={<Lock size={20} />} 
                  label="Confirmação"
                  placeholder="Repita a senha" 
                  type="password"
                  value={formData.confirmPassword} 
                  onChange={(v) => setFormData({...formData, confirmPassword: v})} 
                />
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      <div className="fixed bottom-0 left-0 right-0 p-8 pb-10 z-30 bg-gradient-to-t from-dark-bg via-dark-bg/95 to-transparent">
        <div className="max-w-sm mx-auto">
          {step < 3 ? (
            <Button variant="premium" size="xl" onClick={nextStep} className="w-full h-18 rounded-[2.5rem] shadow-glow text-lg">
              PRÓXIMO PASSO
            </Button>
          ) : (
            <Button 
              variant="premium" 
              size="xl" 
              onClick={handleFinish} 
              disabled={isRegistering}
              className="w-full h-18 rounded-[2.5rem] shadow-glow flex items-center justify-center gap-3 text-lg"
            >
              {isRegistering ? (
                <>PROCESSANDO... <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}><Sparkles size={22} /></motion.div></>
              ) : (
                <>HABILITAR VITALIS <Zap size={22} fill="currentColor" /></>
              )}
            </Button>
          )}
        </div>
      </div>

      <AnimatePresence>
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed bottom-36 left-8 right-8 p-5 glass border-red-500/20 text-red-500 rounded-[2rem] text-[11px] font-bold uppercase tracking-[0.1em] z-40 max-w-sm mx-auto flex items-center gap-3 shadow-2xl"
          >
            {error.includes('CONEXÃO') ? <AlertTriangle size={18} /> : <Lock size={18} />}
            {error}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const InputWithIcon: React.FC<{
  icon: React.ReactNode;
  label: string;
  placeholder: string;
  type?: string;
  value: string | number;
  onChange: (val: string) => void;
}> = ({ icon, label, placeholder, type = 'text', value, onChange }) => (
  <div className="group">
    <label className="text-[11px] font-bold text-white/50 uppercase tracking-widest ml-2 mb-3 block">{label}</label>
    <div className="relative">
      <div className="absolute left-6 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-vibrant-orange transition-colors">
        {icon}
      </div>
      <input
        type={type}
        placeholder={placeholder}
        className="w-full pl-16 pr-6 py-6 glass rounded-[2rem] border-white/10 focus:border-vibrant-orange/50 outline-none transition-all font-bold text-white placeholder:text-white/40 tracking-wide text-base shadow-inner md:text-lg"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  </div>
);
