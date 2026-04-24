-- SQL SETUP FOR SUPABASE
-- Execute este script no SQL Editor do seu Dashboard Supabase

-- 1. Criar a tabela de perfis
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  nome TEXT,
  email TEXT,
  cpf TEXT UNIQUE,
  data_nascimento DATE,
  cidade TEXT,
  estado TEXT,
  peso DECIMAL,
  altura DECIMAL,
  genero TEXT,
  has_doctor BOOLEAN DEFAULT FALSE,
  doctor_name TEXT,
  doctor_id TEXT,
  xp INTEGER DEFAULT 0,
  nivel INTEGER DEFAULT 1,
  streak INTEGER DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Habilitar RLS (Row Level Security)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. Políticas de Segurança (Policies)
-- Permitir leitura pública dos nomes (opcional, para busca de médicos por exemplo)
DROP POLICY IF EXISTS "Allow public read-only of names" ON public.profiles;
CREATE POLICY "Allow public read-only of names" ON public.profiles
  FOR SELECT USING (true);

-- Permitir que cada usuário atualize seu próprio perfil
DROP POLICY IF EXISTS "Allow individual update" ON public.profiles;
CREATE POLICY "Allow individual update" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Permitir que cada usuário insira seu próprio perfil
DROP POLICY IF EXISTS "Allow individual insert" ON public.profiles;
CREATE POLICY "Allow individual insert" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- 4. Função e Trigger para criação automática
-- Esta função é chamada quando um usuário se registra no Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, nome, email, cpf, updated_at)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'name', ''), 
    new.email,
    COALESCE(new.raw_user_meta_data->>'cpf', ''),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    nome = EXCLUDED.nome,
    email = EXCLUDED.email,
    cpf = CASE WHEN EXCLUDED.cpf <> '' THEN EXCLUDED.cpf ELSE profiles.cpf END,
    updated_at = NOW();
  RETURN new;
EXCEPTION WHEN OTHERS THEN
  -- Se houver erro (ex: CPF duplicado), ainda assim permite a criação do usuário no Auth
  -- O app tentará fazer o upsert manual em seguida e mostrará o erro específico
  RETURN new; 
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Remover trigger se já existir para evitar duplicidade
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Criar o trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
