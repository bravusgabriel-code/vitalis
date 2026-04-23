-- TABELA DE PERFIS DE USUÁRIO (VITALIS)
-- Criando a tabela de perfis que estende o Supabase Auth

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    nome TEXT NOT NULL,
    email TEXT NOT NULL,
    cpf TEXT,
    data_nascimento DATE,
    genero TEXT CHECK (genero IN ('male', 'female', 'other')),
    cidade TEXT,
    estado CHAR(2),
    peso DECIMAL(5,2),
    altura DECIMAL(5,2),
    has_doctor BOOLEAN DEFAULT FALSE,
    doctor_name TEXT,
    doctor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    xp INTEGER DEFAULT 0,
    nivel INTEGER DEFAULT 1,
    streak INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- POLÍTICAS DE SEGURANÇA

-- 1. Usuários podem ver seu próprio perfil
CREATE POLICY "Users can view own profile" 
ON public.profiles FOR SELECT 
USING (auth.uid() = id);

-- 2. Usuários podem atualizar seu próprio perfil
CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id);

-- 3. Inserção permitida durante o cadastro
CREATE POLICY "Allow individual insert" 
ON public.profiles FOR INSERT 
WITH CHECK (true); -- Permitido pois Auth é controlado pelo Supabase

-- TRIGGER PARA UPDATED_AT
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- TRIGGER PARA CRIAR PERFIL AUTOMATICAMENTE NO SIGNUP (OPCIONAL MAS RECOMENDADO)
-- Nota: O app já faz o upsert manual, mas isso garante integridade.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, nome, email, cpf)
    VALUES (
        NEW.id, 
        COALESCE(NEW.raw_user_meta_data->>'name', 'Usuário Vitalis'), 
        NEW.email,
        NEW.raw_user_meta_data->>'cpf'
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Habilitar se desejar auto-criação básica:
-- CREATE TRIGGER on_auth_user_created
-- AFTER INSERT ON auth.users
-- FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- COMENTÁRIOS DE SEGURANÇA
COMMENT ON TABLE public.profiles IS 'Tabela central de usuários do Vitalis, vinculada ao Auth.';
