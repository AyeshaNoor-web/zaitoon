-- 1. Add branch_id to admin_users and link it to branches
ALTER TABLE public.admin_users 
ADD COLUMN branch_id UUID REFERENCES public.branches(id) NULL;

-- 2. Add branch_id to admin_sessions
ALTER TABLE public.admin_sessions
ADD COLUMN branch_id UUID REFERENCES public.branches(id) NULL;

-- 3. Assign branches to existing employees
UPDATE public.admin_users 
SET branch_id = '638ca9cd-22fe-4c37-a5f7-69e9e99427dc' -- Cantonment
WHERE username = 'employee1';

UPDATE public.admin_users 
SET branch_id = '3a3e3397-ba73-4f1d-a0c0-6c9b14613780' -- Wapda Town
WHERE username = 'employee2';
