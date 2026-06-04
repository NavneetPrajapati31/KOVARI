ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS onboarding_tour_completed boolean NOT NULL DEFAULT false;
