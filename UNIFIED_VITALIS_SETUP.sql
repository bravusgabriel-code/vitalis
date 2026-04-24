-- UNIFIED VITALIS PROFILE TABLE
-- This script unifies all profile data into a single source of truth.

-- UNIFIED VITALIS PROFILE TABLE cleanup
-- Execute these drops ONLY if you want to start fresh or remove old conflicting relations.
-- DROP TABLE IF EXISTS public.user_profile CASCADE;
-- DROP TABLE IF EXISTS public.profile CASCADE;
-- DROP TABLE IF EXISTS public.account_profile CASCADE;

-- 1. Create the unified profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    
    -- Basic Information
    name TEXT,
    email TEXT,
    cpf TEXT,
    age INTEGER,
    gender TEXT,
    
    -- Body Metrics
    weight NUMERIC,
    height NUMERIC,
    
    -- Activity and Goals
    activity_level TEXT, -- 'sedentary', 'light', 'moderate', 'active', 'very_active'
    goal_type TEXT,     -- 'lose', 'gain', 'maintain', 'recomp'
    goal_value NUMERIC,
    goal_target_weight NUMERIC,
    goal_deadline DATE,
    calorie_strategy TEXT, -- requested by app logic
    
    -- Calculated Metabolic Values
    bmr NUMERIC,
    tdee NUMERIC,
    target_calories NUMERIC,
    target_deficit NUMERIC,
    target_protein NUMERIC,
    target_carbs NUMERIC,
    target_fat NUMERIC,
    target_balance NUMERIC,
    
    -- App Specific Metrics
    water_goal INTEGER DEFAULT 2500,
    xp INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    streak INTEGER DEFAULT 0,
    achievements TEXT[] DEFAULT '{}',
    total_weight_lifted NUMERIC DEFAULT 0,
    total_cardio_distance NUMERIC DEFAULT 0,
    water_days_count INTEGER DEFAULT 0,
    nutrition_days_count INTEGER DEFAULT 0,
    missions_completed_count INTEGER DEFAULT 0,
    app_usage_days_count INTEGER DEFAULT 0,
    last_active_date DATE,
    
    -- Personal/Location
    birth_date DATE,
    city TEXT,
    state TEXT,
    
    -- Medical Link
    has_doctor BOOLEAN DEFAULT FALSE,
    doctor_name TEXT,
    doctor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Daily Fitness Logs (already correct, but ensuring it references the new profiles)
CREATE TABLE IF NOT EXISTS public.daily_fitness_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    date DATE DEFAULT CURRENT_DATE,
    calories_consumed INTEGER DEFAULT 0,
    protein_consumed INTEGER DEFAULT 0,
    carbs_consumed INTEGER DEFAULT 0,
    fat_consumed INTEGER DEFAULT 0,
    bmr_snapshot INTEGER DEFAULT 0,
    tdee_snapshot INTEGER DEFAULT 0,
    target_calories INTEGER DEFAULT 0,
    target_balance INTEGER DEFAULT 0,
    weight_snapshot DECIMAL,
    UNIQUE(user_id, date)
);

-- 3. Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_fitness_logs ENABLE ROW LEVEL SECURITY;

-- 4. Policies for profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Allow individual insert" ON public.profiles;
CREATE POLICY "Allow individual insert" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- 5. Policies for logs
DROP POLICY IF EXISTS "Allow individual logs read" ON public.daily_fitness_logs;
CREATE POLICY "Allow individual logs read" ON public.daily_fitness_logs
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow individual logs write" ON public.daily_fitness_logs;
CREATE POLICY "Allow individual logs write" ON public.daily_fitness_logs
    FOR ALL USING (auth.uid() = user_id);

-- 6. Trigger for updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at ON public.profiles;
CREATE TRIGGER set_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 7. Trigger for automatic profile creation on Auth Signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, name, email)
    VALUES (
        NEW.id, 
        COALESCE(NEW.raw_user_meta_data->>'name', 'Usuário Vitalis'), 
        NEW.email
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
