-- Configuração do Banco de Dados para Vitalis Fitness
-- Desenvolvido para PostgreSQL (Supabase)

-- 1. EXTENSÕES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ENUMS (Para garantir integridade de dados)
CREATE TYPE goal_type AS ENUM ('lose', 'gain', 'maintain');
CREATE TYPE gender_type AS ENUM ('male', 'female', 'other');
CREATE TYPE meal_type AS ENUM ('breakfast', 'lunch', 'dinner', 'snack', 'custom');
CREATE TYPE workout_category AS ENUM ('strength', 'cardio');
CREATE TYPE task_category AS ENUM ('workout', 'nutrition', 'habit');
CREATE TYPE mission_type AS ENUM ('daily', 'weekly');

-- 3. TABELAS PRINCIPAIS

-- TABELA: profiles (Extensão da tabela auth.users do Supabase)
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    first_name TEXT GENERATED ALWAYS AS (split_part(full_name, ' ', 1)) STORED,
    email TEXT UNIQUE NOT NULL,
    cpf TEXT UNIQUE,
    birth_date DATE,
    city TEXT,
    state TEXT,
    weight FLOAT DEFAULT 0,
    height FLOAT DEFAULT 0,
    gender gender_type DEFAULT 'other',
    goal goal_type DEFAULT 'maintain',
    activity_level FLOAT DEFAULT 1.2,
    target_calories INT DEFAULT 2000,
    manual_calories INT,
    water_goal INT DEFAULT 2000,
    
    -- Gamificação
    xp INT DEFAULT 0,
    level INT DEFAULT 1,
    streak INT DEFAULT 0,
    last_active_date DATE,
    total_weight_lifted FLOAT DEFAULT 0,
    total_cardio_distance FLOAT DEFAULT 0,
    water_days_count INT DEFAULT 0,
    nutrition_days_count INT DEFAULT 0,
    missions_completed_count INT DEFAULT 0,
    app_usage_days_count INT DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TABELA: exercises (Catálogo mestre)
CREATE TABLE public.exercises (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    category workout_category NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TABELA: food_items (Biblioteca de alimentos)
CREATE TABLE public.food_items (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE, -- Null se for item Global
    name TEXT NOT NULL,
    calories FLOAT DEFAULT 0,
    protein FLOAT DEFAULT 0,
    carbs FLOAT DEFAULT 0,
    fat FLOAT DEFAULT 0,
    serving_size TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TABELA: meal_logs (Registro de alimentação)
CREATE TABLE public.meal_logs (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    type meal_type NOT NULL,
    custom_type_name TEXT,
    name TEXT NOT NULL,
    calories FLOAT DEFAULT 0,
    protein FLOAT DEFAULT 0,
    carbs FLOAT DEFAULT 0,
    fat FLOAT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TABELA: water_logs (Hidratação)
CREATE TABLE public.water_logs (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    amount_ml INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, date) -- Uma entrada por dia, somando os ml
);

-- TABELA: workout_sessions (Sessões de treino)
CREATE TABLE public.workout_sessions (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    name TEXT, -- Ex: "Treino A - Peito"
    is_planned BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TABELA: workout_exercises (Exercícios dentro de uma sessão)
CREATE TABLE public.workout_exercises (
    id SERIAL PRIMARY KEY,
    workout_id INT NOT NULL REFERENCES public.workout_sessions(id) ON DELETE CASCADE,
    exercise_id INT NOT NULL REFERENCES public.exercises(id),
    order_index INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TABELA: workout_sets (Séries de cada exercício)
CREATE TABLE public.workout_sets (
    id SERIAL PRIMARY KEY,
    workout_exercise_id INT NOT NULL REFERENCES public.workout_exercises(id) ON DELETE CASCADE,
    reps INT DEFAULT 0,
    weight FLOAT DEFAULT 0,
    order_index INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TABELA: cardio_logs (Registros de cardio)
CREATE TABLE public.cardio_logs (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    type TEXT NOT NULL,
    distance_km FLOAT DEFAULT 0,
    duration_seconds INT DEFAULT 0,
    calories FLOAT DEFAULT 0,
    pace TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TABELA: planner_tasks (Planejamento diário)
CREATE TABLE public.planner_tasks (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    title TEXT NOT NULL,
    completed BOOLEAN DEFAULT FALSE,
    type task_category NOT NULL DEFAULT 'habit',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. SISTEMA DE GAMIFICAÇÃO

-- TABELA: badge_definitions (Definições de conquistas)
CREATE TABLE public.badge_definitions (
    id TEXT PRIMARY KEY, -- Slug unico (ex: 'strength_1t')
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    icon TEXT, -- URL ou nome do icone
    category TEXT NOT NULL,
    requirement INT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TABELA: user_achievements (Conquistas desbloqueadas)
CREATE TABLE public.user_achievements (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    badge_id TEXT NOT NULL REFERENCES public.badge_definitions(id),
    unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, badge_id)
);

-- TABELA: mission_definitions (Missões ativas)
CREATE TABLE public.mission_definitions (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    xp_reward INT DEFAULT 0,
    type mission_type DEFAULT 'daily',
    category TEXT NOT NULL,
    requirement INT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TABELA: mission_progress (Progresso individual do usuário)
CREATE TABLE public.mission_progress (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    mission_id TEXT NOT NULL REFERENCES public.mission_definitions(id),
    current_progress INT DEFAULT 0,
    is_completed BOOLEAN DEFAULT FALSE,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, mission_id)
);

-- TABELA: xp_history (Log de ganhos de XP)
CREATE TABLE public.xp_history (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    amount INT NOT NULL,
    reason TEXT, -- Ex: 'Missão concluida', 'Treino finalizado'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. PERFORMANCE E ÍNDICES

-- Índices para otimização de consultas frequentes
CREATE INDEX idx_meal_logs_user_date ON public.meal_logs(user_id, date);
CREATE INDEX idx_workout_sessions_user_date ON public.workout_sessions(user_id, date);
CREATE INDEX idx_cardio_logs_user_date ON public.cardio_logs(user_id, date);
CREATE INDEX idx_water_logs_user_date ON public.water_logs(user_id, date);
CREATE INDEX idx_planner_tasks_user_date ON public.planner_tasks(user_id, date);
CREATE INDEX idx_xp_history_user ON public.xp_history(user_id);

-- 6. SEGURANÇA (RLS - Row Level Security)

-- Ativar RLS em todas as tabelas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.water_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cardio_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.planner_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mission_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.xp_history ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso (Exemplo: Usuário só vê seus próprios dados)
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Aplicar política padrão para as demais tabelas
CREATE POLICY "Users can interact with own logs" ON public.meal_logs USING (auth.uid() = user_id);
CREATE POLICY "Users can interact with own water" ON public.water_logs USING (auth.uid() = user_id);
CREATE POLICY "Users can interact with own workouts" ON public.workout_sessions USING (auth.uid() = user_id);
-- ... (repetir lógica para as demais tabelas de log)

-- 7. TRIGGERS / AUTOMAÇÕES (Exemplos)

-- Função para atualizar o updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_column();

-- Função para criar perfil automaticamente no Supabase Auth signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para o handle_new_user (Deve ser ativado no schema auth)
-- CREATE TRIGGER on_auth_user_created
--   AFTER INSERT ON auth.users
--   FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
