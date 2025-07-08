ALTER TABLE public.tasks
ADD COLUMN priority TEXT CHECK (priority IN ('High', 'Medium', 'Low'));