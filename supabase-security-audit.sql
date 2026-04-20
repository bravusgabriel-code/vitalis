-- Auditoria e Reforço de Segurança (RLS & Proteção de Dados)
-- Desenvolvido para Supabase (PostgreSQL)

-- 1. LIMPEZA DE POLÍTICAS EXISTENTES (Para evitar duplicação ou conflitos)
DO $$ 
DECLARE 
    pol record;
BEGIN
    FOR pol IN (SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public') 
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I', pol.policyname, pol.tablename);
    END LOOP;
END $$;

-- 2. POLÍTICAS PARA: profiles
-- Proteção máxima: Usuário só vê seu próprio perfil. Admin (se houver) pode ver todos.
CREATE POLICY "Profiles: Users can select own" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Profiles: Users can update own" ON public.profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- 3. POLÍTICAS PARA: foods (Biblioteca de Alimentos)
-- Vulnerabilidade Corrigida: Garantir que ninguém delete alimentos globais (user_id IS NULL).
CREATE POLICY "Foods: Viewable by anyone if global or by owner" ON public.foods FOR SELECT USING (user_id IS NULL OR auth.uid() = user_id);
CREATE POLICY "Foods: Users can insert own custom" ON public.foods FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Foods: Users can update/delete only own custom" ON public.foods 
FOR ALL USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- 4. POLÍTICAS PARA: logs (Nutrição, Água, Cardio, Treinos, Medidas, Tarefas)
-- Padronização: 'auth.uid() = user_id' em todas as operações de escrita e leitura.

-- Macro para aplicar em tabelas de log padrão
DO $$ 
DECLARE 
    tbl text;
    tables_to_secure text[] := ARRAY[
        'meal_logs', 'food_logs', 'water_logs', 'cardio_logs', 
        'planner_tasks', 'user_achievements', 'mission_progress', 
        'xp_history', 'user_bio_history', 'food_favorites',
        'workout_sessions'
    ];
BEGIN
    FOREACH tbl IN ARRAY tables_to_secure LOOP
        EXECUTE format('CREATE POLICY "Standard Log: Access by owner" ON public.%I FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)', tbl);
    END LOOP;
END $$;

-- 5. TRATAMENTO ESPECIAL: workout_exercises e workout_sets
-- Problema: Essas tabelas não têm 'user_id' direto, elas dependem da FK de workout_sessions.
-- Solução: Usar subqueries ou garantias de herança.

-- workout_exercises
CREATE POLICY "Workout Exercises: Access via session owner" ON public.workout_exercises FOR ALL 
USING (EXISTS (SELECT 1 FROM public.workout_sessions s WHERE s.id = workout_id AND s.user_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.workout_sessions s WHERE s.id = workout_id AND s.user_id = auth.uid()));

-- workout_sets
CREATE POLICY "Workout Sets: Access via exercise owner" ON public.workout_sets FOR ALL 
USING (EXISTS (
    SELECT 1 FROM public.workout_exercises e 
    JOIN public.workout_sessions s ON e.workout_id = s.id 
    WHERE e.id = workout_exercise_id AND s.user_id = auth.uid()
))
WITH CHECK (EXISTS (
    SELECT 1 FROM public.workout_exercises e 
    JOIN public.workout_sessions s ON e.workout_id = s.id 
    WHERE e.id = workout_exercise_id AND s.user_id = auth.uid()
));

-- 6. POLÍTICAS PARA: rankings (Transparência Limitada)
-- Usuários podem ver o ranking de todos, mas não podem alterar.
CREATE POLICY "Rankings: Public viewable" ON public.user_rankings FOR SELECT USING (true);
-- Update é feito via TRIGGER (SECURITY DEFINER), então não precisa de política INSERT/UPDATE para o usuário.

-- 7. AUDITORIA DE SEGURANÇA FINAL
-- Garantir que tabelas mestras (exercises, definitions) sejam READ-ONLY para usuários comuns.
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badge_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mission_definitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Master Data: Read-only for everyone" ON public.exercises FOR SELECT USING (true);
CREATE POLICY "Definitions: Read-only for everyone" ON public.badge_definitions FOR SELECT USING (true);
CREATE POLICY "Definitions: Read-only for everyone" ON public.mission_definitions FOR SELECT USING (true);
