
-- Create crew_agents table
CREATE TABLE public.crew_agents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  agent_key TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT '',
  avatar TEXT NOT NULL DEFAULT '🤖',
  provider TEXT NOT NULL DEFAULT 'openai',
  model TEXT NOT NULL DEFAULT 'gpt-4',
  status TEXT NOT NULL DEFAULT 'idle',
  position JSONB NOT NULL DEFAULT '[0,0,0]'::jsonb,
  system_prompt TEXT NOT NULL DEFAULT '',
  priority TEXT NOT NULL DEFAULT 'medium',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, agent_key)
);

ALTER TABLE public.crew_agents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own agents" ON public.crew_agents FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own agents" ON public.crew_agents FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own agents" ON public.crew_agents FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own agents" ON public.crew_agents FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_crew_agents_updated_at BEFORE UPDATE ON public.crew_agents FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Create crew_edges table
CREATE TABLE public.crew_edges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  from_agent_key TEXT NOT NULL,
  to_agent_key TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'idle',
  label TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.crew_edges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own edges" ON public.crew_edges FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own edges" ON public.crew_edges FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own edges" ON public.crew_edges FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own edges" ON public.crew_edges FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_crew_edges_updated_at BEFORE UPDATE ON public.crew_edges FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Seed function for default crew template
CREATE OR REPLACE FUNCTION public.seed_crew_template(_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only seed if user has no agents yet
  IF EXISTS (SELECT 1 FROM public.crew_agents WHERE user_id = _user_id LIMIT 1) THEN
    RETURN;
  END IF;

  INSERT INTO public.crew_agents (user_id, agent_key, name, role, avatar, provider, model, status, position, system_prompt, priority) VALUES
    (_user_id, 'ceo', 'CEO', 'Chief Executive Officer', '👔', 'openai', 'gpt-4', 'active', '[0,2,0]', 'You are a visionary CEO.', 'high'),
    (_user_id, 'sales', 'Sales Director', 'Sales & Revenue', '📊', 'openai', 'gpt-4', 'thinking', '[-3,0,1]', 'You drive revenue growth.', 'high'),
    (_user_id, 'dev', 'Senior Dev', 'Engineering Lead', '💻', 'anthropic', 'claude-3', 'active', '[3,0,-1]', 'You write clean code.', 'medium'),
    (_user_id, 'analyst', 'Data Analyst', 'Analytics & Insights', '📈', 'google', 'gemini-pro', 'waiting', '[-1,-2,2]', 'You analyze data patterns.', 'medium'),
    (_user_id, 'support', 'Support Agent', 'Customer Success', '🎧', 'openai', 'gpt-4', 'idle', '[2,-2,-2]', 'You help customers.', 'low'),
    (_user_id, 'writer', 'Content Writer', 'Content & Marketing', '✍️', 'anthropic', 'claude-3', 'thinking', '[-2,1,-3]', 'You craft compelling content.', 'low');

  INSERT INTO public.crew_edges (user_id, from_agent_key, to_agent_key, status, label) VALUES
    (_user_id, 'ceo', 'sales', 'active', 'Strategy brief'),
    (_user_id, 'sales', 'analyst', 'waiting', 'Data request'),
    (_user_id, 'ceo', 'dev', 'active', 'Feature spec'),
    (_user_id, 'dev', 'support', 'idle', 'Bug report'),
    (_user_id, 'writer', 'ceo', 'active', 'Content draft');
END;
$$;

-- Update handle_new_user to also seed crew
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
  );
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'viewer');
  
  INSERT INTO public.credits (user_id, balance, lifetime_earned)
  VALUES (NEW.id, 100, 100);
  
  INSERT INTO public.subscriptions (user_id, plan, status, trial_ends_at)
  VALUES (NEW.id, 'free', 'trialing', now() + INTERVAL '14 days');

  -- Seed default constellation
  PERFORM public.seed_crew_template(NEW.id);
  
  RETURN NEW;
END;
$$;
