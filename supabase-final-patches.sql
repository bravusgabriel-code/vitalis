-- Script de Complementação de Tabelas e Ajustes Finais
-- Focado em Bio-Evolução, Ranking e Metas de Nutrição

-- 1. ADICIONAR COLUNAS DE MACROS AO PERFIL
-- Para permitir que o usuário defina metas específicas além de calorias
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS target_protein INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS target_carbs INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS target_fat INT DEFAULT 0;

-- 2. TABELA: user_weight_history (Evolução de Peso e Medidas)
-- Essencial para o Dashboard de Bio-Evolução
CREATE TABLE IF NOT EXISTS public.user_bio_history (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    weight FLOAT, -- em kg
    body_fat_percent FLOAT, -- % de gordura (opcional)
    neck_cm FLOAT,
    waist_cm FLOAT,
    hips_cm FLOAT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, date) -- Evita múltiplos registros por dia
);

-- 3. TABELA: user_social_stats (Cache para Rankings)
-- Otimiza a performance do Dashboard e Gamificação
CREATE TABLE IF NOT EXISTS public.user_rankings (
    user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    total_xp INT DEFAULT 0,
    current_level INT DEFAULT 1,
    current_streak INT DEFAULT 0,
    total_workouts INT DEFAULT 0,
    last_snapshot TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. ÍNDICES DE PERFORMANCE ADICIONAIS
CREATE INDEX IF NOT EXISTS idx_bio_history_user_date ON public.user_bio_history(user_id, date);
CREATE INDEX IF NOT EXISTS idx_rankings_xp ON public.user_rankings(total_xp DESC);

-- 5. SEGURANÇA (RLS)
ALTER TABLE public.user_bio_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_rankings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own bio history" ON public.user_bio_history USING (auth.uid() = user_id);
CREATE POLICY "Rankings are public for all users" ON public.user_rankings FOR SELECT USING (true);

-- 6. TRIGGER PARA AUTOMATIZAR O RANKING (Sincronização de XP)
CREATE OR REPLACE FUNCTION public.sync_user_ranking()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_rankings (user_id, total_xp, current_level, current_streak)
    VALUES (NEW.id, NEW.xp, NEW.level, NEW.streak)
    ON CONFLICT (user_id) DO UPDATE SET
        total_xp = EXCLUDED.total_xp,
        current_level = EXCLUDED.current_level,
        current_streak = EXCLUDED.current_streak,
        last_snapshot = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_sync_ranking
AFTER UPDATE OF xp, level, streak ON public.profiles
FOR EACH ROW
EXECUTE PROCEDURE public.sync_user_ranking();
