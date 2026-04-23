-- ############################################################
-- VITALIS FITNESS: SISTEMA DE NUTRIÇÃO (SUPABASE/POSTGRESQL)
-- ############################################################

-- 1. EXTENSÕES
-- Habilita busca por similaridade (fuzzy search) para nomes de alimentos
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABELAS

-- TABELA: foods
-- Armazena o catálogo de alimentos (globais e personalizados)
CREATE TABLE public.foods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    calories_100g NUMERIC(10,1) NOT NULL DEFAULT 0,
    protein_100g NUMERIC(10,1) NOT NULL DEFAULT 0,
    carbs_100g NUMERIC(10,1) NOT NULL DEFAULT 0,
    fat_100g NUMERIC(10,1) NOT NULL DEFAULT 0,
    category TEXT,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- NULL se for alimento global do sistema
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TABELA: food_logs
-- Registro de consumo diário dos usuários
CREATE TABLE public.food_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    food_id UUID REFERENCES public.foods(id) ON DELETE SET NULL,
    quantity_grams NUMERIC(10,1) NOT NULL DEFAULT 0,
    calories NUMERIC(10,1) DEFAULT 0,
    protein NUMERIC(10,1) DEFAULT 0,
    carbs NUMERIC(10,1) DEFAULT 0,
    fat NUMERIC(10,1) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TABELA: food_favorites
-- Permite ao usuário favoritar alimentos para acesso rápido
CREATE TABLE public.food_favorites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    food_id UUID NOT NULL REFERENCES public.foods(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, food_id)
);

-- 3. ÍNDICES DE PERFORMANCE
-- Busca rápida por nome usando GIN para suporte a busca inteligente (fuzzy search)
CREATE INDEX IF NOT EXISTS idx_foods_name_trgm ON public.foods USING gin (name gin_trgm_ops);
-- Indexação comum para filtros por usuário e data
CREATE INDEX IF NOT EXISTS idx_food_logs_user_date ON public.food_logs(user_id, created_at);

-- 4. LÓGICA DE CÁLCULO AUTOMÁTICO (TRIGGER)
-- Esta função é executada toda vez que um alimento é registrado (INSERT ou UPDATE)
CREATE OR REPLACE FUNCTION public.fn_calculate_nutrition_on_log()
RETURNS TRIGGER AS $$
DECLARE
    ref_food RECORD;
BEGIN
    -- Busca os valores nutricionais de referência (100g) do alimento selecionado
    SELECT calories_100g, protein_100g, carbs_100g, fat_100g 
    INTO ref_food 
    FROM public.foods 
    WHERE id = NEW.food_id;

    -- Se o alimento existir, calcula os macros baseado na quantidade informada (Arredondamento 1 casa decimal)
    IF ref_food IS NOT NULL THEN
        NEW.calories := ROUND((ref_food.calories_100g / 100.0) * NEW.quantity_grams, 1);
        NEW.protein  := ROUND((ref_food.protein_100g / 100.0) * NEW.quantity_grams, 1);
        NEW.carbs    := ROUND((ref_food.carbs_100g / 100.0) * NEW.quantity_grams, 1);
        NEW.fat      := ROUND((ref_food.fat_100g / 100.0) * NEW.quantity_grams, 1);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_auto_calculate_nutrition
BEFORE INSERT OR UPDATE ON public.food_logs
FOR EACH ROW
EXECUTE FUNCTION public.fn_calculate_nutrition_on_log();

-- 5. SEGURANÇA (RLS - Row Level Security)
ALTER TABLE public.foods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.food_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.food_favorites ENABLE ROW LEVEL SECURITY;

-- POLÍTICAS: Alimentos
-- Todos podem ver alimentos globais (user_id IS NULL), usuários vêem apenas seus próprios personalizados
CREATE POLICY "Select Global or Own Foods" ON public.foods FOR SELECT USING (user_id IS NULL OR auth.uid() = user_id);
CREATE POLICY "Insert Own Foods" ON public.foods FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Update/Delete Own Foods" ON public.foods FOR ALL USING (auth.uid() = user_id);

-- POLÍTICAS: Logs e Favoritos
-- Apenas o dono do registro pode visualizar ou modificar
CREATE POLICY "Manage Own Logs" ON public.food_logs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Manage Own Favorites" ON public.food_favorites FOR ALL USING (auth.uid() = user_id);

-- 6. DADOS INICIAIS (SEED DATA)
INSERT INTO public.foods (name, calories_100g, protein_100g, carbs_100g, fat_100g, category) VALUES
('Frango Grelhado', 165, 31, 0, 3.6, 'Proteínas'),
('Arroz Branco Cozido', 130, 2.7, 28, 0.3, 'Carboidratos'),
('Ovo Cozido', 155, 13, 1.1, 11, 'Proteínas'),
('Banana Prata', 89, 1.1, 22.8, 0.3, 'Frutas'),
('Abacate', 160, 2, 8.5, 14.7, 'Gorduras Saudáveis'),
('Batata Doce Cozida', 86, 1.6, 20.1, 0.1, 'Carboidratos');
