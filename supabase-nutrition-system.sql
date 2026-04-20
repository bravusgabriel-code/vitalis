-- Sistema de Nutrição Avançado (Base 100g)
-- Desenvolvido para Supabase (PostgreSQL)

-- 1. EXTENSÕES (Para busca inteligente)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 2. TABELAS

-- TABELA: foods (Biblioteca de Alimentos - Referência 100g)
CREATE TABLE public.foods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE, -- NULL para alimentos globais
    name TEXT NOT NULL,
    calories_100g NUMERIC(10,1) NOT NULL DEFAULT 0,
    protein_100g NUMERIC(10,1) NOT NULL DEFAULT 0,
    carbs_100g NUMERIC(10,1) NOT NULL DEFAULT 0,
    fat_100g NUMERIC(10,1) NOT NULL DEFAULT 0,
    category TEXT,
    is_custom BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TABELA: food_logs (Registro de Consumo Individual)
CREATE TABLE public.food_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    food_id UUID REFERENCES public.foods(id) ON DELETE SET NULL,
    meal_type meal_type DEFAULT 'snack', -- Usa o enum criado no setup anterior
    quantity_grams NUMERIC(10,1) NOT NULL DEFAULT 0,
    calories NUMERIC(10,1) DEFAULT 0,
    protein NUMERIC(10,1) DEFAULT 0,
    carbs NUMERIC(10,1) DEFAULT 0,
    fat NUMERIC(10,1) DEFAULT 0,
    consumed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TABELA: food_favorites (Alimentos Favoritos do Usuário)
CREATE TABLE public.food_favorites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    food_id UUID NOT NULL REFERENCES public.foods(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, food_id)
);

-- 3. ÍNDICES PARA BUSCA INTELIGENTE
CREATE INDEX idx_foods_name_trgm ON public.foods USING gin (name gin_trgm_ops);
CREATE INDEX idx_foods_category ON public.foods(category);
CREATE INDEX idx_food_logs_user_date ON public.food_logs(user_id, consumed_at);

-- 4. LÓGICA DE CÁLCULO AUTOMÁTICO (TRIGGER)

CREATE OR REPLACE FUNCTION calculate_food_log_nutrition()
RETURNS TRIGGER AS $$
DECLARE
    food_ref RECORD;
BEGIN
    -- Busca os valores de referência do alimento
    SELECT calories_100g, protein_100g, carbs_100g, fat_100g 
    INTO food_ref
    FROM public.foods
    WHERE id = NEW.food_id;

    -- Realiza o cálculo baseado na quantidade informada (Arredondado para 1 casa decimal)
    IF food_ref IS NOT NULL THEN
        NEW.calories := ROUND((food_ref.calories_100g / 100.0) * NEW.quantity_grams, 1);
        NEW.protein  := ROUND((food_ref.protein_100g / 100.0) * NEW.quantity_grams, 1);
        NEW.carbs    := ROUND((food_ref.carbs_100g / 100.0) * NEW.quantity_grams, 1);
        NEW.fat      := ROUND((food_ref.fat_100g / 100.0) * NEW.quantity_grams, 1);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calculate_nutrition
BEFORE INSERT OR UPDATE ON public.food_logs
FOR EACH ROW
EXECUTE FUNCTION calculate_food_log_nutrition();

-- 5. SEGURANÇA (RLS)

ALTER TABLE public.foods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.food_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.food_favorites ENABLE ROW LEVEL SECURITY;

-- Políticas Foods: Todos vêem globais (user_id IS NULL), usuários vêem seus próprios customizados
CREATE POLICY "Foods are viewable by everyone if global or by owner if custom" 
ON public.foods FOR SELECT 
USING (user_id IS NULL OR auth.uid() = user_id);

CREATE POLICY "Users can insert their own custom foods" 
ON public.foods FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Políticas Logs e Favoritos: Apenas o dono
CREATE POLICY "Users can manage own food logs" 
ON public.food_logs USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own favorites" 
ON public.food_favorites USING (auth.uid() = user_id);

-- 6. DATA SEED (Exemplos Iniciais)
INSERT INTO public.foods (name, calories_100g, protein_100g, carbs_100g, fat_100g, category) VALUES
('Frango Grelhado', 165.0, 31.0, 0.0, 3.6, 'Proteínas'),
('Arroz Branco Cozido', 130.0, 2.7, 28.0, 0.3, 'Carboidratos'),
('Ovo Cozido', 155.0, 13.0, 1.1, 11.0, 'Proteínas'),
('Abacate', 160.0, 2.0, 8.5, 14.7, 'Gorduras'),
('Aveia em Flocos', 389.0, 16.9, 66.3, 6.9, 'Carboidratos'),
('Banana Prata', 89.0, 1.1, 22.8, 0.3, 'Frutas');
