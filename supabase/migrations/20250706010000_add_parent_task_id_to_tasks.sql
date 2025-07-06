ALTER TABLE public.tasks
ADD COLUMN parent_task_id uuid,
ADD CONSTRAINT tasks_parent_task_id_fkey FOREIGN KEY (parent_task_id) REFERENCES public.tasks(id) ON DELETE CASCADE;

